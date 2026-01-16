package sandboxmanager

import (
	"context"
)

// SandboxInfo contains information about a running sandbox
type SandboxInfo struct {
	Name    string
	Id      string
	Ip      string
	Address string // PodIP:Port for gRPC connection
}

type SandboxManager interface {
	CreateSandbox(ctx context.Context, sandboxId string) (*SandboxInfo, error)
	DeleteSandbox(ctx context.Context, sandboxId string) error
}
