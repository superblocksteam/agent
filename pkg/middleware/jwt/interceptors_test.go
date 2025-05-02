package jwt

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/metadata"
)

type testClaims struct {
	jwt.RegisteredClaims

	UserEmail string `json:"user_email,omitempty"`
	OrgId     string `json:"org_id,omitempty"`
}

func TestValidate(t *testing.T) {
	t.Parallel()

	signingKey := []byte("testSigningKey")
	private_rsa, public_rsa := pair_rsa(t)
	private_ecdsa, public_ecdsa := pair_ecdsa(t)

	for _, test := range []struct {
		name   string
		errMsg string
		ctx    context.Context
	}{
		{
			name: "valid hmac jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, testClaims{
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
					},
					UserEmail: "fbgrecojr@me.com",
					OrgId:     "12345",
				}).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name: "valid rsa jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodRS256, testClaims{
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
					},
					UserEmail: "fbgrecojr@me.com",
					OrgId:     "12345",
				}).SignedString(private_rsa)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name: "valid ecdsa jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodES256, testClaims{
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
					},
					UserEmail: "fbgrecojr@me.com",
					OrgId:     "12345",
				}).SignedString(private_ecdsa)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name: "valid jwt with no claims",
			ctx: func() context.Context {
				token, err := jwt.New(jwt.SigningMethodHS256).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name:   "no incoming metadata",
			ctx:    context.Background(),
			errMsg: "could not get metadata from context",
		},
		{
			name:   "no auth in metadata",
			ctx:    metadata.NewIncomingContext(context.Background(), metadata.Pairs("other", "value")),
			errMsg: "could not get authorization token",
		},
		{
			name:   "malformed auth metadata",
			ctx:    metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer")),
			errMsg: "authorization token malformed",
		},
		{
			name: "wrong signing key",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{}).SignedString([]byte("wrongSigningKey"))
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
			errMsg: fmt.Sprintf("%s: %s", jwt.ErrTokenSignatureInvalid.Error(), "signature is invalid"),
		},
		{
			name: "expired jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(time.Now().Add(-5 * time.Minute)),
				}).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
			errMsg: fmt.Sprintf("%s: %s", jwt.ErrTokenInvalidClaims.Error(), jwt.ErrTokenExpired.Error()),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, err := validate(test.ctx, &options{
				key:             "authorization",
				hmacSigningKey:  []byte("testSigningKey"),
				rsaSigningKey:   public_rsa,
				ecdsaSigningKey: public_ecdsa,
				claimsFactory: func() jwt.Claims {
					return &testClaims{}
				},
			})

			if err != nil {
				assert.EqualError(t, err, test.errMsg, test.name)
				return
			} else if test.errMsg != "" {
				t.Fatalf("expected error %s, got nil", test.errMsg)
			}

			assert.NoError(t, err, test.name)
		})
	}
}

func TestValidate_AdditionalValidators(t *testing.T) {
	t.Parallel()

	signingKey := []byte("testSigningKey")
	for _, test := range []struct {
		name   string
		errMsg string
		ctx    context.Context
	}{
		{
			name: "valid jwt with additional validator",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, testClaims{
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
					},
					UserEmail: "testUser@test.com",
					OrgId:     "12345",
				}).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name: "invalid jwt additional validator missing org id claim",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, testClaims{
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
					},
				}).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
			errMsg: "could not get organization id",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx, err := validate(test.ctx, &options{
				key:            "authorization",
				hmacSigningKey: []byte("testSigningKey"),
				claimsFactory: func() jwt.Claims {
					return &testClaims{}
				},
				additionalValidators: []JwtValidator{
					func(ctx context.Context, token *jwt.Token, claims jwt.Claims) (context.Context, error) {
						c, ok := claims.(*testClaims)
						if !ok || !token.Valid {
							return nil, errors.New("could not parse jwt claims")
						}

						orgID := c.OrgId
						if orgID == "" {
							return nil, errors.New("could not get organization id")
						}
						ctx = context.WithValue(ctx, "org_id", orgID)

						return ctx, nil
					},
				},
			})

			if err != nil {
				assert.EqualError(t, err, test.errMsg, test.name)
				return
			} else if test.errMsg != "" {
				t.Fatalf("expected error %s, got nil", test.errMsg)
			}

			assert.NoError(t, err, test.name)
			orgID, ok := ctx.Value("org_id").(string)
			assert.True(t, ok)
			assert.Equal(t, orgID, "12345")
		})
	}
}

func pair_rsa(t *testing.T) (*rsa.PrivateKey, *rsa.PublicKey) {
	t.Helper()

	private, err := rsa.GenerateKey(rand.Reader, 4096)
	assert.NoError(t, err)

	public, ok := private.Public().(*rsa.PublicKey)
	assert.True(t, ok)

	return private, public
}

func pair_ecdsa(t *testing.T) (*ecdsa.PrivateKey, *ecdsa.PublicKey) {
	t.Helper()

	private, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	assert.NoError(t, err)

	public, ok := private.Public().(*ecdsa.PublicKey)
	assert.True(t, ok)

	return private, public
}
