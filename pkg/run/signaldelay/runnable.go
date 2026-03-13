package signaldelay

import (
	"context"
	cryptorand "crypto/rand"
	"math/big"
	"math/rand"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/superblocksteam/run"
)

// Runnable listens for OS signals and, upon receipt, waits a configurable base
// duration plus random jitter before returning. The wait is interruptible—if
// another runnable in the group returns first, the run group cancels the
// context and this runnable exits immediately.
type runnable struct {
	signals   []os.Signal
	baseDelay time.Duration
	maxJitter time.Duration

	run.ForwardCompatibility
}

// New returns a run.Runnable that listens for signals, then waits base delay
// plus jitter before returning. The wait can be interrupted by context
// cancellation (e.g. when another runnable returns).
func New(opts ...Option) run.Runnable {
	r := &runnable{
		signals:   []os.Signal{os.Interrupt, syscall.SIGTERM},
		baseDelay: 0,
		maxJitter: 0,
	}
	for _, opt := range opts {
		opt(r)
	}
	return r
}

func (*runnable) Name() string { return "signal delay process manager" }
func (*runnable) Alive() bool  { return true }

func (r *runnable) Run(ctx context.Context) error {
	signalCtx, cancel := signal.NotifyContext(context.Background(), r.signals...)
	defer cancel()

	select {
	case <-ctx.Done():
		return nil
	case <-signalCtx.Done():
	}

	// Signal received. Wait base + jitter, but remain interruptible.
	jitter := time.Duration(0)
	if r.maxJitter > 0 {
		n, err := cryptorand.Int(cryptorand.Reader, big.NewInt(int64(r.maxJitter)))
		if err == nil {
			jitter = time.Duration(n.Int64())
		} else {
			jitter = time.Duration(rand.Int63n(int64(r.maxJitter)))
		}
	}
	delay := r.baseDelay + jitter

	if delay <= 0 {
		return nil
	}

	timer := time.NewTimer(delay)
	defer timer.Stop()

	select {
	case <-ctx.Done():
		return nil
	case <-timer.C:
		return nil
	}
}
