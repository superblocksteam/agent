package sandbox

import (
	"context"

	"workers/ephemeral/task-manager/internal/sandboxmanager"
)

type mockSandboxManager struct {
	createFunc func(ctx context.Context, sandboxId string) (*sandboxmanager.SandboxInfo, error)
	deleteFunc func(ctx context.Context, sandboxId string) error
	watchFunc  func(ctx context.Context, jobName string) <-chan error
}

func (m *mockSandboxManager) CreateSandbox(ctx context.Context, sandboxId string) (*sandboxmanager.SandboxInfo, error) {
	if m.createFunc != nil {
		return m.createFunc(ctx, sandboxId)
	}
	return &sandboxmanager.SandboxInfo{
		Name:    "sandbox-" + sandboxId,
		Id:      sandboxId,
		Ip:      "10.0.0.1",
		Address: "10.0.0.1:50051",
	}, nil
}

func (m *mockSandboxManager) DeleteSandbox(ctx context.Context, sandboxId string) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, sandboxId)
	}
	return nil
}

func (m *mockSandboxManager) WatchSandboxPod(ctx context.Context, jobName string) <-chan error {
	if m.watchFunc != nil {
		return m.watchFunc(ctx, jobName)
	}
	return make(chan error)
}

// mockIpFilterSetter records AddAllowedIps / RemoveAllowedIps calls for tests.
type mockIpFilterSetter struct {
	added   []string
	removed []string
}

func (m *mockIpFilterSetter) AddAllowedIps(ips ...string) {
	m.added = append(m.added, ips...)
}

func (m *mockIpFilterSetter) RemoveAllowedIps(ips ...string) {
	m.removed = append(m.removed, ips...)
}
