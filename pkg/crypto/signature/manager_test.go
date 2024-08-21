package signature

import (
	"encoding/base64"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	utilsv1 "github.com/superblocksteam/agent/types/gen/go/utils/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestManager(t *testing.T) {
	for _, test := range []struct {
		name                string
		verificationEnabled bool
		keys                []Key
		signingKeyId        string
		expectedErr         error
	}{
		{
			// validateConfiguration state #3
			name:                "verification enabled and signing key id set, valid",
			verificationEnabled: true,
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			signingKeyId: "my_key",
		},
		{
			// validateConfiguration state #2
			name: "verification disabled, valid signing key",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			signingKeyId: "my_key",
		},
		{
			// this state is useful for humans to change the mode of operation (verification,
			// signing) separately from managing the set of names+secrets
			//
			//	SUPERBLOCKS_ORCHESTRATOR_SIGNATURE_SIGNING_KEY_ID=k1
			//	SUPERBLOCKS_ORCHESTRATOR_SIGNATURE_KEYS=k1=secret1,k2=secret2
			//	SUPERBLOCKS_ORCHESTRATOR_SIGNATURE_VERIFICATION_ENABLED=true
			//
			// An operator can change/unset SUPERBLOCKS_ORCHESTRATOR_SIGNATURE_SIGNING_KEY_ID and
			// SUPERBLOCKS_ORCHESTRATOR_SIGNATURE_VERIFICATION_ENABLED without disturbing the set
			// of keys and their secrets (otherwise, they'd have to copy/paste them somewhere else
			// to preserve them in order to move between modes documented in validateConfiguration)
			//
			name: "verification disabled, valid no signing key",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
		},
		{
			// validateConfiguration state #1
			name: "verification disabled, valid no keys",
			keys: []Key{},
		},
		{
			name:                "verification enabled, invalid no signing key",
			verificationEnabled: true,
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			expectedErr: errors.New("when signature.verification.enabled=true, signature.signing_key_id must be supplied"),
		},
		{
			name:                "verification enabled, invalid signing key set and absent from keys",
			verificationEnabled: true,
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			signingKeyId: "frank",
			expectedErr:  errors.New("the signature.signing_key_id cannot be found in the set of signature.keys supplied"),
		},
		{
			name:                "verification enabled, invalid no keys",
			verificationEnabled: true,
			keys:                []Key{},
			signingKeyId:        "frank",
			expectedErr:         errors.New("the signature.signing_key_id cannot be found in the set of signature.keys supplied"),
		},
		{
			name:                "verification enabled, invalid nil keys",
			verificationEnabled: true,
			keys:                nil,
			signingKeyId:        "frank",
			expectedErr:         errors.New("the signature.signing_key_id cannot be found in the set of signature.keys supplied"),
		},
		{
			name: "verification disabled, invalid signing key set and absent from keys",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			signingKeyId: "frank",
			expectedErr:  errors.New("the signature.signing_key_id cannot be found in the set of signature.keys supplied"),
		},
		{
			name: "error building manager (nil key value)",
			keys: []Key{
				{
					ID:    "signing_key",
					Value: nil,
				},
			},
			signingKeyId: "signing_key",
			expectedErr:  errors.New("key secret must be provided to generate public/private key pair\nthe signature.signing_key_id cannot be found in the set of signature.keys supplied"),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			registry, err := Manager(test.verificationEnabled, test.keys, test.signingKeyId, NewResourceSerializer())

			if test.expectedErr != nil {
				assert.EqualError(t, err, test.expectedErr.Error())
			} else {
				assert.NotNil(t, registry)
				assert.NoError(t, err)
				assert.Equal(t, test.signingKeyId, registry.SigningKeyID())

				for _, key := range test.keys {
					resourceSigner := registry.(*manager).resourceSigners[key.ID]
					assert.NotNil(t, resourceSigner)
					assert.Equal(t, ED25519, resourceSigner.Algorithm())
				}
			}
		})
	}
}

