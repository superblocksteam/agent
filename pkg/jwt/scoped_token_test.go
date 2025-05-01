package jwt

import (
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
)

type options struct {
	clock clockwork.Clock
}

type option func(*options)

func WithClock(clock clockwork.Clock) option {
	return func(o *options) {
		o.clock = clock
	}
}

type args struct {
	registeredClaims jwt.RegisteredClaims

	buildScopeClaims BuildScopedClaims
	viewScopeClaims  ViewScopedClaims
	editScopeClaims  EditScopedClaims

	buildScopeValidationErr error
	viewScopeValidationErr  error
	editScopeValidationErr  error
}

func validArgs(t *testing.T, opts ...option) *args {
	t.Helper()

	options := &options{
		clock: clockwork.NewFakeClock(),
	}
	for _, opt := range opts {
		opt(options)
	}

	now := options.clock.Now()
	expiration := now.Add(time.Hour)

	validRegisteredClaims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(expiration),
	}

	return &args{
		registeredClaims: validRegisteredClaims,
		buildScopeClaims: BuildScopedClaims{
			ScopedTokenBaseClaims: ScopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scope:            TokenScopesBuildApplication,
			},
			ApplicationId:  "app1",
			OrganizationId: "org1",
			DirectoryHash:  "dir1",
			CommitId:       "commit1",
		},
		viewScopeClaims: ViewScopedClaims{
			ScopedTokenBaseClaims: ScopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scope:            TokenScopesViewApplication,
			},
			ApplicationId:  "app1",
			OrganizationId: "org1",
			DirectoryHash:  "dir1",
			CommitId:       "commit1",
			UserEmail:      "user1@example.com",
			UserType:       UserTypeSuperblocks,
			Name:           "User 1",
		},
		editScopeClaims: EditScopedClaims{
			ScopedTokenBaseClaims: ScopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scope:            TokenScopesEditApplication,
			},
			ApplicationId:  "app1",
			OrganizationId: "org1",
			UserEmail:      "user1@example.com",
			UserType:       UserTypeSuperblocks,
			Name:           "User 1",
		},
	}
}

func verify(t *testing.T, a *args) {
	if a.buildScopeValidationErr != nil {
		assert.ErrorContains(t, a.buildScopeClaims.Valid(), a.buildScopeValidationErr.Error())
	} else {
		assert.NoError(t, a.buildScopeClaims.Valid())
	}

	if a.viewScopeValidationErr != nil {
		assert.ErrorContains(t, a.viewScopeClaims.Valid(), a.viewScopeValidationErr.Error())
	} else {
		assert.NoError(t, a.viewScopeClaims.Valid())
	}

	if a.editScopeValidationErr != nil {
		assert.ErrorContains(t, a.editScopeClaims.Valid(), a.editScopeValidationErr.Error())
	} else {
		assert.NoError(t, a.editScopeClaims.Valid())
	}
}

func TestScopedTokenClaims_Ok(t *testing.T) {
	args := validArgs(t)
	verify(t, args)
}

func TestScopedTokenClaims_InvalidTokenScopes(t *testing.T) {
	invalidScopeErr := errors.New("invalid scope")

	args := validArgs(t)
	args.buildScopeClaims.Scope = TokenScopesEditApplication
	args.buildScopeValidationErr = invalidScopeErr

	args.viewScopeClaims.Scope = TokenScopesBuildApplication
	args.viewScopeValidationErr = invalidScopeErr

	args.editScopeClaims.Scope = TokenScopesViewApplication
	args.editScopeValidationErr = invalidScopeErr

	verify(t, args)
}

func TestScopedTokenClaims_ExpiredScopedToken(t *testing.T) {
	// Set the clock to 1 day in the past so that all the scoped JWTs will be expired
	clock := clockwork.NewFakeClock()
	clock.Advance(-24 * time.Hour)

	expirationErr := errors.New("token is expired by 23h")

	args := validArgs(t, WithClock(clock))
	args.buildScopeValidationErr = expirationErr
	args.viewScopeValidationErr = expirationErr
	args.editScopeValidationErr = expirationErr

	verify(t, args)
}

func TestTokenScopesString(t *testing.T) {
	var testCases = []struct {
		name     string
		scope    TokenScopes
		expected string
	}{
		{
			name:     "BuildScopedTokenClaims",
			scope:    TokenScopesBuildApplication,
			expected: "build:app",
		},
		{
			name:     "ViewScopedTokenClaims",
			scope:    TokenScopesViewApplication,
			expected: "view:app",
		},
		{
			name:     "EditScopedTokenClaims",
			scope:    TokenScopesEditApplication,
			expected: "edit:app",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, tc.scope.String())
		})
	}
}
