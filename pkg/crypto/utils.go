package crypto

import (
	"context"
	"crypto/ecdsa"
	"errors"

	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwk"
)

// LoadEcdsaPublicKeyFromJwksUrl loads an ECDSA public key from a JWKS URI.
func LoadEcdsaPublicKeyFromJwksUrl(ctx context.Context, url string) (*ecdsa.PublicKey, error) {
	set, err := jwk.Fetch(ctx, url)
	if err != nil {
		return nil, err
	}

	for it := set.Keys(ctx); it.Next(ctx); {
		key, ok := it.Pair().Value.(jwk.Key)
		if !ok {
			return nil, errors.New("malformed jwk set")
		}

		if key.KeyType() != jwa.EC {
			continue
		}

		var untyped any
		if err := key.Raw(&untyped); err != nil {
			return nil, err
		}

		typed, ok := untyped.(*ecdsa.PublicKey)
		if !ok {
			continue
		}

		return typed, nil
	}

	return nil, errors.New("no EC public keys found in jwk set")
}
