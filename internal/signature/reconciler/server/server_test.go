package server

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/utils"
	pbapi "github.com/superblocksteam/agent/types/gen/go/api/v1"
	pbcommon "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest"
)

var broken = errors.New("broken")

type args struct {
	client  *fakeServerClient
	log     *zap.Logger
	patches []*pbapi.PatchApi
	updates []*pbapi.UpdateApplicationSignature
}

func validArgs(t *testing.T) *args {
	return &args{
		client: newFakeServerClient(t),
		log:    zaptest.NewLogger(t),
		patches: []*pbapi.PatchApi{
			{
				Api: &pbapi.Api{
					Metadata: &pbcommon.Metadata{
						Id: "api-1",
					},
				},
			},
		},
		updates: []*pbapi.UpdateApplicationSignature{
			{
				ApplicationId: "app-1",
			},
		},
	}
}

func verify(t *testing.T, args *args, expectedErr error) {
	server := New(args.log, args.client, "test-agent-id",
		WithBatchSize(10),
	)

	ctx := context.Background()

	batch, err := server.ClaimBatchToSign(ctx)
	if expectedErr == nil {
		require.NoError(t, err)
		require.Greater(t, len(batch), 0, "fake should return more than 0 resources")
	} else {
		require.ErrorIs(t, err, expectedErr)
	}

	err = server.PatchApiAsSignedResources(ctx, args.patches)
	if expectedErr == nil {
		require.NoError(t, err)
	} else {
		require.ErrorIs(t, err, expectedErr)
	}

	err = server.UpdateAppAsSignedResources(ctx, args.updates)
	if expectedErr == nil {
		require.NoError(t, err)
	} else {
		require.ErrorIs(t, err, expectedErr)
	}
}

func TestOk(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verify(t, args, nil)
}

func TestOkPerResourceStatusConflict(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	log, logs := utils.NewZapTestObservedLogger(t)
	args.log = log
	args.client.statusesCode = int32(http.StatusConflict)

	verify(t, args, nil)

	require.Len(t, logs.FilterLevelExact(zap.WarnLevel).All(), 2)
}

func TestOkPerResourceStatusNotFound(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	log, logs := utils.NewZapTestObservedLogger(t)
	args.log = log
	args.client.statusesCode = int32(http.StatusNotFound)

	verify(t, args, nil)

	require.Len(t, logs.FilterLevelExact(zap.WarnLevel).All(), 2)
}

func TestOkPerResourceStatusUnhandled(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	log, logs := utils.NewZapTestObservedLogger(t)
	args.log = log
	args.client.statusesCode = 0 // invalid status code, should never be handled

	verify(t, args, nil)

	require.Len(t, logs.FilterLevelExact(zap.ErrorLevel).All(), 2)
}

func TestErrServerGeneralError(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.client.err = broken
	verify(t, args, broken)
}

func TestErrServerCodeNonOk(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.client.code = http.StatusBadRequest
	verify(t, args, ErrStatusCode)
}

func TestErrServerResponseBad(t *testing.T) {
	t.Parallel()

	args := validArgs(t)

	code := http.StatusOK
	args.client.resp = &http.Response{
		Status:        http.StatusText(code),
		StatusCode:    code,
		Body:          io.NopCloser(bytes.NewBuffer([]byte("not-json"))),
		ContentLength: 2,
	}

	verify(t, args, ErrUnmarshalError)
}
