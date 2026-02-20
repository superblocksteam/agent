package transport

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/structpb"

	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
)

func TestExtractUserContext(t *testing.T) {
	t.Parallel()

	t.Run("returns error when email is missing", func(t *testing.T) {
		t.Parallel()
		ctx := context.Background()

		uc, err := extractUserContext(ctx)
		assert.Nil(t, uc)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "user email")
	})

	t.Run("extracts email only when no optional fields", func(t *testing.T) {
		t.Parallel()
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")

		uc, err := extractUserContext(ctx)
		require.NoError(t, err)
		assert.Equal(t, "test@example.com", uc.Email)
		assert.Empty(t, uc.ID)
		assert.Empty(t, uc.Name)
	})

	t.Run("extracts all fields when present", func(t *testing.T) {
		t.Parallel()
		ctx := jwt_validator.WithUserEmail(context.Background(), "test@example.com")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-123")
		ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserDisplayName, "Test User")

		uc, err := extractUserContext(ctx)
		require.NoError(t, err)
		assert.Equal(t, "test@example.com", uc.Email)
		assert.Equal(t, "user-123", uc.ID)
		assert.Equal(t, "Test User", uc.Name)
	})
}

func TestGenerateWrapperScript(t *testing.T) {
	t.Parallel()

	t.Run("generates script with user context and inputs", func(t *testing.T) {
		t.Parallel()
		user := &userContext{
			Email: "user@example.com",
			ID:    "u-1",
			Name:  "Alice",
		}
		inputs := map[string]*structpb.Value{
			"name":  structpb.NewStringValue("world"),
			"count": structpb.NewNumberValue(42),
		}
		bundle := "module.exports = { run: function() { return 'hello'; } };"

		script, err := generateWrapperScript(user, inputs, bundle)
		require.NoError(t, err)
		assert.Contains(t, script, `"email":"user@example.com"`)
		assert.Contains(t, script, `"id":"u-1"`)
		assert.Contains(t, script, `"name":"Alice"`)
		assert.Contains(t, script, `"world"`)
		assert.Contains(t, script, `42`)
		assert.Contains(t, script, bundle)
		assert.Contains(t, script, "__sb_context")
		assert.Contains(t, script, "--- begin bundle ---")
		assert.Contains(t, script, "--- end bundle ---")
	})

	t.Run("handles nil inputs", func(t *testing.T) {
		t.Parallel()
		user := &userContext{Email: "a@b.com"}

		script, err := generateWrapperScript(user, nil, "var x = 1;")
		require.NoError(t, err)
		assert.Contains(t, script, "{}")
		assert.Contains(t, script, "var x = 1;")
	})

	t.Run("handles empty inputs", func(t *testing.T) {
		t.Parallel()
		user := &userContext{Email: "a@b.com"}

		script, err := generateWrapperScript(user, map[string]*structpb.Value{}, "var x = 1;")
		require.NoError(t, err)
		assert.Contains(t, script, "{}")
	})

	t.Run("omits empty optional fields from user JSON", func(t *testing.T) {
		t.Parallel()
		user := &userContext{Email: "a@b.com"}

		script, err := generateWrapperScript(user, nil, "bundle")
		require.NoError(t, err)

		// The script should contain the email but not "id" or "name" keys
		// because json omitempty skips zero-value strings.
		assert.Contains(t, script, `"email":"a@b.com"`)
		assert.NotContains(t, script, `"id"`)
		assert.NotContains(t, script, `"name"`)
	})

	t.Run("includes run() invocation after bundle", func(t *testing.T) {
		t.Parallel()
		user := &userContext{Email: "a@b.com"}
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
		user := &userContext{Email: "a@b.com"}

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
		user := &userContext{Email: "a@b.com"}
		bundle := "const msg = `hello ${name}`; module.exports = { run: () => msg };"

		script, err := generateWrapperScript(user, nil, bundle)
		require.NoError(t, err)
		assert.Contains(t, script, "hello ${name}")
		assert.Contains(t, script, "__sb_context")
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
