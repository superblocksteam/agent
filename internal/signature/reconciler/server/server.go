package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"

	"github.com/superblocksteam/agent/internal/signature/reconciler"
	pbapi "github.com/superblocksteam/agent/types/gen/go/api/v1"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
)

var (
	ErrStatusCode     = errors.New("status code is not ok")
	ErrUnmarshalError = errors.New("unmarshal error")

	headers = http.Header{
		"content-type": []string{"application/json"},
	}
)

type ServerClient interface {
	PostClaimKeyRotationResourcesForSigningV2(context.Context, *time.Duration, http.Header, *pbsecurity.ResourcesToResignRequest) (*http.Response, error) // Claim key rotation resources for signing
	PutApplicationSignatures(context.Context, *time.Duration, http.Header, url.Values, *pbapi.UpdateApplicationSignaturesRequest) (*http.Response, error) // Put Application Signatures
	PutApiSignatures(context.Context, *time.Duration, http.Header, url.Values, *pbapi.UpdateApiSignaturesRequest) (*http.Response, error)                 // Put API Signatures
}

type server struct {
	log         *zap.Logger
	agentId     string
	client      ServerClient
	unmarshaler protojson.UnmarshalOptions

	options options
}

var _ reconciler.Server = &server{}

func New(log *zap.Logger, client ServerClient, agentId string, options ...Option) *server {
	s := &server{
		log:         log.Named("signing/reconciler/server"),
		agentId:     agentId,
		client:      client,
		unmarshaler: protojson.UnmarshalOptions{DiscardUnknown: true},
	}

	for _, o := range options {
		o(&s.options)
	}

	return s
}

func (s *server) ClaimBatchToSign(ctx context.Context) ([]*pbsecurity.Resource, error) {
	resp, err := s.client.PostClaimKeyRotationResourcesForSigningV2(ctx, nil, headers, &pbsecurity.ResourcesToResignRequest{
		Limit:     s.options.batchSize,
		ClaimedBy: s.agentId,
	})
	if err != nil {
		return nil, fmt.Errorf("cannot claim resources for signing: %w", err)
	}

	typed := &pbsecurity.ResourcesToResignResponse{}
	err = readResponse(s.unmarshaler, resp, typed)
	if err != nil {
		return nil, fmt.Errorf("cannot read typed response: %w", err)
	}

	return typed.GetResources(), nil
}

func (s *server) UpdateApiAsSignedResources(ctx context.Context, updates []*pbapi.UpdateApiSignature) error {
	log := s.log

	resp, err := s.client.PutApiSignatures(ctx, nil, headers, nil, &pbapi.UpdateApiSignaturesRequest{
		Updates: updates,
	})
	if err != nil {
		return fmt.Errorf("error patching APIs: %w", err)
	}

	typed := &pbapi.UpdateApiSignaturesResponse{}
	err = readResponse(s.unmarshaler, resp, typed)
	if err != nil {
		return fmt.Errorf("cannot read typed response: %w", err)
	}

	for _, status := range typed.Statuses {
		zapFields := []zapcore.Field{
			zap.String("message", status.Message),
			zap.String("api_id", status.ApiId),
		}
		switch status.Code {
		case http.StatusConflict:
			log.Warn("conflict attempting to patch api", zapFields...)
		case http.StatusNotFound:
			log.Warn("api was not found while attempting to patch", zapFields...)
		case http.StatusOK:
		default:
			log.Error("unknown status code from server",
				append([]zapcore.Field{
					zap.Int32("statusCode", status.Code),
					zap.String("statusCodeText", http.StatusText(int(status.Code))),
				}, zapFields...)...,
			)
		}
	}

	return nil
}

func (s *server) UpdateAppAsSignedResources(ctx context.Context, updates []*pbapi.UpdateApplicationSignature) error {
	log := s.log

	resp, err := s.client.PutApplicationSignatures(ctx, nil, headers, nil, &pbapi.UpdateApplicationSignaturesRequest{
		Updates: updates,
	})
	if err != nil {
		return fmt.Errorf("error updating applications: %w", err)
	}

	typed := &pbapi.UpdateApplicationSignaturesResponse{}
	err = readResponse(s.unmarshaler, resp, typed)
	if err != nil {
		return fmt.Errorf("cannot read typed response: %w", err)
	}

	for _, status := range typed.Statuses {
		zapFields := []zapcore.Field{
			zap.String("message", status.Message),
			zap.String("application_id", status.ApplicationId),
			zap.String("branch", status.GetBranchName()),
		}
		switch status.Code {
		case http.StatusConflict:
			log.Warn("conflict attempting to update application", zapFields...)
		case http.StatusNotFound:
			log.Warn("application was not found while attempting to update", zapFields...)
		case http.StatusOK:
		default:
			log.Error("unknown status code from server",
				append([]zapcore.Field{
					zap.Int32("statusCode", status.Code),
					zap.String("statusCodeText", http.StatusText(int(status.Code))),
				}, zapFields...)...,
			)
		}
	}

	return nil
}

func readResponse(unmarshaler protojson.UnmarshalOptions, resp *http.Response, typed proto.Message) error {
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status code from server: %v (%w)", resp.StatusCode, ErrStatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read server response body: %w", err)
	}

	if err := unmarshaler.Unmarshal(body, typed); err != nil {
		return fmt.Errorf("server response, %w: %w", ErrUnmarshalError, err)
	}

	return nil
}
