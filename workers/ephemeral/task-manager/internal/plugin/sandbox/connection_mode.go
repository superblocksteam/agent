package sandbox

type SandboxConnectionMode uint

const (
	SandboxConnectionModeUnspecified SandboxConnectionMode = iota
	SandboxConnectionModeStatic
	SandboxConnectionModeDynamic
)
