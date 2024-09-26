package reconciler

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/jonboulle/clockwork"
	"github.com/superblocksteam/agent/pkg/utils"
	pbapi "github.com/superblocksteam/agent/types/gen/go/api/v1"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/testing/protocmp"
	"google.golang.org/protobuf/types/known/structpb"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"go.uber.org/zap/zaptest/observer"
)

const typesOfResources = 3

var (
	broken    = errors.New("broken")
	emptySkre = SigningKeyRotationEvent{}
	noop      = func(ctx context.Context) {}
)

type args struct {
	cancel     context.CancelFunc
	clock      clockwork.FakeClock
	log        *zap.Logger
	logs       *observer.ObservedLogs
	noTestLoop bool
	onLoop     chan SigningKeyRotationEvent
	server     *fakeServer
	signer     *fakeSigner
	skre       chan SigningKeyRotationEvent
}

func makeChan(events ...SigningKeyRotationEvent) chan SigningKeyRotationEvent {
	ch := make(chan SigningKeyRotationEvent, len(events))
	for _, event := range events {
		ch <- event
	}
	return ch
}

func validArgs(t *testing.T) *args {
	log, logs := utils.NewZapTestObservedLogger(t)

	args := &args{
		clock:  clockwork.NewFakeClock(),
		log:    log,
		logs:   logs,
		onLoop: make(chan SigningKeyRotationEvent, 2),
		server: newFakeServer(),
		signer: newFakeSigner(),
	}

	args.skre = makeChan(SigningKeyRotationEvent{
		KeyId:  args.signer.SigningKeyID(),
		Status: SigningStatus_InProgress,
	})
	args.onLoop <- emptySkre // implementation needs second loop to start signing
	args.onLoop <- emptySkre // implementation needs third loop to read signing err
	close(args.onLoop)

	// *typesOfResources guarantees '>=# of types' to ensure the set of resources under test by
	// default includes all Resource types as created in the for loop below (i%X conditional).
	//
	// maxBatch*2 ensures the the reconciler must request multiple batches
	n := args.server.maxBatch * 2 * typesOfResources

	if n <= 0 {
		t.Fatalf("n cannot be zero or less")
	}

	resources := make([]*pbsecurity.Resource, n)
	for i := range n {
		res := &pbsecurity.Resource{
			GitRef: &pbsecurity.Resource_CommitId{
				CommitId: fmt.Sprintf("%d", i),
			},
		}

		switch i % typesOfResources {
		case 0:
			api, err := structpb.NewStruct(map[string]any{
				"metadata": map[string]any{
					"id": fmt.Sprintf("%d", i),
				},
			})
			require.NoError(t, err)

			res.Config = &pbsecurity.Resource_Api{
				Api: structpb.NewStructValue(api),
			}
		case 1:
			literal, err := structpb.NewStruct(map[string]any{
				"metadata": map[string]any{
					"id": fmt.Sprintf("%d", i),
				},
			})
			require.NoError(t, err)

			res.Config = &pbsecurity.Resource_ApiLiteral_{
				ApiLiteral: &pbsecurity.Resource_ApiLiteral{
					Data: structpb.NewStructValue(literal),
				},
			}
		case 2:
			res.Config = &pbsecurity.Resource_Literal_{
				Literal: &pbsecurity.Resource_Literal{
					ResourceId: fmt.Sprintf("%d", i),
				},
			}
		default:
			t.Fatalf("unhandled type %d", i%typesOfResources)
		}

		resources[i] = res
	}
	args.server.ClaimBatchToSignSet(resources)

	args.server.onClaim = func(ctx context.Context) {
		if len(args.server.resources) == 0 {
			args.skre <- SigningKeyRotationEvent{
				KeyId:  args.signer.SigningKeyID(),
				Status: SigningStatus_Completed,
			}
		}
	}

	return args
}

// verifyError ensures all log.Errors are the given string with the given expectedErr. If
// expectedErr is nil, the `error` in the log can be any error but must not be nil. If expectedErr
// is not nil, the error is verified using `require.ErrorIs` to verify its of the proper type.
func verifyError(t *testing.T, args *args, msg string, expectedErr error) {
	for _, le := range args.logs.FilterLevelExact(zap.ErrorLevel).All() {
		require.Equal(t, msg, le.Message)

		var err error
		for _, field := range le.Context {
			if field.Key != "error" {
				continue
			}
			err = field.Interface.(error)
			break
		}
		if expectedErr == nil {
			require.NotNil(t, err)
		} else {
			require.ErrorIs(t, err, expectedErr)
		}
	}
}

