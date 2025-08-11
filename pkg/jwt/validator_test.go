package jwt

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jonboulle/clockwork"
	"github.com/stretchr/testify/assert"
)

type validatorArgs struct {
	ctx              context.Context
	registeredClaims jwt.RegisteredClaims
	parsedJwt        *jwt.Token

	allScopeClaims     *AllScopedClaims
	buildScopeClaims   *AllScopedClaims
	viewScopeClaims    *AllScopedClaims
	previewScopeClaims *AllScopedClaims
	editScopeClaims    *AllScopedClaims

	allScopesValidationErr    error
	buildScopeValidationErr   error
	viewScopeValidationErr    error
	previewScopeValidationErr error
	editScopeValidationErr    error
}

func validValidatorArgs(t *testing.T, opts ...testOption) *validatorArgs {
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

	return &validatorArgs{
		ctx:              context.Background(),
		registeredClaims: validRegisteredClaims,
		parsedJwt: &jwt.Token{
			Raw:    "test.payload.signature",
			Method: jwt.SigningMethodHS256,
			Claims: &jwt.MapClaims{
				"exp": expiration.Unix(),
			},
			Valid: true,
		},
		allScopeClaims: &AllScopedClaims{
			scopedTokenBaseClaims: scopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scopes:           "apps:build apps:view apps:preview apps:update",
			},
			ApplicationId:  "app",
			OrganizationId: "org",
			DirectoryHash:  "dir",
			CommitId:       "commit",
			UserEmail:      "admin@example.com",
			UserType:       UserTypeExternal,
		},
		buildScopeClaims: &AllScopedClaims{
			scopedTokenBaseClaims: scopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scopes:           TokenScopesBuildApplication,
			},
			ApplicationId:  "app1",
			OrganizationId: "org1",
			DirectoryHash:  "dir1",
			CommitId:       "commit1",
			UserEmail:      "user1@example.com",
			UserType:       UserTypeSuperblocks,
		},
		viewScopeClaims: &AllScopedClaims{
			scopedTokenBaseClaims: scopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scopes:           TokenScopesViewApplication,
			},
			ApplicationId:  "app1",
			OrganizationId: "org1",
			DirectoryHash:  "dir1",
			UserEmail:      "user1@example.com",
			UserType:       UserTypeSuperblocks,
		},
		previewScopeClaims: &AllScopedClaims{
			scopedTokenBaseClaims: scopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scopes:           TokenScopesPreviewApplication,
			},
			ApplicationId:  "app1",
			OrganizationId: "org1",
			DirectoryHash:  "dir1",
			UserEmail:      "user1@example.com",
			UserType:       UserTypeSuperblocks,
		},
		editScopeClaims: &AllScopedClaims{
			scopedTokenBaseClaims: scopedTokenBaseClaims{
				RegisteredClaims: validRegisteredClaims,
				Scopes:           TokenScopesEditApplication,
			},
			ApplicationId:  "app1",
			OrganizationId: "org1",
			UserEmail:      "user1@example.com",
			UserType:       UserTypeSuperblocks,
		},
	}
}

func verifyValidators(t *testing.T, a *validatorArgs) {
	verifyScopedValidators(t, a, false)
}

func verifyScopedValidators(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	verifyAllScopedClaims(t, a)
	verifyBuildScopedClaims(t, a, useScopedValidationFunc)
	verifyViewScopedClaims(t, a, useScopedValidationFunc)
	verifyPreviewScopedClaims(t, a, useScopedValidationFunc)
	verifyEditScopedClaims(t, a, useScopedValidationFunc)
}

