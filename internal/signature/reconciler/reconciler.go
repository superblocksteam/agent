package reconciler

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/superblocksteam/agent/pkg/crypto/signature"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/utils"
	pbapi "github.com/superblocksteam/agent/types/gen/go/api/v1"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"google.golang.org/protobuf/types/known/structpb"

	"go.uber.org/zap"
)

type Server interface {
	ClaimBatchToSign(ctx context.Context) ([]*pbsecurity.Resource, error)
	UpdateApiAsSignedResources(ctx context.Context, patches []*pbapi.UpdateApiSignature) error
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
	Algorithm() pbutils.Signature_Algorithm
	PublicKey() []byte
}

type signingResult struct {
	resource *pbsecurity.Resource
	err      error
}

type prepped struct {
	apiUpdates []*pbapi.UpdateApiSignature
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
		toUpdate := make([]*signingResult, 0, len(batch))
		for _, res := range batch {
			if err := r.signer.SignAndUpdateResource(res); err != nil {
				resType, resId := resourceId(res)
				fullResId := strings.TrimLeft(strings.Join([]string{resType, resId}, "-"), "-")

				log.Error("error signing single resource",
					zap.Error(err),
					zap.String("resourcetype-id", fullResId),
				)

				toUpdate = append(toUpdate, &signingResult{resource: res, err: err})
			} else {
				toUpdate = append(toUpdate, &signingResult{resource: res})
			}
		}

		prepped := r.prep(log, toUpdate)

		var wg sync.WaitGroup
		var errApi error
		var errApp error

		if len(prepped.apiUpdates) > 0 {
			wg.Add(1)
			go func() {
				defer wg.Done()

				errApi = r.server.UpdateApiAsSignedResources(ctx, prepped.apiUpdates)
				if errApi == nil {
					log.Info("signed apis updated", zap.Int("len(apiUpdates)", len(prepped.apiUpdates)))
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

func (r *reconciler) prep(log *zap.Logger, resources []*signingResult) prepped {
	prepped := prepped{}

	for _, result := range resources {
		res := result.resource
		resType, resId := resourceId(res)
		fullResId := strings.TrimLeft(strings.Join([]string{resType, resId}, "-"), "-")

		if res.GetApiLiteral() != nil {
			update, err := r.updateFromApiLiteral(resId, result, res.GetApiLiteral().GetData().GetStructValue())
			if err != nil {
				log.Error("error building patch from api literal", zap.Error(err), zap.String(observability.OBS_TAG_RESOURCE_ID, fullResId))
				continue
			}
			prepped.apiUpdates = append(prepped.apiUpdates, update)
		} else if res.GetApi() != nil {
			update, err := r.updateFromApiLiteral(resId, result, res.GetApi().GetStructValue())
			if err != nil {
				log.Error("error building patch from api", zap.Error(err), zap.String(observability.OBS_TAG_RESOURCE_ID, fullResId))
				continue
			}
			prepped.apiUpdates = append(prepped.apiUpdates, update)
		} else if res.GetLiteral() != nil {
			literal := res.GetLiteral()
			update := &pbapi.UpdateApplicationSignature{
				ApplicationId: resId,
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

			r.updateWithAppSigningResult(update, result)
			prepped.appUpdates = append(prepped.appUpdates, update)
		} else {
			log.Error("unknown resource type", zap.Any("resource", res))
			update := &pbapi.UpdateApiSignature{
				ApiId: resId,
				Result: &pbapi.UpdateApiSignature_Errors{
					Errors: r.sigRotationErrsFromErrs([]error{result.err}),
				},
			}
			prepped.apiUpdates = append(prepped.apiUpdates, update)
		}
	}

	return prepped
}

func (r *reconciler) updateFromApiLiteral(id string, res *signingResult, api *structpb.Struct) (*pbapi.UpdateApiSignature, error) {
	update := &pbapi.UpdateApiSignature{
		ApiId: id,
	}
	errs := []error{res.err}

	var sig *pbutils.Signature
	if res.err == nil {
		var err error
		sig, err = signature.StructpbToSignatureProto(api.GetFields()["signature"].GetStructValue())
		if err != nil {
			errs = append(errs, fmt.Errorf("error converting signature literal to proto: %w", err))
		}
	}

	if errs := sberrors.UnwrapJoined(errors.Join(errs...)); len(errs) > 0 {
		result := &pbapi.UpdateApiSignature_Errors{
			Errors: &pbapi.SignatureRotationErrors{
				KeyId:     r.signer.SigningKeyID(),
				Algorithm: r.signer.Algorithm(),
				PublicKey: r.signer.PublicKey(),
			},
		}
		for _, err := range errs {
			if err != nil {
				result.Errors.Errors = append(result.Errors.Errors, &pbapi.SignatureRotationError{Message: err.Error()})
			}
		}

		update.Result = result
	} else {
		update.Result = &pbapi.UpdateApiSignature_Signature{Signature: sig}
	}

	if res.resource.GetCommitId() != "" {
		update.GitRef = &pbapi.UpdateApiSignature_CommitId{
			CommitId: res.resource.GetCommitId(),
		}
	}

	if res.resource.GetBranchName() != "" {
		update.GitRef = &pbapi.UpdateApiSignature_BranchName{
			BranchName: res.resource.GetBranchName(),
		}
	}

	return update, nil
}

func (r *reconciler) updateWithAppSigningResult(update *pbapi.UpdateApplicationSignature, sr *signingResult) {
	if sr.err != nil {
		update.Result = &pbapi.UpdateApplicationSignature_Errors{
			Errors: r.sigRotationErrsFromErrs([]error{sr.err}),
		}
	} else {
		update.Result = &pbapi.UpdateApplicationSignature_Signature{
			Signature: sr.resource.GetLiteral().GetSignature(),
		}
	}
}

func (r *reconciler) sigRotationErrsFromErrs(errs []error) *pbapi.SignatureRotationErrors {
	result := &pbapi.SignatureRotationErrors{
		KeyId:     r.signer.SigningKeyID(),
		Algorithm: r.signer.Algorithm(),
		PublicKey: r.signer.PublicKey(),
	}
	for _, err := range errs {
		if err != nil {
			result.Errors = append(result.Errors, &pbapi.SignatureRotationError{Message: err.Error()})
		}
	}
	return result
}

func resourceId(res *pbsecurity.Resource) (string, string) {
	switch t := res.Config.(type) {
	case *pbsecurity.Resource_Api:
		resourceId, err := utils.GetStructField(t.Api.GetStructValue(), "metadata.id")
		if err != nil {
			resourceId = structpb.NewStringValue("unknown")
		}
		return "api", resourceId.GetStringValue()
	case *pbsecurity.Resource_ApiLiteral_:
		resourceId, err := utils.GetStructField(t.ApiLiteral.GetData().GetStructValue(), "metadata.id")
		if err != nil {
			resourceId = structpb.NewStringValue("unknown")
		}
		return "api", resourceId.GetStringValue()
	case *pbsecurity.Resource_Literal_:
		return "app", t.Literal.GetResourceId()
	default:
		return "", "unknown"
	}
}
