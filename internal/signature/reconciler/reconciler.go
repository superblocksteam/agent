package reconciler

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/utils"
	pbapi "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	"google.golang.org/protobuf/types/known/structpb"

	"go.uber.org/zap"
)

type Server interface {
	ClaimBatchToSign(ctx context.Context) ([]*pbsecurity.Resource, error)
	PatchApiAsSignedResources(ctx context.Context, patches []*pbapi.PatchApi) error
	UpdateAppAsSignedResources(ctx context.Context, updates []*pbapi.UpdateApplicationSignature) error
}

// this enum is duplicated in server:
//
//	github.com/superblocksteam/superblocks
//	packages/shared/src/types/signingKeyRotationJob/index.ts
//	SigningKeyRotationJobStatus
type SigningStatus string

var (
	SigningStatus_Initial    SigningStatus = ""
	SigningStatus_Canceled   SigningStatus = "CANCELED"
	SigningStatus_Completed  SigningStatus = "COMPLETED"
	SigningStatus_Failed     SigningStatus = "FAILED"
	SigningStatus_InProgress SigningStatus = "IN_PROGRESS"
)

func (s SigningStatus) String() string {
	return string(s)
}

type SigningKeyRotationEvent struct {
	KeyId  string        `json:"signingKeyId,omitempty"`
	Status SigningStatus `json:"status,omitempty"`
}

type Signer interface {
	SignAndUpdateResource(res *pbsecurity.Resource) error
	SigningKeyID() string
}

type prepped struct {
	apiPatches []*pbapi.PatchApi
	appUpdates []*pbapi.UpdateApplicationSignature
}

type reconciler struct {
	log     *zap.Logger
	options options
	server  Server
	signer  Signer
	skre    <-chan SigningKeyRotationEvent

	// test only, pkg private
	testLoop func(state string, ctxErr error)
}

type state struct {
	inBackoff         bool
	loggedKeyMismatch bool
	signingCancel     context.CancelFunc
	startSigning      <-chan time.Time
	shouldBeSigning   bool
}

func New(
	log *zap.Logger,
	server Server,
	signer Signer,
	skre <-chan SigningKeyRotationEvent,
	options ...Option,
) *reconciler {
	r := &reconciler{
		log:     log.Named("signing/reconciler"),
		options: defaults(),
		server:  server,
		signer:  signer,
		skre:    skre,
	}

	for _, o := range options {
		o(&r.options)
	}

	return r
}

