package resigner

import (
	"bytes"
	"context"
	"encoding/base64"
	"io"
	"net/http"
	"sync"
	"testing"
	"time"

	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"github.com/superblocksteam/agent/pkg/crypto/signature"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	utilsv1 "github.com/superblocksteam/agent/types/gen/go/utils/v1"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestRun(t *testing.T) {
	var sig []byte
	var appSig []byte
	{
		sig = make([]byte, 64)
		_, err := base64.StdEncoding.Decode(sig, []byte("+ayu0B40zFz64MEJSTHM1fmZISD5OkEvYsvWtN2/hhme9hmJqPQWRgWhMBH+gg5cLnYwe6JilJWxZrlVAjUjDQ=="))
		assert.NoError(t, err)

		appSig = make([]byte, 64)
		_, err = base64.StdEncoding.Decode(appSig, []byte("rtv/vj3AgQH0u2jUeq5nJSGKw2f6nGq2pt3jGUlv5Q907eCr/01wU/Z2OZiVA/kt1mIxH86c1IhXpnt5no8SBA=="))
		assert.NoError(t, err)
	}

	nowPb := timestamppb.Now()

	var server clients.ServerClient
	{
		server = &mocks.ServerClient{}

		server.(*mocks.ServerClient).On("PatchApis", mock.Anything, mock.Anything, mock.Anything, mock.Anything, &apiv1.PatchApisRequest{
			Patches: []*apiv1.PatchApi{
				{
					Api: &apiv1.Api{
						Signature: &utilsv1.Signature{
							KeyId: "example",
							Data:  sig,
						},
					},
					GitRef: &apiv1.PatchApi_BranchName{
						BranchName: "main",
					},
				},
			},
		}).Return(&http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(bytes.NewBufferString(`{"statuses": [{"code": 200}]}`)),
		}, nil)

		server.(*mocks.ServerClient).On("PutApplicationSignatures", mock.Anything, mock.Anything, mock.Anything, mock.Anything, &apiv1.UpdateApplicationSignaturesRequest{
			Updates: []*apiv1.UpdateApplicationSignature{
				{
					ApplicationId: "my_app_id",
					Signature: &utilsv1.Signature{
						KeyId: "example",
						Data:  appSig,
					},
					Updated: nowPb,
					GitRef: &apiv1.UpdateApplicationSignature_BranchName{
						BranchName: "main",
					},
				},
			},
		}).Return(&http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(bytes.NewBufferString(`{"statuses": [{"code": 200}]}`)),
		}, nil)
	}

	queue := make(chan protoreflect.ProtoMessage, 3)

	signer, err := signature.Manager(
		true,
		[]signature.Key{
			{
				ID:    "example",
				Value: []byte("example"),
			},
		},
		"example",
		signature.NewResourceSerializer(),
	)
	require.NoError(t, err)

	wg := &sync.WaitGroup{}
	log, _ := zap.NewDevelopment()

	l := NewListener(
		New(signer, zaptest.NewLogger(t)),
		server,
		&Options{
			Logger:           log,
			Workers:          1,
			FlushMaxDuration: 1 * time.Second,
			FlushMaxItems:    5,
			Queue:            queue,
			Wait:             wg,
		},
	)

	wg.Add(3)

	apiMap := map[string]any{
		"signature": map[string]any{
			"key_id": "example",
			"data":   sig,
		},
	}
	apiStruct, err := structpb.NewStruct(apiMap)
	require.NoError(t, err)

	queue <- &securityv1.Resource{
		Config: &securityv1.Resource_ApiLiteral_{
			ApiLiteral: &securityv1.Resource_ApiLiteral{
				Data: structpb.NewStructValue(apiStruct),
			},
		},
		GitRef: &securityv1.Resource_BranchName{
			BranchName: "main",
		},
	}

	queue <- &securityv1.Resource{
		Config: &securityv1.Resource_Api{
			Api: &apiv1.Api{
				Signature: &utilsv1.Signature{
					KeyId: "example",
					Data:  sig,
				},
			},
		},
		GitRef: &securityv1.Resource_BranchName{
			BranchName: "main",
		},
	}

	queue <- &securityv1.Resource{
		Config: &securityv1.Resource_Literal_{
			Literal: &securityv1.Resource_Literal{
				ResourceId:     "my_app_id",
				OrganizationId: "my_org_id",
				Signature: &utilsv1.Signature{
					KeyId: "example",
					Data:  appSig,
				},
				LastUpdated: nowPb,
			},
		},
		GitRef: &securityv1.Resource_BranchName{
			BranchName: "main",
		},
	}

	manager := &sync.WaitGroup{}
	manager.Add(1)
	go func() {
		defer manager.Done()
		l.Run(context.Background())
	}()

	// Wait for run to be called before closing
	assert.NoError(t, l.Close(nil))
	manager.Wait()

	server.(*mocks.ServerClient).AssertExpectations(t)
}
