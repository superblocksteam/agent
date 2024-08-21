package emitter

import (
	"time"

	"go.uber.org/zap"

	"github.com/superblocksteam/run"
)

//go:generate mockery --name=Emitter --output ./mocks --structname Emitter
type Emitter interface {
	Write(time time.Time, level string, message string, fields map[string]any) error
	Trigger() string
	Flush(chan struct{}) error
	Enabled() bool
	Logger(*zap.Logger)

	run.Runnable
}