func testRunLoop(t *testing.T, args *args) {
	var wg sync.WaitGroup
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(func() {
		cancel()
		wg.Wait()
	})

	args.cancel = cancel
	r := New(args.log, args.server, args.signer, args.skre,
		WithClock(args.clock),
	)

	if args.noTestLoop {
		args.server.doneWhen = len(args.server.resources)
	} else {
		r.testLoop = func(state string, ctxErr error) {
			t.Logf("testLoop: ctxErr %v, state %s, now %v", ctxErr, state, args.clock.Now())

			e, ok := <-args.onLoop
			if ok && e != emptySkre {
				t.Logf("testLoop: sending skre %#v", e)
				args.skre <- e
			} else if ok {
				// just loop for empty events
				t.Logf("testLoop: just loop")
			} else {
				t.Logf("testLoop: args.onLoop closed, canceling")
				cancel()
			}
		}
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		err := r.Run(ctx)
		if err == nil {
			t.Fatalf("err must not be nil, it must return only when ctx is canceled")
		}
		require.ErrorIs(t, err, ctx.Err())
	}()

	if args.noTestLoop {
		<-args.server.done
		cancel()
	}

	wg.Wait()
}

func verify(t *testing.T, args *args) {
	resources := args.server.resources

	resourcesCloned := make([]*pbsecurity.Resource, len(resources))
	for i, res := range resources {
		res := proto.Clone(res).(*pbsecurity.Resource)
		resourcesCloned[i] = res
		require.NoError(t, args.signer.SignAndUpdateResource(res))
	}

	expected := prep(args.log, resourcesCloned)

	testRunLoop(t, args)

	sortApiPatchesOption := cmpopts.SortSlices(func(a, b *pbapi.PatchApi) bool {
		return a.Api.Metadata.Id < b.Api.Metadata.Id
	})
	sortAppUpdatesOption := cmpopts.SortSlices(func(a, b *pbapi.UpdateApplicationSignature) bool {
		return a.ApplicationId < b.ApplicationId
	})

	if diff := cmp.Diff(expected.apiUpdates, args.server.apiUpdates, sortApiPatchesOption, protocmp.Transform()); diff != "" {
		t.Fatalf("unexpected apiPatches\n%s", diff)
	}

	if diff := cmp.Diff(expected.appUpdates, args.server.appUpdates, sortAppUpdatesOption, protocmp.Transform()); diff != "" {
		t.Fatalf("unexpected appUpdates\n%s", diff)
	}
}

func verifyOneTurn(t *testing.T, args *args, event SigningKeyRotationEvent) {
	args.server.resources = nil
	args.server.onClaim = noop
	args.onLoop = make(chan SigningKeyRotationEvent)
	close(args.onLoop) // cancel after first turn
	args.skre = makeChan(event)
	verify(t, args)
}

func TestReal(t *testing.T) {
	t.Parallel()
	args := validArgs(t)
	args.noTestLoop = true
	verify(t, args)
}

func TestAllResourcesWithMultipleBatchesAreSignedCorrectly(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verify(t, args)
}

func TestNoResourcesToSign(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.server.ClaimBatchToSignSet(nil)
	verify(t, args)
}

func TestOnlyApisToSign(t *testing.T) {
	t.Parallel()

	api, err := structpb.NewStruct(map[string]any{
		"metadata": map[string]any{
			"id": "0",
		},
	})
	require.NoError(t, err)

	args := validArgs(t)
	args.server.ClaimBatchToSignSet([]*pbsecurity.Resource{
		{
			Config: &pbsecurity.Resource_Api{
				Api: structpb.NewStructValue(api),
			},
			GitRef: &pbsecurity.Resource_CommitId{
				CommitId: "0",
			},
		},
	})
	verify(t, args)
}

func TestOnlyApiLiteralsToSign(t *testing.T) {
	t.Parallel()

	literal, err := structpb.NewStruct(map[string]any{
		"metadata": map[string]any{
			"id": "0",
		},
	})
	require.NoError(t, err)

	args := validArgs(t)
	args.server.ClaimBatchToSignSet([]*pbsecurity.Resource{
		{
			Config: &pbsecurity.Resource_ApiLiteral_{
				ApiLiteral: &pbsecurity.Resource_ApiLiteral{
					Data: structpb.NewStructValue(literal),
				},
			},
			GitRef: &pbsecurity.Resource_CommitId{
				CommitId: "0",
			},
		},
	})
	verify(t, args)
}

func TestOnlyAppsToSign(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.server.ClaimBatchToSignSet([]*pbsecurity.Resource{
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
	})
	verify(t, args)
}

