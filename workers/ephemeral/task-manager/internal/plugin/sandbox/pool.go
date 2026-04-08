package sandbox

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	sandboxmetrics "workers/ephemeral/task-manager/internal/metrics"
	"workers/ephemeral/task-manager/internal/plugin"

	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/protobuf/types/known/structpb"
)

// poolEntryStatus is lifecycle + last observed availability for round-robin dispatch.
type poolEntryStatus uint32

const (
	poolEntryNotReady poolEntryStatus = iota
	poolEntryReady
	poolEntryReserved
	poolEntryUnavailable
)

// poolEntry is one SandboxPlugin with its Run lifecycle (Run executes in a goroutine; closePlugin cancels it).
type poolEntry struct {
	plug            *SandboxPlugin
	runCancel       context.CancelFunc
	wg              sync.WaitGroup
	status          atomic.Uint32 // poolEntryStatus
	alreadyReplaced atomic.Bool
	closingPlugin   atomic.Bool
}

const (
	defaultFailedSandboxRetryBackoff = 100 * time.Millisecond
	maxFailedSandboxRetryBackoff     = 30 * time.Second
)

// SandboxPool runs SandboxPlugin instances (one Kubernetes Job per plugin in dynamic mode)
// and dispatches Execute using round-robin across entries in poolEntryReady state.
// Plugins are keyed by sandbox id; replacement removes one id and adds another.
type SandboxPool struct {
	mu sync.RWMutex

	workerId         string
	sandboxPoolSize  int
	sandboxAddresses []string
	sandboxOptions   []Option

	plugins                map[string]*poolEntry
	pluginOrder            []string
	recoveryTimers         map[string]*time.Timer
	rr                     *atomic.Uint32
	sandboxRecoveryTimeout time.Duration
	staticMode             bool
	ephemeralExecution     bool

	runMu  sync.RWMutex
	runCtx context.Context

	// drainCompleteCh is closed after in-flight requests finish.
	drainCompleteCh           <-chan struct{}
	failedSandboxReplacements chan struct{}

	logger       *zap.Logger
	tracer       trace.Tracer
	shuttingDown atomic.Bool

	// poolReady is set to true once every pool entry has reached poolEntryReady (same semantics as sandboxReady on SandboxPlugin).
	poolReady         atomic.Bool
	poolReadyNotifyMu sync.Mutex
	poolReadyNotifyCh []chan<- bool

	run.ForwardCompatibility
}

var _ plugin.Plugin = (*SandboxPool)(nil)
var _ run.Runnable = (*SandboxPool)(nil)

// NewSandboxPool returns a Runnable + Plugin over sandbox plugins keyed by sandbox id.
func NewSandboxPool(options ...PoolOption) (*SandboxPool, error) {
	poolOpts := ApplyPoolOptions(options...)
	if err := validatePoolOptions(poolOpts); err != nil {
		return nil, err
	}

	sandboxPool := &SandboxPool{
		workerId:                  poolOpts.WorkerId,
		sandboxPoolSize:           poolOpts.SandboxPoolSize,
		sandboxAddresses:          poolOpts.SandboxAddresses,
		sandboxOptions:            poolOpts.SandboxOptions,
		drainCompleteCh:           poolOpts.DrainCompleteCh,
		failedSandboxReplacements: make(chan struct{}, poolOpts.SandboxPoolSize),
		rr:                        &atomic.Uint32{},
		plugins:                   make(map[string]*poolEntry),
		recoveryTimers:            make(map[string]*time.Timer),
		sandboxRecoveryTimeout:    poolOpts.SandboxRecoveryTimeout,
		logger:                    poolOpts.Logger,
		staticMode:                len(poolOpts.SandboxAddresses) > 0,
	}

	connectionMode := "dynamic"
	if sandboxPool.staticMode {
		connectionMode = "static"
		sandboxPool.sandboxRecoveryTimeout = 0
	}

	sandboxPool.ephemeralExecution = poolOpts.EphemeralExecution && !sandboxPool.staticMode
	sandboxPool.tracer = otel.Tracer("sandbox.pool")
	sandboxPool.logger = sandboxPool.logger.With(
		zap.String("worker_id", sandboxPool.workerId),
		zap.Bool("ephemeral", sandboxPool.ephemeralExecution),
		zap.String("connection_mode", connectionMode),
		zap.Int("pool_size", sandboxPool.sandboxPoolSize),
	)

	if err := sandboxPool.bootstrapPlugins(); err != nil {
		return nil, fmt.Errorf("failed to create sandbox plugins: %w", err)
	}

	sandboxmetrics.RecordGauge(context.Background(), sandboxmetrics.SandboxPoolConfiguredSandboxes, int64(len(sandboxPool.plugins)),
		sandboxmetrics.AttrPoolConnectionMode.String(connectionMode),
	)

	return sandboxPool, nil
}

