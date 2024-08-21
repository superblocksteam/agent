package plugins

// NOTE(frank): This IS NOT a Superblocks plugin.... Don't @ me.
type Plugin interface {
	Scanner
	Renderer
}
