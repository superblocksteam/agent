package consumerfx

import (
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/kafka/consumer"
	"github.com/superblocksteam/run"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

var Module = fx.Module("kafka/consumer",
	fx.Provide(
		New,
		ProvideOptions,
	),
)

type Consumer interface {
	run.Runnable
}

// This is not standard fx pattern. This is a custom way of passing this
// required argument into the existing kafka.New Options as it must be passed
// in from a caller.
type Handler func(msg *kafka.Message) error

type Config map[string]interface{}

func init() {
	//
	// defaults are for local dev; production must set specific details
	// in the deployment config
	//
	pflag.String("kafka.auto.offset.reset", "earliest", "behavior when offsets are reset (earliest or latest)")
	pflag.String("kafka.bootstrap", "localhost:19092", "bootstrap host:port for kafka")
	pflag.String("kafka.consumer.group.id", "local", "kafka consumer group id")
	pflag.Int("kafka.consumer.workers", 1, "number of workers to run")
	pflag.Bool("kafka.enabled", true, "run kafka consumer or not")
	pflag.String("kafka.sasl.password", "", "kafka password")
	pflag.String("kafka.sasl.username", "", "kafka username")
	pflag.StringSlice("kafka.topics", []string{}, "kafka topics to consume")
}

func ProvideOptions(logger *zap.Logger, config Config, handler Handler) *consumer.Options {
	metrics.RegisterMetrics() // binary/package global, basically sync.Once executed

	options := &consumer.Options{
		Handler:        handler,
		Logger:         logger,
		MetricsCounter: metrics.KafkaConsumedMessagesTotal,
		Topics:         viper.GetStringSlice("kafka.topics"),
		Workers:        viper.GetInt("kafka.consumer.workers"),
		Config:         config,
	}

	return options
}

func New(g *run.Group, options *consumer.Options) (Consumer, error) {
	client, err := consumer.New(options)
	if err != nil {
		return nil, err
	}

	g.Add(viper.GetBool("kafka.enabled"), client)

	return client, nil
}
