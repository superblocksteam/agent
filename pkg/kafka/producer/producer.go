package producer

import (
	"context"
	"errors"
	"sync"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

type Client interface {
	GetProducer() (*kafka.Producer, error)
	ValidateConnection() bool

	run.Runnable
}

type service struct {
	*Options
	mutex    *sync.RWMutex
	producer *kafka.Producer
	wg       sync.WaitGroup
	run      bool
	done     chan (struct{})
	config   *kafka.ConfigMap

	run.ForwardCompatibility
}

type Options struct {
	Config map[string]interface{}
	Logger *zap.Logger
}

func New(options *Options) (Client, error) {
	kafkaConfig := kafka.ConfigMap{}
	for key, value := range options.Config {
		kafkaConfig.SetKey(key, value)
	}
	bootstrapServers, _ := kafkaConfig.Get("bootstrap.servers", nil)
	if bootstrapServers == nil {
		return nil, errors.New("bootstrap.servers is required")
	}

	options.Logger = options.Logger.With(
		zap.String("service", "kafka"),
		zap.Any("bootstrap", bootstrapServers),
	)

	return &service{
		Options: options,
		mutex:   &sync.RWMutex{},
		wg:      sync.WaitGroup{},
		run:     true,
		done:    make(chan struct{}),
		config:  &kafkaConfig,
	}, nil
}

func (s *service) GetProducer() (*kafka.Producer, error) {
	if s.producer != nil {
		return s.producer, nil
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	p, err := kafka.NewProducer(s.config)
	if err != nil {
		return nil, err
	}
	s.producer = p
	if ok := s.ValidateConnection(); !ok {
		s.Logger.Error("unable to validate connection")
	}
	return s.producer, nil
}

// returns a boolean of whether or not we were able to validate the producer's connection
func (s *service) ValidateConnection() bool {
	if s.producer == nil {
		return false
	}
	// NOTE: (joey) right now we timeout after 1 second. this can be adjusted (or hoisted) as needed in the future
	metadata, err := s.producer.GetMetadata(nil, true, 1000)
	return err == nil && metadata != nil
}

func (s *service) Name() string { return "kafka producer" }

func (s *service) Run(context.Context) error {
	_, err := s.GetProducer()
	if err != nil {
		s.Logger.Error("failed to create producer", zap.Error(err))
		return err
	}

	<-s.done

	return nil
}

func (s *service) Alive() bool {
	return s != nil && s.producer != nil
}

func (s *service) Close(context.Context) error {
	s.done <- struct{}{}
	close(s.done)

	if s.producer != nil {
		s.producer.Close()
	}

	return nil
}
