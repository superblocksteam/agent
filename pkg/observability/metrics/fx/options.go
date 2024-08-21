package metricsfx

import "github.com/prometheus/client_golang/prometheus"

type options struct {
	Addr     string
	Port     int
	Registry prometheus.Registerer
	Gatherer prometheus.Gatherer
}

type Option func(*options)

func WithAddr(addr string) Option {
	return func(o *options) {
		o.Addr = addr
	}
}

func WithPort(port int) Option {
	return func(o *options) {
		o.Port = port
	}
}

func WithRegistry(registry prometheus.Registerer) Option {
	return func(o *options) {
		o.Registry = registry
	}
}

func WithGatherer(gatherer prometheus.Gatherer) Option {
	return func(o *options) {
		o.Gatherer = gatherer
	}
}
