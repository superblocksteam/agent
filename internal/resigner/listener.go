package resigner

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/pool"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	"github.com/superblocksteam/run"

	"github.com/avast/retry-go"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/structpb"
)

type service struct {
	*Options
	ResourceResigner
	clients.ServerClient
	run.ForwardCompatibility

	ctx       context.Context
	cancel    context.CancelFunc
	lastFlush time.Time
	buffer    utils.List[*securityv1.Resource]
	mutex     *sync.RWMutex
	ticker    *time.Ticker
}

type Options struct {
	Logger           *zap.Logger
	Workers          int
	FlushMaxDuration time.Duration
	FlushMaxItems    int
	Queue            chan protoreflect.ProtoMessage
	Wait             *sync.WaitGroup
}

func NewListener(resigner ResourceResigner, serverClient clients.ServerClient, options *Options) run.Runnable {
	options.Logger = options.Logger.With(
		zap.String("service", "resigner"),
	)

	ctx, cancel := context.WithCancel(context.Background())

	return &service{
		ResourceResigner: resigner,
		ServerClient:     serverClient,
		Options:          options,
		lastFlush:        time.Now(),
		mutex:            &sync.RWMutex{},
		buffer:           utils.NewList[*securityv1.Resource](),
		ticker:           time.NewTicker(options.FlushMaxDuration),
		ctx:              ctx,
		cancel:           cancel,
	}
}

func (s *service) Name() string { return "resigner" }

func (s *service) Run(context.Context) error {
	// Consumer
	err := pool.OneWay[protoreflect.ProtoMessage](s.Queue, func(req protoreflect.ProtoMessage) {
		defer s.Wait.Done()

		resource, ok := req.(*securityv1.Resource)
		if !ok {
			s.Logger.Error("received a protobuf message that was not of the expected type")
			return
		}

		resources, err := s.ResourceResigner.Do([]*securityv1.Resource{resource})
		if err != nil {
			s.Logger.Error("failed to resign resources", zap.Error(err))
			return
		}

		s.buffer.Add(resources...)

		if s.full() {
			s.Flush(nil)
		}
	}, []pool.Option{
		pool.Size(s.Workers),
		pool.Logger(s.Logger),
	}...)
	if err != nil {
		return err
	}

	// Ticker for flushing
	go func() {
		for range s.ticker.C {
			if s.full() {
				s.Flush(nil)
			}
		}
	}()

	<-s.ctx.Done()
	s.Wait.Wait()

	return nil
}

