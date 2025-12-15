package redis

import (
	sharedredis "workers/shared/transport/redis"
)

// StreamKeys re-exports the shared StreamKeys function for backward compatibility.
var StreamKeys = sharedredis.StreamKeys
