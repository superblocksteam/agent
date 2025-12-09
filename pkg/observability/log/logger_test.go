package log

import (
	"context"
	"fmt"
	"os"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/emitter/mocks"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	"go.uber.org/zap"
)

func TestLoggerInvokesEmitterOnlyIfTriggerFieldIsPresent(t *testing.T) {
	t.Parallel()
	mockEmitter := mocks.NewEmitter(t)
	mockEmitter.On("Enabled").Return(true)
	mockEmitter.On("Trigger").Return("mock-trigger")
	mockEmitter.On("Write", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	mockEmitter.On("Logger", mock.Anything).Run(nil)

	var logger *zap.Logger
	{
		l, err := Logger(&Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				mockEmitter,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	logger.Info("Test log", zap.String("mock-trigger", "true"))
	logger.Info("Test log", zap.String("foobar", "true"))

	mockEmitter.AssertNumberOfCalls(t, "Write", 1)
}

func TestLoggerChildDoesNotClobberFields(t *testing.T) {
	t.Parallel()
	mockEmitter := mocks.NewEmitter(t)
	mockEmitter.On("Enabled").Return(true)
	mockEmitter.On("Trigger").Return("mock-trigger")
	mockEmitter.On("Write", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	mockEmitter.On("Logger", mock.Anything).Run(nil)

	var logger *zap.Logger
	{
		l, err := Logger(&Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				mockEmitter,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	child1 := logger.With(zap.String("foo", "bar"), zap.String("logger1", "child1"))
	child2 := logger.With(zap.String("foo", "baz"), zap.String("logger2", "child2"))
	child3 := logger.With(zap.String("foo", "car"), zap.String("logger3", "child3"))
	child4 := logger.With(zap.String("foo", "qux"), zap.String("logger4", "child4"))

	wg := &sync.WaitGroup{}
	wg.Add(4)

	go func() {
		defer wg.Done()
		child1.Info("Test log1", zap.String("mock-trigger", "true"))
	}()
	go func() {
		defer wg.Done()
		child2.Info("Test log2", zap.String("mock-trigger", "true"))
	}()
	go func() {
		defer wg.Done()
		child3.Info("Test log3", zap.String("mock-trigger", "true"))
	}()
	go func() {
		defer wg.Done()
		child4.Info("Test log4", zap.String("mock-trigger", "true"))
	}()

	wg.Wait()

	mockEmitter.AssertNumberOfCalls(t, "Write", 4)
	mockEmitter.AssertCalled(t, "Write", mock.Anything, mock.Anything, "Test log1", map[string]any{"foo": "bar", "mock-trigger": "true", "logger1": "child1"})
	mockEmitter.AssertCalled(t, "Write", mock.Anything, mock.Anything, "Test log2", map[string]any{"foo": "baz", "mock-trigger": "true", "logger2": "child2"})
	mockEmitter.AssertCalled(t, "Write", mock.Anything, mock.Anything, "Test log3", map[string]any{"foo": "car", "mock-trigger": "true", "logger3": "child3"})
	mockEmitter.AssertCalled(t, "Write", mock.Anything, mock.Anything, "Test log4", map[string]any{"foo": "qux", "mock-trigger": "true", "logger4": "child4"})
}

func TestLoggerChildAlwaysTriggersIfTriggerFieldAdded(t *testing.T) {
	t.Parallel()
	mockEmitter := mocks.NewEmitter(t)
	mockEmitter.On("Enabled").Return(true)
	mockEmitter.On("Trigger").Return("mock-trigger")
	mockEmitter.On("Write", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	mockEmitter.On("Logger", mock.Anything).Run(nil)

	var logger *zap.Logger
	{
		l, err := Logger(&Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				mockEmitter,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	child := logger.With(zap.String("mock-trigger", "true"))

	logger.Info("Nope")
	child.Info("Hello", zap.String("my", "baby"))
	child.Info("Hello", zap.String("my", "honey"))
	child.Info("Hello", zap.String("my", "ragtime gal"))

	mockEmitter.AssertNumberOfCalls(t, "Write", 3)
}

// testProcessor is a simple processor that counts log records for testing.
type testProcessor struct {
	recordCount int32
}

func (p *testProcessor) OnEmit(ctx context.Context, record *sdklog.Record) error {
	atomic.AddInt32(&p.recordCount, 1)
	return nil
}

func (p *testProcessor) Shutdown(ctx context.Context) error {
	return nil
}

func (p *testProcessor) ForceFlush(ctx context.Context) error {
	return nil
}

func (p *testProcessor) count() int32 {
	return atomic.LoadInt32(&p.recordCount)
}

func TestLoggerWithLoggerProvider(t *testing.T) {
	t.Parallel()

	// Create test processor to capture logs
	processor := &testProcessor{}
	provider := sdklog.NewLoggerProvider(
		sdklog.WithProcessor(processor),
	)
	defer provider.Shutdown(context.Background())

	logger, err := Logger(&Options{
		Level:          "debug",
		LoggerProvider: provider,
	})
	require.NoError(t, err)

	logger.Info("test message", zap.String("key", "value"))

	// Force sync to ensure logs are flushed
	logger.Sync()

	// Force flush the provider
	provider.ForceFlush(context.Background())

	// Verify log was captured by the OTEL core
	require.Greater(t, processor.count(), int32(0), "expected OTEL processor to capture logs")
}

func TestLoggerWithLoggerProviderMultipleLevels(t *testing.T) {
	t.Parallel()

	// Create test processor to capture logs
	processor := &testProcessor{}
	provider := sdklog.NewLoggerProvider(
		sdklog.WithProcessor(processor),
	)
	defer provider.Shutdown(context.Background())

	logger, err := Logger(&Options{
		Level:          "debug",
		LoggerProvider: provider,
	})
	require.NoError(t, err)

	// Log at different levels
	logger.Debug("debug message")
	logger.Info("info message")
	logger.Warn("warn message")
	logger.Error("error message")

	// Force sync and flush
	logger.Sync()
	provider.ForceFlush(context.Background())

	// Verify all log levels were captured (4 messages)
	require.GreaterOrEqual(t, processor.count(), int32(4), "expected OTEL processor to capture all log levels")
}

func TestLoggerWithLoggerProviderAndEmitters(t *testing.T) {
	t.Parallel()

	// Create mock emitter
	mockEmitter := mocks.NewEmitter(t)
	mockEmitter.On("Enabled").Return(true)
	mockEmitter.On("Trigger").Return("remote")
	mockEmitter.On("Write", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	mockEmitter.On("Logger", mock.Anything).Run(nil)

	// Create OTEL processor
	processor := &testProcessor{}
	provider := sdklog.NewLoggerProvider(
		sdklog.WithProcessor(processor),
	)
	defer provider.Shutdown(context.Background())

	// Create logger with both emitter and LoggerProvider
	logger, err := Logger(&Options{
		Level:          "debug",
		Emitters:       []emitter.Emitter{mockEmitter},
		LoggerProvider: provider,
	})
	require.NoError(t, err)

	// Log with trigger field (should go to both emitter and OTEL)
	logger.Info("test message", zap.String("remote", "true"))

	// Force sync and flush
	logger.Sync()
	provider.ForceFlush(context.Background())

	// Verify emitter received the log
	mockEmitter.AssertNumberOfCalls(t, "Write", 1)

	// Verify OTEL processor also received the log
	require.Greater(t, processor.count(), int32(0), "expected OTEL processor to capture logs alongside emitter")
}

func TestLoggerWithLoggerProviderInitialFields(t *testing.T) {
	t.Parallel()

	// Create test processor to capture logs
	processor := &testProcessor{}
	provider := sdklog.NewLoggerProvider(
		sdklog.WithProcessor(processor),
	)
	defer provider.Shutdown(context.Background())

	// Create logger with initial fields
	logger, err := Logger(&Options{
		Level: "debug",
		InitialFields: map[string]any{
			"service":     "test-service",
			"environment": "testing",
		},
		LoggerProvider: provider,
	})
	require.NoError(t, err)

	// Log a message
	logger.Info("test message with initial fields")

	// Force sync and flush
	logger.Sync()
	provider.ForceFlush(context.Background())

	// Verify log was captured
	require.Greater(t, processor.count(), int32(0), "expected OTEL processor to capture logs with initial fields")
}

func TestLoggerWithInvalidLevel(t *testing.T) {
	t.Parallel()

	_, err := Logger(&Options{
		Level: "invalid-level",
	})
	require.Error(t, err, "expected error for invalid log level")
}

func TestLoggerWithLoggerProviderNilProvider(t *testing.T) {
	t.Parallel()

	// Create logger with nil LoggerProvider (should work without OTEL core)
	logger, err := Logger(&Options{
		Level:          "debug",
		LoggerProvider: nil,
	})
	require.NoError(t, err)
	require.NotNil(t, logger)

	// Should be able to log without issues
	logger.Info("test message without OTEL")
}
