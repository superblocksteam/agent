package cli

type config struct {
	args      []string
	envPrefix string
	name      string
}

type Option func(*config)

func WithArgs(args []string) Option {
	return func(c *config) {
		c.args = args
	}
}

func WithEnvPrefix(envPrefix string) Option {
	return func(c *config) {
		c.envPrefix = envPrefix
	}
}

func WithName(name string) Option {
	return func(c *config) {
		c.name = name
	}
}
