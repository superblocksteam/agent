// Package redis provides common Redis transport utilities for workers.
package redis

import "fmt"

// StreamKeys generates Redis stream keys for the given plugins, group, bucket, and events.
// The format matches: agent.<group>.bucket.<bucket>.plugin.<plugin>.event.<event>
//
// Note: the dynamic bucket format only applies to execute events (non-execute events only generate streams with the 'BA' bucket)
func StreamKeys(plugins []string, workerGroup string, buckets []string, events []string, isEphemeral bool) []string {
	result := make([]string, 0)
	for _, pluginName := range plugins {
		for _, event := range events {
			if event == "execute" {
				for _, bucket := range buckets {
					result = append(result, buildStreamKey(workerGroup, bucket, pluginName, event, isEphemeral))
				}
			} else {
				result = append(result, buildStreamKey(workerGroup, "BA", pluginName, event, isEphemeral))
			}
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
