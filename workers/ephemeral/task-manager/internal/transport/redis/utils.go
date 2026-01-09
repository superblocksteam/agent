package redis

import (
	"fmt"

	sharedredis "workers/shared/transport/redis"

	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

// StreamKeys re-exports the shared StreamKeys function for backward compatibility.
var StreamKeys = sharedredis.StreamKeys

// ComputeAllowedKeys computes the list of Redis keys that the sandbox is allowed to request.
// This includes:
// - Binding keys (context.global.* and context.output.*)
// - Variable keys from props.Variables (all types that have keys)
func ComputeAllowedKeys(executionID string, props *transportv1.Request_Data_Data_Props) []string {
	var keys []string

	// Add binding keys (globals and outputs from previous steps)
	for _, binding := range props.GetBindingKeys() {
		keyType := binding.GetType()
		keyValue := binding.GetKey()

		var redisKey string
		switch keyType {
		case "global":
			redisKey = fmt.Sprintf("%s.context.global.%s", executionID, keyValue)
		case "output":
			redisKey = fmt.Sprintf("%s.context.output.%s", executionID, keyValue)
		default:
			continue
		}
		keys = append(keys, redisKey)
	}

	// Add variable keys - the sandbox may need to read any variable type
	// Variable types (from apiv1.Variables_Type):
	// - TYPE_SIMPLE = 1
	// - TYPE_ADVANCED = 2
	// - TYPE_NATIVE = 3
	// - TYPE_FILEPICKER = 4
	// All of these can have keys that the sandbox needs to access
	for _, variable := range props.GetVariables() {
		if variable == nil {
			continue
		}
		if key := variable.GetKey(); key != "" {
			keys = append(keys, key)
		}
	}

	return keys
}
