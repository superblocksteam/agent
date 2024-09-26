package reconciler

import (
	"context"
	"crypto/sha256"
	"fmt"
	"sync"

	"github.com/superblocksteam/agent/pkg/crypto/signature"
	pbapi "github.com/superblocksteam/agent/types/gen/go/api/v1"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/structpb"
)

type fakeServer struct {
	done                          chan struct{}
	doneWhen                      int
	errClaimBatchToSign           error
	errPatchApiAsSignedResources  error
	errUpdateAppAsSignedResources error
	maxBatch                      int
	onClaim                       func(ctx context.Context)

	mu         sync.Mutex
	apiUpdates []*pbapi.UpdateApiSignature
	appUpdates []*pbapi.UpdateApplicationSignature
	resources  []*pbsecurity.Resource
}

func newFakeServer() *fakeServer {
	f := &fakeServer{
		done:     make(chan struct{}),
		maxBatch: 50,
	}
	return f
}

func (f *fakeServer) ClaimBatchToSign(ctx context.Context) ([]*pbsecurity.Resource, error) {
	if f.onClaim != nil {
		f.onClaim(ctx)
	}

	if ctx.Err() != nil {
		return nil, ctx.Err()
	}

	if f.errClaimBatchToSign != nil {
		return nil, f.errClaimBatchToSign
	}

	f.mu.Lock()
	defer f.mu.Unlock()
	var resources []*pbsecurity.Resource
	if len(f.resources) >= f.maxBatch {
		resources = f.resources[:f.maxBatch]
		f.resources = f.resources[f.maxBatch:]
	} else {
		resources = f.resources
		f.resources = nil
	}
	return resources, nil
}

func (f *fakeServer) ClaimBatchToSignSet(resources []*pbsecurity.Resource) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.resources = resources
}

func (f *fakeServer) markDoneLocked() {
	if f.doneWhen > 0 && len(f.apiUpdates)+len(f.appUpdates) >= f.doneWhen {
		close(f.done)
	}
}

func (f *fakeServer) UpdateApiAsSignedResources(ctx context.Context, updates []*pbapi.UpdateApiSignature) error {
	if ctx.Err() != nil {
		return ctx.Err()
	}

	if f.errPatchApiAsSignedResources != nil {
		return f.errPatchApiAsSignedResources
	}

	f.mu.Lock()
	defer f.mu.Unlock()
	f.apiUpdates = append(f.apiUpdates, updates...)
	f.markDoneLocked()
	return nil
}

func (f *fakeServer) UpdateAppAsSignedResources(ctx context.Context, updates []*pbapi.UpdateApplicationSignature) error {
	if ctx.Err() != nil {
		return ctx.Err()
	}

	if f.errUpdateAppAsSignedResources != nil {
		return f.errUpdateAppAsSignedResources
	}

	f.mu.Lock()
	defer f.mu.Unlock()
	f.appUpdates = append(f.appUpdates, updates...)
	f.markDoneLocked()
	return nil
}

type fakeSigner struct {
	errSign error
	keyId   string
}

func newFakeSigner() *fakeSigner {
	return &fakeSigner{
		keyId: "fake-key-id",
	}
}

func (f *fakeSigner) SignAndUpdateResource(res *pbsecurity.Resource) error {
	if f.errSign != nil {
		return f.errSign
	}

	data, err := protojson.Marshal(res)
	if err != nil {
		return fmt.Errorf("cannot marshal resource: %w", err)
	}

	hash := sha256.Sum256(data)
	return setSignature(res, &pbutils.Signature{KeyId: f.keyId, Data: hash[:]})
}

func (f *fakeSigner) SigningKeyID() string {
	return f.keyId
}

func setSignature(res *pbsecurity.Resource, sig *pbutils.Signature) error {
	switch t := res.Config.(type) {
	case *pbsecurity.Resource_Api:
		sigStruct := signature.SignatureProtoToStructpb(sig)
		t.Api.GetStructValue().GetFields()["signature"] = structpb.NewStructValue(sigStruct)
	case *pbsecurity.Resource_ApiLiteral_:
		sigStruct := signature.SignatureProtoToStructpb(sig)
		t.ApiLiteral.GetData().GetStructValue().GetFields()["signature"] = structpb.NewStructValue(sigStruct)
	case *pbsecurity.Resource_Literal_:
		t.Literal.Signature = sig
	default:
		return fmt.Errorf("unknown resource type: %T", t)
	}

	return nil
}
