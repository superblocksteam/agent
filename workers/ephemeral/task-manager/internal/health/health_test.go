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
)

// MockRedisChecker is a mock implementation of RedisChecker
type MockRedisChecker struct {
	mock.Mock
}

func (m *MockRedisChecker) Ping(ctx context.Context) *r.StatusCmd {
	args := m.Called(ctx)
	return args.Get(0).(*r.StatusCmd)
}

func newTestChecker(redis RedisChecker, healthFilePath string) *Checker {
	logger, _ := zap.NewDevelopment()
	return NewChecker(&Options{
		Redis:          redis,
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

			checker := newTestChecker(mockRedis, "/tmp/test_health")
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

func TestMarkHealthyAndUnhealthy(t *testing.T) {
	tmpDir := t.TempDir()
	healthFile := filepath.Join(tmpDir, "worker_healthy")

	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, healthFile)

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
		name          string
		redisHealthy  bool
		expectHealthy bool
	}{
		{
			name:          "healthy when redis is healthy",
			redisHealthy:  true,
			expectHealthy: true,
		},
		{
			name:          "unhealthy when redis fails",
			redisHealthy:  false,
			expectHealthy: false,
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

			checker := newTestChecker(mockRedis, healthFile)
			checker.updateHealthFile()

			_, err := os.Stat(healthFile)
			if tt.expectHealthy {
				assert.NoError(t, err, "health file should exist")
			} else {
				assert.True(t, os.IsNotExist(err), "health file should not exist")
			}

			mockRedis.AssertExpectations(t)
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
	checker := newTestChecker(mockRedis, "/tmp/test_health")

	assert.Equal(t, "healthChecker", checker.Name())
}

func TestCheckerAlive(t *testing.T) {
	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, "/tmp/test_health")

	assert.True(t, checker.Alive())
}

func TestCheckerClose(t *testing.T) {
	tmpDir := t.TempDir()
	healthFile := filepath.Join(tmpDir, "worker_healthy")

	mockRedis := new(MockRedisChecker)
	checker := newTestChecker(mockRedis, healthFile)

	// Create health file first
	err := checker.markHealthy()
	assert.NoError(t, err)

	// Close should remove health file
	err = checker.Close(context.Background())
	assert.NoError(t, err)

	_, err = os.Stat(healthFile)
	assert.True(t, os.IsNotExist(err))
}