func (p *SandboxPool) connectionModeAttr() string {
	if p.staticMode {
		return "static"
	}
	return "dynamic"
}

// tracerForPool returns the configured tracer or the global OTEL tracer (noop in tests that build SandboxPool manually).
func (p *SandboxPool) tracerForPool() trace.Tracer {
	if p.tracer != nil {
		return p.tracer
	}
	return otel.Tracer("sandbox.pool")
}

func (p *SandboxPool) recordPoolEvent(ctx context.Context, event string) {
	if ctx == nil {
		ctx = context.Background()
	}
	sandboxmetrics.RecordPoolEvent(ctx, event, p.connectionModeAttr())
}

func validatePoolOptions(opts *PoolOptions) error {
	merged := ApplyOptions(opts.SandboxOptions...)
	if merged.ConnectionMode == SandboxConnectionModeDynamic && merged.SandboxId == "" {
		merged.SandboxId = "pool-validation-placeholder"
	}

	// Static pool: addresses are applied per sandbox in bootstrapPlugins (WithSandboxAddress per entry).
	// Template options from main only set connection mode; satisfy validateOptions like dynamic placeholder.
	if merged.ConnectionMode == SandboxConnectionModeStatic && merged.SandboxAddress == "" && len(opts.SandboxAddresses) > 0 {
		merged.SandboxAddress = "pool-validation-placeholder"
	}

	if err := validateOptions(merged); err != nil {
		return err
	}

	if opts.SandboxPoolSize < 1 && len(opts.SandboxAddresses) == 0 {
		return fmt.Errorf("sandbox pool size or addresses must be provided")
	}

	return nil
}

func (p *SandboxPool) bootstrapPlugins() error {
	if len(p.sandboxAddresses) > 0 {
		for _, addr := range p.sandboxAddresses {
			if _, err := p.createAndRegisterPlugin(WithSandboxAddress(addr)); err != nil {
				return err
			}
		}
	} else {
		for range p.sandboxPoolSize {
			if _, err := p.createAndRegisterPlugin(); err != nil {
				return err
			}
		}
	}

	return nil
}

// createPlugin builds a new dynamic-mode SandboxPlugin with a unique sandbox id.
func (p *SandboxPool) createPlugin(extra ...Option) (*SandboxPlugin, string, error) {
	sid := p.newDynamicSandboxID()
	opts := append(append([]Option{}, p.sandboxOptions...), WithSandboxId(sid))
	opts = append(opts, extra...)
	plug, err := NewSandboxPlugin(opts...)
	if err != nil {
		return nil, "", err
	}
	return plug, sid, nil
}

func (p *SandboxPool) createAndRegisterPlugin(extra ...Option) (*poolEntry, error) {
	plug, sid, err := p.createPlugin(extra...)
	if err != nil {
		return nil, err
	}

	p.mu.Lock()
	if p.shuttingDown.Load() {
		p.mu.Unlock()
		return nil, fmt.Errorf("cannot register new plugin: sandbox pool is shutting down")
	}

	e := &poolEntry{plug: plug}
	e.status.Store(uint32(poolEntryNotReady))
	p.plugins[sid] = e
	p.pluginOrder = append(p.pluginOrder, sid)
	p.mu.Unlock()

	return e, nil
}

