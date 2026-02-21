package ipfiltermanager

import (
	"sync"

	"github.com/superblocksteam/agent/pkg/utils"
)

type IpFilterManager struct {
	allowedIps *utils.Set[string]
	mu         sync.RWMutex
}

func NewIpFilterManager(allowedIps ...string) *IpFilterManager {
	return &IpFilterManager{
		allowedIps: utils.NewSet(allowedIps...),
	}
}

func (m *IpFilterManager) GetAllowedIps() *utils.Set[string] {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return m.allowedIps.Clone()
}

func (m *IpFilterManager) AddAllowedIps(ips ...string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.allowedIps.Add(ips...)
}

func (m *IpFilterManager) RemoveAllowedIps(ips ...string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.allowedIps.Remove(ips...)
}

func (m *IpFilterManager) SetAllowedIps(ips ...string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.allowedIps.Clear()
	m.allowedIps.Add(ips...)
}
