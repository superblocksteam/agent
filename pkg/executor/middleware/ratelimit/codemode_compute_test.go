package ratelimit

import (
	"context"
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/flags"
	mockflags "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap/zaptest"
)

func TestDeductCodeModeComputeMinutes_SkipsWhenFlagsDisabled(t *testing.T) {
	t.Parallel()

	err := DeductCodeModeComputeMinutes(
		context.Background(),
		zaptest.NewLogger(t),
		store.Memory(),
		nil,
		"org-1", "TRIAL", 60000,
	)
	assert.NoError(t, err)
}

func TestDeductCodeModeComputeMinutes_SkipsWhenNoopFlags(t *testing.T) {
	t.Parallel()

	mf := mockflags.NewFlags(t)
	mf.On("GetFlagSource").Return(flags.SourceNoop)

	err := DeductCodeModeComputeMinutes(
		context.Background(),
		zaptest.NewLogger(t),
		store.Memory(),
		mf,
		"org-1", "TRIAL", 60000,
	)
	assert.NoError(t, err)
}

func TestDeductCodeModeComputeMinutes_SkipsWhenUnlimited(t *testing.T) {
	t.Parallel()

	mf := mockflags.NewFlags(t)
	mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
	mf.On("GetComputeMinutesPerWeekV2", "TRIAL", "org-1").Return(float64(math.MaxInt32))

	err := DeductCodeModeComputeMinutes(
		context.Background(),
		zaptest.NewLogger(t),
		store.Memory(),
		mf,
		"org-1", "TRIAL", 60000,
	)
	assert.NoError(t, err)
}

func TestDeductCodeModeComputeMinutes_DeductsAndAllows(t *testing.T) {
	t.Parallel()

	mf := mockflags.NewFlags(t)
	mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
	mf.On("GetComputeMinutesPerWeekV2", "TRIAL", "org-1").Return(float64(10))

	s := store.Memory()
	logger := zaptest.NewLogger(t)

	// 1 minute execution out of 10 minutes budget -- should pass.
	err := DeductCodeModeComputeMinutes(context.Background(), logger, s, mf, "org-1", "TRIAL", 60000)
	require.NoError(t, err)

	// Another 1 minute execution -- should still pass.
	err = DeductCodeModeComputeMinutes(context.Background(), logger, s, mf, "org-1", "TRIAL", 60000)
	require.NoError(t, err)
}

func TestDeductCodeModeComputeMinutes_ExhaustsBudget(t *testing.T) {
	t.Parallel()

	mf := mockflags.NewFlags(t)
	mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
	mf.On("GetComputeMinutesPerWeekV2", "TRIAL", "org-1").Return(float64(1))

	s := store.Memory()
	logger := zaptest.NewLogger(t)

	// 1 minute budget, 1.5 minute execution -- returns quota error after deduction.
	err := DeductCodeModeComputeMinutes(context.Background(), logger, s, mf, "org-1", "TRIAL", 90000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "compute")
}

func TestDeductCodeModeComputeMinutes_AlreadyExhausted(t *testing.T) {
	t.Parallel()

	mf := mockflags.NewFlags(t)
	mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
	mf.On("GetComputeMinutesPerWeekV2", "TRIAL", "org-1").Return(float64(1))

	s := store.Memory()
	logger := zaptest.NewLogger(t)

	// Exhaust the budget.
	_ = DeductCodeModeComputeMinutes(context.Background(), logger, s, mf, "org-1", "TRIAL", 90000)

	// Next call sees alloc <= 0 and blocks immediately.
	err := DeductCodeModeComputeMinutes(context.Background(), logger, s, mf, "org-1", "TRIAL", 1000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "compute")
}
