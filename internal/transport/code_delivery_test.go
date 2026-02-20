package transport

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/structpb"

	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	authv1 "github.com/superblocksteam/agent/types/gen/go/auth/v1"
)

func TestExtractUserContext(t *testing.T) {
	t.Parallel()

	t.Run("returns error when user id is missing", func(t *testing.T) {
		t.Parallel()
		ctx := context.Background()

		uc, err := extractUserContext(ctx)
		assert.Nil(t, uc)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "user id")
	})

	t.Run("extracts required user id with empty optional fields", func(t *testing.T) {
		t.Parallel()
		ctx := context.WithValue(context.Background(), jwt_validator.ContextKeyUserId, "user-123")

		uc, err := extractUserContext(ctx)
		require.NoError(t, err)
		assert.Equal(t, "user-123", uc.UserID)
		assert.Empty(t, uc.Email)
		assert.Empty(t, uc.Name)
		assert.Equal(t, []string{}, uc.Groups)
		assert.Equal(t, map[string]interface{}{}, uc.CustomClaims)
	})

	t.Run("extracts all fields when present", func(t *testing.T) {
		t.Parallel()
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-123")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserDisplayName, "Test User")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyRbacGroupObjects, []*authv1.Claims_RbacGroupObject{
			{Id: "group-1", Name: "admins"},
			{Id: "group-2", Name: "devs"},
		})
		md, err := structpb.NewStruct(map[string]interface{}{
			"department": "engineering",
			"tier":       "gold",
		})
		require.NoError(t, err)
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyMetadata, md)

		uc, err := extractUserContext(ctx)
		require.NoError(t, err)
		assert.Equal(t, "user-123", uc.UserID)
		assert.Equal(t, "test@example.com", uc.Email)
		assert.Equal(t, "Test User", uc.Name)
		assert.Equal(t, []string{"admins", "devs"}, uc.Groups)
		assert.Equal(t, "engineering", uc.CustomClaims["department"])
		assert.Equal(t, "gold", uc.CustomClaims["tier"])
	})

	t.Run("fallback to email when user id is absent", func(t *testing.T) {
		t.Parallel()
		ctx := jwt_validator.WithUserEmail(context.Background(), "fallback@example.com")
		// No ContextKeyUserId - simulates legacy JWT without user_id claim

		uc, err := extractUserContext(ctx)
		require.NoError(t, err)
		assert.Equal(t, "fallback@example.com", uc.UserID)
		assert.Equal(t, "fallback@example.com", uc.Email)
	})

	t.Run("handles metadata with empty struct", func(t *testing.T) {
		t.Parallel()
		ctx := context.WithValue(context.Background(), jwt_validator.ContextKeyUserId, "user-123")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyMetadata, &structpb.Struct{})

		uc, err := extractUserContext(ctx)
		require.NoError(t, err)
		assert.Equal(t, "user-123", uc.UserID)
		assert.Equal(t, map[string]interface{}{}, uc.CustomClaims)
	})
}

func TestToUserGroups(t *testing.T) {
	t.Parallel()

	t.Run("skips nil groups", func(t *testing.T) {
		t.Parallel()
		groups := []*authv1.Claims_RbacGroupObject{
			nil,
			{Id: "g1", Name: "admins"},
			nil,
		}
		out := toUserGroups(groups)
		assert.Equal(t, []string{"admins"}, out)
	})

	t.Run("uses id when name is empty", func(t *testing.T) {
		t.Parallel()
		groups := []*authv1.Claims_RbacGroupObject{
			{Id: "group-id-only", Name: ""},
		}
		out := toUserGroups(groups)
		assert.Equal(t, []string{"group-id-only"}, out)
	})

	t.Run("returns empty slice when all groups produce no output", func(t *testing.T) {
		t.Parallel()
		groups := []*authv1.Claims_RbacGroupObject{
			nil,
			{Id: "", Name: ""},
		}
		out := toUserGroups(groups)
		assert.Equal(t, []string{}, out)
	})
}

