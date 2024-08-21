package run

import (
	"context"
	"fmt"
	"log/slog"

	redis "github.com/redis/go-redis/v9"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

type redisRunnable struct {
	name   string
	client *redis.Client
	logger *zap.Logger
	done   chan struct{}

	run.ForwardCompatibility
}

func Redis(name string, client *redis.Client, logger *zap.Logger) run.Runnable {
	return &redisRunnable{
		name:   name,
		client: client,
		logger: logger.With(
			zap.String("redis.addr", client.Options().Addr),
		),
		done: make(chan struct{}),
	}
}

func (r *redisRunnable) Run(context.Context) error {
	if err := r.client.Ping(context.Background()).Err(); err != nil {
		return err
	}

	<-r.done

	return nil
}

func (r *redisRunnable) Fields() []slog.Attr {
	stats := r.client.PoolStats()
	options := r.client.Options()

	return []slog.Attr{
		slog.Int("pool.connections.max", int(stats.TotalConns)),
		slog.String("address", options.Addr),
	}
}

func (r *redisRunnable) Alive() bool {
	if r.client == nil {
		return false
	}

	return r.client.Ping(context.Background()).Err() == nil
}

func (r *redisRunnable) Name() string {
	return r.name + " redis client"
}

func (r *redisRunnable) Close(context.Context) error {
	close(r.done)

	if r.client != nil {
		if err := r.client.Close(); err != nil {
			r.logger.Error(fmt.Sprintf("could not close %s redis connection", r.name))
			return err
		}
	}

	return nil
}
