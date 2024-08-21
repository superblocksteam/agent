package signature

import (
	cryptorand "crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"hash"
	"io"
	mathrand "math/rand/v2"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
)

var (
	payloadData          = []byte(`{"one":"two"}`)
	payloadDataSignature = "9573863cfd175ea1f9f9149e15ab7c22c955dbbb41fa82bc9dcd63d22f9bea659af7152c7368ea18594c9888487bcbf58adf1004ae993d2d42704c29ff364308"

	emptyPayloadData          = []byte{}
	emptyPayloadDataSignature = "b772f78994e15af00f42968060995b39d2c46f3bade09dd6e90e2865600b7a24032f9bd46a4c681f604ad0bdca2ba0770fbee573e44a2ed1056bb402f6c8e001"

	otherPayloadData          = []byte(`{"one":"three"}`)
	otherPayloadDataSignature = "aea1e68ff4ec742b1ac3173dededd03114ea227b59b0444c5ba52fdf9bf21bd4dce002fb504b8dbd2fa579cb0f94cd54e8e2f85255689b49c1bea84289c6120a"

	signingKeySecret = []byte("secret")
)

func TestNewEd25519Signer(t *testing.T) {
	for _, test := range []struct {
		name        string
		keySecret   []byte
		hashFn      hash.Hash
		expectedErr error
	}{
		{
			name:      "creates valid ed25519 resource signer",
			keySecret: signingKeySecret,
			hashFn:    sha256.New(),
		},
		{
			name:      "empty key secret returns error",
			keySecret: []byte{},
			hashFn:    sha256.New(),
			expectedErr: &sberrors.ValidationError{
				Issues: []error{errors.New("key secret must be provided to generate public/private key pair")},
			},
		},
		{
			name:      "no key secret returns error",
			keySecret: nil,
			hashFn:    sha256.New(),
			expectedErr: &sberrors.ValidationError{
				Issues: []error{errors.New("key secret must be provided to generate public/private key pair")},
			},
		},
		{
			name:      "no hash function returns error",
			keySecret: signingKeySecret,
			hashFn:    nil,
			expectedErr: &sberrors.ValidationError{
				Issues: []error{errors.New("hash function must be provided to generate public/private key pair")},
			},
		},
		{
			name:      "hashing error returns error",
			keySecret: signingKeySecret,
			hashFn: &fakeHash{
				WriteError: errors.New("hashing error"),
			},
			expectedErr: &sberrors.InternalError{
				Err: errors.New("failed to hash key secret: hashing error"),
			},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			resourceSigner, err := NewEd25519Signer(test.keySecret, test.hashFn)

			if test.expectedErr != nil {
				assert.Error(t, err)
				assert.EqualError(t, err, test.expectedErr.Error())
			} else {
				assert.NotNil(t, resourceSigner)
				assert.NoError(t, err)
			}
		})
	}
}

func TestPublicKey(t *testing.T) {
	// Generate a random secret key with a random length between 1 and 100 bytes
	anySecretLength := mathrand.IntN(100) + 1
	anySecret := make([]byte, anySecretLength)
	_, err := io.ReadFull(cryptorand.Reader, anySecret)
	require.NoError(t, err)

	ed25519Signer, err := NewEd25519Signer(anySecret, sha256.New())
	require.NoError(t, err)

	publicKey := ed25519Signer.PublicKey()

	assert.Equal(t, []byte(ed25519Signer.publicKey), publicKey)
}

func TestAlgorithm(t *testing.T) {
	ed25519Signer, err := NewEd25519Signer(signingKeySecret, sha256.New())
	require.NoError(t, err)

	assert.Equal(t, ED25519, ed25519Signer.Algorithm())
}

func TestSign(t *testing.T) {
	for _, test := range []struct {
		name                        string
		payload                     []byte
		expectedErr                 error
		expectedHexEncodedSignature string
	}{
		{
			name:                        "valid",
			payload:                     payloadData,
			expectedHexEncodedSignature: payloadDataSignature,
		},
		{
			name:                        "valid empty payload",
			payload:                     emptyPayloadData,
			expectedHexEncodedSignature: emptyPayloadDataSignature,
		},
		{
			name:        "nil payload",
			payload:     nil,
			expectedErr: &sberrors.ValidationError{Issues: []error{errors.New("payload must be provided to sign")}},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ed25519Signer, err := NewEd25519Signer(signingKeySecret, sha256.New())
			require.NoError(t, err)

			signature, err := ed25519Signer.Sign(test.payload)

			if test.expectedErr != nil {
				assert.EqualError(t, err, test.expectedErr.Error())
			} else {
				assert.Equal(t, test.expectedHexEncodedSignature, hex.EncodeToString(signature))
				assert.NoError(t, err)
			}
		})
	}
}

func TestVerify(t *testing.T) {
	for _, test := range []struct {
		name        string
		payload     []byte
		signature   string
		expectedErr error
	}{
		{
			name:      "valid",
			payload:   payloadData,
			signature: payloadDataSignature,
		},
		{
			name:        "invalid signature",
			payload:     payloadData,
			signature:   otherPayloadDataSignature,
			expectedErr: SignatureError(errors.New("integrity check failed")),
		},
		{
			name:        "nil payload",
			signature:   payloadDataSignature,
			expectedErr: SignatureError(errors.New("integrity check failed")),
		},
		{
			name:        "empty payload",
			payload:     emptyPayloadData,
			expectedErr: SignatureError(errors.New("integrity check failed")),
		},
		{
			name:        "nil signature",
			payload:     otherPayloadData,
			expectedErr: SignatureError(errors.New("integrity check failed")),
		},
		{
			name:        "empty signature",
			payload:     otherPayloadData,
			signature:   "",
			expectedErr: SignatureError(errors.New("integrity check failed")),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ed25519Signer, err := NewEd25519Signer(signingKeySecret, sha256.New())
			require.NoError(t, err)

			signature, err := hex.DecodeString(test.signature)
			require.NoError(t, err)

			err = ed25519Signer.Verify(test.payload, signature)

			if test.expectedErr != nil {
				assert.EqualError(t, err, test.expectedErr.Error())
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
