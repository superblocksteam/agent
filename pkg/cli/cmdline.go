package cli

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/pflag"
	"github.com/spf13/viper"
)

// Parse runs |pflag.Parse| and sets up viper.
func Parse(options ...Option) error {
	return ParseWithFlagSet(pflag.CommandLine, options...)
}

func ParseWithFlagSet(fs *pflag.FlagSet, options ...Option) error {
	c := &config{
		args: os.Args,
		name: filepath.Base(os.Args[0]),
	}
	c.envPrefix = strings.ToUpper(c.name)
	for _, opt := range options {
		opt(c)
	}

	fs.String("config.path", "./"+c.name+".yaml", "config file path")

	fs.Init(c.name, pflag.ContinueOnError)
	err := fs.Parse(c.args)
	if err != nil {
		return fmt.Errorf("pflag.Parse error: %w", err)
	}

	err = viper.BindPFlags(fs)
	if err != nil {
		return fmt.Errorf("viper.BindPFlags error: %w", err)
	}

	viper.SetEnvPrefix(c.envPrefix)
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if path := viper.GetString("config.path"); path != "" {
		viper.SetConfigFile(path)
		if err := viper.ReadInConfig(); err != nil {
			fmt.Fprintf(os.Stderr, "error: failed to load a config file, ignoring: %s\n", err)
		}
	}

	return nil
}
