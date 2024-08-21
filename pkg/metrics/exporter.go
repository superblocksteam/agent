package metrics

import (
	"context"
	"os"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/process"
	metrics "github.com/superblocksteam/agent/internal/metrics"
	clients "github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

var _ run.Runnable = (*MetricsExporter)(nil)

const (
	AgentStatusActive       = "Active"
	AgentStatusDisconnected = "Disconnected"
)

// Not putting this in types due to inconsistent naming
type HealthCheckRequest struct {
	Cpu                  float64 `json:"cpu"`
	Memory               float64 `json:"memory"`
	CurrentHeapSizeBytes float64 `json:"currentHeapSizeBytes"`
	Version              string  `json:"version"`
	VersionExternal      string  `json:"version_external"`
	DesiredState         string  `json:"desiredState"`
	ApiSuccessCount      float64 `json:"apiSuccessCount"`
	ApiFailureCount      float64 `json:"apiFailureCount"`
	WorkflowSuccessCount float64 `json:"workflowSuccessCount"`
	WorkflowFailureCount float64 `json:"workflowFailureCount"`
}

type MetricsExporter struct {
	serverHttpClient clients.ServerClient
	version          string
	versionExternal  string
	desiredState     string
	interval         time.Duration
	ticker           *time.Ticker
	logger           *zap.Logger
	ctx              context.Context
	cancel           context.CancelFunc

	run.ForwardCompatibility
}

type MetricsExporterOptions struct {
	ServerHttpClient clients.ServerClient
	Version          string
	VersionExternal  string
	Interval         time.Duration
	Logger           *zap.Logger
}

func NewMetricsExporter(options *MetricsExporterOptions) *MetricsExporter {
	ctx, cancel := context.WithCancel(context.Background())

	return &MetricsExporter{
		serverHttpClient: options.ServerHttpClient,
		version:          options.Version,
		versionExternal:  options.VersionExternal,
		interval:         options.Interval,
		logger:           options.Logger,
		desiredState:     AgentStatusActive,
		ctx:              ctx,
		cancel:           cancel,
	}
}

func (m *MetricsExporter) sendHealthCheckMetrics() error {
	var cpuUsage float64
	{
		p, err := process.NewProcess(int32(os.Getpid()))

		if err != nil {
			m.logger.Error("failed to get process", zap.Error(err))
		} else {
			cpuUsage, err = p.Percent(1 * time.Second)

			if err != nil {
				m.logger.Error("failed to get cpu usage", zap.Error(err))
			}
		}
	}

	var memoryUsage float64
	var currentHeapSizeBytes float64
	{
		m := &runtime.MemStats{}
		runtime.ReadMemStats(m)
		memoryUsage = float64(m.Sys)
		currentHeapSizeBytes = float64(m.HeapAlloc)
	}

	healthCheckRequest := &HealthCheckRequest{
		Cpu:                  cpuUsage,
		Memory:               memoryUsage,
		CurrentHeapSizeBytes: currentHeapSizeBytes,
		Version:              m.version,
		VersionExternal:      m.versionExternal,
		DesiredState:         m.desiredState,
		ApiSuccessCount:      metrics.GetCounterValue(metrics.ApiExecutionEventsTotal, []string{"succeeded", "api"}),
		ApiFailureCount:      metrics.GetCounterValue(metrics.ApiExecutionEventsTotal, []string{"failed", "api"}),
		WorkflowSuccessCount: metrics.GetCounterValue(metrics.ApiExecutionEventsTotal, []string{"succeeded", "workflow"}),
		WorkflowFailureCount: metrics.GetCounterValue(metrics.ApiExecutionEventsTotal, []string{"failed", "workflow"}),
	}

	_, err := m.serverHttpClient.PostHealthcheck(context.Background(), nil, nil, nil, healthCheckRequest)
	return err
}

func (m *MetricsExporter) Name() string { return "metrics exporter" }

func (m *MetricsExporter) Run(context.Context) error {
	m.ticker = time.NewTicker(m.interval)

	for {
		select {
		case <-m.ticker.C:
			err := m.sendHealthCheckMetrics()
			if err != nil {
				m.logger.Error("failed to send healthcheck", zap.Error(err))
			}
		case <-m.ctx.Done():
			return nil
		}
	}
}

func (*MetricsExporter) Alive() bool { return true }

func (m *MetricsExporter) Close(context.Context) error {
	m.ticker.Stop()
	m.cancel()
	m.desiredState = AgentStatusDisconnected
	e := m.sendHealthCheckMetrics()
	if e != nil {
		m.logger.Error("failed to send healthcheck", zap.Error(e))
	}

	return nil
}
