package consumer

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

type service struct {
	*Options
	mutex           *sync.RWMutex
	consumer        *kafka.Consumer
	wg              sync.WaitGroup
	ch              chan *kafka.Message
	run             bool
	done            chan (struct{})
	config          *kafka.ConfigMap
	ConsumerGroupId string

	run.ForwardCompatibility
}

type Options struct {
	Logger         *zap.Logger
	Handler        func(msg *kafka.Message) error
	Workers        int
	Topics         []string
	MetricsCounter *prometheus.CounterVec
	Config         map[string]interface{}
}

var _ run.Runnable = &service{}

func New(options *Options) (*service, error) {
	kafkaConfig := kafka.ConfigMap{}
	for key, value := range options.Config {
		kafkaConfig.SetKey(key, value)
	}
	bootstrapServers, _ := kafkaConfig.Get("bootstrap.servers", nil)
	if bootstrapServers == nil {
		return nil, errors.New("bootstrap.servers is required")
	}

	consumerGroupId, _ := kafkaConfig.Get("group.id", nil)
	if consumerGroupId == nil {
		return nil, errors.New("group.id is required")
	}

	options.Logger = options.Logger.Named("kafka/consumer").With(
		zap.String("service", "kafka"),
		zap.Any("bootstrap", bootstrapServers),
		zap.Any("consumer_group_id", consumerGroupId),
	)

	return &service{
		Options:         options,
		mutex:           &sync.RWMutex{},
		wg:              sync.WaitGroup{},
		ch:              make(chan *kafka.Message, options.Workers*2), // NOTE(frank): I don't know why I'm multiplying by 2. Buffered by the number of workers should be sufficient.
		run:             true,
		done:            make(chan struct{}),
		config:          &kafkaConfig,
		ConsumerGroupId: consumerGroupId.(string),
	}, nil
}

func (s *service) Name() string { return "kafka consumer" }

func (s *service) Fields() []slog.Attr {
	return []slog.Attr{
		slog.String("consumer_group_id", s.ConsumerGroupId),
		slog.String("topics", strings.Join(s.Topics, ",")),
	}
}

func (s *service) Run(context.Context) error {
	defer close(s.done)
	defer close(s.ch)

	c, err := kafka.NewConsumer(s.config)
	if err != nil {
		s.Logger.Error("failed to create consumer", zap.Error(err))
		return err
	}
	s.consumer = c

	if err := c.SubscribeTopics(s.Options.Topics, nil); err != nil {
		s.Logger.Error(
			fmt.Sprintf("failed to subscribe to topics: %v\n", err),
			zap.Error(err),
			zap.Strings("topics", s.Topics),
			zap.String("config:group.id", s.ConsumerGroupId),
		)
		return err
	}

	s.Logger.Info("subscribed to topics", zap.Strings("topics", s.Options.Topics))

	for i := 0; i < s.Workers; i++ {
		s.wg.Add(1)
		go func() {
			defer s.wg.Done()

			for msg := range s.ch {
				if err := s.Handler(msg); err != nil {
					s.Logger.Error("failed to handle kafka message", zap.Error(err))
					s.executeMetric(*msg.TopicPartition.Topic, "failed")
				}

				s.Logger.Debug("committing offset")

				// NOTE(frank): We're committing messages with errors so we don't deadlock the consumer.
				if _, err := s.consumer.CommitMessage(msg); err != nil {
					s.Logger.Error("failed to commit kafka message", zap.Error(err))
					s.executeMetric(*msg.TopicPartition.Topic, "failed")
				}

				s.executeMetric(*msg.TopicPartition.Topic, "succeeded")
			}
		}()
	}

	for s.run {
		msg, err := c.ReadMessage(time.Second)

		if err != nil && err.(kafka.Error).IsTimeout() {
			continue
		}

		if err != nil {
			s.Logger.Error("failed to consume kafka message", zap.Error(err))

			if err.(kafka.Error).IsFatal() {
				return err
			}

			switch err.(kafka.Error).Code() {
			case kafka.ErrGroupAuthorizationFailed:
				return err
			}

			continue
		}

		s.Logger.With(
			zap.String("topic", *msg.TopicPartition.Topic),
			zap.Int32("partition", msg.TopicPartition.Partition),
			zap.Int64("offset", int64(msg.TopicPartition.Offset)),
		).Debug("received kafka message")

		s.ch <- msg
	}

	return nil
}

func (s *service) Alive() bool {
	return s != nil && s.consumer != nil
}

func (s *service) Close(context.Context) error {
	// This will stop the consumer from reading new messages.
	s.run = false

	<-s.done

	// The workers commit messages so we need to wait
	// for them to finish before we close the consumer.
	s.wg.Wait()

	if s.consumer != nil {
		if err := s.consumer.Close(); err != nil {
			s.Logger.Error("failed to close kafka consumer", zap.Error(err))
		}
	}

	return nil
}

func (s *service) executeMetric(topic, label string) {
	if s.MetricsCounter != nil {
		counter, err := s.MetricsCounter.GetMetricWithLabelValues(label, topic)
		if err != nil {
			s.Logger.Error("failed to get metric", zap.Error(err))
		}
		counter.Add(1)
	}
}
