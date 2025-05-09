package validator

import (
	"context"
	"testing"

	"github.com/superblocksteam/agent/pkg/testutils"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"

	"google.golang.org/protobuf/types/known/structpb"

	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
)

type results struct {
	orgID            string
	orgType          string
	userEmail        string
	userType         string
	userId           string
	userName         string
	rbacRole         string
	rbacGroupObjects []*authv1.Claims_RbacGroupObject
	metadata         *structpb.Struct
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
					OrgId:     "12345",
					OrgType:   "free",
					UserEmail: "test_user@test.com",
					UserId:    "test_user_id",
					UserName:  "Mr. Test User",
					RbacRole:  "admin",
					RbacGroupObjects: []*authv1.Claims_RbacGroupObject{
						{
							Id:   "1",
							Name: "admin",
						},
						{
							Id:   "2",
							Name: "user",
						},
					},
					UserType: "awesome",
				},
			},
			expected: results{
				orgID:     "12345",
				orgType:   "free",
				userEmail: "test_user@test.com",
				userId:    "test_user_id",
				userName:  "Mr. Test User",
				userType:  "awesome",
				rbacRole:  "admin",
				rbacGroupObjects: []*authv1.Claims_RbacGroupObject{
					{
						Id:   "1",
						Name: "admin",
					},
					{
						Id:   "2",
						Name: "user",
					},
				},
			},
		},
		{
			name:        "valid parsed jwt and claims with metadata",
			parsedToken: &jwt.Token{Valid: true},
			parsedClaims: &claims{
				Claims: authv1.Claims{
					OrgId:     "12345",
					OrgType:   "free",
					UserEmail: "test_user@test.com",
					UserId:    "test_user_id",
					UserName:  "Mr. Test User",
					RbacRole:  "admin",
					RbacGroupObjects: []*authv1.Claims_RbacGroupObject{
						{
							Id:   "1",
							Name: "admin",
						},
						{
							Id:   "2",
							Name: "user",
						},
					},
					UserType: "awesome",
					Metadata: func() *structpb.Struct {
						s, _ := structpb.NewStruct(map[string]any{
							"foo": "bar",
						})
						return s
					}(),
				},
			},
			expected: results{
				orgID:     "12345",
				orgType:   "free",
				userEmail: "test_user@test.com",
				userId:    "test_user_id",
				userName:  "Mr. Test User",
				userType:  "awesome",
				rbacRole:  "admin",
				rbacGroupObjects: []*authv1.Claims_RbacGroupObject{
					{
						Id:   "1",
						Name: "admin",
					},
					{
						Id:   "2",
						Name: "user",
					},
				},
				metadata: func() *structpb.Struct {
					s, _ := structpb.NewStruct(map[string]any{
						"foo": "bar",
					})
					return s
				}(),
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
					UserId:    "id",
					UserName:  "name",
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
					UserId:    "id",
					UserName:  "name",
				},
			},
			errMsg: "could not get rbac group objects",
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

			testEquals(t, ctx, test.expected)
		})
	}
}

func testEquals(t *testing.T, ctx context.Context, expected results) {
	t.Helper()

	orgID, ok := GetOrganizationID(ctx)
	assert.True(t, ok, "could not get orgId")

	orgType, ok := GetOrganizationType(ctx)
	assert.True(t, ok, "could not get orgType")

	userEmail, ok := GetUserEmail(ctx)
	assert.True(t, ok, "could not get userEmail")

	userType, ok := GetUserType(ctx)
	assert.True(t, ok, "could not get userType")

	userId, ok := GetUserId(ctx)
	assert.True(t, ok, "could not get userId")

	userName, ok := GetUserDisplayName(ctx)
	assert.True(t, ok, "could not get userName")

	rbacRole, ok := GetRbacRole(ctx)
	assert.True(t, ok, "could not get rbacRole")

	rbacGroupObjects, ok := GetRbacGroupObjects(ctx)
	assert.True(t, ok, "could not get rbacGroupObjects")

	actualMetadata, ok := GetMetadata(ctx)
	assert.True(t, ok, "could not get metadata")

	// since metadata is proto, we just assert that separately
	// first, check that metadata matches
	testutils.ProtoEquals(t, expected.metadata, actualMetadata)

	// second, check that results (minus metadata) matches
	expected.metadata = nil
	actual := results{
		orgID:            orgID,
		orgType:          orgType,
		userEmail:        userEmail,
		userType:         userType,
		userId:           userId,
		userName:         userName,
		rbacRole:         rbacRole,
		rbacGroupObjects: rbacGroupObjects,
	}
	assert.Equal(t, expected, actual)
}
