package kafka

import (
	"context"
	"errors"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

// Produce is a higher level helper function that produces all messages in a single transaction.
// Here is an example of how to use this with `Client.Producer`:
//
//	    client.Producer(func(producer *kafka.Producer) error {
//		    return Produce(ctx, producer, message_one, message_two)
//	    }, func(config *kafka.ConfigMap) {
//		    config.SetKey("transactional.id", id.String())
//	    })
//
// If you do not wish to use transactions, you should use the raw producer directly.
func Produce(ctx context.Context, producer *kafka.Producer, messages ...*kafka.Message) error {

	if len(messages) == 0 {
		return nil
	}

	if len(messages) == 1 {
		return producer.Produce(messages[0], nil)
	}

	// use transaction (2+ messages)
	if err := producer.InitTransactions(ctx); err != nil {
		// We could retry if `err.(kafka.Error).IsRetriable()` is true.
		return err
	}

	if err := producer.BeginTransaction(); err != nil {
		return err
	}

	for _, msg := range messages {

		// TODO(frank): I don't quite understand if we need to wire up delivery reports.
		// I thought we get this for free by using transactions but that may not be the case.
		if pErr := producer.Produce(msg, nil); pErr != nil {
			if aErr := producer.AbortTransaction(ctx); aErr != nil {
				return errors.Join(pErr, aErr)
			}
			return pErr
		}
	}

	if cErr := producer.CommitTransaction(ctx); cErr != nil {
		if cErr.(kafka.Error).TxnRequiresAbort() {
			if aErr := producer.AbortTransaction(ctx); aErr != nil {
				return errors.Join(cErr, aErr)
			}
		}
		return cErr
	}

	return nil

}

type ConnectionOptions struct {
	Bootstrap string
	Username  string
	Password  string
}

func BuildKafkaConfig(opts *ConnectionOptions, config *kafka.ConfigMap) *kafka.ConfigMap {
	if config == nil {
		config = &kafka.ConfigMap{}
	}
	config.SetKey("bootstrap.servers", opts.Bootstrap)

	if opts.Username != "" || opts.Password != "" {
		config.SetKey("security.protocol", "SASL_SSL")
		config.SetKey("sasl.mechanisms", "PLAIN")
		config.SetKey("sasl.username", opts.Username)
		config.SetKey("sasl.password", opts.Password)
	}

	return config
}
