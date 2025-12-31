package health

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	r "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
	"google.golang.org/grpc/connectivity"
)

// DefaultHealthFilePath is the default path for the health file used by Kubernetes probes
const DefaultHealthFilePath = "/tmp/worker_healthy"

// RedisChecker is an interface for checking Redis connectivity
type RedisChecker interface {
	Ping(ctx context.Context) *r.StatusCmd
}

// SandboxChecker is an interface for checking sandbox gRPC connectivity
type SandboxChecker interface {
	ConnectionState() connectivity.State
}

// Checker provides file-based health checks for Kubernetes probes
type Checker struct {
	redis          RedisChecker
	sandbox        SandboxChecker
	logger         *zap.Logger
	pingTimeout    time.Duration
	healthFilePath string
	checkInterval  time.Duration
}

var _ run.Runnable = &Checker{}

// Options for creating a health Checker
type Options struct {
	Redis          RedisChecker
	Sandbox        SandboxChecker
	Logger         *zap.Logger
	PingTimeout    time.Duration
	HealthFilePath string        // Path for the health file (default: /tmp/worker_healthy)
	CheckInterval  time.Duration // Interval for health checks (default: 5s)
}

// NewChecker creates a new health checker
func NewChecker(opts *Options) *Checker {
	pingTimeout := opts.PingTimeout
	if pingTimeout == 0 {
		pingTimeout = 5 * time.Second
	}

	healthFilePath := opts.HealthFilePath
	if healthFilePath == "" {
		healthFilePath = DefaultHealthFilePath
	}

	checkInterval := opts.CheckInterval
	if checkInterval == 0 {
		checkInterval = 5 * time.Second
	}

	return &Checker{
		redis:          opts.Redis,
		sandbox:        opts.Sandbox,
		logger:         opts.Logger,
		pingTimeout:    pingTimeout,
		healthFilePath: healthFilePath,
		checkInterval:  checkInterval,
	}
}

// checkRedis checks if Redis is reachable
func (c *Checker) checkRedis() error {
	ctx, cancel := context.WithTimeout(context.Background(), c.pingTimeout)
	defer cancel()

	if err := c.redis.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis ping failed: %w", err)
	}
	return nil
}

// checkSandbox checks if the sandbox gRPC connection is alive
func (c *Checker) checkSandbox() error {
	if c.sandbox == nil {
		return nil
	}

	state := c.sandbox.ConnectionState()
	switch state {
	case connectivity.Ready, connectivity.Idle:
		// Considered healthy
		return nil
	case connectivity.Connecting:
		// Still connecting, consider it healthy during startup
		return nil
	case connectivity.TransientFailure:
		return fmt.Errorf("sandbox connection in transient failure: %s", state.String())
	case connectivity.Shutdown:
		return fmt.Errorf("sandbox connection shutdown: %s", state.String())
	default:
		return fmt.Errorf("unexpected sandbox connection state marking unhealthy: %s", state.String())
	}
}

// markHealthy creates the health file to indicate the worker is healthy
func (c *Checker) markHealthy() error {
	file, err := os.Create(c.healthFilePath)
	if err != nil {
		return fmt.Errorf("failed to create health file: %w", err)
	}
	return file.Close()
}

// markUnhealthy removes the health file to indicate the worker is unhealthy
func (c *Checker) markUnhealthy() {
	if err := os.Remove(c.healthFilePath); err != nil && !os.IsNotExist(err) {
		c.logger.Warn("failed to remove health file", zap.Error(err))
	}
}

// updateHealthFile checks health and creates/removes the health file accordingly
func (c *Checker) updateHealthFile() {
	if err := c.checkRedis(); err != nil {
		c.logger.Error("redis check failed, marking unhealthy", zap.Error(err))
		c.markUnhealthy()
		return
	}
	if err := c.checkSandbox(); err != nil {
		c.logger.Error("sandbox check failed, marking unhealthy", zap.Error(err))
		c.markUnhealthy()
		return
	}

	if err := c.markHealthy(); err != nil {
		c.logger.Error("failed to mark healthy", zap.Error(err))
	}
}

// Run implements run.Runnable
func (c *Checker) Run(ctx context.Context) error {
	c.logger.Info("starting health checker", zap.String("healthFile", c.healthFilePath))

	ticker := time.NewTicker(c.checkInterval)
	defer ticker.Stop()

	// Initial health check
	c.updateHealthFile()

	for {
		select {
		case <-ctx.Done():
			// Clean up health file on shutdown
			c.markUnhealthy()
			return nil
		case <-ticker.C:
			c.updateHealthFile()
		}
	}
}

// Close implements run.Runnable
func (c *Checker) Close(ctx context.Context) error {
	c.logger.Info("shutting down health checker")
	c.markUnhealthy()
	return nil
}

// Name implements run.Runnable
func (c *Checker) Name() string {
	return "healthChecker"
}

// Alive implements run.Runnable
func (c *Checker) Alive() bool {
	return true
}

// Fields implements run.Runnable
func (c *Checker) Fields() []slog.Attr {
	return []slog.Attr{}
}
