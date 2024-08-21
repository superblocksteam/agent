package kafka

import (
	"bytes"
	"context"
	"errors"

	kafka "github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/golang/protobuf/jsonpb"
	"go.uber.org/zap"

	"github.com/superblocksteam/agent/internal/syncer"
	kafkav1 "github.com/superblocksteam/agent/types/gen/go/kafka/v1"
)

var (
	errUnknownEvent = errors.New("unknown integration metadata event")
)

func Dispatcher(syncer syncer.Service, logger *zap.Logger) func(msg *kafka.Message) error {
	return func(msg *kafka.Message) error {
		logger = logger.With(
			zap.String("topic", *msg.TopicPartition.Topic),
			zap.Int32("partition", msg.TopicPartition.Partition),
			zap.Int64("offset", int64(msg.TopicPartition.Offset)),
		)

		var event kafkav1.IntegrationMetadataEvent
		{
			if err := jsonpb.Unmarshal(bytes.NewReader(msg.Value), &event); err != nil {
				logger.Error("message was not of the right type", zap.Error(err))
				return err
			}
		}

		switch e := event.Event.(type) {
		case *kafkav1.IntegrationMetadataEvent_Upsert_:
			if err := syncer.SyncConfiguration(
				context.Background(),
				e.Upsert.GetConfigurationId(),
				e.Upsert.GetIntegrationId(),
				e.Upsert.GetIntegrationType(),
				e.Upsert.GetOrganizationId(),
				e.Upsert.GetDatasourceConfiguration(),
			); err != nil {
				logger.Error("failed to sync configuration", zap.Error(err))
				return err
			}
		default:
			logger.Error(errUnknownEvent.Error())
			return errUnknownEvent
		}

		return nil
	}
}
