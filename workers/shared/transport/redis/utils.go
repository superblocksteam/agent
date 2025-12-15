// Package redis provides common Redis transport utilities for workers.
package redis

import "fmt"

// StreamKeys generates Redis stream keys for the given plugins, group, bucket, and events.
// The format matches: agent.<group>.bucket.<bucket>.plugin.<plugin>.event.<event>
func StreamKeys(plugins []string, workerGroup string, bucket string, events []string) []string {
	result := make([]string, 0)

	for _, pluginName := range plugins {
		for _, event := range events {
			result = append(result, fmt.Sprintf("agent.%s.bucket.%s.plugin.%s.event.%s", workerGroup, bucket, pluginName, event))
		}
	}

	return result
}
