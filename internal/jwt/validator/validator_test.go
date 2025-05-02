package validator

import (
	"context"
	"testing"

	"github.com/golang-jwt/jwt/v4"
	"github.com/stretchr/testify/assert"

	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
)

type results struct {
	orgID      string
	orgType    string
	userEmail  string
	userType   string
	rbacRole   string
	rbacGroups []string
}

func TestValidate(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name         string
		parsedToken  *jwt.Token
		parsedClaims *claims
		expected     results
		errMsg       string
	}{
		{
			name:        "valid parsed jwt and claims",
			parsedToken: &jwt.Token{Valid: true},
			parsedClaims: &claims{
				Claims: authv1.Claims{
					OrgId:      "12345",
					OrgType:    "free",
					UserEmail:  "test_user@test.com",
					RbacRole:   "admin",
					RbacGroups: []string{"admin", "user"},
					UserType:   "awesome",
				},
			},
			expected: results{
				orgID:      "12345",
				orgType:    "free",
				userEmail:  "test_user@test.com",
				userType:   "awesome",
				rbacRole:   "admin",
				rbacGroups: []string{"admin", "user"},
			},
		},
		{
			name:        "invalid parsed jwt",
			parsedToken: &jwt.Token{Valid: false},
			errMsg:      "could not parse jwt claims",
		},
		{
			name:         "missing org id",
			parsedToken:  &jwt.Token{Valid: true},
			parsedClaims: &claims{},
			errMsg:       "could not get organization id",
		},
		{
			name:        "missing org type",
			parsedToken: &jwt.Token{Valid: true},
			parsedClaims: &claims{
				Claims: authv1.Claims{
					OrgId: "12345",
				},
			},
			errMsg: "could not get organization type",
		},
		{
			name:        "missing user email",
			parsedToken: &jwt.Token{Valid: true},
			parsedClaims: &claims{
				Claims: authv1.Claims{
					OrgId:   "12345",
					OrgType: "free",
				},
			},
			errMsg: "could not get user email",
		},
		{
			name:        "missing user type",
			parsedToken: &jwt.Token{Valid: true},
			parsedClaims: &claims{
				Claims: authv1.Claims{
					OrgId:     "12345",
					OrgType:   "free",
					UserEmail: "test_user@test.com",
				},
			},
			errMsg: "could not get user type",
		},
		{
			name:        "missing rbac role",
			parsedToken: &jwt.Token{Valid: true},
			parsedClaims: &claims{
				Claims: authv1.Claims{
					OrgId:     "12345",
					OrgType:   "free",
					UserEmail: "test_user@test.com",
					UserType:  "awesome",
				},
			},
			errMsg: "could not get rbac role",
		},
		{
			name:        "missing rbac groups",
			parsedToken: &jwt.Token{Valid: true},
			parsedClaims: &claims{
				Claims: authv1.Claims{
					OrgId:     "12345",
					OrgType:   "free",
					UserEmail: "test_user@test.com",
					UserType:  "awesome",
					RbacRole:  "admin",
				},
			},
			errMsg: "could not get rbac groups",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			ctx, err := Validate(context.Background(), test.parsedToken, test.parsedClaims)

			if err != nil {
				assert.EqualError(t, err, test.errMsg, test.name)
				return
			} else if test.errMsg != "" {
				t.Fatalf("expected error %s, got nil", test.errMsg)
			}

			assert.NoError(t, err, test.name)

			ret := getResultsFromCtx(t, ctx)
			assert.Equal(t, test.expected, ret, test.name)
		})
	}
}

func getResultsFromCtx(t *testing.T, ctx context.Context) results {
	t.Helper()

	orgID, ok := GetOrganizationID(ctx)
	assert.True(t, ok, "orgID should be a string")

	orgType, ok := GetOrganizationType(ctx)
	assert.True(t, ok, "orgType should be a string")

	userEmail, ok := GetUserEmail(ctx)
	assert.True(t, ok, "userEmail should be a string")

	userType, ok := GetUserType(ctx)
	assert.True(t, ok, "userType should be a string")

	rbacRole, ok := GetRbacRole(ctx)
	assert.True(t, ok, "rbacRole should be a string")

	rbacGroups, ok := GetRbacGroups(ctx)
	assert.True(t, ok, "rbacGroups should be a string")

	return results{
		orgID:      orgID,
		orgType:    orgType,
		userEmail:  userEmail,
		userType:   userType,
		rbacRole:   rbacRole,
		rbacGroups: rbacGroups,
	}
}