func (p *SandboxPool) createAndRunNewPlugin(extra ...Option) (*poolEntry, error) {
	p.runMu.RLock()
	rc := p.runCtx
	p.runMu.RUnlock()
	if rc == nil {
		return nil, fmt.Errorf("sandbox pool run not started")
	}
	if err := rc.Err(); err != nil {
		return nil, err
	}

	entry, err := p.createAndRegisterPlugin(extra...)
	if err != nil {
		return nil, err
	}

	go p.runPlugin(rc, entry.plug.sandboxId)
	return entry, nil
}

func (p *SandboxPool) replacePlugin(oldId string) {
	ctx, span := p.tracerForPool().Start(context.Background(), "sandbox.pool.replace",
		trace.WithAttributes(attribute.String("sandbox.pool.sandbox_id", oldId)))
	defer span.End()

	if !p.canReplacePlugin(oldId) {
		span.SetStatus(codes.Ok, "replace skipped")
		return
	}

	defer p.closePlugin(oldId)

	if _, err := p.createAndRunNewPlugin(); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "replacement create failed")
		p.recordPoolEvent(ctx, sandboxmetrics.PoolEventReplaceCreateFailed)
		p.logger.Warn("failed to create and run new sandbox plugin for replacement", zap.String("old_sandbox_id", oldId), zap.Error(err))
		select {
		case p.failedSandboxReplacements <- struct{}{}:
		default:
		}
		return
	}
	span.SetStatus(codes.Ok, "replacement scheduled")
}

func (p *SandboxPool) canReplacePlugin(id string) bool {
	if p.shuttingDown.Load() {
		return false
	}

	p.mu.RLock()
	entry := p.plugins[id]
	p.mu.RUnlock()

	if p.staticMode {
		p.recordPoolEvent(context.Background(), sandboxmetrics.PoolEventReplaceSkippedStatic)
		p.logger.Debug("cannot replace plugin: static mode", zap.String("sandbox_id", id))
		return false
	}

	if entry == nil {
		p.recordPoolEvent(context.Background(), sandboxmetrics.PoolEventReplaceSkippedNotFound)
		p.logger.Debug("cannot replace plugin: plugin not found", zap.String("sandbox_id", id))
		return false
	}

	if !entry.alreadyReplaced.CompareAndSwap(false, true) {
		p.recordPoolEvent(context.Background(), sandboxmetrics.PoolEventReplaceSkippedAlreadyReplaced)
		p.logger.Debug("cannot replace plugin: already replaced", zap.String("sandbox_id", id))
		return false
	}

	return true
}

func (p *SandboxPool) monitorFailedSandboxReplacements() {
	p.runMu.RLock()
	rc := p.runCtx
	p.runMu.RUnlock()
	if rc == nil {
		return
	}

	for rc.Err() == nil {
		select {
		case <-p.failedSandboxReplacements:
			p.scheduleFailedReplacementRetry(rc, defaultFailedSandboxRetryBackoff)
		case <-rc.Done():
		}
	}
}

// scheduleFailedReplacementRetry attempts createAndRunNewPlugin after initialBackoff, then with exponential
// backoff (capped at maxFailedSandboxRetryBackoff) while attempts keep failing
func (p *SandboxPool) scheduleFailedReplacementRetry(ctx context.Context, initialBackoff time.Duration) {
	var attempt func(time.Duration)

	attempt = func(backoff time.Duration) {
		time.AfterFunc(backoff, func() {
			// Close may set shuttingDown before Run's context is cancelled; skip work in that window.
			if ctx.Err() != nil || p.shuttingDown.Load() {
				return
			}

			p.logger.Debug("retrying failed sandbox replacement after backoff", zap.Duration("backoff", backoff))
			if _, err := p.createAndRunNewPlugin(); err != nil {
				p.recordPoolEvent(ctx, sandboxmetrics.PoolEventRetryReplaceFailed)
				p.logger.Debug("retry replacement skipped", zap.Error(err))

				next := backoff * 2
				if next > maxFailedSandboxRetryBackoff {
					next = maxFailedSandboxRetryBackoff
				}
				attempt(next)
			}
		})
	}

	attempt(initialBackoff)
}

func (p *SandboxPool) newDynamicSandboxID() string {
	return fmt.Sprintf("%s-%s", p.workerId, randomSandboxSuffix())
}

