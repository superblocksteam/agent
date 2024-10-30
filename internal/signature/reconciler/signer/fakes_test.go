package signer

import (
	"bytes"
	"crypto/sha256"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

var (
	errSignatureIntegrityError = errors.New("signature integrity error")
)

type fakeSignerManager struct {
	errSign   error
	errVerify error
	keyId     string
	algorithm pbutils.Signature_Algorithm
	publicKey []byte
}

func newFakeSignerManager() *fakeSignerManager {
	return &fakeSignerManager{
		keyId:     "fake-key-id",
		algorithm: pbutils.Signature_ALGORITHM_ED25519,
		publicKey: []byte("fake-public-key"),
	}
}

func (f *fakeSignerManager) SignAndUpdateResource(res *pbsecurity.Resource) error {
	if f.errSign != nil {
		return f.errSign
	}

	sig, _ := hash(res)
	setSignature(
		res,
		&pbutils.Signature{
			KeyId:     f.keyId,
			Algorithm: f.algorithm,
			PublicKey: f.publicKey,
			Data:      sig,
		},
	)

	return nil
}

func (f *fakeSignerManager) Verify(res *pbsecurity.Resource) error {
	if f.errVerify != nil {
		return f.errVerify
	}

	actual, err := hash(res)
	if err != nil {
		return fmt.Errorf("error hashing security.Resource: %w", err)
	}

	expected := getSignature(res)
	if !bytes.Equal(actual, expected) {
		return errSignatureIntegrityError
	}
	return nil
}

func (f *fakeSignerManager) SigningKeyID() string {
	return f.keyId
}

func (f *fakeSignerManager) PublicKeys() map[string]signature.PublicKey {
	return map[string]signature.PublicKey{
		f.keyId: {
			Algorithm: f.algorithm,
			Value:     f.publicKey,
		},
	}
}

func getSignature(res *pbsecurity.Resource) []byte {
	switch t := res.Config.(type) {
	case *pbsecurity.Resource_Api:
		sig, err := signature.StructpbToSignatureProto(t.Api.GetStructValue().GetFields()["signature"].GetStructValue())
		if err != nil {
			return []byte("invalid-type-no-signature-" + uuid.NewString())
		}
		return sig.GetData()
	case *pbsecurity.Resource_ApiLiteral_:
		sigStruct := t.ApiLiteral.GetData().GetStructValue().GetFields()["signature"].GetStructValue()
		sig, err := signature.StructpbToSignatureProto(sigStruct)
		if err != nil {
			return []byte("invalid-type-no-signature-" + uuid.NewString())
		}
		return sig.GetData()
	case *pbsecurity.Resource_Literal_:
		return t.Literal.GetSignature().GetData()
	default:
		// try really hard to make sure signatures are always unique for this case so something
		// blows up
		return []byte("invalid-type-no-signature-" + uuid.NewString())
	}
}

func setSignature(res *pbsecurity.Resource, sig *pbutils.Signature) {
	switch t := res.Config.(type) {
	case *pbsecurity.Resource_Api:
		if sig == nil {
			t.Api.GetStructValue().Fields["signature"] = structpb.NewNullValue()
			break
		}

		sigStruct := signature.SignatureProtoToStructpb(sig)
		t.Api.GetStructValue().Fields["signature"] = structpb.NewStructValue(sigStruct)
	case *pbsecurity.Resource_ApiLiteral_:
		if sig == nil {
			t.ApiLiteral.Data.GetStructValue().Fields["signature"] = structpb.NewNullValue()
			break
		}

		sigStruct := signature.SignatureProtoToStructpb(sig)
		t.ApiLiteral.Data.GetStructValue().Fields["signature"] = structpb.NewStructValue(sigStruct)
	case *pbsecurity.Resource_Literal_:
		t.Literal.Signature = sig
	}
}

func hash(res *pbsecurity.Resource) ([]byte, error) {
	res = proto.Clone(res).(*pbsecurity.Resource)
	setSignature(res, nil)

	data, err := protojson.Marshal(res)
	if err != nil {
		return nil, fmt.Errorf("marshal security.Resource error: %w", err)
	}

	hash := sha256.Sum256(data)
	return hash[:], nil
}
