package ratelimit

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/superblocksteam/agent/internal/flags"
	mockflags "github.com/superblocksteam/agent/internal/flags/mock"
	"github.com/superblocksteam/agent/pkg/store"
	"go.uber.org/zap/zaptest"
)

func TestCheckCodeModeRateLimit_SkipsWhenFlagsDisabled(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name  string
		flags flags.Flags
	}{
		{
			name:  "nil flags",
			flags: nil,
		},
		{
			name: "noop flags",
			flags: func() flags.Flags {
				mf := new(mockflags.Flags)
				mf.On("GetFlagSource").Return(flags.SourceNoop)
				return mf
			}(),
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			err := CheckCodeModeRateLimit(
				context.Background(),
				zaptest.NewLogger(t),
				store.Memory(),
				test.flags,
				&CodeModeQuotaParams{OrgID: "org-1", OrgTier: "TRIAL", ApiID: "api-1"},
			)
			assert.NoError(t, err)
		})
	}
}

func TestCheckCodeModeRateLimit_InvalidConfigAllowsRequest(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name string
		cfg  map[string]any
	}{
		{
			name: "missing value field",
			cfg:  map[string]any{"units": "seconds"},
		},
		{
			name: "non-numeric value",
			cfg:  map[string]any{"value": "ten", "units": "seconds"},
		},
		{
			name: "unsupported units",
			cfg:  map[string]any{"value": 5, "units": "days"},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			s := store.Memory()
			mf := new(mockflags.Flags)
			mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
			mf.On("GetCodeModeRatePerApiV2", mock.Anything, mock.Anything).Return(test.cfg)
			logger := zaptest.NewLogger(t)
			params := &CodeModeQuotaParams{OrgID: "org-1", OrgTier: "TRIAL", ApiID: "api-1"}

			err := CheckCodeModeRateLimit(context.Background(), logger, s, mf, params)
			assert.NoError(t, err)
		})
	}
}

func TestCheckCodeModeRateLimit_ZeroBlocksEverything(t *testing.T) {
	t.Parallel()

	s := store.Memory()
	mf := new(mockflags.Flags)
	mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
	mf.On("GetCodeModeRatePerApiV2", mock.Anything, mock.Anything).Return(map[string]any{
		"value": 0,
		"units": "minutes",
	})
	logger := zaptest.NewLogger(t)
	params := &CodeModeQuotaParams{OrgID: "org-1", OrgTier: "TRIAL", ApiID: "api-1"}

	err := CheckCodeModeRateLimit(context.Background(), logger, s, mf, params)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not available on your current plan")
}

func TestCheckCodeModeRateLimit_PerApiLimitBreached(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name      string
		cfg       map[string]any
		calls     int
		wantErr   bool
		expectMsg string
	}{
		{
			name:      "within budget minute window",
			cfg:       map[string]any{"value": 30, "units": "minutes"},
			calls:     20,
			wantErr:   false,
			expectMsg: "",
		},
		{
			name:      "at exact limit minute window",
			cfg:       map[string]any{"value": 30, "units": "minutes"},
			calls:     30,
			wantErr:   false,
			expectMsg: "",
		},
		{
			name:      "exceeds limit minute window",
			cfg:       map[string]any{"value": 30, "units": "minutes"},
			calls:     31,
			wantErr:   true,
			expectMsg: "30 per minute",
		},
		{
			name:      "sub 1 rps represented as 1 per minute",
			cfg:       map[string]any{"value": 1, "units": "minutes"},
			calls:     2,
			wantErr:   true,
			expectMsg: "1 per minute",
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			s := store.Memory()
			mf := new(mockflags.Flags)
			mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
			mf.On("GetCodeModeRatePerApiV2", mock.Anything, mock.Anything).Return(test.cfg)
			logger := zaptest.NewLogger(t)
			params := &CodeModeQuotaParams{OrgID: "org-1", OrgTier: "TRIAL", ApiID: "api-1"}

			var lastErr error
			for i := 0; i < test.calls; i++ {
				if err := CheckCodeModeRateLimit(context.Background(), logger, s, mf, params); err != nil {
					lastErr = err
				}
			}

			if test.wantErr {
				require.Error(t, lastErr)
				assert.Contains(t, lastErr.Error(), test.expectMsg)
			} else {
				assert.NoError(t, lastErr)
			}
		})
	}
}

func TestCheckCodeModeRateLimit_ApisAreIsolated(t *testing.T) {
	t.Parallel()

	s := store.Memory()
	mf := new(mockflags.Flags)
	mf.On("GetFlagSource").Return(flags.SourceLaunchDarkly)
	mf.On("GetCodeModeRatePerApiV2", mock.Anything, mock.Anything).Return(map[string]any{
		"value": 5,
		"units": "seconds",
	})
	logger := zaptest.NewLogger(t)

	api1 := &CodeModeQuotaParams{OrgID: "org-1", OrgTier: "TRIAL", ApiID: "api-1"}
	api2 := &CodeModeQuotaParams{OrgID: "org-1", OrgTier: "TRIAL", ApiID: "api-2"}

	for i := 0; i < 4; i++ {
		require.NoError(t, CheckCodeModeRateLimit(context.Background(), logger, s, mf, api1))
	}

	for i := 0; i < 4; i++ {
		require.NoError(t, CheckCodeModeRateLimit(context.Background(), logger, s, mf, api2))
	}
}
