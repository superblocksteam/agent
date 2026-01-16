package health

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	r "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
	"google.golang.org/grpc/connectivity"
)

// MockRedisChecker is a mock implementation of RedisChecker
type MockRedisChecker struct {
	mock.Mock
}

func (m *MockRedisChecker) Ping(ctx context.Context) *r.StatusCmd {
	args := m.Called(ctx)
	return args.Get(0).(*r.StatusCmd)
}

// MockSandboxChecker is a mock implementation of SandboxChecker
type MockSandboxChecker struct {
	mock.Mock
}

func (m *MockSandboxChecker) ConnectionState() connectivity.State {
	args := m.Called()
	return args.Get(0).(connectivity.State)
}

func newTestChecker(redis RedisChecker, sandbox SandboxChecker, healthFilePath string) *Checker {
	logger, _ := zap.NewDevelopment()
	return NewChecker(&Options{
		Redis:          redis,
		Sandbox:        sandbox,
		Logger:         logger,
		PingTimeout:    5 * time.Second,
		HealthFilePath: healthFilePath,
		CheckInterval:  100 * time.Millisecond,
	})
}

func newHealthyRedisCmd() *r.StatusCmd {
	cmd := r.NewStatusCmd(context.Background())
	cmd.SetVal("PONG")
	return cmd
}

func newUnhealthyRedisCmd() *r.StatusCmd {
	cmd := r.NewStatusCmd(context.Background())
	cmd.SetErr(context.DeadlineExceeded)
	return cmd
}

func TestCheckRedis(t *testing.T) {
	tests := []struct {
		name        string
		redisCmd    *r.StatusCmd
		expectError bool
	}{
		{
			name:        "healthy redis returns no error",
			redisCmd:    newHealthyRedisCmd(),
			expectError: false,
		},
		{
			name:        "unhealthy redis returns error",
			redisCmd:    newUnhealthyRedisCmd(),
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRedis := new(MockRedisChecker)
			mockRedis.On("Ping", mock.Anything).Return(tt.redisCmd)

			checker := newTestChecker(mockRedis, nil, "/tmp/test_health")
			err := checker.checkRedis()

			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
			mockRedis.AssertExpectations(t)
		})
	}
}

func TestCheckSandbox(t *testing.T) {
	tests := []struct {
		name                 string
		sandboxState         connectivity.State
		sandboxEverConnected bool
		expectError          bool
	}{
		{
			name:                 "ready state is healthy",
			sandboxState:         connectivity.Ready,
			sandboxEverConnected: false,
			expectError:          false,
		},
		{
			name:                 "idle state is healthy",
			sandboxState:         connectivity.Idle,
			sandboxEverConnected: false,
			expectError:          false,
		},
		{
			name:                 "connecting state is healthy",
			sandboxState:         connectivity.Connecting,
			sandboxEverConnected: false,
			expectError:          false,
		},
		{
			name:                 "transient failure is healthy before first connection",
			sandboxState:         connectivity.TransientFailure,
			sandboxEverConnected: false,
			expectError:          false,
		},
		{
			name:                 "transient failure returns error after first connection",
			sandboxState:         connectivity.TransientFailure,
			sandboxEverConnected: true,
			expectError:          true,
		},
		{
			name:                 "shutdown returns error",
			sandboxState:         connectivity.Shutdown,
			sandboxEverConnected: false,
			expectError:          true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRedis := new(MockRedisChecker)
			mockSandbox := new(MockSandboxChecker)
			mockSandbox.On("ConnectionState").Return(tt.sandboxState)

			checker := newTestChecker(mockRedis, mockSandbox, "/tmp/test_health")
			checker.sandboxEverConnected = tt.sandboxEverConnected
			err := checker.checkSandbox()

			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
			mockSandbox.AssertExpectations(t)
		})
	}
}

func TestCheckSandbox_SetsEverConnectedOnReady(t *testing.T) {
	mockRedis := new(MockRedisChecker)
	mockSandbox := new(MockSandboxChecker)
	mockSandbox.On("ConnectionState").Return(connectivity.Ready)

	checker := newTestChecker(mockRedis, mockSandbox, "/tmp/test_health")
	assert.False(t, checker.sandboxEverConnected)

	err := checker.checkSandbox()
	assert.NoError(t, err)
	assert.True(t, checker.sandboxEverConnected, "sandboxEverConnected should be set to true after Ready state")
}

func TestCheckSandboxNil(t *testing.T) {
	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, nil, "/tmp/test_health")

	// nil sandbox should not return error
	err := checker.checkSandbox()
	assert.NoError(t, err)
}