func TestPatchWithGitBranches(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	for _, res := range args.server.resources {
		commit := res.GitRef.(*pbsecurity.Resource_CommitId)
		res.GitRef = &pbsecurity.Resource_BranchName{
			BranchName: commit.CommitId,
		}
	}
	verify(t, args)
}

func TestInvalidEventStatus(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verifyOneTurn(t, args, SigningKeyRotationEvent{
		Status: "not-a-valid-status",
	})
	utils.RequireLogContains(t, args.logs, zap.ErrorLevel, "unknown signing key rotation event status")
}

func TestInitial(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verifyOneTurn(t, args, SigningKeyRotationEvent{})
	utils.RequireLogContains(t, args.logs, zap.InfoLevel, "initial signing state")
}

func TestFailed(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verifyOneTurn(t, args, SigningKeyRotationEvent{
		Status: SigningStatus_Failed,
	})
	utils.RequireLogContains(t, args.logs, zap.WarnLevel, "signing key rotation event reports signing failed")
}

func TestWrongSigningKey(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	verifyOneTurn(t, args, SigningKeyRotationEvent{
		KeyId:  "wrong-key-id",
		Status: SigningStatus_InProgress,
	})
	utils.RequireLogContains(t, args.logs, zap.WarnLevel,
		"cannot participate in signing rotation job as signing key id differs",
	)
}

func TestCancelReconcileOnContextCancel(t *testing.T) {
	t.Parallel()

	args := validArgs(t)

	orig := args.server.resources
	args.server.resources = nil // convince verify to expect no resources
	args.server.onClaim = func(ctx context.Context) {
		args.server.resources = orig // these resources must not make it back to server
		args.cancel()
	}

	args.skre = makeChan(SigningKeyRotationEvent{
		KeyId:  args.signer.SigningKeyID(),
		Status: SigningStatus_InProgress,
	})
	verify(t, args)
	utils.RequireLogContains(t, args.logs, zap.InfoLevel, "looking for resources to sign")
}

func TestCancelReconcileOnEventCancel(t *testing.T) {
	t.Parallel()

	args := validArgs(t)

	orig := args.server.resources
	args.onLoop = make(chan SigningKeyRotationEvent, 1)
	args.skre = make(chan SigningKeyRotationEvent, 1)
	args.server.resources = nil // convince verify to expect no resources

	args.server.onClaim = func(ctx context.Context) {
		args.server.resources = orig // these resources must not make it back to server
		args.onLoop <- SigningKeyRotationEvent{
			KeyId:  args.signer.SigningKeyID(),
			Status: SigningStatus_Canceled,
		}
		args.onLoop <- emptySkre // fully process cancel
		<-ctx.Done()
		close(args.onLoop)
	}

	args.skre <- SigningKeyRotationEvent{
		KeyId:  args.signer.SigningKeyID(),
		Status: SigningStatus_InProgress,
	}
	args.onLoop <- emptySkre // signing needs extra loop to start

	verify(t, args)
	utils.RequireLogContains(t, args.logs, zap.InfoLevel, "canceling in progress rotation due to rotation event request")
	utils.RequireLogContains(t, args.logs, zap.InfoLevel, "signing canceled")
}

func TestInProgressSentTwice(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.server.resources = nil
	args.skre = make(chan SigningKeyRotationEvent, 1)
	args.onLoop = make(chan SigningKeyRotationEvent, 3)

	args.server.onClaim = func(ctx context.Context) {
		<-ctx.Done()
	}

	args.skre <- SigningKeyRotationEvent{
		KeyId:  args.signer.SigningKeyID(),
		Status: SigningStatus_InProgress,
	}
	args.onLoop <- emptySkre

	args.onLoop <- SigningKeyRotationEvent{
		KeyId:  args.signer.SigningKeyID(),
		Status: SigningStatus_InProgress,
	}
	args.onLoop <- SigningKeyRotationEvent{
		KeyId:  args.signer.SigningKeyID(),
		Status: SigningStatus_Canceled,
	}
	close(args.onLoop)

	verify(t, args)
	utils.RequireLogContains(t, args.logs, zap.InfoLevel, "signing still in progress")
}

