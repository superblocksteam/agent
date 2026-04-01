// Benchmarks for code-mode wrapper generation and executeCodeMode flow.
//
// NOTE: Fixtures in testdata/fixtures/ are synthetic, hand-crafted bundles
// (~200 lines). Real SDK API bundles are esbuild IIFE output with sdk-api+zod
// inlined, typically 50-100KB minified. These benchmarks are useful for
// regression detection but don't represent production payload sizes.
package transport

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/constants"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/worker"

	fetchmocks "github.com/superblocksteam/agent/internal/fetch/mocks"
	flagsmock "github.com/superblocksteam/agent/internal/flags/mock"
	jwt_validator "github.com/superblocksteam/agent/internal/jwt/validator"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"

	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

// loadFixture reads a JS fixture file from testdata/fixtures/.
func loadFixture(b *testing.B, name string) string {
	b.Helper()
	data, err := os.ReadFile(filepath.Join("testdata", "fixtures", name))
	require.NoError(b, err)
	return string(data)
}

// benchInputs creates n structpb.Value entries simulating API inputs.
func benchInputs(n int) map[string]*structpb.Value {
	inputs := make(map[string]*structpb.Value, n)
	for i := 0; i < n; i++ {
		inputs[fmt.Sprintf("input_%d", i)] = structpb.NewStringValue(fmt.Sprintf("value_%d", i))
	}
	return inputs
}

// setupCodeModeServer creates a server with mocked dependencies for benchmarking
// executeCodeMode. The mock worker returns the given outputKey which must already
// be written to the returned store.
func setupCodeModeServer(b *testing.B, outputKey string, pluginName string) (*server, store.Store) {
	b.Helper()

	mockWorker := &worker.MockClient{}
	fetcher := &fetchmocks.Fetcher{}
	memStore := store.Memory()

	require.NoError(b, memStore.Write(context.Background(), &store.KV{
		Key:   outputKey,
		Value: `{"output":{"ok":true}}`,
	}))

	mockFlags := flagsmock.NewFlags(b)

	if pluginName == sdkApiWasmPluginName {
		mockFlags.On("GetSdkApiUseWasmWorkerEnabled", mock.Anything, mock.Anything).Return(true).Maybe()
	} else {
		mockFlags.On("GetSdkApiUseWasmWorkerEnabled", mock.Anything, mock.Anything).Return(false).Maybe()
	}

	mockWorker.On("Execute", mock.Anything, pluginName, mock.Anything, mock.Anything, mock.Anything).
		Return(&transportv1.Performance{}, outputKey, nil).Maybe()

	s := &server{
		Config: &Config{
			Logger:  zap.NewNop(),
			Store:   memStore,
			Worker:  mockWorker,
			Fetcher: fetcher,
			Flags:   mockFlags,
		},
	}

	return s, memStore
}

// benchCtx creates a context with JWT claims suitable for executeCodeMode.
func benchCtx(executionID string) context.Context {
	ctx := jwt_validator.WithUserEmail(context.Background(), "bench@example.com")
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyUserId, "user-bench")
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyOrganizationType, "ENTERPRISE")
	ctx = context.WithValue(ctx, jwt_validator.ContextKeyOrganziationID, "org-bench")
	ctx = constants.WithExecutionID(ctx, executionID)
	return ctx
}

// --- Wrapper generation benchmarks ---

func BenchmarkGenerateWrapperScript_Minimal(b *testing.B) {
	bundle := loadFixture(b, "minimal.js")
	user := &userContext{UserID: "user-1", Email: "bench@test.com"}
	inputs := benchInputs(2)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := generateWrapperScript(user, inputs, bundle, "exec-bench", "")
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGenerateWrapperScript_CrudApp(b *testing.B) {
	bundle := loadFixture(b, "crud_app.js")
	user := &userContext{UserID: "user-1", Email: "bench@test.com"}
	inputs := benchInputs(5)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := generateWrapperScript(user, inputs, bundle, "exec-bench", "")
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGenerateWrapperScript_ComplexApp(b *testing.B) {
	bundle := loadFixture(b, "complex_app.js")
	user := &userContext{UserID: "user-1", Email: "bench@test.com"}
	inputs := benchInputs(10)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := generateWrapperScript(user, inputs, bundle, "exec-bench", "")
		if err != nil {
			b.Fatal(err)
		}
	}
}

// --- Full executeCodeMode benchmarks (mocked worker) ---

func benchExecuteCodeMode(b *testing.B, fixtureName string, numInputs int) {
	b.Helper()
	defer metrics.SetupForTesting()()

	bundle := loadFixture(b, fixtureName)
	outputKey := "bench-output-key"
	s, memStore := setupCodeModeServer(b, outputKey, sdkApiWasmPluginName)

	ctx := benchCtx("exec-bench-full")
	fetchCode := &apiv1.ExecuteRequest_FetchCode{Id: "bench-app", CommitId: strPtr("abc")}
	result := &apiv1.Definition{
		Api: &apiv1.Api{Metadata: &v1.Metadata{Name: "bench-api"}},
	}
	rawResult := &structpb.Struct{
		Fields: map[string]*structpb.Value{
			"bundle": structpb.NewStringValue(bundle),
		},
	}
	req := &apiv1.ExecuteRequest{
		Request: &apiv1.ExecuteRequest_FetchCode_{FetchCode: fetchCode},
		Inputs:  benchInputs(numInputs),
	}
	send := func(*apiv1.StreamResponse) error { return nil }

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Re-write the output key each iteration since executeCodeMode deletes it.
		b.StopTimer()
		if err := memStore.Write(context.Background(), &store.KV{Key: outputKey, Value: `{"output":{"ok":true}}`}); err != nil {
			b.Fatal(err)
		}
		b.StartTimer()

		_, err := s.executeCodeMode(ctx, fetchCode, result, rawResult, req, false, send, false)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkExecuteCodeMode_Minimal(b *testing.B) {
	benchExecuteCodeMode(b, "minimal.js", 2)
}

func BenchmarkExecuteCodeMode_CrudApp(b *testing.B) {
	benchExecuteCodeMode(b, "crud_app.js", 5)
}

func BenchmarkExecuteCodeMode_ComplexApp(b *testing.B) {
	benchExecuteCodeMode(b, "complex_app.js", 10)
}

// --- Variable persistence benchmarks ---

func BenchmarkExecuteCodeMode_10Inputs(b *testing.B) {
	benchExecuteCodeMode(b, "minimal.js", 10)
}

func BenchmarkExecuteCodeMode_100Inputs(b *testing.B) {
	benchExecuteCodeMode(b, "minimal.js", 100)
}