func TestManagerPublicKeys(t *testing.T) {
	for _, test := range []struct {
		name                string
		verificationEnabled bool
		signingKeyId        string
		keys                []Key
		expected            map[string]string
	}{
		{
			name:                "single key",
			verificationEnabled: true,
			signingKeyId:        "my_key",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			expected: map[string]string{
				"my_key": base64.StdEncoding.EncodeToString([]byte("public-key")),
			},
		},
		{
			name:                "multiple keys",
			verificationEnabled: true,
			signingKeyId:        "my_key",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
				{
					ID:    "my_other_key",
					Value: []byte("other_secret"),
				},
			},
			expected: map[string]string{
				"my_key":       base64.StdEncoding.EncodeToString([]byte("public-key")),
				"my_other_key": base64.StdEncoding.EncodeToString([]byte("public-key")),
			},
		},
		{
			name:     "no keys",
			keys:     []Key{},
			expected: map[string]string{},
		},
		{
			name:     "nil keys",
			keys:     nil,
			expected: map[string]string{},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			mockSignature := NewMockSignature(t)
			if len(test.keys) > 0 {
				mockSignature.On("PublicKey").Return([]byte("public-key")).Times(len(test.keys))
			}

			signers := make(map[string]Signature)
			for _, key := range test.keys {
				signers[key.ID] = mockSignature
			}

			registry := manager{
				verificationEnabled: test.verificationEnabled,
				resourceSigners:     signers,
				serializer:          NewResourceSerializer(),
				signingKeyID:        test.signingKeyId,
			}

			publicKeys := registry.PublicKeys()

			assert.Equal(t, test.expected, publicKeys)
		})
	}
}

func TestManagerSign(t *testing.T) {
	anyResource := &securityv1.Resource{
		Config: &securityv1.Resource_Literal_{
			Literal: &securityv1.Resource_Literal{
				Data: structpb.NewStringValue("any-resource"),
			},
		},
	}
	anySerializedOutput := []byte("any-serialized-output")
	anySignature := []byte("any-signature-value")
	signedResourceSignature := []byte("signed-payload")

	for _, test := range []struct {
		name                string
		verificationEnabled bool
		keys                []Key
		signingKeyId        string
		serializeErr        error
		shouldCallSerialize bool
		shouldSignResource  bool
		expectedSignature   []byte
		shouldErr           bool
	}{
		{
			name:                "valid",
			verificationEnabled: true,
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			signingKeyId:        "my_key",
			shouldCallSerialize: true,
			shouldSignResource:  true,
			expectedSignature:   signedResourceSignature,
		},
		{
			name:                "skips signing",
			verificationEnabled: false,
			keys:                []Key{},
		},
		{
			name:                "serialize resource fails",
			verificationEnabled: true,
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			signingKeyId:        "my_key",
			serializeErr:        errors.New("serialize error"),
			shouldCallSerialize: true,
			shouldErr:           true,
		},
		{
			name:                "signing fails",
			verificationEnabled: true,
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			signingKeyId:        "my_key",
			shouldCallSerialize: true,
			shouldSignResource:  true,
			shouldErr:           true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var signingErr error
			if test.shouldErr {
				signingErr = errors.New("signing error")
			}

			mockResourceSerializer := NewMockResourceSerializer(t)
			if test.shouldCallSerialize {
				mockResourceSerializer.On("Serialize", anyResource).Return(anySerializedOutput, anySignature, test.serializeErr).Once()
			}

			mockSignature := NewMockSignature(t)
			if test.shouldSignResource {
				mockSignature.On("Sign", anySerializedOutput).Return(test.expectedSignature, signingErr).Once()
			}

			signers := make(map[string]Signature)
			for _, key := range test.keys {
				signers[key.ID] = mockSignature
			}

			registry := manager{
				verificationEnabled: test.verificationEnabled,
				resourceSigners:     signers,
				serializer:          mockResourceSerializer,
				signingKeyID:        test.signingKeyId,
			}

			signature, err := registry.Sign(anyResource)

			if test.shouldErr {
				assert.Error(t, err)
			} else {
				assert.Equal(t, test.expectedSignature, signature)
				assert.NoError(t, err)
			}
		})
	}
}

