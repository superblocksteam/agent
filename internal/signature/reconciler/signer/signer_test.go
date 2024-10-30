package signer

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
	pbsecurity "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"go.uber.org/zap/zaptest"
	"google.golang.org/protobuf/types/known/structpb"
)

var broken = errors.New("broken")

type args struct {
	sm *fakeSignerManager
}

type paramResourceType struct {
	name string
	res  *pbsecurity.Resource
}

func validArgs(t *testing.T) *args {
	return &args{
		sm: newFakeSignerManager(),
	}
}

func validParamResourceTypes(t *testing.T) []*paramResourceType {
	api, err := structpb.NewStruct(map[string]any{
		"metadata": map[string]any{
			"id": "0",
		},
	})
	require.NoError(t, err)

	literal, err := structpb.NewStruct(map[string]any{
		"metadata": map[string]any{
			"id": "0",
		},
	})
	require.NoError(t, err)

	prts := []*paramResourceType{
		{
			name: "api",
			res: &pbsecurity.Resource{
				Config: &pbsecurity.Resource_Api{
					Api: structpb.NewStructValue(api),
				},
				GitRef: &pbsecurity.Resource_CommitId{
					CommitId: "0",
				},
			},
		},
		{
			name: "api-literal",
			res: &pbsecurity.Resource{
				Config: &pbsecurity.Resource_ApiLiteral_{
					ApiLiteral: &pbsecurity.Resource_ApiLiteral{
						Data: structpb.NewStructValue(literal),
					},
				},
				GitRef: &pbsecurity.Resource_CommitId{
					CommitId: "0",
				},
			},
		},
		{
			name: "app",
			res: &pbsecurity.Resource{
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
	}

	for _, prt := range prts {
		signed, err := hash(prt.res)
		require.NoError(t, err)

		setSignature(prt.res, &pbutils.Signature{
			KeyId: "bogus",
			Data:  signed,
		})
	}

	return prts
}

func verify(t *testing.T, args *args, expectedErr error, res *pbsecurity.Resource) {
	log := zaptest.NewLogger(t)

	signer := New(log, args.sm)

	expectedSigned, err := hash(res)
	require.NoError(t, err)

	require.Equal(t, args.sm.keyId, signer.SigningKeyID())
	require.Equal(t, args.sm.algorithm, signer.Algorithm())
	require.Equal(t, args.sm.publicKey, signer.PublicKey())

	err = signer.SignAndUpdateResource(res)
	if expectedErr == nil {
		require.Equal(t, expectedSigned, getSignature(res))
	} else {
		require.ErrorIs(t, err, expectedErr)
	}
}

func verifyParamResourceTypes(t *testing.T, prts []*paramResourceType, run func(t *testing.T, res *pbsecurity.Resource)) {
	for _, prt := range prts {
		t.Run(prt.name, func(t *testing.T) {
			t.Parallel()
			run(t, prt.res)
		})
	}
}

func TestSign(t *testing.T) {
	prts := validParamResourceTypes(t)
	verifyParamResourceTypes(t, prts, func(t *testing.T, res *pbsecurity.Resource) {
		args := validArgs(t)
		verify(t, args, nil, res)
	})
}

func TestErrSignCannotVerify(t *testing.T) {
	prts := validParamResourceTypes(t)
	for _, prt := range prts {
		setSignature(prt.res, nil)
	}

	verifyParamResourceTypes(t, prts, func(t *testing.T, res *pbsecurity.Resource) {
		args := validArgs(t)
		verify(t, args, errSignatureIntegrityError, res)
	})
}

func TestErrSignCannotVerifyAnyError(t *testing.T) {
	prts := validParamResourceTypes(t)
	verifyParamResourceTypes(t, prts, func(t *testing.T, res *pbsecurity.Resource) {
		args := validArgs(t)
		args.sm.errVerify = broken
		verify(t, args, broken, res)
	})
}

func TestErrSignError(t *testing.T) {
	prts := validParamResourceTypes(t)
	verifyParamResourceTypes(t, prts, func(t *testing.T, res *pbsecurity.Resource) {
		args := validArgs(t)
		args.sm.errSign = broken
		verify(t, args, broken, res)
	})
}
