package javascript

import (
	"context"
	"errors"
	"sync"

	pkgengine "github.com/superblocksteam/agent/pkg/engine"
	commonErr "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	v8 "rogchap.com/v8go"
)

var (
	ErrEngineClosed  = errors.New("engine closed")
	ErrSandboxClosed = errors.New("sandbox closed")
)

type Options struct {
	Logger              *zap.Logger
	Store               store.Store
	BindingErrorOptions []commonErr.BindingErrorOption
	AfterFunc           func(error) // Called after every engine resolution.
}

func Sandbox(ctx context.Context, options *Options) pkgengine.Sandbox {
	return newSandbox(ctx, options)
}

type sandbox struct {
	options *Options

	mu      sync.Mutex
	iso     *v8.Isolate
	engines map[*engine]struct{}
}

func newSandbox(ctx context.Context, options *Options) *sandbox {
	iso, _ := tracer.Observe(ctx, "v8.isolate", nil, func(context.Context, trace.Span) (*v8.Isolate, error) {
		return v8.NewIsolate(), nil
	}, nil)

	return &sandbox{
		options: options,
		iso:     iso,
		engines: map[*engine]struct{}{},
	}
}

func (s *sandbox) Engine(ctx context.Context) (pkgengine.Engine, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.iso == nil {
		return newNoopEngine(ErrSandboxClosed), ErrSandboxClosed
	}

	engine := newEngine(ctx, s)
	s.engines[engine] = struct{}{}
	return engine, nil
}

func (s *sandbox) Close() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.iso == nil {
		return
	}

	for engine := range s.engines {
		engine.closeLocked()
	}
	s.iso.Dispose()

	s.engines = nil
	s.iso = nil
}
