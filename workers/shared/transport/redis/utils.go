// Package redis provides common Redis transport utilities for workers.
package redis

import "fmt"

// StreamKeys generates Redis stream keys for the given plugins, group, bucket, and events.
// The format matches: agent.<group>.bucket.<bucket>.plugin.<plugin>.event.<event>
//
// Note: the dynamic bucket format only applies to execute events (non-execute events only generate streams with the 'BA' bucket)
func StreamKeys(plugins []string, workerGroup string, buckets []string, variants []string, events []string, includeStandardStreams bool) []string {
	updatedVariants := append([]string{}, variants...)
	if includeStandardStreams {
		updatedVariants = append(updatedVariants, "")
	}

	result := make([]string, 0)
	for _, pluginName := range plugins {
		for _, variant := range updatedVariants {
			for _, event := range events {
				if event == "execute" {
					for _, bucket := range buckets {
						result = append(result, buildStreamKey(workerGroup, bucket, variant, pluginName, event))
					}
				} else {
					result = append(result, buildStreamKey(workerGroup, "BA", variant, pluginName, event))
				}
			}
		}
	}

	return result
}

func buildStreamKey(workerGroup string, bucket string, variant string, pluginName string, event string) string {
	if variant != "" {
		return fmt.Sprintf("agent.%s.bucket.%s.%s.plugin.%s.event.%s", workerGroup, bucket, variant, pluginName, event)
	}
	return fmt.Sprintf("agent.%s.bucket.%s.plugin.%s.event.%s", workerGroup, bucket, pluginName, event)
}