func (r *reconciler) Run(ctx context.Context) error {
	log := r.log
	ch := r.skre
	keyId := r.signer.SigningKeyID()
	signingErr := make(chan error)

	var state state
	var wg sync.WaitGroup

	defer func() {
		if state.signingCancel != nil {
			state.signingCancel()
		}
		wg.Wait()
		close(signingErr)
	}()

	for ctx.Err() == nil {
		select {
		case <-ctx.Done():
		case event, ok := <-ch:
			if !ok {
				ch = nil // future reads block forever
				log.Info("signing key rotation event chan closed, no more signing events")
				break
			}

			log.Info("signing key rotation event", zap.Any("event", event))

			state.shouldBeSigning = false
			switch event.Status {
			case SigningStatus_Initial:
				log.Info("initial signing state")
			case SigningStatus_InProgress:
				if event.KeyId != keyId {
					if !state.loggedKeyMismatch {
						log.Warn(
							"cannot participate in signing rotation job as signing key id differs",
							zap.String("signature.signing_key_id", keyId),
						)
						state.loggedKeyMismatch = true
					}
					break
				}

				if state.signingCancel != nil {
					log.Info("signing still in progress")
					break
				}

				state.shouldBeSigning = true
				ch := make(chan time.Time)
				close(ch)
				state.startSigning = ch
			case SigningStatus_Canceled:
				if state.signingCancel != nil {
					log.Info("canceling in progress rotation due to rotation event request")
					state.signingCancel()
					state.signingCancel = nil
				}
			case SigningStatus_Completed:
			case SigningStatus_Failed:
				log.Warn("signing key rotation event reports signing failed")
			default:
				log.Error("unknown signing key rotation event status",
					zap.String("status", event.Status.String()),
				)
			}
		case <-state.startSigning:
			state.startSigning = nil
			if !state.shouldBeSigning {
				// may have changed while we were in backoff
				log.Debug("would have retried, but event canceled")
				break
			}

			var signingCtx context.Context
			signingCtx, state.signingCancel = context.WithCancel(ctx)

			wg.Add(1)
			go func() {
				defer wg.Done()
				select {
				case <-ctx.Done():
				case signingErr <- r.signAllAndUpdateServer(signingCtx):
				}
			}()
		case err := <-signingErr:
			state.signingCancel = nil
			if err != nil {
				if errors.Is(err, context.Canceled) {
					log.Info("signing canceled")
				} else {
					log.Error("error signing all resources", zap.Error(err))
				}
			}

			if state.shouldBeSigning {
				if !state.inBackoff {
					state.inBackoff = true
					r.options.backoff.Reset()
				}

				// retry
				d := r.options.backoff.NextBackOff()

				// unfortunately, even in the happy path, this fires because the job completion
				// event is async to the reconciler returning. I considered removing it or
				// conditionally adding it, but I ended up leaving it for these reasons:
				//
				//	1. whenever this ends up 'sleeping', ideally it logs that it started sleeping or
				//	its confusing to someone following it closely why its not making progress
				//	2. the race between the event and reconcile completion cannot be fixed without
				//	API changes (the reconcile could know it finished if one of the APIs reported
				//	the job was finished)
				//
				// Because of this, prefer being a bit noisey in the general case to possibly less
				// noisey but more confusing in edge cases.
				log.Warn("signing retrying, in backoff", zap.Duration("backoff", d))

				state.startSigning = r.options.clock.After(d)
			} else {
				state.inBackoff = false
			}
		}
		if r.testLoop != nil {
			// only takes this branch in tests
			// fmt.Sprintf here ensures tests cannot modify internal state of loop
			r.testLoop(fmt.Sprintf("%#v", state), ctx.Err())
		}
	}

	return ctx.Err()
}

func (r *reconciler) signAllAndUpdateServer(ctx context.Context) error {
	log := r.log

	var batch []*pbsecurity.Resource
	var err error

	log.Info("looking for resources to sign")
	for ctx.Err() == nil {
		batch, err = r.server.ClaimBatchToSign(ctx)
		if err != nil {
			return fmt.Errorf("error getting batch to sign from server: %w", err)
		}

		if len(batch) == 0 {
			log.Info("no resources left to sign")
			break
		}

		log.Info("signing resources", zap.Int("len(batch)", len(batch)))
		toUpdate := []*pbsecurity.Resource{}
		for _, res := range batch {
			err = r.signer.SignAndUpdateResource(res)
			if err != nil {
				log.Error("error signing single resource",
					zap.Error(err),
					zap.String("resourcetype-id", resourceId(res)),
				)
				continue
			}

			toUpdate = append(toUpdate, res)
		}

		if len(toUpdate) == 0 {
			log.Info("no resources to update after signing")
			break
		}

		prepped := prep(log, toUpdate)

		var wg sync.WaitGroup
		var errApi error
		var errApp error

		if len(prepped.apiPatches) > 0 {
			wg.Add(1)
			go func() {
				defer wg.Done()

				errApi = r.server.PatchApiAsSignedResources(ctx, prepped.apiPatches)
				if errApi == nil {
					log.Info("signed apis patched", zap.Int("len(apiPatches)", len(prepped.apiPatches)))
				}
			}()
		} else {
			log.Info("no apis to patch")
		}

		if len(prepped.appUpdates) > 0 {
			wg.Add(1)
			go func() {
				defer wg.Done()

				errApp = r.server.UpdateAppAsSignedResources(ctx, prepped.appUpdates)
				if errApp == nil {
					log.Info("signed apps updated", zap.Int("len(appUpdates)", len(prepped.appUpdates)))
				}
			}()
		} else {
			log.Info("no apps to update")
		}

		wg.Wait()

		err = errors.Join(errApi, errApp)
		if err != nil {
			return fmt.Errorf("error updating server with signed resources: %w", err)
		}
	}

	return ctx.Err()
}