func verifyAllScopedClaims(t *testing.T, a *validatorArgs) {
	var allCtx context.Context
	var err error

	allCtx, err = ValidateScopedClaims(a.ctx, a.parsedJwt, a.allScopeClaims)

	if a.allScopesValidationErr != nil {
		assert.ErrorContains(t, err, a.allScopesValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, allCtx)

	rawJwt, exists := GetRawJwt(allCtx)
	if a.parsedJwt != nil {
		assert.True(t, exists)
		assert.Equal(t, a.parsedJwt.Raw, rawJwt)
	} else {
		assert.False(t, exists)
	}

	scopes, exists := GetTokenScopes(allCtx)
	assert.True(t, exists)
	assert.True(t, scopes.Contains(TokenScopesBuildApplication))
	assert.True(t, scopes.Contains(TokenScopesViewApplication))
	assert.True(t, scopes.Contains(TokenScopesPreviewApplication))
	assert.True(t, scopes.Contains(TokenScopesEditApplication))

	appId, exists := GetApplicationID(allCtx)
	assert.True(t, exists)
	assert.Equal(t, a.allScopeClaims.ApplicationId, appId)

	orgId, exists := GetOrganizationID(allCtx)
	assert.True(t, exists)
	assert.Equal(t, a.allScopeClaims.OrganizationId, orgId)

	userEmail, exists := GetUserEmail(allCtx)
	assert.True(t, exists)
	assert.Equal(t, a.allScopeClaims.UserEmail, userEmail)

	userType, exists := GetUserType(allCtx)
	assert.True(t, exists)
	assert.Equal(t, a.allScopeClaims.UserType, userType)

	dirHash, exists := GetDirectoryHash(allCtx)
	if a.allScopeClaims.DirectoryHash != "" {
		assert.True(t, exists)
		assert.Equal(t, a.allScopeClaims.DirectoryHash, dirHash)
	} else {
		assert.False(t, exists)
	}

	commitId, exists := GetCommitID(allCtx)
	if a.allScopeClaims.CommitId != "" {
		assert.True(t, exists)
		assert.Equal(t, a.allScopeClaims.CommitId, commitId)
	} else {
		assert.False(t, exists)
	}
}

func verifyBuildScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	var buildCtx context.Context
	var err error

	if useScopedValidationFunc {
		buildCtx, err = ValidateBuildScopedClaims(a.ctx, a.parsedJwt, a.buildScopeClaims.AsBuildScopedClaims())
	} else {
		buildCtx, err = ValidateScopedClaims(a.ctx, a.parsedJwt, a.buildScopeClaims)
	}

	if a.buildScopeValidationErr != nil {
		assert.ErrorContains(t, err, a.buildScopeValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, buildCtx)

	rawJwt, exists := GetRawJwt(buildCtx)
	if !useScopedValidationFunc && a.parsedJwt != nil {
		assert.True(t, exists)
		assert.Equal(t, a.parsedJwt.Raw, rawJwt)
	} else {
		assert.False(t, exists)
	}

	scopes, exists := GetTokenScopes(buildCtx)
	assert.True(t, exists)
	assert.True(t, scopes.Contains(TokenScopesBuildApplication))

	appId, exists := GetApplicationID(buildCtx)
	assert.True(t, exists)
	assert.Equal(t, a.buildScopeClaims.ApplicationId, appId)

	orgId, exists := GetOrganizationID(buildCtx)
	assert.True(t, exists)
	assert.Equal(t, a.buildScopeClaims.OrganizationId, orgId)

	dirHash, exists := GetDirectoryHash(buildCtx)
	assert.True(t, exists)
	assert.Equal(t, a.buildScopeClaims.DirectoryHash, dirHash)

	commitId, exists := GetCommitID(buildCtx)
	assert.True(t, exists)
	assert.Equal(t, a.buildScopeClaims.CommitId, commitId)

	userEmail, exists := GetUserEmail(buildCtx)
	assert.True(t, exists)
	assert.Equal(t, a.buildScopeClaims.UserEmail, userEmail)

	userType, exists := GetUserType(buildCtx)
	assert.True(t, exists)
	assert.Equal(t, a.buildScopeClaims.UserType, userType)
}

func verifyViewScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	var viewCtx context.Context
	var err error

	if useScopedValidationFunc {
		viewCtx, err = ValidateViewScopedClaims(a.ctx, a.parsedJwt, a.viewScopeClaims.AsViewScopedClaims())
	} else {
		viewCtx, err = ValidateScopedClaims(a.ctx, a.parsedJwt, a.viewScopeClaims)
	}

	if a.viewScopeValidationErr != nil {
		assert.ErrorContains(t, err, a.viewScopeValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, viewCtx)

	rawJwt, exists := GetRawJwt(viewCtx)
	if !useScopedValidationFunc && a.parsedJwt != nil {
		assert.True(t, exists)
		assert.Equal(t, a.parsedJwt.Raw, rawJwt)
	} else {
		assert.False(t, exists)
	}

	scopes, exists := GetTokenScopes(viewCtx)
	assert.True(t, exists)
	assert.True(t, scopes.Contains(TokenScopesViewApplication))

	appId, exists := GetApplicationID(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.ApplicationId, appId)

	orgId, exists := GetOrganizationID(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.OrganizationId, orgId)

	dirHash, exists := GetDirectoryHash(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.DirectoryHash, dirHash)

	userEmail, exists := GetUserEmail(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.UserEmail, userEmail)

	userType, exists := GetUserType(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.UserType, userType)
}

func verifyPreviewScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	var previewCtx context.Context
	var err error

	if useScopedValidationFunc {
		previewCtx, err = ValidatePreviewScopedClaims(a.ctx, a.parsedJwt, a.previewScopeClaims.AsPreviewScopedClaims())
	} else {
		previewCtx, err = ValidateScopedClaims(a.ctx, a.parsedJwt, a.previewScopeClaims)
	}

	if a.previewScopeValidationErr != nil {
		assert.ErrorContains(t, err, a.previewScopeValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, previewCtx)

	rawJwt, exists := GetRawJwt(previewCtx)
	if !useScopedValidationFunc && a.parsedJwt != nil {
		assert.True(t, exists)
		assert.Equal(t, a.parsedJwt.Raw, rawJwt)
	} else {
		assert.False(t, exists)
	}

	scopes, exists := GetTokenScopes(previewCtx)
	assert.True(t, exists)
	assert.True(t, scopes.Contains(TokenScopesPreviewApplication))

	appId, exists := GetApplicationID(previewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.previewScopeClaims.ApplicationId, appId)

	orgId, exists := GetOrganizationID(previewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.previewScopeClaims.OrganizationId, orgId)

	dirHash, exists := GetDirectoryHash(previewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.previewScopeClaims.DirectoryHash, dirHash)

	userEmail, exists := GetUserEmail(previewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.previewScopeClaims.UserEmail, userEmail)

	userType, exists := GetUserType(previewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.previewScopeClaims.UserType, userType)
}

func verifyEditScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	var editCtx context.Context
	var err error

	if useScopedValidationFunc {
		editCtx, err = ValidateEditScopedClaims(a.ctx, a.parsedJwt, a.editScopeClaims.AsEditScopedClaims())
	} else {
		editCtx, err = ValidateScopedClaims(a.ctx, a.parsedJwt, a.editScopeClaims)
	}

	if a.editScopeValidationErr != nil {
		assert.ErrorContains(t, err, a.editScopeValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, editCtx)

	rawJwt, exists := GetRawJwt(editCtx)
	if !useScopedValidationFunc && a.parsedJwt != nil {
		assert.True(t, exists)
		assert.Equal(t, a.parsedJwt.Raw, rawJwt)
	} else {
		assert.False(t, exists)
	}

	scopes, exists := GetTokenScopes(editCtx)
	assert.True(t, exists)
	assert.True(t, scopes.Contains(TokenScopesEditApplication))

	appId, exists := GetApplicationID(editCtx)
	assert.True(t, exists)
	assert.Equal(t, a.editScopeClaims.ApplicationId, appId)

	orgId, exists := GetOrganizationID(editCtx)
	assert.True(t, exists)
	assert.Equal(t, a.editScopeClaims.OrganizationId, orgId)

	userEmail, exists := GetUserEmail(editCtx)
	assert.True(t, exists)
	assert.Equal(t, a.editScopeClaims.UserEmail, userEmail)

	userType, exists := GetUserType(editCtx)
	assert.True(t, exists)
	assert.Equal(t, a.editScopeClaims.UserType, userType)
}

func TestOk(t *testing.T) {
	args := validValidatorArgs(t)
	verifyValidators(t, args)
}

func TestOk_NoParsedJwt(t *testing.T) {
	args := validValidatorArgs(t)
	args.parsedJwt = nil
	verifyValidators(t, args)
}

func TestErr_ClaimsNotScopedTokenClaims(t *testing.T) {
	_, err := ValidateScopedClaims(context.Background(), nil, jwt.MapClaims{})
	assert.EqualError(t, err, "could not parse jwt claims")

	_, err = ValidateBuildScopedClaims(context.Background(), nil, jwt.MapClaims{})
	assert.EqualError(t, err, "could not parse jwt claims")

	_, err = ValidateViewScopedClaims(context.Background(), nil, jwt.MapClaims{})
	assert.EqualError(t, err, "could not parse jwt claims")

	_, err = ValidatePreviewScopedClaims(context.Background(), nil, jwt.MapClaims{})
	assert.EqualError(t, err, "could not parse jwt claims")

	_, err = ValidateEditScopedClaims(context.Background(), nil, jwt.MapClaims{})
	assert.EqualError(t, err, "could not parse jwt claims")
}

func TestErr_ClaimsNotValid(t *testing.T) {
	// Set the clock to 1 day in the past so that all the scoped JWTs will be expired
	clock := clockwork.NewFakeClock()
	clock.Advance(-24 * time.Hour)

	expirationErr := errors.New("invalid jwt claims: token is expired")

	args := validValidatorArgs(t, WithClock(clock))
	args.allScopesValidationErr = expirationErr
	args.buildScopeValidationErr = expirationErr
	args.viewScopeValidationErr = expirationErr
	args.previewScopeValidationErr = expirationErr
	args.editScopeValidationErr = expirationErr

	verifyValidators(t, args)
	verifyScopedValidators(t, args, true)
}

func TestErr_UnknownTokenScope(t *testing.T) {
	args := validValidatorArgs(t)
	args.allScopeClaims.Scopes = "jobs:deploy"
	args.allScopesValidationErr = errors.New("invalid jwt claims: invalid scope: jobs:deploy")

	verifyValidators(t, args)
}

func TestErr_BuildScopedClaims_MissingClaims(t *testing.T) {
	args := validValidatorArgs(t)
	args.buildScopeClaims.ApplicationId = ""
	args.buildScopeValidationErr = errors.New("could not get application id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.buildScopeClaims.OrganizationId = ""
	args.buildScopeValidationErr = errors.New("could not get organization id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.buildScopeClaims.DirectoryHash = ""
	args.buildScopeValidationErr = errors.New("could not get directory hash")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.buildScopeClaims.CommitId = ""
	args.buildScopeValidationErr = errors.New("could not get commit id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.buildScopeClaims.UserEmail = ""
	args.buildScopeValidationErr = errors.New("could not get user email")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.buildScopeClaims.UserType = ""
	args.buildScopeValidationErr = errors.New("could not get user type")
	verifyValidators(t, args)
}

func TestErr_ViewScopedClaims_MissingRequiredClaims(t *testing.T) {
	args := validValidatorArgs(t)
	args.viewScopeClaims.ApplicationId = ""
	args.viewScopeValidationErr = errors.New("could not get application id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.viewScopeClaims.OrganizationId = ""
	args.viewScopeValidationErr = errors.New("could not get organization id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.viewScopeClaims.DirectoryHash = ""
	args.viewScopeValidationErr = errors.New("could not get directory hash")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.viewScopeClaims.UserEmail = ""
	args.viewScopeValidationErr = errors.New("could not get user email")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.viewScopeClaims.UserType = ""
	args.viewScopeValidationErr = errors.New("could not get user type")
	verifyValidators(t, args)
}

func TestErr_PreviewScopedClaims_MissingRequiredClaims(t *testing.T) {
	args := validValidatorArgs(t)
	args.previewScopeClaims.ApplicationId = ""
	args.previewScopeValidationErr = errors.New("could not get application id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.previewScopeClaims.OrganizationId = ""
	args.previewScopeValidationErr = errors.New("could not get organization id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.previewScopeClaims.DirectoryHash = ""
	args.previewScopeValidationErr = errors.New("could not get directory hash")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.previewScopeClaims.UserEmail = ""
	args.previewScopeValidationErr = errors.New("could not get user email")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.previewScopeClaims.UserType = ""
	args.previewScopeValidationErr = errors.New("could not get user type")
	verifyValidators(t, args)
}

func TestErr_EditScopedClaims_MissingClaims(t *testing.T) {
	args := validValidatorArgs(t)
	args.editScopeClaims.ApplicationId = ""
	args.editScopeValidationErr = errors.New("could not get application id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.editScopeClaims.OrganizationId = ""
	args.editScopeValidationErr = errors.New("could not get organization id")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.editScopeClaims.UserEmail = ""
	args.editScopeValidationErr = errors.New("could not get user email")
	verifyValidators(t, args)

	args = validValidatorArgs(t)
	args.editScopeClaims.UserType = ""
	args.editScopeValidationErr = errors.New("could not get user type")
	verifyValidators(t, args)
}