func TestGenerateWrapperScript(t *testing.T) {
	t.Parallel()

	t.Run("generates script with user context and inputs", func(t *testing.T) {
		t.Parallel()
		user := &userContext{
			UserID: "u-1",
			Email:  "user@example.com",
			Name:   "Alice",
			Groups: []string{"admins"},
			CustomClaims: map[string]interface{}{
				"department": "engineering",
			},
		}
		inputs := map[string]*structpb.Value{
			"name":  structpb.NewStringValue("world"),
			"count": structpb.NewNumberValue(42),
		}
		bundle := "module.exports = { run: function() { return 'hello'; } };"

		script, err := generateWrapperScript(user, inputs, bundle)
		require.NoError(t, err)
		assert.Contains(t, script, `"userId":"u-1"`)
		assert.Contains(t, script, `"email":"user@example.com"`)
		assert.Contains(t, script, `"name":"Alice"`)
		assert.Contains(t, script, `"groups":["admins"]`)
		assert.Contains(t, script, `"customClaims":{"department":"engineering"}`)
		assert.Contains(t, script, `"world"`)
		assert.Contains(t, script, `42`)
		assert.Contains(t, script, bundle)
		assert.Contains(t, script, "__sb_context")
		assert.Contains(t, script, "--- begin bundle ---")
		assert.Contains(t, script, "--- end bundle ---")
	})

	t.Run("handles nil inputs", func(t *testing.T) {
		t.Parallel()
		user := &userContext{UserID: "u-1", Email: "a@b.com", Groups: []string{}, CustomClaims: map[string]interface{}{}}

		script, err := generateWrapperScript(user, nil, "var x = 1;")
		require.NoError(t, err)
		assert.Contains(t, script, "{}")
		assert.Contains(t, script, "var x = 1;")
	})

	t.Run("handles empty inputs", func(t *testing.T) {
		t.Parallel()
		user := &userContext{UserID: "u-1", Email: "a@b.com", Groups: []string{}, CustomClaims: map[string]interface{}{}}

		script, err := generateWrapperScript(user, map[string]*structpb.Value{}, "var x = 1;")
		require.NoError(t, err)
		assert.Contains(t, script, "{}")
	})

	t.Run("omits empty optional fields from user JSON", func(t *testing.T) {
		t.Parallel()
		user := &userContext{
			UserID:       "u-1",
			Groups:       []string{},
			CustomClaims: map[string]interface{}{},
		}

		script, err := generateWrapperScript(user, nil, "bundle")
		require.NoError(t, err)

		// The script should include required keys and omit optional keys.
		// because json omitempty skips zero-value strings.
		assert.Contains(t, script, `"userId":"u-1"`)
		assert.NotContains(t, script, `"name"`)
		assert.NotContains(t, script, `"email"`)
		assert.Contains(t, script, `"groups":[]`)
		assert.Contains(t, script, `"customClaims":{}`)
	})

	t.Run("includes run() invocation after bundle", func(t *testing.T) {
		t.Parallel()
		user := &userContext{UserID: "u-1", Email: "a@b.com", Groups: []string{}, CustomClaims: map[string]interface{}{}}
		bundle := "module.exports = { run: function(ctx) { return ctx; } };"

		script, err := generateWrapperScript(user, nil, bundle)
		require.NoError(t, err)
		assert.Contains(t, script, "__sb_run(__sb_context)")
		assert.Contains(t, script, "return await __sb_run(__sb_context)")
		assert.Contains(t, script, "var module = { exports: {} }")
		assert.Contains(t, script, `typeof __sb_run !== "function"`)
	})

	t.Run("handles nested struct inputs", func(t *testing.T) {
		t.Parallel()
		user := &userContext{UserID: "u-1", Email: "a@b.com", Groups: []string{}, CustomClaims: map[string]interface{}{}}

		nested, err := structpb.NewStruct(map[string]interface{}{
			"key": "value",
			"arr": []interface{}{"a", "b"},
		})
		require.NoError(t, err)

		inputs := map[string]*structpb.Value{
			"config": structpb.NewStructValue(nested),
			"flag":   structpb.NewBoolValue(true),
		}

		script, err := generateWrapperScript(user, inputs, "bundle")
		require.NoError(t, err)
		assert.Contains(t, script, `"key":"value"`)
		assert.Contains(t, script, `"flag":true`)
	})

	t.Run("handles bundle with backticks and template literals", func(t *testing.T) {
		t.Parallel()
		user := &userContext{UserID: "u-1", Email: "a@b.com", Groups: []string{}, CustomClaims: map[string]interface{}{}}
		bundle := "const msg = `hello ${name}`; module.exports = { run: () => msg };"

		script, err := generateWrapperScript(user, nil, bundle)
		require.NoError(t, err)
		assert.Contains(t, script, "hello ${name}")
		assert.Contains(t, script, "__sb_context")
	})

	t.Run("returns error when user context cannot be marshaled", func(t *testing.T) {
		t.Parallel()
		user := &userContext{
			UserID:       "u-1",
			CustomClaims: map[string]interface{}{"chan": make(chan int)},
		}

		script, err := generateWrapperScript(user, nil, "bundle")
		assert.Empty(t, script)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "marshal user context")
	})
}

func TestMarshalInputs(t *testing.T) {
	t.Parallel()

	t.Run("returns empty object for nil inputs", func(t *testing.T) {
		t.Parallel()
		result, err := marshalInputs(nil)
		require.NoError(t, err)
		assert.Equal(t, "{}", string(result))
	})

	t.Run("returns empty object for empty map", func(t *testing.T) {
		t.Parallel()
		result, err := marshalInputs(map[string]*structpb.Value{})
		require.NoError(t, err)
		assert.Equal(t, "{}", string(result))
	})

	t.Run("marshals string and number values", func(t *testing.T) {
		t.Parallel()
		inputs := map[string]*structpb.Value{
			"key":   structpb.NewStringValue("value"),
			"count": structpb.NewNumberValue(5),
		}
		result, err := marshalInputs(inputs)
		require.NoError(t, err)

		var parsed map[string]interface{}
		require.NoError(t, json.Unmarshal(result, &parsed))
		assert.Equal(t, "value", parsed["key"])
		assert.Equal(t, float64(5), parsed["count"])
	})

	t.Run("skips nil values", func(t *testing.T) {
		t.Parallel()
		inputs := map[string]*structpb.Value{
			"present": structpb.NewStringValue("yes"),
			"absent":  nil,
		}
		result, err := marshalInputs(inputs)
		require.NoError(t, err)

		var parsed map[string]interface{}
		require.NoError(t, json.Unmarshal(result, &parsed))
		assert.Equal(t, "yes", parsed["present"])
		assert.NotContains(t, parsed, "absent")
	})
}
