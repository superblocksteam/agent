// Package redis provides common Redis transport utilities for workers.
package redis

import "fmt"

// StreamKeys generates Redis stream keys for the given plugins, group, bucket, and events.
// The format matches: agent.<group>.bucket.<bucket>.plugin.<plugin>.event.<event>
func StreamKeys(plugins []string, workerGroup string, bucket string, events []string, isEphemeral bool) []string {
	result := make([]string, 0)
	for _, pluginName := range plugins {
		for _, event := range events {
			result = append(result, buildStreamKey(workerGroup, bucket, pluginName, event, isEphemeral))
		}
	}

	return result
}

func buildStreamKey(workerGroup string, bucket string, pluginName string, event string, isEphemeral bool) string {
	streamFmtStr := "agent.%s.bucket.%s.plugin.%s.event.%s"
	if isEphemeral {
		streamFmtStr = "agent.%s.bucket.%s.ephemeral.plugin.%s.event.%s"
	}
	return fmt.Sprintf(streamFmtStr, workerGroup, bucket, pluginName, event)
}
