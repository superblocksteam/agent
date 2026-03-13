package signaldelay

import (
	"os"
	"syscall"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWithSignals(t *testing.T) {
	t.Parallel()

	sigs := []os.Signal{syscall.SIGUSR1, syscall.SIGUSR2}
	r := New(WithSignals(sigs...)).(*runnable)

	require.Len(t, r.signals, 2)
	assert.Equal(t, syscall.SIGUSR1, r.signals[0])
	assert.Equal(t, syscall.SIGUSR2, r.signals[1])
}

func TestWithBaseDelay(t *testing.T) {
	t.Parallel()

	d := 15 * time.Second
	r := New(WithBaseDelay(d)).(*runnable)

	assert.Equal(t, d, r.baseDelay)
}

func TestWithMaxJitter(t *testing.T) {
	t.Parallel()

	j := 5 * time.Second
	r := New(WithMaxJitter(j)).(*runnable)

	assert.Equal(t, j, r.maxJitter)
}

func TestNew_DefaultsWithoutOptions(t *testing.T) {
	t.Parallel()

	r := New().(*runnable)

	assert.Len(t, r.signals, 2)
	assert.Equal(t, os.Interrupt, r.signals[0])
	assert.Equal(t, syscall.SIGTERM, r.signals[1])
	assert.Zero(t, r.baseDelay)
	assert.Zero(t, r.maxJitter)
}

func TestNew_OptionsAppliedInOrder(t *testing.T) {
	t.Parallel()

	r := New(
		WithSignals(syscall.SIGUSR1),
		WithBaseDelay(10*time.Second),
		WithMaxJitter(2*time.Second),
	).(*runnable)

	require.Len(t, r.signals, 1)
	assert.Equal(t, syscall.SIGUSR1, r.signals[0])
	assert.Equal(t, 10*time.Second, r.baseDelay)
	assert.Equal(t, 2*time.Second, r.maxJitter)
}
