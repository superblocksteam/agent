package redis

import (
	"encoding/json"
	"errors"
	"io"
	"math"
	"os"
	"sort"
)

const (
	noEstimateSentinel uint32 = 0
)

type Config struct {
	Analysis string    `json:"analysis"`
	Error    string    `json:"error"`
	Buckets  []*Bucket `json:"custom"`
}

type Bucket struct {
	Label        string   `json:"label"`
	Integrations []string `json:"integrations"`
	Bound        uint32   `json:"bound"`
}

type buckets struct {
	analysis string
	err      string
	registry map[string][]*Bucket
}

type Buckets interface {
	Register(...*Bucket) error
	Assign(string, *uint32) string
}

func BucketsFromConfig(location string) (Buckets, error) {
	file, err := os.Open(location)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	return load(data)
}

func load(data []byte) (Buckets, error) {
	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return NewBuckets(&config)
}

func NewBuckets(config *Config) (Buckets, error) {
	if config == nil {
		return nil, errors.New("buckets config must be provided")
	}

	if config.Analysis == "" {
		return nil, errors.New("the analysis bucket must be provided")
	}

	b := &buckets{
		analysis: config.Analysis,
		err:      config.Error,
		registry: map[string][]*Bucket{},
	}

	if err := b.Register(config.Buckets...); err != nil {
		return nil, err
	}

	return b, nil
}

func (b *buckets) Assign(pluginName string, e *uint32) string {
	if e == nil || *e == noEstimateSentinel {
		return b.analysis
	}

	if *e == math.MaxUint32 {
		if b.err == "" {
			return b.analysis
		}

		return b.err
	}

	batch, ok := b.registry[pluginName]
	if !ok {
		// No bucket has been explicitly registered for this plugin.
		// Using the default.
		return b.analysis
	}

	for _, bucket := range batch {
		if *e <= bucket.Bound {
			return bucket.Label
		}
	}

	// No bucket with an unbounded bound has been set.
	return b.analysis
}

func (b *buckets) Register(x ...*Bucket) error {
	for _, bucket := range x {
		if err := b.register(bucket); err != nil {
			return err
		}
	}

	return nil
}

func (b *buckets) register(x *Bucket) error {
	if x == nil {
		return errors.New("bucket must be defined")
	}

	if x.Integrations == nil || len(x.Integrations) == 0 {
		return errors.New("bucket must be assigned to a list of integrations")
	}

	for _, integration := range x.Integrations {
		if _, ok := b.registry[integration]; !ok {
			b.registry[integration] = []*Bucket{}
		}

		// I'm lazy
		b.registry[integration] = append(b.registry[integration], x)
		sort.SliceStable(b.registry[integration], func(i, j int) bool {
			return b.registry[integration][i].Bound < b.registry[integration][j].Bound
		})
	}

	return nil
}
