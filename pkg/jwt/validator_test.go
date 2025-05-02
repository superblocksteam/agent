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

	buildScopeClaims BuildScopedClaims
	viewScopeClaims  ViewScopedClaims
	editScopeClaims  EditScopedClaims

	buildScopeValidationErr error
	viewScopeValidationErr  error
	editScopeValidationErr  error
}

func validValidatorArgs(t *testing.T, opts ...option) *validatorArgs {
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

	return &validatorArgs{
		ctx:              context.Background(),
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

func verifyValidators(t *testing.T, a *validatorArgs) {
	verifyScopedClaims(t, a, false)
}

func verifyScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	verifyBuildScopedClaims(t, a, useScopedValidationFunc)
	verifyViewScopedClaims(t, a, useScopedValidationFunc)
	verifyEditScopedClaims(t, a, useScopedValidationFunc)
}

func verifyBuildScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	var buildCtx context.Context
	var err error

	if useScopedValidationFunc {
		buildCtx, err = ValidateBuildScopedClaims(a.ctx, nil, a.buildScopeClaims)
	} else {
		buildCtx, err = ValidateScopedClaims(a.ctx, nil, a.buildScopeClaims)
	}

	if a.buildScopeValidationErr != nil {
		assert.ErrorContains(t, err, a.buildScopeValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, buildCtx)

	scope, exists := GetTokenScope(buildCtx)
	assert.True(t, exists)
	assert.Equal(t, TokenScopesBuildApplication, scope)

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
}

func verifyViewScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	var viewCtx context.Context
	var err error

	if useScopedValidationFunc {
		viewCtx, err = ValidateViewScopedClaims(a.ctx, nil, a.viewScopeClaims)
	} else {
		viewCtx, err = ValidateScopedClaims(a.ctx, nil, a.viewScopeClaims)
	}

	if a.viewScopeValidationErr != nil {
		assert.ErrorContains(t, err, a.viewScopeValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, viewCtx)

	scope, exists := GetTokenScope(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, TokenScopesViewApplication, scope)

	appId, exists := GetApplicationID(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.ApplicationId, appId)

	orgId, exists := GetOrganizationID(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.OrganizationId, orgId)

	dirHash, exists := GetDirectoryHash(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.DirectoryHash, dirHash)

	commitId, exists := GetCommitID(viewCtx)
	assert.True(t, exists)
	assert.Equal(t, a.viewScopeClaims.CommitId, commitId)

	userEmail, exists := GetUserEmail(viewCtx)
	if a.viewScopeClaims.UserEmail != "" {
		assert.True(t, exists)
		assert.Equal(t, a.viewScopeClaims.UserEmail, userEmail)
	} else {
		assert.False(t, exists)
	}

	userType, exists := GetUserType(viewCtx)
	if a.viewScopeClaims.UserType != "" {
		assert.True(t, exists)
		assert.Equal(t, a.viewScopeClaims.UserType, userType)
	} else {
		assert.False(t, exists)
	}

	name, exists := GetName(viewCtx)
	if a.viewScopeClaims.Name != "" {
		assert.True(t, exists)
		assert.Equal(t, a.viewScopeClaims.Name, name)
	} else {
		assert.False(t, exists)
	}
}

func verifyEditScopedClaims(t *testing.T, a *validatorArgs, useScopedValidationFunc bool) {
	var editCtx context.Context
	var err error

	if useScopedValidationFunc {
		editCtx, err = ValidateEditScopedClaims(a.ctx, nil, a.editScopeClaims)
	} else {
		editCtx, err = ValidateScopedClaims(a.ctx, nil, a.editScopeClaims)
	}

	if a.editScopeValidationErr != nil {
		assert.ErrorContains(t, err, a.editScopeValidationErr.Error())
		return
	}

	assert.NoError(t, err)
	assert.NotNil(t, editCtx)

	scope, exists := GetTokenScope(editCtx)
	assert.True(t, exists)
	assert.Equal(t, TokenScopesEditApplication, scope)

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

	name, exists := GetName(editCtx)
	assert.True(t, exists)
	assert.Equal(t, a.editScopeClaims.Name, name)
}

func TestOk(t *testing.T) {
	args := validValidatorArgs(t)
	verifyValidators(t, args)
}

func TestOk_ViewScopedClaims_MissingOptionalClaims(t *testing.T) {
	args := validValidatorArgs(t)
	args.viewScopeClaims.UserEmail = ""
	args.viewScopeClaims.UserType = ""
	args.viewScopeClaims.Name = ""

	verifyValidators(t, args)
}

func TestErr_ClaimsNotScopedTokenClaims(t *testing.T) {
	_, err := ValidateScopedClaims(context.Background(), nil, jwt.MapClaims{})
	assert.EqualError(t, err, "could not parse jwt claims")

	_, err = ValidateBuildScopedClaims(context.Background(), nil, jwt.MapClaims{})
	assert.EqualError(t, err, "could not parse jwt claims")

	_, err = ValidateViewScopedClaims(context.Background(), nil, jwt.MapClaims{})
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
	args.buildScopeValidationErr = expirationErr
	args.viewScopeValidationErr = expirationErr
	args.editScopeValidationErr = expirationErr

	verifyValidators(t, args)
	verifyScopedClaims(t, args, true)
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
	args.viewScopeClaims.CommitId = ""
	args.viewScopeValidationErr = errors.New("could not get commit id")
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

	args = validValidatorArgs(t)
	args.editScopeClaims.Name = ""
	args.editScopeValidationErr = errors.New("could not get name")
	verifyValidators(t, args)
}
