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
}

func TestTPflagParseOk(t *testing.T) {
	TPflagParse(t, nil)
	require.Equal(t, testOptionDefault, viper.GetString("cli.test.option"))
}

func TestTPflagParseOkNonDefault(t *testing.T) {
	TPflagParse(t, []string{
		"--cli.test.option=nondefault",
	})
	require.Equal(t, "nondefault", viper.GetString("cli.test.option"))
}
