package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolveMetricsOTLPCollectorURLReturnsURLWhenEnabled(t *testing.T) {
	got := resolveMetricsOTLPCollectorURL(true, "http://otelcol-collector.observability.svc.cluster.local:4318/v1/traces")

	assert.Equal(t, "http://otelcol-collector.observability.svc.cluster.local:4318/v1/traces", got)
}

func TestResolveMetricsOTLPCollectorURLReturnsEmptyWhenDisabled(t *testing.T) {
	got := resolveMetricsOTLPCollectorURL(false, "http://otelcol-collector.observability.svc.cluster.local:4318/v1/traces")

	assert.Empty(t, got)
}

func TestResolveMetricsOTLPCollectorURLDisabledEvenWithEmptyURL(t *testing.T) {
	got := resolveMetricsOTLPCollectorURL(false, "")

	assert.Empty(t, got)
}