func TestMarkHealthyAndUnhealthy(t *testing.T) {
	tmpDir := t.TempDir()
	healthFile := filepath.Join(tmpDir, "worker_healthy")

	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, nil, healthFile)

	// Initially file should not exist
	_, err := os.Stat(healthFile)
	assert.True(t, os.IsNotExist(err))

	// Mark healthy - file should be created
	err = checker.markHealthy()
	assert.NoError(t, err)
	_, err = os.Stat(healthFile)
	assert.NoError(t, err)

	// Mark unhealthy - file should be removed
	checker.markUnhealthy()
	_, err = os.Stat(healthFile)
	assert.True(t, os.IsNotExist(err))
}

func TestUpdateHealthFile(t *testing.T) {
	tests := []struct {
		name                 string
		redisHealthy         bool
		sandboxState         *connectivity.State
		sandboxEverConnected bool
		expectSandboxCalled  bool // Whether sandbox check should be called
		expectHealthy        bool
	}{
		{
			name:                 "healthy when redis and sandbox are healthy",
			redisHealthy:         true,
			sandboxState:         ptr(connectivity.Ready),
			sandboxEverConnected: false,
			expectSandboxCalled:  true,
			expectHealthy:        true,
		},
		{
			name:                 "unhealthy when redis fails",
			redisHealthy:         false,
			sandboxState:         nil, // Won't be checked since Redis fails first
			sandboxEverConnected: false,
			expectSandboxCalled:  false,
			expectHealthy:        false,
		},
		{
			name:                 "unhealthy when sandbox is shutdown",
			redisHealthy:         true,
			sandboxState:         ptr(connectivity.Shutdown),
			sandboxEverConnected: false,
			expectSandboxCalled:  true,
			expectHealthy:        false,
		},
		{
			name:                 "healthy when sandbox is nil",
			redisHealthy:         true,
			sandboxState:         nil,
			sandboxEverConnected: false,
			expectSandboxCalled:  false,
			expectHealthy:        true,
		},
		{
			name:                 "healthy when sandbox in transient failure before first connection",
			redisHealthy:         true,
			sandboxState:         ptr(connectivity.TransientFailure),
			sandboxEverConnected: false,
			expectSandboxCalled:  true,
			expectHealthy:        true,
		},
		{
			name:                 "unhealthy when sandbox in transient failure after first connection",
			redisHealthy:         true,
			sandboxState:         ptr(connectivity.TransientFailure),
			sandboxEverConnected: true,
			expectSandboxCalled:  true,
			expectHealthy:        false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpDir := t.TempDir()
			healthFile := filepath.Join(tmpDir, "worker_healthy")

			mockRedis := new(MockRedisChecker)
			if tt.redisHealthy {
				mockRedis.On("Ping", mock.Anything).Return(newHealthyRedisCmd())
			} else {
				mockRedis.On("Ping", mock.Anything).Return(newUnhealthyRedisCmd())
			}

			var mockSandbox *MockSandboxChecker
			if tt.sandboxState != nil && tt.expectSandboxCalled {
				mockSandbox = new(MockSandboxChecker)
				mockSandbox.On("ConnectionState").Return(*tt.sandboxState)
			}

			var checker *Checker
			if mockSandbox != nil {
				checker = newTestChecker(mockRedis, mockSandbox, healthFile)
			} else {
				checker = newTestChecker(mockRedis, nil, healthFile)
			}
			checker.sandboxEverConnected = tt.sandboxEverConnected

			checker.updateHealthFile()

			_, err := os.Stat(healthFile)
			if tt.expectHealthy {
				assert.NoError(t, err, "health file should exist")
			} else {
				assert.True(t, os.IsNotExist(err), "health file should not exist")
			}

			mockRedis.AssertExpectations(t)
			if mockSandbox != nil {
				mockSandbox.AssertExpectations(t)
			}
		})
	}
}

func TestNewChecker_Defaults(t *testing.T) {
	mockRedis := new(MockRedisChecker)
	logger, _ := zap.NewDevelopment()

	checker := NewChecker(&Options{
		Redis:  mockRedis,
		Logger: logger,
		// PingTimeout, HealthFilePath, CheckInterval not set - should use defaults
	})

	assert.Equal(t, 5*time.Second, checker.pingTimeout)
	assert.Equal(t, DefaultHealthFilePath, checker.healthFilePath)
	assert.Equal(t, 5*time.Second, checker.checkInterval)
}

func TestCheckerName(t *testing.T) {
	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, nil, "/tmp/test_health")

	assert.Equal(t, "healthChecker", checker.Name())
}

func TestCheckerAlive(t *testing.T) {
	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, nil, "/tmp/test_health")

	assert.True(t, checker.Alive())
}

func TestCheckerClose(t *testing.T) {
	tmpDir := t.TempDir()
	healthFile := filepath.Join(tmpDir, "worker_healthy")

	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, nil, healthFile)

	// Create health file first
	err := checker.markHealthy()
	assert.NoError(t, err)

	// Close should remove health file
	err = checker.Close(context.Background())
	assert.NoError(t, err)

	_, err = os.Stat(healthFile)
	assert.True(t, os.IsNotExist(err))
}

func ptr[T any](v T) *T { return &v }
