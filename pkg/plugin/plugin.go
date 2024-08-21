package plugin

type Plugin interface {
	Name() string
	Type() string
	Build() (map[string]any, error)
}
