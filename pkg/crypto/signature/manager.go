package signature

import (
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
	securityv1 "github.com/superblocksteam/agent/types/gen/go/security/v1"
	pbutils "github.com/superblocksteam/agent/types/gen/go/utils/v1"
)

type Registry interface {
	Sign(*securityv1.Resource) ([]byte, error)
	SignAndUpdateResource(*securityv1.Resource) error
	Verify(*securityv1.Resource) error

	SigningKeyID() string
	PublicKeys() map[string]string
}

type Key struct {
	ID    string
	Value []byte
}

type manager struct {
	signingKeyID        string
	serializer          ResourceSerializer
	resourceSigners     map[string]Signature
	verificationEnabled bool
}

func Manager(verificationEnabled bool, keySecrets []Key, signingKeyID string, serializer ResourceSerializer) (Registry, error) {
	m := &manager{
		resourceSigners:     make(map[string]Signature),
		serializer:          serializer,
		signingKeyID:        signingKeyID,
		verificationEnabled: verificationEnabled,
	}

	var errs error
	for _, key := range keySecrets {
		ed25519Signer, err := NewEd25519Signer(key.Value, sha256.New())
		if err != nil {
			errs = errors.Join(errs, err)
		} else {
			m.resourceSigners[key.ID] = ed25519Signer
		}
	}

	errs = errors.Join(errs, validateConfiguration(m))

	return m, errs
}

// validateConfiguration must allow for the following states:
//
//  1. no keys, no signing/verification (enabled false, no keys given, no signing key given)
//     --signature.verification.enabled=false, --signature.keys=, --signature.signing_key_id=
//
//  2. signing, no verification (enabled false, keys + signing key given)
//     --signature.verification.enabled=false, --signature.keys=key=secret, --signature.signing_key_id=key
//
//  3. signing, verification (enabled true, keys + signing key given)
//     --signature.verification.enabled=true, --signature.keys=key=secret, --signature.signing_key_id=key
//
// in states 2 and 3, there may be extra signature.keys to allow for verification during rotation
func validateConfiguration(m *manager) error {
	_, signingKeyExists := m.resourceSigners[m.signingKeyID]
	if m.signingKeyID != "" {
		if !signingKeyExists {
			return &sberrors.ValidationError{Issues: []error{
				errors.New("the signature.signing_key_id cannot be found in the set of signature.keys supplied"),
			}}
		}
	}

	if m.verificationEnabled {
		if len(m.resourceSigners) == 0 {
			return &sberrors.ValidationError{Issues: []error{
				errors.New("when signature.verification.enabled=true, signature.keys must be supplied"),
			}}
		}
		if m.signingKeyID == "" {
			return &sberrors.ValidationError{Issues: []error{
				errors.New("when signature.verification.enabled=true, signature.signing_key_id must be supplied"),
			}}
		}
	}

	return nil
}

func (m *manager) SigningKeyID() string {
	return m.signingKeyID
}

func (m *manager) PublicKeys() map[string]string {
	publicKeys := make(map[string]string, len(m.resourceSigners))
	for keyId := range m.resourceSigners {
		publicKeys[keyId] = base64.StdEncoding.EncodeToString(m.resourceSigners[keyId].PublicKey())
	}

	return publicKeys
}

func (m *manager) Sign(resource *securityv1.Resource) ([]byte, error) {
	if m.signingKeyID == "" {
		return nil, nil
	}

	payload, _, err := m.serializer.Serialize(resource)
	if err != nil {
		return nil, err
	}

	return m.resourceSigners[m.signingKeyID].Sign(payload)
}

func (m *manager) SignAndUpdateResource(resource *securityv1.Resource) error {
	signature, err := m.Sign(resource)
	if err != nil {
		return fmt.Errorf("failed to sign resource: %w", err)
	}

	signer := m.resourceSigners[m.SigningKeyID()]
	return m.serializer.UpdateResourceWithSignature(
		resource,
		m.SigningKeyID(),
		toAlgorithmEnumProto(signer.Algorithm()),
		signer.PublicKey(),
		signature,
	)
}

func (m *manager) Verify(resource *securityv1.Resource) error {
	if !m.verificationEnabled {
		return nil
	}

	payload, signature, err := m.serializer.Serialize(resource)
	if err != nil {
		return err
	}

	var verifyErrs error
	for keyId, signer := range m.resourceSigners {
		err := signer.Verify(payload, signature)
		if err == nil {
			return nil
		}

		if _, isSigErr := IsSignatureError(err); isSigErr {
			verifyErrs = SignatureError(verifyErrs, err)
		} else {
			verifyErrs = errors.Join(verifyErrs, fmt.Errorf("%s: %w", keyId, err))
		}
	}

	return verifyErrs
}

func toAlgorithmEnumProto(algo SigningAlgorithm) pbutils.Signature_Algorithm {
	switch algo {
	case ED25519:
		return pbutils.Signature_ALGORITHM_ED25519
	default:
		return pbutils.Signature_ALGORITHM_UNSPECIFIED
	}
}