func TestManagerSignAndUpdateResource(t *testing.T) {
	anyResource := &securityv1.Resource{
		Config: &securityv1.Resource_Literal_{
			Literal: &securityv1.Resource_Literal{
				Data: structpb.NewStringValue("any-resource"),
			},
		},
	}
	anySerializedOutput := []byte("any-serialized-output")
	anySignature := []byte("any-signature-value")
	signedResourceSignature := []byte("signed-payload")

	for _, test := range []struct {
		name              string
		signingErr        bool
		updateErr         error
		shouldCallUpdate  bool
		expectedSignature []byte
	}{
		{
			name:              "valid",
			shouldCallUpdate:  true,
			expectedSignature: signedResourceSignature,
		},
		{
			name:       "signing fails",
			signingErr: true,
		},
		{
			name:              "update fails fails",
			shouldCallUpdate:  true,
			updateErr:         errors.New("update error"),
			expectedSignature: signedResourceSignature,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var signingErr error
			if test.signingErr {
				signingErr = errors.New("signing error")
			}

			signingKeyId := "my_key"

			mockResourceSerializer := NewMockResourceSerializer(t)
			mockResourceSerializer.On("Serialize", anyResource).Return(anySerializedOutput, anySignature, nil).Once()
			if test.shouldCallUpdate {
				mockResourceSerializer.On("UpdateResourceWithSignature", anyResource, signingKeyId, signedResourceSignature).Return(test.updateErr).Once()
			}

			mockSignature := NewMockSignature(t)
			mockSignature.On("Sign", anySerializedOutput).Return(signedResourceSignature, signingErr).Once()

			signers := map[string]Signature{
				"my_key": mockSignature,
			}

			registry := manager{
				verificationEnabled: true,
				resourceSigners:     signers,
				serializer:          mockResourceSerializer,
				signingKeyID:        signingKeyId,
			}

			err := registry.SignAndUpdateResource(anyResource)

			if test.signingErr || test.updateErr != nil {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestManagerVerify(t *testing.T) {
	anyResource := &securityv1.Resource{
		Config: &securityv1.Resource_Literal_{
			Literal: &securityv1.Resource_Literal{
				Data: structpb.NewStringValue("any-resource"),
				Signature: &utilsv1.Signature{
					Data: []byte("any-signature-value"),
				},
			},
		},
	}
	anySerializedOutput := []byte("any-serialized-output")
	anySignature := []byte("any-signature-value")

	for _, test := range []struct {
		name                      string
		verificationEnabled       bool
		signingKeyId              string
		keys                      []Key
		serializeErr              error
		shouldCallSerialize       bool
		numExpectedVerifyAttempts int
		shouldErr                 bool
	}{
		{
			name:                "skips verification when disabled",
			verificationEnabled: false,
		},
		{
			name:                "valid resource, one key",
			verificationEnabled: true,
			signingKeyId:        "example",
			keys: []Key{
				{
					ID:    "example",
					Value: []byte("koala"),
				},
			},
			shouldCallSerialize:       true,
			numExpectedVerifyAttempts: 1,
		},
		{
			name:                "valid resource succeeds with no signing key",
			verificationEnabled: true,
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			shouldCallSerialize:       true,
			numExpectedVerifyAttempts: 1,
		},
		{
			name:                "valid resource, multiple keys",
			verificationEnabled: true,
			signingKeyId:        "my_key",
			keys: []Key{
				{
					ID:    "my_key_wrong",
					Value: []byte("wrong"),
				},
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			shouldCallSerialize:       true,
			numExpectedVerifyAttempts: 1,
		},
		{
			name:                "serialize fails",
			verificationEnabled: true,
			signingKeyId:        "my_key",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			serializeErr:        errors.New("serialize error"),
			shouldCallSerialize: true,
			shouldErr:           true,
		},
		{
			name:                "verify fails, single key",
			verificationEnabled: true,
			signingKeyId:        "my_key",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
			},
			shouldCallSerialize:       true,
			numExpectedVerifyAttempts: 1,
			shouldErr:                 true,
		},
		{
			name:                "verify fails, multiple keys",
			verificationEnabled: true,
			signingKeyId:        "my_key",
			keys: []Key{
				{
					ID:    "my_key",
					Value: []byte("secret"),
				},
				{
					ID:    "my_other_key",
					Value: []byte("wrong_secret"),
				},
			},
			shouldCallSerialize:       true,
			numExpectedVerifyAttempts: 2,
			shouldErr:                 true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			var verifyErr error
			if test.shouldErr {
				verifyErr = errors.New("verification error")
			}

			mockResourceSerializer := NewMockResourceSerializer(t)
			if test.shouldCallSerialize {
				mockResourceSerializer.On("Serialize", anyResource).Return(anySerializedOutput, anySignature, test.serializeErr).Once()
			}

			mockSignature := NewMockSignature(t)
			if test.numExpectedVerifyAttempts > 0 {
				mockSignature.On("Verify", anySerializedOutput, anySignature).Return(verifyErr).Times(test.numExpectedVerifyAttempts)
			}

			signers := make(map[string]Signature)
			for _, key := range test.keys {
				signers[key.ID] = mockSignature
			}

			registry := manager{
				verificationEnabled: test.verificationEnabled,
				resourceSigners:     signers,
				serializer:          mockResourceSerializer,
				signingKeyID:        test.signingKeyId,
			}

			err := registry.Verify(anyResource)

			if test.shouldErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