func randomSandboxSuffix() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return strconv.FormatInt(time.Now().UnixNano(), 36)
	}
	return hex.EncodeToString(b[:])
}

// runPlugin runs plug.Run in a goroutine for a long-lived pool entry: wait for ready, then keep the sandbox until cancel or Run error.
func (p *SandboxPool) runPlugin(ctx context.Context, id string) error {
	if ctx.Err() != nil {
		return ctx.Err()
	}

	ctx, span := p.tracerForPool().Start(ctx, "sandbox.pool.run_plugin",
		trace.WithAttributes(attribute.String("sandbox.pool.sandbox_id", id)))
	defer span.End()

	// Create a context for the plugin's run
	plugCtx, cancel := context.WithCancel(ctx)

	p.mu.Lock()
	if p.shuttingDown.Load() {
		p.mu.Unlock()
		cancel()
		span.SetStatus(codes.Error, "shutting down")

		return fmt.Errorf("cannot run plugin: sandbox pool is shutting down")
	}

	entry, ok := p.plugins[id]
	if !ok || entry == nil || entry.plug == nil {
		p.mu.Unlock()
		cancel()

		p.logger.Warn("exiting run plugin early: sandbox plugin not found", zap.String("sandbox_id", id))
		span.SetStatus(codes.Ok, "plugin not found")
		return nil
	}

	entry.runCancel = cancel
	p.mu.Unlock()

	// Attempt to replace the plugin on exit, if it encounters any errors during execution, for dynamic mode only.
	defer func() {
		p.replacePlugin(id)
	}()

	// Start sandbox plugin
	runDone := make(chan error, 1)
	entry.wg.Add(1)
	go func() {
		defer entry.wg.Done()
		runDone <- entry.plug.Run(plugCtx)
	}()

	// Wait for the plugin to be ready
	readyCh := make(chan bool, 1)
	entry.plug.NotifyWhenReady(readyCh)
	sandboxReadyStart := time.Now()
	select {
	case <-readyCh:
		if success := entry.status.CompareAndSwap(uint32(poolEntryNotReady), uint32(poolEntryReady)); !success {
			cancel()
			err := fmt.Errorf("sandbox plugin ready, but status has already been changed: %d", entry.status.Load())
			span.RecordError(err)
			span.SetStatus(codes.Error, "status race")
			return err
		}
		sandboxmetrics.RecordHistogram(ctx, sandboxmetrics.SandboxPoolSandboxReadyDuration, time.Since(sandboxReadyStart).Seconds(),
			sandboxmetrics.AttrPoolConnectionMode.String(p.connectionModeAttr()),
		)
		p.tryMarkPoolReady()
	case runErr := <-runDone:
		cancel()
		err := fmt.Errorf("sandbox plugin run failed before ready: %w", runErr)
		span.RecordError(runErr)
		span.SetStatus(codes.Error, "run failed before ready")
		return err
	case <-ctx.Done():
		cancel()
		span.SetStatus(codes.Error, "context canceled before ready")
		return ctx.Err()
	}

	// Sandbox plugin is ready, wait for it to finish or for the context to be done
	select {
	case <-ctx.Done():
		cancel()

		<-runDone
		span.SetStatus(codes.Error, "pool context canceled while ready")
		return ctx.Err()
	case err := <-runDone:
		cancel()

		entry.status.Store(uint32(poolEntryUnavailable))
		if err != nil && !errors.Is(err, context.Canceled) {
			span.RecordError(err)
			span.SetStatus(codes.Error, "run ended with error")
			p.logger.Warn("sandbox plugin run ended with error",
				zap.String("sandbox_id", id),
				zap.Error(err),
			)
		} else {
			span.SetStatus(codes.Ok, "run ended")
			p.logger.Debug("sandbox plugin run loop ended", zap.String("sandbox_id", id), zap.Error(err))
		}
	}

	return nil
}

