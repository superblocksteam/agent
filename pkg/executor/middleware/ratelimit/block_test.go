package ratelimit

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/executor/options"
	mockflags "github.com/superblocksteam/agent/pkg/flags/mock"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	"go.uber.org/zap"

	"github.com/superblocksteam/agent/pkg/store"
)

func dummyBlockFunc(ctx *context.Context, block *apiv1.Block, options ...options.Option) (*context.Context, string, error) {
	return ctx, "", nil
}

func TestBlockQuota(t *testing.T) {
	for _, test := range []struct {
		name                string
		orgId               string
		requesterEmail      string
		apiId               string
		maxStreamSendSize   int
		maxParallelPoolSize int
		repeat              int
		hasError            bool
		block               *apiv1.Block
	}{
		{
			name:              "no limit hit",
			orgId:             "org1",
			requesterEmail:    "a@b.com",
			apiId:             "123",
			maxStreamSendSize: 5,
			repeat:            4,
			hasError:          false,
			block: &apiv1.Block{
				Name: "",
				Config: &apiv1.Block_Loop_{
					Loop: &apiv1.Block_Loop{
						Range:     "{{ 5 + 5 }}",
						Type:      0,
						Variables: nil,
						Blocks:    nil,
					},
				},
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockStore := store.Memory()
			flags := new(mockflags.Flags)
			flags.On("GetMaxStreamSendSizeV2", mock.Anything, mock.Anything).Return(test.maxStreamSendSize, nil)
			flags.On("GetMaxParallelPoolSizeV2", mock.Anything, mock.Anything).Return(test.maxParallelPoolSize, nil)
			flags.On("GetStepDurationV2", mock.Anything, mock.Anything).Return(2000, nil)
			flags.On("GetStepSizeV2", mock.Anything, mock.Anything).Return(100000, nil)
			flags.On("GetStepRateV2", mock.Anything, mock.Anything).Return(100000, nil)
			flags.On("GetStepRatePerApiV2", mock.Anything, mock.Anything).Return(100000, nil)
			flags.On("GetStepRatePerUserV2", mock.Anything, mock.Anything).Return(100000, nil)

			myMiddleWare := BlockMiddleware(
				zap.NewNop(),
				mockStore,
				flags,
				test.orgId,
				test.apiId,
				"TRIAL",
			)

			ctx := &context.Context{}

			for i := 0; i < test.repeat; i++ {
				newCtx, _, _ := myMiddleWare(dummyBlockFunc)(ctx, test.block)
				assert.Equal(t, test.maxStreamSendSize, newCtx.MaxStreamSendSize)
			}
		})
	}
}
