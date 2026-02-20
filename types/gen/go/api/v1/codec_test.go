package v1

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestOutputFromOutputOldJSON(t *testing.T) {
	t.Parallel()

	t.Run("maps error field to Stderr", func(t *testing.T) {
		// Worker sets output.error when JS throws; OutputOld proto has no error field.
		json := `{"output":{},"log":[],"error":"ReferenceError: x is not defined"}`
		o, err := OutputFromOutputOldJSON([]byte(json))
		require.NoError(t, err)
		require.Len(t, o.Stderr, 1)
		assert.Equal(t, "ReferenceError: x is not defined", o.Stderr[0])
	})

	t.Run("maps log [ERROR] prefix to Stderr", func(t *testing.T) {
		json := `{"output":{},"log":["[ERROR] runtime failed"],"request":""}`
		o, err := OutputFromOutputOldJSON([]byte(json))
		require.NoError(t, err)
		require.Len(t, o.Stderr, 1)
		assert.Equal(t, "runtime failed", o.Stderr[0])
	})

	t.Run("combines error field and log [ERROR] entries", func(t *testing.T) {
		json := `{"output":{},"log":["[ERROR] first"],"error":"second"}`
		o, err := OutputFromOutputOldJSON([]byte(json))
		require.NoError(t, err)
		require.Len(t, o.Stderr, 2)
		assert.Equal(t, "first", o.Stderr[0])
		assert.Equal(t, "second", o.Stderr[1])
	})

	t.Run("preserves placeHoldersInfo", func(t *testing.T) {
		json := `{"output":{"key":"value"},"log":[],"placeHoldersInfo":{"foo":"bar"}}`
		o, err := OutputFromOutputOldJSON([]byte(json))
		require.NoError(t, err)
		require.NotNil(t, o.RequestV2)
		require.NotNil(t, o.RequestV2.Metadata)
		ph := o.RequestV2.Metadata.GetFields()["placeHoldersInfo"]
		require.NotNil(t, ph)
		assert.Equal(t, "bar", ph.GetStructValue().GetFields()["foo"].GetStringValue())
	})

	t.Run("accepts placeholdersInfo (worker variant)", func(t *testing.T) {
		json := `{"output":{},"log":[],"placeholdersInfo":{"baz":"qux"}}`
		o, err := OutputFromOutputOldJSON([]byte(json))
		require.NoError(t, err)
		require.NotNil(t, o.RequestV2)
		require.NotNil(t, o.RequestV2.Metadata)
		ph := o.RequestV2.Metadata.GetFields()["placeHoldersInfo"]
		require.NotNil(t, ph)
		assert.Equal(t, "qux", ph.GetStructValue().GetFields()["baz"].GetStringValue())
	})

	t.Run("returns error for invalid JSON", func(t *testing.T) {
		_, err := OutputFromOutputOldJSON([]byte(`{invalid`))
		assert.Error(t, err)
	})
}

func TestOutputFromOutputOld(t *testing.T) {
	t.Parallel()

	t.Run("maps log entries to Stdout and Stderr", func(t *testing.T) {
		old := &OutputOld{
			Output:  structpb.NewStructValue(&structpb.Struct{Fields: map[string]*structpb.Value{"k": structpb.NewStringValue("v")}}),
			Log:     []string{"info", "[ERROR] err"},
			Request: "GET /",
		}
		o := OutputFromOutputOld(old)
		assert.Equal(t, []string{"info"}, o.Stdout)
		assert.Equal(t, []string{"err"}, o.Stderr)
		assert.Equal(t, old.Output, o.Result)
		assert.Equal(t, "GET /", o.Request)
	})
}
