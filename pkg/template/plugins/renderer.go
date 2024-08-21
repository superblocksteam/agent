package plugins

type Renderer interface {
	Render([]string) (string, error)
}