// closePlugin cancels Run, waits for it to finish, closes the plugin, and removes it from the pool.
func (p *SandboxPool) closePlugin(id string) {
	p.mu.RLock()
	entry := p.plugins[id]
	p.mu.RUnlock()

	if entry == nil {
		return
	}

	if !entry.closingPlugin.CompareAndSwap(false, true) {
		p.logger.Debug("sandbox plugin already being closed", zap.String("sandbox_id", id))
		return
	}

	if entry.runCancel != nil {
		entry.runCancel()
	}
	entry.wg.Wait()

	closeCtx, closeCancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer closeCancel()

	if err := entry.plug.Close(closeCtx); err != nil {
		p.logger.Warn("sandbox plugin close failed", zap.String("sandbox_id", id), zap.Error(err))
	}

	p.mu.Lock()
	delete(p.plugins, id)
	p.removePluginOrderLocked(id)
	p.mu.Unlock()

	p.stopRecoveryTimer(id)
}

func (p *SandboxPool) removePluginOrderLocked(id string) {
	for i, x := range p.pluginOrder {
		if x == id {
			p.pluginOrder = append(p.pluginOrder[:i], p.pluginOrder[i+1:]...)
			return
		}
	}
}

func (p *SandboxPool) Name() string {
	return "sandboxPool"
}

func (p *SandboxPool) Run(ctx context.Context) error {
	p.runMu.Lock()
	p.runCtx = ctx
	p.runMu.Unlock()

	p.mu.RLock()
	ids := append([]string(nil), p.pluginOrder...)
	p.mu.RUnlock()

	// Monitor failed sandbox replacements
	go p.monitorFailedSandboxReplacements()

	// Start all plugins
	for _, id := range ids {
		id := id
		go p.runPlugin(ctx, id)
	}

	// Block until run context is done
	<-ctx.Done()
	return ctx.Err()
}

func (p *SandboxPool) Close(ctx context.Context) error {
	p.shuttingDown.Store(true)

	if p.drainCompleteCh != nil {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-p.drainCompleteCh:
			// Drain complete, proceed with teardown
		}
	}

	p.mu.Lock()
	for id := range p.recoveryTimers {
		if t := p.recoveryTimers[id]; t != nil {
			t.Stop()
		}
		delete(p.recoveryTimers, id)
	}
	p.mu.Unlock()

	p.mu.RLock()
	pluginIDs := make([]string, 0, len(p.plugins))
	for id := range p.plugins {
		pluginIDs = append(pluginIDs, id)
	}
	p.mu.RUnlock()

	var wg sync.WaitGroup
	for _, id := range pluginIDs {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			p.closePlugin(id)
		}(id)
	}

	wg.Wait()
	return nil
}

// NotifyWhenReady registers notifyCh and delivers true once the pool is ready (every entry has
// reached poolEntryReady), or immediately if already ready.
func (p *SandboxPool) NotifyWhenReady(notifyCh chan<- bool) {
	p.poolReadyNotifyMu.Lock()
	p.poolReadyNotifyCh = append(p.poolReadyNotifyCh, notifyCh)
	p.poolReadyNotifyMu.Unlock()

	if p.poolReady.Load() {
		p.notifyPoolReadyChannels()
	}
}

func (p *SandboxPool) notifyPoolReadyChannels() {
	p.poolReadyNotifyMu.Lock()
	defer p.poolReadyNotifyMu.Unlock()

	p.runMu.RLock()
	rc := p.runCtx
	p.runMu.RUnlock()
	if rc == nil {
		return
	}

	for _, notifyCh := range p.poolReadyNotifyCh {
		go func(notifyCh chan<- bool) {
			select {
			case <-rc.Done():
				return
			case notifyCh <- true:
				return
			}
		}(notifyCh)
	}

	p.poolReadyNotifyCh = nil
}

// tryMarkPoolReady sets poolReady and notifies waiters when every entry in pluginOrder is poolEntryReady.
func (p *SandboxPool) tryMarkPoolReady() {
	if p.poolReady.Load() {
		return
	}

	p.mu.RLock()
	for _, id := range p.pluginOrder {
		e := p.plugins[id]
		if e == nil || e.status.Load() != uint32(poolEntryReady) {
			p.mu.RUnlock()
			return
		}
	}
	p.mu.RUnlock()

	p.poolReady.Store(true)
	p.notifyPoolReadyChannels()
}

