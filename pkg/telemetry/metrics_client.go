package telemetry

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"go.opentelemetry.io/otel/attribute"
	otelmetric "go.opentelemetry.io/otel/metric"
)

const (
	defaultGaugeTTL        = 5 * time.Minute
	defaultGaugeMaxEntries = 10_000
)

type Labels map[string]string

type CounterHandle interface {
	Inc(labels Labels, value ...int64)
}

type GaugeHandle interface {
	Set(labels Labels, value float64)
}

type HistogramHandle interface {
	Observe(labels Labels, value float64)
}

type MetricsClient struct {
	meter otelmetric.Meter
	nowFn func() time.Time

	mu         sync.Mutex
	counters   map[string]otelmetric.Int64Counter
	gauges     map[string]*gaugeStore
	histograms map[string]otelmetric.Float64Histogram
	registries []otelmetric.Registration
}

func NewMetricsClient(meter otelmetric.Meter) *MetricsClient {
	return &MetricsClient{
		meter:      meter,
		nowFn:      time.Now,
		counters:   map[string]otelmetric.Int64Counter{},
		gauges:     map[string]*gaugeStore{},
		histograms: map[string]otelmetric.Float64Histogram{},
	}
}

func (m *MetricsClient) Counter(name string) CounterHandle {
	m.mu.Lock()
	defer m.mu.Unlock()

	counter, ok := m.counters[name]
	if !ok {
		created, err := m.meter.Int64Counter(name)
		if err != nil {
			return counterHandle{}
		}
		counter = created
		m.counters[name] = counter
	}
	return counterHandle{counter: counter}
}

func (m *MetricsClient) Histogram(name string) HistogramHandle {
	m.mu.Lock()
	defer m.mu.Unlock()

	hist, ok := m.histograms[name]
	if !ok {
		created, err := m.meter.Float64Histogram(name)
		if err != nil {
			return histogramHandle{}
		}
		hist = created
		m.histograms[name] = hist
	}
	return histogramHandle{histogram: hist}
}

func (m *MetricsClient) Gauge(name string) GaugeHandle {
	m.mu.Lock()
	defer m.mu.Unlock()

	store, ok := m.gauges[name]
	if ok {
		return gaugeHandle{store: store, nowFn: m.nowFn}
	}

	gauge, err := m.meter.Float64ObservableGauge(name)
	if err != nil {
		return gaugeHandle{}
	}
	store = newGaugeStore(defaultGaugeTTL, defaultGaugeMaxEntries)
	reg, err := m.meter.RegisterCallback(func(_ context.Context, observer otelmetric.Observer) error {
		for _, entry := range store.Snapshot(m.nowFn()) {
			observer.ObserveFloat64(gauge, entry.value, otelmetric.WithAttributes(entry.attrs...))
		}
		return nil
	}, gauge)
	if err != nil {
		return gaugeHandle{}
	}

	m.registries = append(m.registries, reg)
	m.gauges[name] = store
	return gaugeHandle{store: store, nowFn: m.nowFn}
}

func (m *MetricsClient) IncCounter(name string, labels Labels, value ...int64) {
	m.Counter(name).Inc(labels, value...)
}

func (m *MetricsClient) ObserveHistogram(name string, labels Labels, value float64) {
	m.Histogram(name).Observe(labels, value)
}

func (m *MetricsClient) SetGauge(name string, labels Labels, value float64) {
	m.Gauge(name).Set(labels, value)
}

func (m *MetricsClient) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, reg := range m.registries {
		_ = reg.Unregister()
	}
	m.registries = nil
	return nil
}

type counterHandle struct {
	counter otelmetric.Int64Counter
}

func (c counterHandle) Inc(labels Labels, value ...int64) {
	if c.counter == nil {
		return
	}
	v := int64(1)
	if len(value) > 0 {
		v = value[0]
	}
	c.counter.Add(context.Background(), v, otelmetric.WithAttributes(labelsToAttributes(labels)...))
}

type histogramHandle struct {
	histogram otelmetric.Float64Histogram
}

func (h histogramHandle) Observe(labels Labels, value float64) {
	if h.histogram == nil {
		return
	}
	h.histogram.Record(context.Background(), value, otelmetric.WithAttributes(labelsToAttributes(labels)...))
}

type gaugeHandle struct {
	store *gaugeStore
	nowFn func() time.Time
}

func (g gaugeHandle) Set(labels Labels, value float64) {
	if g.store == nil {
		return
	}
	attrs := labelsToAttributes(labels)
	g.store.Set(labelsKey(labels), attrs, value, g.nowFn())
}

type gaugeStore struct {
	ttl        time.Duration
	maxEntries int

	mu      sync.Mutex
	entries map[string]gaugeEntry
}

type gaugeEntry struct {
	attrs     []attribute.KeyValue
	value     float64
	updatedAt time.Time
}

func newGaugeStore(ttl time.Duration, maxEntries int) *gaugeStore {
	return &gaugeStore{
		ttl:        ttl,
		maxEntries: maxEntries,
		entries:    map[string]gaugeEntry{},
	}
}

func (g *gaugeStore) Set(key string, attrs []attribute.KeyValue, value float64, now time.Time) {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.evictExpired(now)

	if _, exists := g.entries[key]; !exists && len(g.entries) >= g.maxEntries {
		g.evictOldest()
	}

	g.entries[key] = gaugeEntry{
		attrs:     attrs,
		value:     value,
		updatedAt: now,
	}
}

func (g *gaugeStore) Snapshot(now time.Time) []gaugeEntry {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.evictExpired(now)
	out := make([]gaugeEntry, 0, len(g.entries))
	for _, entry := range g.entries {
		out = append(out, entry)
	}
	return out
}

func (g *gaugeStore) evictExpired(now time.Time) {
	for key, entry := range g.entries {
		if now.Sub(entry.updatedAt) > g.ttl {
			delete(g.entries, key)
		}
	}
}

func (g *gaugeStore) evictOldest() {
	var (
		oldestKey string
		oldest    time.Time
		first     = true
	)
	for key, entry := range g.entries {
		if first || entry.updatedAt.Before(oldest) {
			first = false
			oldest = entry.updatedAt
			oldestKey = key
		}
	}
	if oldestKey != "" {
		delete(g.entries, oldestKey)
	}
}

func labelsToAttributes(labels Labels) []attribute.KeyValue {
	if len(labels) == 0 {
		return nil
	}
	keys := make([]string, 0, len(labels))
	for key := range labels {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	attrs := make([]attribute.KeyValue, 0, len(keys))
	for _, key := range keys {
		attrs = append(attrs, attribute.String(key, labels[key]))
	}
	return attrs
}

func labelsKey(labels Labels) string {
	if len(labels) == 0 {
		return ""
	}
	keys := make([]string, 0, len(labels))
	for key := range labels {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	var builder strings.Builder
	for i, key := range keys {
		if i > 0 {
			builder.WriteByte('\x00')
		}
		builder.WriteString(escapeLabel(key))
		builder.WriteByte('\x00')
		builder.WriteString(escapeLabel(labels[key]))
	}
	return builder.String()
}

// escapeLabel escapes backslashes then null bytes so that the null-byte
// delimiter in labelsKey cannot collide with literal content.
func escapeLabel(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, "\x00", `\0`)
	return s
}
