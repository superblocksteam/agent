package utils

import (
	redis "github.com/redis/go-redis/v9"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

func PoolStats(stats *redis.PoolStats) *commonv1.Pool {
	return &commonv1.Pool{
		Hits:     Pointer(stats.Hits),
		Misses:   Pointer(stats.Misses),
		Timeouts: Pointer(stats.Timeouts),
		Total:    Pointer(stats.TotalConns),
		Idle:     Pointer(stats.IdleConns),
		Stale:    Pointer(stats.StaleConns),
	}
}