// IsAvailable aggregates SandboxPlugin health across pool entries. An empty pool is treated as unavailable (FATAL).
// Entries still warming (poolEntryNotReady) are skipped until runPlugin marks them ready. If any entry reports
// available, the pool is available. Otherwise degradation is the worst among entries; dynamic mode may replace
// FATAL sandboxes and start recovery timers for TRANSIENT sandboxes when sandboxRecoveryTimeout is set.
func (p *SandboxPool) IsAvailable(ctx context.Context) plugin.PluginStatus {
	p.mu.RLock()
	if len(p.plugins) == 0 {
		p.mu.RUnlock()
		return plugin.PluginStatus{
			Available:        false,
			DegradationState: plugin.DegradationState_FATAL,
			Error:            fmt.Errorf("sandbox pool has no plugins"),
		}
	}

	pluginIds := append([]string(nil), p.pluginOrder...)
	entries := make([]*poolEntry, len(pluginIds))
	for i, id := range pluginIds {
		entries[i] = p.plugins[id]
	}
	p.mu.RUnlock()

	var errs error
	anyAvailable := false
	maxDeg := plugin.DegradationState_UNSPECIFIED

	for i, id := range pluginIds {
		entry := entries[i]
		if entry == nil || entry.plug == nil {
			continue
		}

		if entry.status.Load() == uint32(poolEntryNotReady) || entry.status.Load() == uint32(poolEntryReserved) {
			continue
		}

		s := entry.plug.IsAvailable(ctx)
		if s.Available {
			entry.status.Store(uint32(poolEntryReady))
			anyAvailable = true
			p.stopRecoveryTimer(id)
			continue
		}

		entry.status.Store(uint32(poolEntryUnavailable))
		errs = errors.Join(errs, s.Error)
		if s.DegradationState > maxDeg {
			maxDeg = s.DegradationState
		}

		switch s.DegradationState {
		case plugin.DegradationState_FATAL:
			p.stopRecoveryTimer(id)
			go p.replacePlugin(id)
		case plugin.DegradationState_TRANSIENT:
			p.startRecoveryTimerIfNeeded(id)
		default:
			p.stopRecoveryTimer(id)
		}
	}

	if anyAvailable {
		return plugin.PluginStatus{
			Available:        true,
			DegradationState: plugin.DegradationState_NONE,
		}
	}

	return plugin.PluginStatus{
		Available:        false,
		DegradationState: maxDeg,
		Error:            errs,
	}
}

func (p *SandboxPool) startRecoveryTimerIfNeeded(id string) {
	if p.sandboxRecoveryTimeout <= 0 {
		return
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	if p.recoveryTimers[id] != nil {
		return
	}

	p.logger.Debug("sandbox plugin is degraded, starting recovery timer", zap.String("sandbox_id", id), zap.Duration("timeout", p.sandboxRecoveryTimeout))

	p.recoveryTimers[id] = time.AfterFunc(p.sandboxRecoveryTimeout, func() {
		p.logger.Warn("sandbox plugin unhealthy past recovery timeout, replacing",
			zap.String("sandbox_id", id),
			zap.Duration("timeout", p.sandboxRecoveryTimeout),
		)

		p.replacePlugin(id)
	})
}

func (p *SandboxPool) stopRecoveryTimer(id string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if t := p.recoveryTimers[id]; t != nil {
		t.Stop()
		delete(p.recoveryTimers, id)
	}
}

func (p *SandboxPool) pick() *poolEntry {
	_, entry := p.pickWithId(false)
	return entry
}

func (p *SandboxPool) pickWithId(reserveSandbox bool) (string, *poolEntry) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	n := len(p.pluginOrder)
	if n == 0 {
		return "", nil
	}
	for attempts := 0; attempts < n; attempts++ {
		idx := int((p.rr.Add(1) - 1) % uint32(n))
		id := p.pluginOrder[idx]
		entry := p.plugins[id]
		if entry == nil || entry.plug == nil {
			continue
		}
		if poolEntryStatus(entry.status.Load()) != poolEntryReady {
			continue
		}

		if reserveSandbox {
			if success := entry.status.CompareAndSwap(uint32(poolEntryReady), uint32(poolEntryReserved)); !success {
				continue
			}
		}

		return id, entry
	}
	return "", nil
}

