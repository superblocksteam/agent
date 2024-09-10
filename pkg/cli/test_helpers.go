package cli

import (
	"reflect"
	"sync"
	"sync/atomic"

	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/require"
)

var _parseMu sync.Mutex
var _parseMuCount atomic.Int64
var _parseMap sync.Map

type TestingT interface {
	Cleanup(func())
	Errorf(format string, args ...interface{})
	FailNow()
}

type pflagStringSlicer interface {
	GetSlice() []string
}

// TPflagParse creates a local FlagSet copy mirroring pflag.CommandLine (global FlagSet), calls
// fs.Parse and binds to viper global. This function takes a global lock ensuring serialization
// of all callers. It may be called sequentially within the same `t` (address of `t` is utilized
// in internal locking) without issue, but calls between several tests will compete for a single
// lock ensuring serialization of execution. This is primarily due to global `viper` instance.
//
// Several packages use pflag.CommandLine global in init() functions which makes testing
// complicated because naive Parses using the global FlagSet are not isolated between tests and
// the "set value" leaks between tests. This function addresses these issues.
//
// Run tests with `-count=2` to verify proper behavior.
//
// Types with special handling:
//
//	stringSlice - creates new flag of same type throwing away original pointer reader feature
func TPflagParse(t TestingT, args []string) *pflag.FlagSet {
	_, ok := _parseMap.Load(t) // only lock once per test
	if !ok {
		_parseMu.Lock() // only one test may modify global state at a time
		_parseMap.Store(t, t)
	}
	_parseMuCount.Add(1)
	t.Cleanup(func() {
		c := _parseMuCount.Add(-1)
		if c == 0 {
			_parseMap.Delete(t)
			_parseMu.Unlock()
		}
	})

	fs := pflag.NewFlagSet("test", pflag.ContinueOnError)

	// fs.AddFlagSet but make copies instead of mutating same global flag
	pflag.CommandLine.VisitAll(func(flag *pflag.Flag) {
		if flag.Value.Type() == "stringSlice" {
			os := flag.Value.(pflagStringSlicer).GetSlice()
			ns := make([]string, len(os))
			for i, s := range os {
				ns[i] = s
			}

			fs.StringSliceP(
				flag.Name,
				flag.Shorthand,
				ns,
				flag.Usage,
			)
		} else {
			var newFlag pflag.Flag
			newFlag = *flag
			newFlag.Value = reflect.New(reflect.ValueOf(newFlag.Value).Elem().Type()).Interface().(pflag.Value)
			reflect.ValueOf(newFlag.Value).Elem().Set(reflect.ValueOf(flag.Value).Elem())
			if fs.Lookup(newFlag.Name) == nil {
				fs.AddFlag(&newFlag)
			}
		}
	})

	err := fs.Parse(args)
	require.NoError(t, err)
	err = viper.BindPFlags(fs)
	require.NoError(t, err)

	return fs
}
