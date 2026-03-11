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

func TestDiagnosticsFromOutputJSON(t *testing.T) {
	t.Parallel()

	t.Run("returns nil when no diagnostics field", func(t *testing.T) {
		json := `{"output":{},"log":[]}`
		result := DiagnosticsFromOutputJSON([]byte(json))
		assert.Nil(t, result)
	})

	t.Run("returns nil for empty diagnostics array", func(t *testing.T) {
		json := `{"output":{},"log":[],"diagnostics":[]}`
		result := DiagnosticsFromOutputJSON([]byte(json))
		assert.Nil(t, result)
	})

	t.Run("returns nil for invalid JSON", func(t *testing.T) {
		result := DiagnosticsFromOutputJSON([]byte(`{invalid`))
		assert.Nil(t, result)
	})

	t.Run("parses single diagnostic entry", func(t *testing.T) {
		json := `{
			"output":{},
			"log":[],
			"diagnostics":[{
				"integrationId":"int-123",
				"pluginId":"postgres",
				"input":"{\"query\":\"SELECT 1\"}",
				"output":"{\"rows\":[]}",
				"startMs":1700000000000,
				"endMs":1700000000050,
				"durationMs":50,
				"error":"",
				"sequence":0
			}]
		}`
		result := DiagnosticsFromOutputJSON([]byte(json))
		require.Len(t, result, 1)
		assert.Equal(t, "int-123", result[0].IntegrationId)
		assert.Equal(t, "postgres", result[0].PluginId)
		assert.Equal(t, `{"query":"SELECT 1"}`, result[0].InputTruncated)
		assert.Equal(t, `{"rows":[]}`, result[0].OutputTruncated)
		assert.Equal(t, int64(1700000000000), result[0].StartMs)
		assert.Equal(t, int64(1700000000050), result[0].EndMs)
		assert.Equal(t, int64(50), result[0].DurationMs)
		assert.Equal(t, "", result[0].Error)
		assert.Equal(t, int32(0), result[0].Sequence)
	})

	t.Run("parses multiple diagnostic entries with error", func(t *testing.T) {
		json := `{
			"output":{},
			"log":[],
			"diagnostics":[
				{"integrationId":"a","pluginId":"postgres","input":"{}","output":"{}","startMs":100,"endMs":150,"durationMs":50,"error":"","sequence":0},
				{"integrationId":"b","pluginId":"restapi","input":"{}","output":"","startMs":200,"endMs":300,"durationMs":100,"error":"connection refused","sequence":1}
			]
		}`
		result := DiagnosticsFromOutputJSON([]byte(json))
		require.Len(t, result, 2)
		assert.Equal(t, "a", result[0].IntegrationId)
		assert.Equal(t, "postgres", result[0].PluginId)
		assert.Equal(t, int32(0), result[0].Sequence)
		assert.Equal(t, "b", result[1].IntegrationId)
		assert.Equal(t, "restapi", result[1].PluginId)
		assert.Equal(t, "connection refused", result[1].Error)
		assert.Equal(t, int32(1), result[1].Sequence)
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
