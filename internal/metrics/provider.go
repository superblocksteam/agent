/**
 * Metrics provider implementation.
 *
 * Implements the OTEL metrics provider with:
 * - Prometheus exporter for /metrics endpoint (pull-based)
 * - Optional OTLP HTTP exporter for OTEL collector (push-based)
 */

package metrics

import (
	"context"
	"fmt"
	"net/url"
	"strings"

	"github.com/prometheus/client_golang/prometheus"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	otelprom "go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
)

// Namespace is the prefix for OTEL metrics.
const Namespace = "orchestrator"

// Histogram bucket configurations matching the original Prometheus buckets.
var (
	BigBuckets = []float64{
		10000, 12000, 15000, 20000, 30000, 40000, 60000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 3000000,
		4000000, 5000000, 7000000, 10000000, 20000000, 30000000, 60000000, 80000000, 100000000, 120000000, 600000000,
	}

	SmallBuckets = []float64{
		1000, 2000, 3000, 4000, 6000, 8000, 10000, 15000, 20000, 50000, 100000, 200000, 400000, 600000, 800000, 1000000, 1500000, 2000000,
		3000000, 4000000, 5000000, 7000000, 10000000, 20000000,
	}

	SizeBuckets = []float64{
		5000, 10000, 15000, 50000, 100000, 200000, 300000, 400000, 500000, 600000, 800000, 1000000, 2000000, 4000000, 6000000, 10000000, 15000000,
		20000000, 50000000, 100000000, 500000000,
	}

	PercentageBuckets = []float64{5, 7, 10, 15, 20, 25, 32, 40, 50, 60, 75, 100, 150, 200, 250, 400}
)

// ProviderOptions configures the metrics provider.
type ProviderOptions struct {
	// OTELCollectorURL is the URL of the OTEL collector for push-based metrics.
	// If empty, only Prometheus pull-based metrics will be enabled.
	OTELCollectorURL string

	// PrometheusRegistry is the Prometheus registry to use.
	// If nil, the default registry will be used.
	PrometheusRegistry prometheus.Registerer
}

// Provider holds the OTEL metrics provider and meter.
type Provider struct {
	provider *sdkmetric.MeterProvider
	meter    metric.Meter
}

// NewProvider creates a new metrics provider.
//
// The provider exposes metrics via:
//   - Prometheus: Automatically registered with the default (or provided) registry,
//     making them available at /metrics via promhttp.Handler()
//   - OTEL: If OTELCollectorURL is provided, metrics are also pushed to the collector
func NewProvider(ctx context.Context, opts ProviderOptions) (*Provider, error) {
	readers := make([]sdkmetric.Option, 0, 2)

	// Add Prometheus exporter - this registers with the Prometheus registry
	// and makes metrics available at /metrics
	promOpts := []otelprom.Option{}
	if opts.PrometheusRegistry != nil {
		promOpts = append(promOpts, otelprom.WithRegisterer(opts.PrometheusRegistry))
	}

	promExporter, err := otelprom.New(promOpts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create prometheus exporter: %w", err)
	}
	readers = append(readers, sdkmetric.WithReader(promExporter))

	// Optionally add OTLP HTTP exporter for push-based metrics
	if opts.OTELCollectorURL != "" {
		metricsURL, err := buildMetricsURL(opts.OTELCollectorURL)
		if err != nil {
			return nil, fmt.Errorf("failed to build metrics URL: %w", err)
		}

		otlpExporter, err := otlpmetrichttp.New(ctx,
			otlpmetrichttp.WithEndpointURL(metricsURL),
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create OTLP exporter: %w", err)
		}
		readers = append(readers, sdkmetric.WithReader(
			sdkmetric.NewPeriodicReader(otlpExporter),
		))
	}

	// Add histogram views with custom buckets
	views := histogramViews()

	// Create meter provider with all readers and views
	providerOpts := append(readers, views...)
	provider := sdkmetric.NewMeterProvider(providerOpts...)
	meter := provider.Meter(Namespace)

	return &Provider{
		provider: provider,
		meter:    meter,
	}, nil
}

// histogramViews returns OTEL views for configuring histogram buckets.
func histogramViews() []sdkmetric.Option {
	// Define views for histograms with custom buckets
	bigBucketHistograms := []string{
		"superblocks_step_overhead_microseconds",
		"superblocks_step_plugin_duration_microseconds",
		"superblocks_step_total_duration_microseconds",
	}

	smallBucketHistograms := []string{
		"superblocks_step_queue_request_duration_microseconds",
		"superblocks_step_queue_response_duration_microseconds",
		"superblocks_step_kv_fetch_duration_microseconds",
		"superblocks_step_kv_push_duration_microseconds",
	}

	sizeBucketHistograms := []string{
		"superblocks_step_kv_push_size_bytes",
	}

	percentageBucketHistograms := []string{
		"superblocks_step_estimate_error_percentage",
	}

	views := make([]sdkmetric.Option, 0)

	for _, name := range bigBucketHistograms {
		views = append(views, sdkmetric.WithView(sdkmetric.NewView(
			sdkmetric.Instrument{Name: name},
			sdkmetric.Stream{Aggregation: sdkmetric.AggregationExplicitBucketHistogram{Boundaries: BigBuckets}},
		)))
	}

	for _, name := range smallBucketHistograms {
		views = append(views, sdkmetric.WithView(sdkmetric.NewView(
			sdkmetric.Instrument{Name: name},
			sdkmetric.Stream{Aggregation: sdkmetric.AggregationExplicitBucketHistogram{Boundaries: SmallBuckets}},
		)))
	}

	for _, name := range sizeBucketHistograms {
		views = append(views, sdkmetric.WithView(sdkmetric.NewView(
			sdkmetric.Instrument{Name: name},
			sdkmetric.Stream{Aggregation: sdkmetric.AggregationExplicitBucketHistogram{Boundaries: SizeBuckets}},
		)))
	}

	for _, name := range percentageBucketHistograms {
		views = append(views, sdkmetric.WithView(sdkmetric.NewView(
			sdkmetric.Instrument{Name: name},
			sdkmetric.Stream{Aggregation: sdkmetric.AggregationExplicitBucketHistogram{Boundaries: PercentageBuckets}},
		)))
	}

	return views
}

// Meter returns the OTEL meter for creating instruments.
func (p *Provider) Meter() metric.Meter {
	return p.meter
}

// Shutdown gracefully shuts down the metrics provider.
func (p *Provider) Shutdown(ctx context.Context) error {
	return p.provider.Shutdown(ctx)
}

// buildMetricsURL constructs the metrics endpoint URL from a collector URL.
func buildMetricsURL(collectorURL string) (string, error) {
	u, err := url.Parse(collectorURL)
	if err != nil {
		return "", err
	}

	// Strip known OTLP paths and set the metrics path
	path := u.Path
	if strings.HasSuffix(path, "/v1/traces") {
		path = strings.TrimSuffix(path, "/v1/traces")
	} else if strings.HasSuffix(path, "/v1/logs") {
		path = strings.TrimSuffix(path, "/v1/logs")
	} else if strings.HasSuffix(path, "/v1/metrics") {
		path = strings.TrimSuffix(path, "/v1/metrics")
	}

	u.Path = strings.TrimSuffix(path, "/") + "/v1/metrics"
	return u.String(), nil
}
