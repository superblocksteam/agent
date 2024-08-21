package log

import (
	"fmt"
	"os"
	"sync"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/emitter/mocks"
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