func prep(log *zap.Logger, resources []*pbsecurity.Resource) prepped {
	prepped := prepped{}

	for _, res := range resources {
		resId := resourceId(res)

		if res.GetApiLiteral() != nil {
			patch, err := patchFromApiLiteral(res, res.GetApiLiteral().GetData().GetStructValue())
			if err != nil {
				log.Error("error building patch from api literal", zap.Error(err), zap.String(observability.OBS_TAG_RESOURCE_ID, resId))
				continue
			}
			prepped.apiPatches = append(prepped.apiPatches, patch)
		} else if res.GetApi() != nil {
			api := res.GetApi()
			patch := &pbapi.PatchApi{
				Api: &pbapi.Api{
					Signature: api.GetSignature(),
					Metadata:  api.GetMetadata(),
				},
			}

			if res.GetCommitId() != "" {
				patch.GitRef = &pbapi.PatchApi_CommitId{
					CommitId: res.GetCommitId(),
				}
			}

			if res.GetBranchName() != "" {
				patch.GitRef = &pbapi.PatchApi_BranchName{
					BranchName: res.GetBranchName(),
				}
			}

			prepped.apiPatches = append(prepped.apiPatches, patch)
		} else if res.GetLiteral() != nil {
			literal := res.GetLiteral()
			update := &pbapi.UpdateApplicationSignature{
				ApplicationId: literal.GetResourceId(),
				Signature:     literal.GetSignature(),
				Updated:       literal.GetLastUpdated(),
				PageVersion:   literal.GetPageVersion(),
			}

			if res.GetCommitId() != "" {
				update.GitRef = &pbapi.UpdateApplicationSignature_CommitId{
					CommitId: res.GetCommitId(),
				}
			}

			if res.GetBranchName() != "" {
				update.GitRef = &pbapi.UpdateApplicationSignature_BranchName{
					BranchName: res.GetBranchName(),
				}
			}

			prepped.appUpdates = append(prepped.appUpdates, update)
		} else {
			log.Error("unknown resource type", zap.Any("resource", res))
			continue
		}
	}

	return prepped
}

func patchFromApiLiteral(res *pbsecurity.Resource, api *structpb.Struct) (*pbapi.PatchApi, error) {
	metadata := &commonv1.Metadata{}
	if err := utils.StructPbToProto(api.GetFields()["metadata"].GetStructValue(), metadata); err != nil {
		return nil, fmt.Errorf("error converting metadata literal to proto: %w", err)
	}

	sig, err := signature.StructpbToSignatureProto(api.GetFields()["signature"].GetStructValue())
	if err != nil {
		return nil, fmt.Errorf("error converting signature literal to proto: %w", err)
	}

	patch := &pbapi.PatchApi{
		Api: &pbapi.Api{
			Metadata:  metadata,
			Signature: sig,
		},
	}

	if res.GetCommitId() != "" {
		patch.GitRef = &pbapi.PatchApi_CommitId{
			CommitId: res.GetCommitId(),
		}
	}

	if res.GetBranchName() != "" {
		patch.GitRef = &pbapi.PatchApi_BranchName{
			BranchName: res.GetBranchName(),
		}
	}

	return patch, nil
}

func resourceId(res *pbsecurity.Resource) string {
	switch t := res.Config.(type) {
	case *pbsecurity.Resource_Api:
		return "api-" + t.Api.GetMetadata().GetId()
	case *pbsecurity.Resource_ApiLiteral_:
		resourceId, err := utils.GetStructField(t.ApiLiteral.GetData().GetStructValue(), "metadata.id")
		if err != nil {
			resourceId = structpb.NewStringValue("unknown")
		}
		return "api-" + resourceId.GetStringValue()
	case *pbsecurity.Resource_Literal_:
		return "app-" + t.Literal.GetResourceId()
	default:
		return "unknown"
	}
}
