package producer

import (
	"context"
	"testing"
	"time"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	sharedkafka "github.com/superblocksteam/agent/pkg/kafka"
	orchProducer "github.com/superblocksteam/agent/pkg/kafka/producer"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestProducer(t *testing.T) {
	ctx := context.Background()

	// setup
	topicName := "producer.integration.test"
	bootstrap := "127.0.0.1:19092"
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{
		"bootstrap.servers": bootstrap,
	})
	assert.NoError(t, err, "kafka admin client connect")
	_, err = admin.CreateTopics(ctx, []kafka.TopicSpecification{
		{
			Topic:             topicName,
			NumPartitions:     1,
			ReplicationFactor: 1,
		},
	})
	assert.NoError(t, err, "kafka admin create topic")

	consumer, err := kafka.NewConsumer(
		&kafka.ConfigMap{
			"bootstrap.servers": bootstrap,
			"group.id":          "integration-test",
			"auto.offset.reset": "earliest",
		},
	)
	defer consumer.Close()
	assert.NoError(t, err, "could not create kafka consumer")
	err = consumer.SubscribeTopics([]string{topicName}, nil)
	assert.NoError(t, err, "could not subscribe to topics")

	logger := zap.NewNop()

	for _, tc := range []struct {
		name                     string
		connectionOptions        *sharedkafka.ConnectionOptions
		expectAlive              bool
		expectValidateConnection bool
		expectErrorOnProduce     bool
		expectErrorOnConsume     bool
	}{
		{
			name:                     "happy path",
			connectionOptions:        &sharedkafka.ConnectionOptions{Bootstrap: bootstrap},
			expectAlive:              true,
			expectValidateConnection: true,
		},
		{
			name:                     "invalid bootstrap",
			connectionOptions:        &sharedkafka.ConnectionOptions{Bootstrap: "im a bad bootstrap lol"},
			expectAlive:              true, // TODO: (joey) make this be false without breaking production
			expectValidateConnection: false,
			expectErrorOnProduce:     false, // TODO: (joey) make this be true without breaking production
			expectErrorOnConsume:     true,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			// test create new client
			client, err := orchProducer.New(&orchProducer.Options{
				Config: map[string]interface{}{
					"bootstrap.servers": tc.connectionOptions.Bootstrap,
				},
				Logger: logger,
			})

			assert.NoError(t, err)

			// validate connection before get producer (should always be false)
			assert.False(t, client.ValidateConnection())

			// test get producer
			producer, err := client.GetProducer()
			assert.NoError(t, err)

			// call it a second time for that sweet line coverage
			producer, err = client.GetProducer()
			assert.NoError(t, err)

			// test name
			assert.Equal(t, "kafka producer", client.Name())

			// test alive
			assert.Equal(t, tc.expectAlive, client.Alive())

			// test validate connection
			assert.Equal(t, tc.expectValidateConnection, client.ValidateConnection())

			// test producing a message
			err = sharedkafka.Produce(ctx, producer, &kafka.Message{
				TopicPartition: kafka.TopicPartition{Partition: kafka.PartitionAny, Topic: &topicName},
				Key:            []byte("foo"),
				Value:          []byte("bar"),
			})

			if tc.expectErrorOnProduce {
				assert.Error(t, err)
				return
			}
			assert.NoError(t, err)
			msg, err := consumer.ReadMessage(5 * time.Second)
			if tc.expectErrorOnConsume {
				assert.Error(t, err)
				return
			}
			assert.NotNil(t, msg)
			assert.Equal(t, "foo", string(msg.Key))
			assert.Equal(t, "bar", string(msg.Value))
		})
	}

}
