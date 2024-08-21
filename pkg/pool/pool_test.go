package pool

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestConfig(t *testing.T) {
	tests := []struct {
		name             string
		givenOptions     []Option
		doNotGiveOptions bool
		expectedOptions  *Options
		expectError      bool
	}{
		{
			name:         "empty list of options",
			givenOptions: []Option{},
			expectedOptions: &Options{
				size:   4,
				logger: zap.NewNop(),
			},
		},
		{
			name:             "default options when no options given",
			doNotGiveOptions: true,
			expectedOptions: &Options{
				size:   4,
				logger: zap.NewNop(),
			},
		},
		{
			name: "give only a size",
			givenOptions: []Option{
				Size(10),
			},
			expectedOptions: &Options{
				size:   10,
				logger: zap.NewNop(),
			},
		},
		{
			name: "give only a logger",
			givenOptions: []Option{
				Logger(zap.NewNop()),
			},
			expectedOptions: &Options{
				size:   4,
				logger: zap.NewNop(),
			},
		},
		{
			name: "give size and logger",
			givenOptions: []Option{
				Size(10),
				Logger(zap.NewNop()),
			},
			expectedOptions: &Options{
				size:   10,
				logger: zap.NewNop(),
			},
		},
		{
			name: "give zero size",
			givenOptions: []Option{
				Size(0),
			},
			expectedOptions: &Options{
				size:   0,
				logger: zap.NewNop(),
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var actualOptions *Options
			var err error
			if tt.doNotGiveOptions {
				actualOptions, err = config()
				actualOptions, err = config()
			} else {
				actualOptions, err = config(tt.givenOptions...)
			}

			if err != nil {
				assert.True(t, tt.expectError)
				return
			}
			assert.Equal(t, tt.expectedOptions.size, actualOptions.size)
			if tt.expectedOptions.logger == nil {
				assert.Nil(t, actualOptions.logger, "received non-nil logger when expecting a nil one")
			} else {
				assert.NotNil(t, actualOptions.logger, "received a nil logger when expecting a non-nil one")
			}

		})
	}
}