func TestBackoffRetry(t *testing.T) {
	t.Parallel()

	var wg sync.WaitGroup
	t.Cleanup(wg.Wait)

	attempts := 0
	completed := make(chan struct{})
	args := validArgs(t)
	args.onLoop = make(chan SigningKeyRotationEvent)
	args.skre = make(chan SigningKeyRotationEvent, 1)
	orig := args.server.resources
	start := args.clock.Now()

	args.server.onClaim = func(ctx context.Context) {
		attempts++
		// 6 attempts is ~1hour
		if attempts < 6 {
			args.server.resources = nil
		} else if attempts == 6 {
			args.server.resources = orig
		} else {
			// > 6
			if len(args.server.resources) == 0 {
				close(completed)
			}
		}
		d := args.clock.Since(start)
		t.Logf("attempt %d, duration %v", attempts, d)
	}

	args.skre <- SigningKeyRotationEvent{
		KeyId:  args.signer.SigningKeyID(),
		Status: SigningStatus_InProgress,
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		args.onLoop <- emptySkre // signing needs extra loop to start
		for {
			select {
			case args.onLoop <- emptySkre:
				args.clock.Advance(7 * time.Minute)
			case <-completed:
				args.onLoop <- SigningKeyRotationEvent{
					KeyId:  args.signer.SigningKeyID(),
					Status: SigningStatus_Completed,
				}
				close(args.onLoop)
				return
			}
		}
	}()

	verify(t, args)
	utils.RequireLogContains(t, args.logs, zap.WarnLevel, "signing retrying, in backoff")
	require.Less(t, attempts, 100)
}

func TestBackoffRetryButCanceled(t *testing.T) {
	t.Parallel()

	var wg sync.WaitGroup
	t.Cleanup(wg.Wait)

	attempts := 0
	args := validArgs(t)
	args.server.resources = nil
	args.onLoop = make(chan SigningKeyRotationEvent)

	args.server.onClaim = func(ctx context.Context) {
		attempts++
		if attempts > 1 {
			<-ctx.Done()
		} else {
			wg.Add(1)
			go func() {
				defer wg.Done()
				args.onLoop <- emptySkre // enter backoff
				args.onLoop <- emptySkre
				args.skre <- SigningKeyRotationEvent{
					KeyId:  args.signer.SigningKeyID(),
					Status: SigningStatus_Canceled,
				}
				args.onLoop <- emptySkre
				args.clock.Advance(time.Minute)
				args.onLoop <- emptySkre
				close(args.onLoop)
				args.cancel()
			}()
		}
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		args.onLoop <- emptySkre // signing needs extra loop to start
	}()

	verify(t, args)
	utils.RequireLogContains(t, args.logs, zap.WarnLevel, "signing retrying, in backoff")
	utils.RequireLogContains(t, args.logs, zap.DebugLevel, "would have retried, but event canceled")
}

func TestErrServerGetBatchError(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.server.errClaimBatchToSign = broken
	testRunLoop(t, args)
	verifyError(t, args, "error signing all resources", broken)
}

func TestErrSignerSignError(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.signer.errSign = broken
	testRunLoop(t, args)
	verifyError(t, args, "error signing single resource", broken)
}

func TestErrSignerSignErrorInvalidResourceType(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.server.ClaimBatchToSignSet([]*pbsecurity.Resource{
		{
			Config: nil, // "wrong type"
			GitRef: &pbsecurity.Resource_CommitId{
				CommitId: "0",
			},
		},
	})
	testRunLoop(t, args)
	verifyError(t, args, "error signing single resource", nil)
}

func TestErrServerUpdatesError(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	args.server.errPatchApiAsSignedResources = broken
	args.server.errUpdateAppAsSignedResources = broken
	testRunLoop(t, args)
	verifyError(t, args, "error signing all resources", broken)
}

func TestPatchFromApiLiteralMissingMetadata(t *testing.T) {
	t.Parallel()

	args := validArgs(t)
	apiNoMetadata, err := structpb.NewStruct(map[string]any{
		"blocks": map[string]any{},
	})
	require.NoError(t, err)

	resource := &pbsecurity.Resource{
		Config: &pbsecurity.Resource_Api{
			Api: structpb.NewStructValue(apiNoMetadata),
		},
	}
	err = args.signer.SignAndUpdateResource(resource)
	require.NoError(t, err)

	patchApi, err := updateFromApiLiteral(resource, apiNoMetadata)
	require.NoError(t, err)
	require.NotNil(t, patchApi)
}

func TestPatchFromApiLiteralMissingSignature(t *testing.T) {
	t.Parallel()

	apiNoSig, err := structpb.NewStruct(map[string]any{
		"metadata": map[string]any{
			"id": "0",
		},
	})
	require.NoError(t, err)

	resource := &pbsecurity.Resource{
		Config: &pbsecurity.Resource_Api{
			Api: structpb.NewStructValue(apiNoSig),
		},
	}

	patchApi, err := updateFromApiLiteral(resource, apiNoSig)
	require.NoError(t, err)
	require.NotNil(t, patchApi)
}