func (s *service) Flush(notify chan struct{}) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	doNotify := func() {
		if notify != nil {
			notify <- struct{}{}
		}
	}

	if s.buffer.Size() == 0 {
		doNotify()
		return nil
	}

	apiPatches := []*apiv1.PatchApi{}
	uniqueApiPatchRefs := map[string]bool{}
	applicationUpdates := []*apiv1.UpdateApplicationSignature{}
	uniqueApplicationUpdateRefs := map[string]bool{}

	for _, item := range s.buffer.Contents() {
		switch {
		case item.GetApiLiteral() != nil:
			apiLiteral := item.GetApiLiteral().GetData().GetStructValue()
			patch, err := patchFromApiLiteral(item, apiLiteral)
			if err != nil {
				s.Logger.Warn("failed to build patch from api literal", zap.Error(err))
				continue
			}

			uniqueApiPatchRef := fmt.Sprintf("%s:%s%s", getApiIdFromLiteral(apiLiteral), item.GetBranchName(), item.GetCommitId())
			if !uniqueApiPatchRefs[uniqueApiPatchRef] {
				apiPatches = append(apiPatches, patch)
				uniqueApiPatchRefs[uniqueApiPatchRef] = true
			}
		case item.GetApi() != nil:
			api := item.GetApi().GetStructValue()
			patch, err := patchFromApiLiteral(item, api)
			if err != nil {
				s.Logger.Warn("failed to build patch from api", zap.Error(err))
				continue
			}

			uniqueApiPatchRef := fmt.Sprintf("%s:%s%s", getApiIdFromLiteral(api), item.GetBranchName(), item.GetCommitId())
			if !uniqueApiPatchRefs[uniqueApiPatchRef] {
				apiPatches = append(apiPatches, patch)
				uniqueApiPatchRefs[uniqueApiPatchRef] = true
			}
		case item.GetLiteral() != nil:
			update := &apiv1.UpdateApplicationSignature{
				ApplicationId: item.GetLiteral().GetResourceId(),
				Signature:     item.GetLiteral().GetSignature(),
				Updated:       item.GetLiteral().GetLastUpdated(),
				PageVersion:   item.GetLiteral().GetPageVersion(),
			}

			if item.GetCommitId() != "" {
				update.GitRef = &apiv1.UpdateApplicationSignature_CommitId{
					CommitId: item.GetCommitId(),
				}
			}

			if item.GetBranchName() != "" {
				update.GitRef = &apiv1.UpdateApplicationSignature_BranchName{
					BranchName: item.GetBranchName(),
				}
			}

			uniqueApplicationUpdateRef := fmt.Sprintf("%s:%s%s", item.GetLiteral().GetResourceId(), item.GetBranchName(), item.GetCommitId())

			if !uniqueApplicationUpdateRefs[uniqueApplicationUpdateRef] {
				applicationUpdates = append(applicationUpdates, update)
				uniqueApplicationUpdateRefs[uniqueApplicationUpdateRef] = true
			}
		}
	}

	go func() {
		if err := retry.Do(
			func() error {
				return s.handlePatchApis(apiPatches)
			},
			retry.Attempts(5),
		); err != nil {
			s.Logger.Warn("could not flush apis; dropping", zap.Error(err))
		}
		doNotify()
	}()

	go func() {
		if err := retry.Do(
			func() error {
				return s.handlePutApplicationSignatures(applicationUpdates)
			},
			retry.Attempts(5),
		); err != nil {
			s.Logger.Warn("could not flush applications; dropping", zap.Error(err))
		}
		doNotify()
	}()

	s.buffer.Clear()
	s.lastFlush = time.Now()

	return nil
}

func getApiIdFromLiteral(api *structpb.Struct) string {
	apiId, err := utils.GetStructField(api, "metadata.id")
	if err != nil {
		return "unknown"
	}
	return apiId.GetStringValue()
}

func patchFromApiLiteral(res *securityv1.Resource, api *structpb.Struct) (*apiv1.PatchApi, error) {
	var metadata *commonv1.Metadata

	if metadataStruct := api.GetFields()["metadata"].GetStructValue(); metadataStruct != nil {
		metadata := &commonv1.Metadata{}
		if err := utils.StructPbToProto(metadataStruct, metadata); err != nil {
			metadata = nil
		}
	}

	sig, err := signature.StructpbToSignatureProto(api.GetFields()["signature"].GetStructValue())
	if err != nil {
		sig = nil
	}

	patch := &apiv1.PatchApi{
		Api: &apiv1.Api{
			// Don't update actual api, just the signature
			Signature: sig,
			// This is necessary to retain for comparing updated timestamps
			Metadata: metadata,
		},
	}

	if res.GetCommitId() != "" {
		patch.GitRef = &apiv1.PatchApi_CommitId{
			CommitId: res.GetCommitId(),
		}
	}

	if res.GetBranchName() != "" {
		patch.GitRef = &apiv1.PatchApi_BranchName{
			BranchName: res.GetBranchName(),
		}
	}

	return patch, nil
}

func (s *service) full() bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if s.buffer.Size() >= s.FlushMaxItems {
		return true
	}

	if time.Since(s.lastFlush) > s.FlushMaxDuration {
		return true
	}

	return false
}

func (s *service) Alive() bool { return true }

