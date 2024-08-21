package producer

import (
	"context"
	"testing"
	"time"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	consumerfx "github.com/superblocksteam/agent/pkg/kafka/consumer/fx"
	"github.com/superblocksteam/run"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"
	"go.uber.org/zap"
)

func TestConsumer(t *testing.T) {
	ctx := context.Background()

	// setup
	topicName := "consumer.integration.test"
	bootstrap := "127.0.0.1:19092"
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{
		"bootstrap.servers": bootstrap,
	})
	require.NoError(t, err, "kafka admin client connect")
	_, err = admin.CreateTopics(ctx, []kafka.TopicSpecification{
		{
			Topic:             topicName,
			NumPartitions:     1,
			ReplicationFactor: 1,
		},
	})
	assert.NoError(t, err, "kafka admin create topic")

	producer, err := kafka.NewProducer(
		&kafka.ConfigMap{
			"bootstrap.servers": bootstrap,
		},
	)

	defer producer.Close()
	assert.NoError(t, err, "could not create kafka producer")

	err = producer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Partition: kafka.PartitionAny, Topic: &topicName},
		Value:          []byte("bar"),
		Key:            []byte("foo"),
		Timestamp:      time.Time{},
	}, nil)
	require.NoError(t, err)

	t.Run("test consume", func(t *testing.T) {
		c2 := make(chan *kafka.Message, 100)
		// Create a new fx application with the consumer module

		viper.Set("kafka.topics", topicName)
		viper.Set("kafka.consumer.workers", "1")
		viper.Set("kafka.enabled", "true")
		group := run.New()
		var consumer consumerfx.Consumer
		app := fxtest.New(
			t,
			fx.Provide(func() consumerfx.Config {
				return consumerfx.Config{
					"bootstrap.servers": bootstrap,
					"group.id":          "integration-test",
					"auto.offset.reset": "earliest",
				}
			}),
			fx.Provide(func() consumerfx.Handler {
				return func(msg *kafka.Message) error {
					c2 <- msg
					return nil
				}
			}),
			fx.Provide(func() *run.Group {
				return group
			}),
			fx.Provide(func() *zap.Logger {
				return zap.NewNop()
			}),
			consumerfx.Module,
			fx.Invoke(func(c consumerfx.Consumer) {
				consumer = c
			}),
		).RequireStart()

		defer app.Stop(ctx)

		go consumer.Run(ctx)
		defer consumer.Close(ctx)

		select {
		case msg := <-c2:
			assert.Equal(t, []byte("foo"), msg.Key)
			assert.Equal(t, []byte("bar"), msg.Value)
		case <-time.After(5 * time.Second):
			t.Fatal("time out")
		}
	})

}
