package jwt

import (
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
)

type testOptions struct {
	clock clockwork.Clock
}

type testOption func(*testOptions)

func WithClock(clock clockwork.Clock) testOption {
	return func(o *testOptions) {
		o.clock = clock
	}
}

type scopedTokenArgs struct {
	registeredClaims jwt.RegisteredClaims

	allScopeClaims     *AllScopedClaims
	buildScopeClaims   *BuildScopedClaims
	viewScopeClaims    *ViewScopedClaims
	previewScopeClaims *PreviewScopedClaims
	editScopeClaims    *EditScopedClaims

	allScopesValidationErr    error
	buildScopeValidationErr   error
	viewScopeValidationErr    error
	previewScopeValidationErr error
	editScopeValidationErr    error
}

func validArgs(t *testing.T, opts ...testOption) *scopedTokenArgs {
	t.Helper()

	options := &testOptions{
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

	return &scopedTokenArgs{
		registeredClaims: validRegisteredClaims,
		allScopeClaims: NewAllScopedClaims(
			JwtWithRegisteredClaims(validRegisteredClaims),
			JwtWithScopes("apps:build apps:view apps:preview apps:update"),
			JwtWithApplicationId("app"),
			JwtWithOrganizationId("org"),
			JwtWithDirectoryHash("dir"),
			JwtWithCommitId("commit"),
			JwtWithUserId("user-uuid"),
			JwtWithUserEmail("admin@example.com"),
			JwtWithUserType(UserTypeExternal),
		),
		buildScopeClaims: NewBuildScopedClaims(
			JwtWithRegisteredClaims(validRegisteredClaims),
			JwtWithApplicationId("app1"),
			JwtWithOrganizationId("org1"),
			JwtWithDirectoryHash("dir1"),
			JwtWithCommitId("commit1"),
			JwtWithUserId("user-uuid-1"),
			JwtWithUserEmail("user1@example.com"),
			JwtWithUserType(UserTypeSuperblocks),
		),
		viewScopeClaims: NewViewScopedClaims(
			JwtWithRegisteredClaims(validRegisteredClaims),
			JwtWithApplicationId("app1"),
			JwtWithOrganizationId("org1"),
			JwtWithDirectoryHash("dir1"),
			JwtWithUserId("user-uuid-1"),
			JwtWithUserEmail("user1@example.com"),
			JwtWithUserType(UserTypeSuperblocks),
		),
		previewScopeClaims: NewPreviewScopedClaims(
			JwtWithRegisteredClaims(validRegisteredClaims),
			JwtWithApplicationId("app1"),
			JwtWithOrganizationId("org1"),
			JwtWithDirectoryHash("dir1"),
			JwtWithUserId("user-uuid-1"),
			JwtWithUserEmail("user1@example.com"),
			JwtWithUserType(UserTypeSuperblocks),
		),
		editScopeClaims: NewEditScopedClaims(
			JwtWithRegisteredClaims(validRegisteredClaims),
			JwtWithApplicationId("app1"),
			JwtWithOrganizationId("org1"),
			JwtWithUserId("user-uuid-1"),
			JwtWithUserEmail("user1@example.com"),
			JwtWithUserType(UserTypeSuperblocks),
		),
	}
}

func verifyClaims(t *testing.T, a *scopedTokenArgs) {
	verifyScopedClaims(t, a, false)
}

func verifyScopedClaims(t *testing.T, a *scopedTokenArgs, useScopedValidationFunc bool) {
	validatorFunc := func(c jwt.ClaimsValidator) error {
		if useScopedValidationFunc {
			return c.Validate()
		}

		return jwt.NewValidator().Validate(c)
	}

	if a.allScopesValidationErr != nil {
		assert.ErrorContains(t, validatorFunc(a.allScopeClaims), a.allScopesValidationErr.Error())
	} else {
		assert.NoError(t, a.allScopeClaims.Validate())
	}

	if a.buildScopeValidationErr != nil {
		assert.ErrorContains(t, validatorFunc(a.buildScopeClaims), a.buildScopeValidationErr.Error())
	} else {
		assert.NoError(t, a.buildScopeClaims.Validate())
	}

	if a.viewScopeValidationErr != nil {
		assert.ErrorContains(t, validatorFunc(a.viewScopeClaims), a.viewScopeValidationErr.Error())
	} else {
		assert.NoError(t, a.viewScopeClaims.Validate())
	}

	if a.previewScopeValidationErr != nil {
		assert.ErrorContains(t, validatorFunc(a.previewScopeClaims), a.previewScopeValidationErr.Error())
	} else {
		assert.NoError(t, a.previewScopeClaims.Validate())
	}

	if a.editScopeValidationErr != nil {
		assert.ErrorContains(t, validatorFunc(a.editScopeClaims), a.editScopeValidationErr.Error())
	} else {
		assert.NoError(t, a.editScopeClaims.Validate())
	}
}

func TestScopedTokenClaims_Ok(t *testing.T) {
	args := validArgs(t)
	verifyClaims(t, args)
}

func TestScopedTokenClaims_InvalidTokenScopes(t *testing.T) {
	args := validArgs(t)
	args.allScopeClaims.Scopes = "jobs:deploy"
	args.allScopesValidationErr = ErrInvalidScope

	args.buildScopeClaims.Scopes = TokenScopesEditApplication
	args.buildScopeValidationErr = ErrInvalidScope

	args.viewScopeClaims.Scopes = TokenScopesBuildApplication
	args.viewScopeValidationErr = ErrInvalidScope

	args.previewScopeClaims.Scopes = TokenScopesViewApplication
	args.previewScopeValidationErr = ErrInvalidScope

	args.editScopeClaims.Scopes = TokenScopesPreviewApplication
	args.editScopeValidationErr = ErrInvalidScope

	verifyClaims(t, args)
}

func TestNilScopedTokenClaims_InvalidTokenScopes(t *testing.T) {
	args := validArgs(t)
	args.allScopeClaims = nil
	args.allScopesValidationErr = ErrInvalidScope

	args.buildScopeClaims = nil
	args.buildScopeValidationErr = ErrInvalidScope

	args.viewScopeClaims = nil
	args.viewScopeValidationErr = ErrInvalidScope

	args.previewScopeClaims = nil
	args.previewScopeValidationErr = ErrInvalidScope

	args.editScopeClaims = nil
	args.editScopeValidationErr = ErrInvalidScope

	verifyScopedClaims(t, args, true)
}

func TestScopedTokenClaims_ExpiredScopedToken(t *testing.T) {
	// Set the clock to 1 day in the past so that all the scoped JWTs will be expired
	clock := clockwork.NewFakeClock()
	clock.Advance(-24 * time.Hour)

	expirationErr := errors.New("token is expired")

	args := validArgs(t, WithClock(clock))
	args.allScopesValidationErr = expirationErr
	args.buildScopeValidationErr = expirationErr
	args.viewScopeValidationErr = expirationErr
	args.previewScopeValidationErr = expirationErr
	args.editScopeValidationErr = expirationErr

	verifyClaims(t, args)
}

func TestNilScopedClaims_Transformers(t *testing.T) {
	args := validArgs(t)
	args.allScopeClaims = nil

	assert.Nil(t, args.allScopeClaims.AsBuildScopedClaims())
	assert.Nil(t, args.allScopeClaims.AsViewScopedClaims())
	assert.Nil(t, args.allScopeClaims.AsPreviewScopedClaims())
	assert.Nil(t, args.allScopeClaims.AsEditScopedClaims())

}

func TestGetScopes(t *testing.T) {
	args := validArgs(t)

	scopes := args.allScopeClaims.GetScopes()
	assert.Equal(t, 4, scopes.Size())
	assert.True(t, scopes.Contains(TokenScopesBuildApplication))
	assert.True(t, scopes.Contains(TokenScopesViewApplication))
	assert.True(t, scopes.Contains(TokenScopesPreviewApplication))
	assert.True(t, scopes.Contains(TokenScopesEditApplication))

	args.allScopeClaims = nil
	assert.Nil(t, args.allScopeClaims.GetScopes())

	buildScopes := args.buildScopeClaims.GetScopes()
	assert.Equal(t, 1, buildScopes.Size())
	assert.True(t, buildScopes.Contains(TokenScopesBuildApplication))

	args.buildScopeClaims = nil
	assert.Nil(t, args.buildScopeClaims.GetScopes())

	viewScopes := args.viewScopeClaims.GetScopes()
	assert.Equal(t, 1, viewScopes.Size())
	assert.True(t, viewScopes.Contains(TokenScopesViewApplication))

	args.viewScopeClaims = nil
	assert.Nil(t, args.viewScopeClaims.GetScopes())

	previewScopes := args.previewScopeClaims.GetScopes()
	assert.Equal(t, 1, previewScopes.Size())
	assert.True(t, previewScopes.Contains(TokenScopesPreviewApplication))

	args.previewScopeClaims = nil
	assert.Nil(t, args.previewScopeClaims.GetScopes())

	editScopes := args.editScopeClaims.GetScopes()
	assert.Equal(t, 1, editScopes.Size())
	assert.True(t, editScopes.Contains(TokenScopesEditApplication))

	args.editScopeClaims = nil
	assert.Nil(t, args.editScopeClaims.GetScopes())
}

func TestGetRawScopes(t *testing.T) {
	args := validArgs(t)

	assert.Equal(t, TokenScopes("apps:build apps:view apps:preview apps:update"), args.allScopeClaims.GetRawScopes())
	assert.Equal(t, TokenScopes("apps:build"), args.buildScopeClaims.GetRawScopes())
	assert.Equal(t, TokenScopes("apps:view"), args.viewScopeClaims.GetRawScopes())
	assert.Equal(t, TokenScopes("apps:preview"), args.previewScopeClaims.GetRawScopes())
	assert.Equal(t, TokenScopes("apps:update"), args.editScopeClaims.GetRawScopes())

	args.allScopeClaims = nil
	assert.Empty(t, args.allScopeClaims.GetRawScopes())

	args.buildScopeClaims = nil
	assert.Empty(t, args.buildScopeClaims.GetRawScopes())

	args.viewScopeClaims = nil
	assert.Empty(t, args.viewScopeClaims.GetRawScopes())

	args.previewScopeClaims = nil
	assert.Empty(t, args.previewScopeClaims.GetRawScopes())

	args.editScopeClaims = nil
	assert.Empty(t, args.editScopeClaims.GetRawScopes())
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
			expected: "apps:build",
		},
		{
			name:     "ViewScopedTokenClaims",
			scope:    TokenScopesViewApplication,
			expected: "apps:view",
		},
		{
			name:     "PreviewScopedTokenClaims",
			scope:    TokenScopesPreviewApplication,
			expected: "apps:preview",
		},
		{
			name:     "EditScopedTokenClaims",
			scope:    TokenScopesEditApplication,
			expected: "apps:update",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, tc.scope.String())
		})
	}
}
