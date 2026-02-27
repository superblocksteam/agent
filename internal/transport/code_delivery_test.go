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

	defaultUser := &userContext{UserID: "u-1", Email: "a@b.com", Groups: []string{}, CustomClaims: map[string]interface{}{}}

	t.Run("generates script with user context, inputs, and executionID", func(t *testing.T) {
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
		bundle := "module.exports = { default: { run: async function() { return 'hello'; }, inputSchema: {}, outputSchema: {} } };"

		script, err := generateWrapperScript(user, inputs, bundle, "exec-123")
		require.NoError(t, err)
		assert.Contains(t, script, `"userId":"u-1"`)
		assert.Contains(t, script, `"email":"user@example.com"`)
		assert.Contains(t, script, `"name":"Alice"`)
		assert.Contains(t, script, `"groups":["admins"]`)
		assert.Contains(t, script, `"customClaims":{"department":"engineering"}`)
		assert.Contains(t, script, `"world"`)
		assert.Contains(t, script, `42`)
		assert.Contains(t, script, bundle)
		assert.Contains(t, script, `"exec-123"`)
		assert.Contains(t, script, "__sb_context")
		assert.Contains(t, script, "__sb_executionId")
		assert.Contains(t, script, "--- begin bundle ---")
		assert.Contains(t, script, "--- end bundle ---")
	})

	t.Run("handles nil inputs", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, nil, "var x = 1;", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, "{}")
		assert.Contains(t, script, "var x = 1;")
	})

	t.Run("handles empty inputs", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, map[string]*structpb.Value{}, "var x = 1;", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, "{}")
	})

	t.Run("omits empty optional user fields from JSON", func(t *testing.T) {
		t.Parallel()
		user := &userContext{
			UserID:       "u-1",
			Groups:       []string{},
			CustomClaims: map[string]interface{}{},
		}

		script, err := generateWrapperScript(user, nil, "bundle", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, `"userId":"u-1"`)
		assert.NotContains(t, script, `"name"`)
		assert.NotContains(t, script, `"email"`)
		assert.Contains(t, script, `"groups":[]`)
		assert.Contains(t, script, `"customClaims":{}`)
	})

	t.Run("uses __sb_execute and __sb_result pattern", func(t *testing.T) {
		t.Parallel()
		bundle := "module.exports = { default: { run: async function(ctx) { return ctx; }, inputSchema: {}, outputSchema: {} } };"

		script, err := generateWrapperScript(defaultUser, nil, bundle, "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, "__sb_execute")
		assert.Contains(t, script, "__sb_result")
		assert.Contains(t, script, "__sb_api")
		assert.Contains(t, script, "__sb_executeQuery")
		assert.Contains(t, script, "var module = { exports: {} }")
		assert.Contains(t, script, `typeof __sb_api.run !== "function"`)
		assert.Contains(t, script, "return __sb_result.output")
	})

	t.Run("validates CompiledApi shape", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, nil, "// empty bundle", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, `does not export a valid CompiledApi`)
	})

	t.Run("includes executeQuery bridge for integrations", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, nil, "bundle", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, "__sb_executeQuery")
		assert.Contains(t, script, "__sb_integrationExecutor")
		assert.Contains(t, script, "pluginId")
		assert.Contains(t, script, "actionConfiguration")
	})

	t.Run("prepares file methods on marshaled inputs when available", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, map[string]*structpb.Value{
			"SampleFiles": structpb.NewStructValue(&structpb.Struct{
				Fields: map[string]*structpb.Value{
					"files": structpb.NewListValue(&structpb.ListValue{
						Values: []*structpb.Value{
							structpb.NewStructValue(&structpb.Struct{
								Fields: map[string]*structpb.Value{
									"$superblocksId": structpb.NewStringValue("upload-1"),
								},
							}),
						},
					}),
				},
			}),
		}, "bundle", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, "$prepareGlobalObjectForFiles(__sb_context.inputs)")
	})

	t.Run("builds pluginId lookup map from api.integrations", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, nil, "bundle", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, "__sb_pluginIdMap",
			"wrapper should build a map from integrationId to pluginId using api.integrations")
		assert.Contains(t, script, "__sb_api.integrations",
			"wrapper should read integrations from the loaded CompiledApi")
		assert.Contains(t, script, "__sb_pluginIdMap[integrationId]",
			"executeQuery should look up pluginId from the map, not from metadata arg")
	})

	t.Run("handles nested struct inputs", func(t *testing.T) {
		t.Parallel()
		nested, err := structpb.NewStruct(map[string]interface{}{
			"key": "value",
			"arr": []interface{}{"a", "b"},
		})
		require.NoError(t, err)

		inputs := map[string]*structpb.Value{
			"config": structpb.NewStructValue(nested),
			"flag":   structpb.NewBoolValue(true),
		}

		script, err := generateWrapperScript(defaultUser, inputs, "bundle", "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, `"key":"value"`)
		assert.Contains(t, script, `"flag":true`)
	})

	t.Run("handles bundle with backticks and template literals", func(t *testing.T) {
		t.Parallel()
		bundle := "const msg = `hello ${name}`; module.exports = { default: { run: () => msg, inputSchema: {}, outputSchema: {} } };"

		script, err := generateWrapperScript(defaultUser, nil, bundle, "exec-1")
		require.NoError(t, err)
		assert.Contains(t, script, "hello ${name}")
		assert.Contains(t, script, "__sb_execute")
	})

	t.Run("escapes special characters in executionID", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, nil, "bundle", `exec-"special"`)
		require.NoError(t, err)
		assert.Contains(t, script, `exec-\"special\"`)
	})

	t.Run("error handling extracts cause and issues from error details", func(t *testing.T) {
		t.Parallel()
		script, err := generateWrapperScript(defaultUser, nil, "bundle", "exec-1")
		require.NoError(t, err)

		// The wrapper must surface details.cause so callers see the
		// underlying reason (e.g. DB connection error) instead of just
		// "Integration failed during query". Raw V8 line numbers from the
		// combined wrapper+bundle are not useful; structured error details
		// are the primary debug signal.
		assert.Contains(t, script, "__sb_err.details.cause",
			"wrapper should extract cause from error details for richer diagnostics")
		assert.Contains(t, script, "__sb_err.details.issues",
			"wrapper should extract validation issues from error details")
		assert.Contains(t, script, `__sb_cause.message`,
			"wrapper should prefer cause.message when cause is an object")

		// The wrapper should NOT prefix error code into the message (user feedback).
		assert.NotContains(t, script, `"[" + __sb_err.code`,
			"error code should not be prefixed into the human-readable message")
	})

	t.Run("returns error when user context cannot be marshaled", func(t *testing.T) {
		t.Parallel()
		user := &userContext{
			UserID:       "u-1",
			CustomClaims: map[string]interface{}{"chan": make(chan int)},
		}

		script, err := generateWrapperScript(user, nil, "bundle", "exec-1")
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
