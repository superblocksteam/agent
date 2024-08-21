package kafka

import (
	"testing"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/stretchr/testify/assert"
)

func TestBuildKafkaConfig(t *testing.T) {
	for _, tt := range []struct {
		name              string
		connectionOptions *ConnectionOptions
		config            *kafka.ConfigMap
		expectedConfig    *kafka.ConfigMap
	}{
		{
			name: "with config, username, password",
			connectionOptions: &ConnectionOptions{
				Bootstrap: "bootstrap",
				Username:  "username",
				Password:  "password",
			},
			config: &kafka.ConfigMap{
				"group.id":           "cgid",
				"enable.auto.commit": true,
			},
			expectedConfig: &kafka.ConfigMap{
				"bootstrap.servers":  "bootstrap",
				"group.id":           "cgid",
				"enable.auto.commit": true,
				"security.protocol":  "SASL_SSL",
				"sasl.mechanisms":    "PLAIN",
				"sasl.username":      "username",
				"sasl.password":      "password",
			},
		},
		{
			name: "without config. with username, password",
			connectionOptions: &ConnectionOptions{
				Bootstrap: "bootstrap",
				Username:  "username",
				Password:  "password",
			},
			expectedConfig: &kafka.ConfigMap{
				"bootstrap.servers": "bootstrap",
				"security.protocol": "SASL_SSL",
				"sasl.mechanisms":   "PLAIN",
				"sasl.username":     "username",
				"sasl.password":     "password",
			},
		},
		{
			name: "without username. with password",
			connectionOptions: &ConnectionOptions{
				Bootstrap: "bootstrap",
				Password:  "password",
			},
			expectedConfig: &kafka.ConfigMap{
				"bootstrap.servers": "bootstrap",
				"security.protocol": "SASL_SSL",
				"sasl.mechanisms":   "PLAIN",
				"sasl.username":     "",
				"sasl.password":     "password",
			},
		},
		{
			name: "without password. with username",
			connectionOptions: &ConnectionOptions{
				Bootstrap: "bootstrap",
				Username:  "username",
			},
			expectedConfig: &kafka.ConfigMap{
				"bootstrap.servers": "bootstrap",
				"security.protocol": "SASL_SSL",
				"sasl.mechanisms":   "PLAIN",
				"sasl.username":     "username",
				"sasl.password":     "",
			},
		},
		{
			name: "without username, password",
			connectionOptions: &ConnectionOptions{
				Bootstrap: "bootstrap",
			},
			expectedConfig: &kafka.ConfigMap{
				"bootstrap.servers": "bootstrap",
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			config := BuildKafkaConfig(tt.connectionOptions, tt.config)
			assert.Equal(t, tt.expectedConfig, config)
		})
	}
}
