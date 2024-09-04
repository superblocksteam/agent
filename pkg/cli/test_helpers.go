package cli

import (
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/require"
)

// TPflagParse creates a local FlagSet mirroring pflag.CommandLine (global FlagSet), calls
// fs.Parse and binds to viper global.
//
// Several packages use pflag.CommandLine global in init() functions which makes testing
// complicated because Parse may only be called once per FlagSet.
//
// Another side effect of this pattern is that tests utilizing these global pflags must not call
// t.Parallel() prior to initialization (reading viper bound values) as it would cause races between
// tests as to the value.
func TPflagParse(t require.TestingT, args []string) {
	// rebind global pflag.CommandLine to local var so we can call Parse many times and bind that
	// to viper; unfortunately, pflag/viper are managed as runtime globals so tests cannot be
	// parallel or flakes ensue as a test cannot be guaranteed what values it'll get (globals could
	// be changed by another test running in parallel)
	fs := pflag.NewFlagSet("test", pflag.ContinueOnError)
	fs.AddFlagSet(pflag.CommandLine)
	err := fs.Parse(args)
	require.NoError(t, err)
	err = viper.BindPFlags(fs)
	require.NoError(t, err)
}