func (p *SandboxPool) acquireSandbox(ctx context.Context, span trace.Span) (*poolEntry, func(), error) {
	id, entry := p.pickWithId(p.ephemeralExecution)
	if entry == nil {
		p.recordPoolEvent(ctx, sandboxmetrics.PoolEventPickNoReadySandbox)
		err := fmt.Errorf("sandbox pool: no ready sandbox available")
		span.RecordError(err)
		span.SetStatus(codes.Error, "no ready sandbox")
		return nil, nil, err
	}
	span.SetAttributes(attribute.String("sandbox.pool.sandbox_id", id))

	cleanupFn := func() {}
	if p.ephemeralExecution {
		// For ephemeral executions close the plugin after the execution is complete in a goroutine
		// so that it does not block returning the result to the caller.
		cleanupFn = func() {
			go p.closePlugin(id)
		}

		// Eagerly pre-create the next sandbox for ephemeral execution, while the current one is executing the request.
		if ok := entry.alreadyReplaced.CompareAndSwap(false, true); ok {
			if _, err := p.createAndRunNewPlugin(); err != nil {
				p.recordPoolEvent(ctx, sandboxmetrics.PoolEventReplaceCreateFailed)
				p.logger.Warn("failed to pre-create and run new sandbox plugin", zap.Error(err))
				select {
				case p.failedSandboxReplacements <- struct{}{}:
				default:
				}
			}
		}
	}

	return entry, cleanupFn, nil
}

func (p *SandboxPool) Execute(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	props *transportv1.Request_Data_Data_Props,
	quotas *transportv1.Request_Data_Data_Quota,
	pinned *transportv1.Request_Data_Pinned,
) (*workerv1.ExecuteResponse, error) {
	ctx, span := p.tracerForPool().Start(ctx, "sandbox.pool.execute")
	defer span.End()

	entry, cleanup, err := p.acquireSandbox(ctx, span)
	if err != nil {
		return nil, err
	}
	defer cleanup()

	resp, err := entry.plug.Execute(ctx, requestMeta, props, quotas, pinned)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "execute failed")
		return resp, err
	}
	span.SetStatus(codes.Ok, "")
	return resp, nil
}

func (p *SandboxPool) Stream(
	ctx context.Context,
	topic string,
	requestMeta *workerv1.RequestMetadata,
	props *transportv1.Request_Data_Data_Props,
	quotas *transportv1.Request_Data_Data_Quota,
	pinned *transportv1.Request_Data_Pinned,
) error {
	ctx, span := p.tracerForPool().Start(ctx, "sandbox.pool.stream")
	defer span.End()

	entry, cleanup, err := p.acquireSandbox(ctx, span)
	if err != nil {
		return err
	}
	defer cleanup()

	err = entry.plug.Stream(ctx, topic, requestMeta, props, quotas, pinned)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "stream failed")
		return err
	}
	span.SetStatus(codes.Ok, "")
	return nil
}

func (p *SandboxPool) Metadata(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	datasourceConfig *structpb.Struct,
	actionConfig *structpb.Struct,
) (*transportv1.Response_Data_Data, error) {
	entry := p.pick()
	if entry == nil {
		return nil, fmt.Errorf("sandbox pool: no plugin available")
	}
	return entry.plug.Metadata(ctx, requestMeta, datasourceConfig, actionConfig)
}

func (p *SandboxPool) Test(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	datasourceConfig *structpb.Struct,
	actionConfig *structpb.Struct,
) error {
	entry := p.pick()
	if entry == nil {
		return fmt.Errorf("sandbox pool: no plugin available")
	}
	return entry.plug.Test(ctx, requestMeta, datasourceConfig, actionConfig)
}

func (p *SandboxPool) PreDelete(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	datasourceConfig *structpb.Struct,
) error {
	entry := p.pick()
	if entry == nil {
		return fmt.Errorf("sandbox pool: no plugin available")
	}
	return entry.plug.PreDelete(ctx, requestMeta, datasourceConfig)
}
