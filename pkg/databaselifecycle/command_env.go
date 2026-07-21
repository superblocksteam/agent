package databaselifecycle

import "strings"

// defaultDockerConfigDir is the image-packaged Docker config directory that
// points OpenTofu OCI pulls at docker-credential-ecr-login. The OPA and
// orchestrator images install that helper and a matching config.json here.
const defaultDockerConfigDir = "/etc/superblocks/docker"

// terraformCommandEnv builds the environment for a tofu subprocess. It injects
// DOCKER_CONFIG when unset so OpenTofu can resolve ECR OCI credentials via
// docker-credential-ecr-login, and rewrites PWD to match command.Dir so shells
// do not keep the parent process working directory after we set cmd.Env.
func terraformCommandEnv(base []string, dir string) []string {
	env := ensureDockerConfigEnv(omitEnvKeys(base, "PWD"))
	if dir != "" {
		env = append(env, "PWD="+dir)
	}
	return env
}

// ensureDockerConfigEnv injects DOCKER_CONFIG when the caller has not already
// set a non-empty value. OpenTofu resolves OCI registry credentials through
// Docker-style config (including credsStore helpers); without this, tofu init
// against an oci://*.dkr.ecr.*.amazonaws.com module source fails with
// "basic credential not found" even when the pod has IRSA credentials.
func ensureDockerConfigEnv(env []string) []string {
	out := make([]string, 0, len(env)+1)
	hasDockerConfig := false
	for _, entry := range env {
		if strings.HasPrefix(entry, "DOCKER_CONFIG=") {
			if strings.TrimPrefix(entry, "DOCKER_CONFIG=") == "" {
				continue
			}
			hasDockerConfig = true
		}
		out = append(out, entry)
	}
	if !hasDockerConfig {
		out = append(out, "DOCKER_CONFIG="+defaultDockerConfigDir)
	}
	return out
}

func omitEnvKeys(env []string, keys ...string) []string {
	deny := make(map[string]struct{}, len(keys))
	for _, key := range keys {
		deny[key] = struct{}{}
	}
	out := make([]string, 0, len(env))
	for _, entry := range env {
		key, _, _ := strings.Cut(entry, "=")
		if _, skip := deny[key]; skip {
			continue
		}
		out = append(out, entry)
	}
	return out
}
