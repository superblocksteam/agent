package redis

import "fmt"

func StreamKeys(plugins []string, workerGroup string, bucket string, events []string) []string {
	result := make([]string, 0)

	for _, pluginName := range plugins {
		for _, event := range events {
			result = append(result, fmt.Sprintf("agent.%s.bucket.%s.plugin.%s.event.%s", workerGroup, bucket, pluginName, event))
		}
	}

	return result
}
