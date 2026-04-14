package ratelimit

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestParseRateLimit(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name    string
		raw     map[string]any
		want    RateLimit
		wantErr bool
	}{
		{
			name: "seconds",
			raw:  map[string]any{"value": float64(10), "units": "seconds"},
			want: RateLimit{Value: 10, Units: UnitsSecond},
		},
		{
			name: "minute singular",
			raw:  map[string]any{"value": float64(30), "units": "minute"},
			want: RateLimit{Value: 30, Units: UnitsMinute},
		},
		{
			name: "hours abbreviated",
			raw:  map[string]any{"value": float64(1), "units": "hr"},
			want: RateLimit{Value: 1, Units: UnitsHour},
		},
		{
			name: "integer value",
			raw:  map[string]any{"value": 5, "units": "seconds"},
			want: RateLimit{Value: 5, Units: UnitsSecond},
		},
		{
			name:    "missing value field",
			raw:     map[string]any{"units": "seconds"},
			wantErr: true,
		},
		{
			name:    "non-numeric value",
			raw:     map[string]any{"value": "ten", "units": "seconds"},
			wantErr: true,
		},
		{
			name:    "unsupported units",
			raw:     map[string]any{"value": float64(5), "units": "days"},
			wantErr: true,
		},
		{
			name:    "missing units",
			raw:     map[string]any{"value": float64(5)},
			wantErr: true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			got, err := ParseRateLimit(test.raw)
			if test.wantErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, test.want, got)
			}
		})
	}
}

func TestRateLimit_WindowDuration(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name    string
		rl      RateLimit
		want    time.Duration
		wantErr bool
	}{
		{name: "seconds", rl: RateLimit{Units: UnitsSecond}, want: time.Second},
		{name: "minutes", rl: RateLimit{Units: UnitsMinute}, want: time.Minute},
		{name: "hours", rl: RateLimit{Units: UnitsHour}, want: time.Hour},
		{name: "invalid", rl: RateLimit{Units: "days"}, wantErr: true},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			got, err := test.rl.WindowDuration()
			if test.wantErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, test.want, got)
			}
		})
	}
}
