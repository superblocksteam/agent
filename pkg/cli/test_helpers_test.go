package cli

import (
	"testing"

	"github.com/spf13/pflag"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/require"
)

const testOptionDefault = "default"

func init() {
	pflag.String("cli.test.option", testOptionDefault, "test option only")
	pflag.StringSlice("cli.test.stringslice", []string{"default"}, "test option only")
}

func TestTPflagParseOk(t *testing.T) {
	t.Parallel() // just ensures no issues to serialization of TPflagParse

	TPflagParse(t, nil)
	require.Equal(t, testOptionDefault, viper.GetString("cli.test.option"))
}

func TestTPflagParseOkNonDefault(t *testing.T) {
	t.Parallel() // just ensures no issues to serialization of TPflagParse

	TPflagParse(t, []string{
		"--cli.test.option=nondefault",
	})
	require.Equal(t, "nondefault", viper.GetString("cli.test.option"))
}

func TestTPflagParseOkMultipleTimes(t *testing.T) {
	t.Parallel() // just ensures no issues to serialization of TPflagParse

	TPflagParse(t, []string{
		"--cli.test.option=one",
	})
	require.Equal(t, "one", viper.GetString("cli.test.option"))

	TPflagParse(t, []string{
		"--cli.test.option=two",
	})
	require.Equal(t, "two", viper.GetString("cli.test.option"))
}

func TestTPflagParseOkStringSlice(t *testing.T) {
	t.Parallel() // just ensures no issues to serialization of TPflagParse

	TPflagParse(t, []string{})
	require.Equal(t, []string{"default"}, viper.GetStringSlice("cli.test.stringslice"))

	TPflagParse(t, []string{
		"--cli.test.stringslice=one",
	})
	require.Equal(t, []string{"one"}, viper.GetStringSlice("cli.test.stringslice"))

	TPflagParse(t, []string{
		"--cli.test.stringslice=one",
		"--cli.test.stringslice=two",
	})
	require.Equal(t, []string{"one", "two"}, viper.GetStringSlice("cli.test.stringslice"))
}
