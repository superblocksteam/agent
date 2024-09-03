package server

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"testing"
	"time"

	pbapi "github.com/superblocksteam/agent/types/gen/go/api/v1"
	pbcommon "github.com/superblocksteam/agent/types/gen/go/common/v1"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

type fakeServerClient struct {
	t            testing.TB
	code         int
	err          error
	resp         *http.Response
	statusesCode int32
}

func newFakeServerClient(t testing.TB) *fakeServerClient {
	return &fakeServerClient{
		code:         http.StatusOK,
		statusesCode: int32(http.StatusOK),
	}
}

func (f *fakeServerClient) PatchApis(ctx context.Context, td *time.Duration, headers http.Header, query url.Values, req *pbapi.PatchApisRequest) (*http.Response, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.resp != nil {
		return f.resp, nil
	}

	statuses := make([]*pbapi.PatchApisResponse_Status, len(req.GetPatches()))
	for i, patch := range req.GetPatches() {
		statuses[i] = &pbapi.PatchApisResponse_Status{
			ApiId:   patch.GetApi().GetMetadata().GetId(),
			Code:    f.statusesCode,
			Message: "fake-message",
			Error:   nil,
		}
	}

	return makeResponse(f.code, &pbapi.PatchApisResponse{
		Statuses: statuses,
	})
}

func (f *fakeServerClient) PostClaimKeyRotationResourcesForSigningV2(ctx context.Context, td *time.Duration, headers http.Header, req *pbsecurity.ResourcesToResignRequest) (*http.Response, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.resp != nil {
		return f.resp, nil
	}

	api, err := structpb.NewStruct(map[string]any{
		"metadata": map[string]any{
			"id": "0",
		},
	})
	if err != nil {
		f.t.Fatalf("error creating api literal struct from map: %s", err)
	}

	return makeResponse(f.code, &pbsecurity.ResourcesToResignResponse{
		Resources: []*pbsecurity.Resource{
			{
				Config: &pbsecurity.Resource_Api{
					Api: &pbapi.Api{
						Metadata: &pbcommon.Metadata{
							Id: "0",
						},
					},
				},
				GitRef: &pbsecurity.Resource_CommitId{
					CommitId: "0",
				},
			},
			{
				Config: &pbsecurity.Resource_ApiLiteral_{
					ApiLiteral: &pbsecurity.Resource_ApiLiteral{
						Data: structpb.NewStructValue(api),
					},
				},
				GitRef: &pbsecurity.Resource_CommitId{
					CommitId: "0",
				},
			},
			{
				Config: &pbsecurity.Resource_Literal_{
					Literal: &pbsecurity.Resource_Literal{
						ResourceId: "0",
					},
				},
				GitRef: &pbsecurity.Resource_CommitId{
					CommitId: "0",
				},
			},
		},
	})
}

func (f *fakeServerClient) PutApplicationSignatures(ctx context.Context, td *time.Duration, headers http.Header, query url.Values, req *pbapi.UpdateApplicationSignaturesRequest) (*http.Response, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.resp != nil {
		return f.resp, nil
	}

	statuses := make([]*pbapi.UpdateApplicationSignaturesResponse_Status, len(req.GetUpdates()))
	for i, update := range req.GetUpdates() {
		statuses[i] = &pbapi.UpdateApplicationSignaturesResponse_Status{
			ApplicationId: update.GetApplicationId(),
			Code:          f.statusesCode,
			Message:       "fake-message",
			Error:         nil,
		}
	}

	return makeResponse(f.code, &pbapi.UpdateApplicationSignaturesResponse{
		Statuses: statuses,
	})
}

func makeResponse(code int, msg proto.Message) (*http.Response, error) {
	data, err := protojson.Marshal(msg)
	if err != nil {
		return nil, fmt.Errorf("marshal message error: %w", err)
	}

	resp := &http.Response{
		Status:        http.StatusText(code),
		StatusCode:    code,
		Body:          io.NopCloser(bytes.NewBuffer(data)),
		ContentLength: int64(len(data)),
	}

	return resp, nil
}
