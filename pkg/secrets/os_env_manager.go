package secrets

import (
	"os"
	"strings"
)

type SecretManager interface {
	GetSecrets() map[string]string
}

type osSecretManager struct {
	agentAppEnvs map[string]string
}

func NewSecretManager() SecretManager {
	agentAppEnvs := map[string]string{}
	for _, env := range os.Environ() {
		pair := strings.SplitN(env, "=", 2)
		key := pair[0]
		value := pair[1]
		if strings.HasPrefix(key, "SUPERBLOCKS_AGENT_APP_ENV_") {
			agentAppEnvs[strings.ToLower(key[26:])] = value
		}
	}
	return &osSecretManager{agentAppEnvs: agentAppEnvs}
}

func (o *osSecretManager) GetSecrets() map[string]string {
	return o.agentAppEnvs
}