func (s *service) Close(context.Context) error {
	s.cancel()      // to allow run to exit
	s.ticker.Stop() // to stop flushing
	s.Wait.Wait()   // to ensure we don't final flush before all workers are done

	notify := make(chan struct{}, 2)

	if err := s.Flush(notify); err != nil {
		return err
	}
	<-notify
	<-notify

	return nil
}

func (s *service) handlePatchApis(apiPatches []*apiv1.PatchApi) error {
	if len(apiPatches) == 0 {
		s.Logger.Debug("no api signatures to flush")
		return nil
	}

	s.Logger.Debug("flushing apis", zap.Int("count", len(apiPatches)))

	resp, err := s.ServerClient.PatchApis(context.Background(), nil, http.Header{"Content-Type": []string{"application/json"}}, nil, &apiv1.PatchApisRequest{Patches: apiPatches})
	if err != nil {
		s.Logger.Warn("could not flush apis; got error from server", zap.Error(err), zap.Any("response", resp))
		return err
	}
	if resp.StatusCode != http.StatusOK {
		err := fmt.Errorf("flushing apis received non-OK response from server")
		s.Logger.Warn(err.Error(), zap.Int("status_code", resp.StatusCode))
		return err
	}

	s.Logger.Debug("flushed apis", zap.Int("status_code", resp.StatusCode), zap.Int("count", len(apiPatches)))

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		s.Logger.Warn("successfully flushed apis but could not read response body", zap.Error(err))
		return nil
	}

	respBody := &apiv1.PatchApisResponse{}
	unmarshalOpts := &protojson.UnmarshalOptions{
		DiscardUnknown: true,
	}
	if err := unmarshalOpts.Unmarshal(body, respBody); err != nil {
		s.Logger.Warn("successfully flushed apis but could not unmarshal response body", zap.Error(err))
		return nil
	}

	for _, status := range respBody.Statuses {
		switch status.Code {
		case http.StatusConflict:
			s.Logger.Warn("conflict while resigning api", zap.String("message", status.Message), zap.String("api_id", status.ApiId))
		case http.StatusNotFound:
			s.Logger.Warn("api id not found", zap.String("message", status.Message), zap.String("api_id", status.ApiId))
		}
	}

	return nil
}

func (s *service) handlePutApplicationSignatures(applicationUpdates []*apiv1.UpdateApplicationSignature) error {
	if len(applicationUpdates) == 0 {
		s.Logger.Debug("no applications to flush")
		return nil
	}

	s.Logger.Debug("flushing applications", zap.Int("count", len(applicationUpdates)))

	resp, err := s.ServerClient.PutApplicationSignatures(context.Background(), nil, http.Header{"Content-Type": []string{"application/json"}}, nil, &apiv1.UpdateApplicationSignaturesRequest{Updates: applicationUpdates})
	if err != nil {
		s.Logger.Warn("could not flush applications; got error from server", zap.Error(err), zap.Any("response", resp))
		return err
	}
	if resp.StatusCode != http.StatusOK {
		err := fmt.Errorf("flushing applications received non-OK response from server")
		s.Logger.Warn(err.Error(), zap.Int("status_code", resp.StatusCode))
		return err
	}

	s.Logger.Debug("flushed applications", zap.Int("status_code", resp.StatusCode), zap.Int("count", len(applicationUpdates)))

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		s.Logger.Warn("successfully flushed applications but could not read response body", zap.Error(err))
		return nil
	}

	respBody := &apiv1.UpdateApplicationSignaturesResponse{}
	if err := protojson.Unmarshal(body, respBody); err != nil {
		s.Logger.Warn("successfully flushed applications but could not unmarshal response body", zap.Error(err))
		return nil
	}

	for _, status := range respBody.Statuses {
		switch status.Code {
		case http.StatusConflict:
			s.Logger.Warn("conflict while resigning application", zap.String("message", status.Message), zap.String("application_id", status.ApplicationId), zap.String("branch", status.GetBranchName()))
		case http.StatusNotFound:
			s.Logger.Warn("application id not found", zap.String("message", status.Message), zap.String("application_id", status.ApplicationId))
		}
	}

	return nil
}
