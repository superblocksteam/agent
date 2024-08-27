package jwt

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/metadata"

	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
)

func TestValidate(t *testing.T) {
	t.Parallel()

	signingKey := []byte("testSigningKey")
	private_rsa, public_rsa := pair_rsa(t)
	private_ecdsa, public_ecdsa := pair_ecdsa(t)

	for _, test := range []struct {
		name    string
		errType uint32
		errMsg  string
		ctx     context.Context
	}{
		{
			name: "expired jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
					ExpiresAt: jwt.NewNumericDate(time.Now().Add(-5 * time.Minute)),
				}).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
			errType: jwt.ValidationErrorExpired,
		},
		{
			name: "wrong signing key",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
					jwtClaimOrganizationID: "12345",
				}).SignedString([]byte("wrongSigningKey"))
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
			errType: jwt.ValidationErrorSignatureInvalid,
		},
		{
			name: "valid hmac jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{
					Claims: authv1.Claims{
						OrgId:      "12345",
						OrgType:    "free",
						UserEmail:  "fbgrecojr@me.com",
						RbacRole:   "admin",
						RbacGroups: []string{"admin", "user"},
						UserType:   "awesome",
					},
				}).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name: "valid rsa jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodRS256, claims{
					Claims: authv1.Claims{
						OrgId:      "12345",
						OrgType:    "free",
						UserEmail:  "fbgrecojr@me.com",
						RbacRole:   "admin",
						RbacGroups: []string{"admin", "user"},
						UserType:   "awesome",
					},
				}).SignedString(private_rsa)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name: "valid ecdsa jwt",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodES256, claims{
					Claims: authv1.Claims{
						OrgId:      "12345",
						OrgType:    "free",
						UserEmail:  "fbgrecojr@me.com",
						RbacRole:   "admin",
						RbacGroups: []string{"admin", "user"},
						UserType:   "awesome",
					},
				}).SignedString(private_ecdsa)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
		},
		{
			name: "no claims",
			ctx: func() context.Context {
				token, err := jwt.New(jwt.SigningMethodHS256).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
			errMsg: "could not get organization id",
		},
		{
			name: "no orgID claim",
			ctx: func() context.Context {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
					"sub": "12345",
				}).SignedString(signingKey)
				assert.NoError(t, err)
				return metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer "+token))
			}(),
			errMsg: "could not get organization id",
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
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx, err := validate(test.ctx, &options{
				hmacSigningKey:  []byte("testSigningKey"),
				rsaSigningKey:   public_rsa,
				ecdsaSigningKey: public_ecdsa,
				key:             "authorization",
			})

			if err != nil {
				switch e := err.(type) {
				case *jwt.ValidationError:
					// we got a nicely typed error from the jwt lib, check that by code
					assert.Equal(t, e.Errors, test.errType, test.name)
				default:
					// we got a different type of error, just check the error message
					assert.Equal(t, err.Error(), test.errMsg, test.name)
				}
				return
			}

			assert.NoError(t, err, test.name)

			value := ctx.Value(ContextKeyOrganziationID)
			assert.NotNil(t, value)

			orgID, ok := value.(string)
			assert.True(t, ok, "orgID should be a string")

			assert.Equal(t, orgID, "12345", test.name)
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
