package cli

import (
	"os"
	"testing"

	"github.com/spf13/pflag"
	"github.com/stretchr/testify/require"
)

// These tests have to work around the fact that pflag.CommandLine is a
// package global. The ideal expectation, at the moment, is that packages
// use this global so these tests reflect that fact.

type args struct {
	args []string
	name string
}

func validArgs(t *testing.T) *args {
	t.Helper()

	t.Cleanup(func() {
		// need to restore the package global at the end of the test so
		// future tests don't redefine the same flag. this initialization
		// is how pflag currently initializes pflag.CommandLine
		pflag.CommandLine = pflag.NewFlagSet(os.Args[0], pflag.ExitOnError)
	})

	args := &args{
		name: "test",
	}
	args.args = []string{args.name}

	pflag.String("log.level", "info", "logging level")

	return args
}

func verifyArgs(t *testing.T, args *args, expectErrMsg string) *pflag.FlagSet {
	t.Helper()

	err := Parse(WithArgs(args.args))
	if expectErrMsg == "" {
		require.NoError(t, err, "unexpected error returned from Parse")
	} else {
		require.EqualError(t, err, expectErrMsg, "expected different error from Parse")
	}

	return pflag.CommandLine
}

func TestParseOkDefaults(t *testing.T) {
	args := validArgs(t)
	fs := verifyArgs(t, args, "")

	v, err := fs.GetString("log.level")
	require.NoError(t, err)
	require.Equal(t, "info", v)
}

func TestParseOkSpecified(t *testing.T) {
	args := validArgs(t)
	args.args = []string{args.name, "--log.level=debug"}
	fs := verifyArgs(t, args, "")

	v, err := fs.GetString("log.level")
	require.NoError(t, err)
	require.Equal(t, "debug", v)
}

func TestParseErrHelpSpecified(t *testing.T) {
	args := validArgs(t)
	args.args = []string{args.name, "--help"}
	_ = verifyArgs(t, args, "pflag.Parse error: pflag: help requested")
}

func TestParseErrInvalidOption(t *testing.T) {
	args := validArgs(t)
	args.args = []string{args.name, "--invalid"}
	_ = verifyArgs(t, args, "pflag.Parse error: unknown flag: --invalid")
}
