package databaselifecycle

import (
	"bytes"
	"context"
	"errors"
	"os"
	"os/exec"
	"sort"
)

type BinaryCommandExecutor struct {
	binary string
}

func NewBinaryCommandExecutor(binary string) *BinaryCommandExecutor {
	return &BinaryCommandExecutor{binary: binary}
}

func (e *BinaryCommandExecutor) Run(ctx context.Context, command Command) (CommandResult, error) {
	if e.binary == "" {
		return CommandResult{}, errors.New("database lifecycle Terraform binary is required")
	}

	args := append([]string{command.Name}, command.Args...)
	cmd := exec.CommandContext(ctx, e.binary, args...)
	cmd.Dir = command.Dir
	cmd.Env = terraformCommandEnv(commandEnvironment(os.Environ(), command.Env), command.Dir)
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	err := cmd.Run()
	return CommandResult{
		Stdout: stdout.String(),
		Stderr: stderr.String(),
	}, err
}

func commandEnvironment(inherited []string, overrides map[string]string) []string {
	if len(overrides) == 0 {
		return inherited
	}
	env := make(map[string]string, len(inherited)+len(overrides))
	for _, entry := range inherited {
		for index := 0; index < len(entry); index++ {
			if entry[index] == '=' {
				env[entry[:index]] = entry[index+1:]
				break
			}
		}
	}
	for key, value := range overrides {
		env[key] = value
	}
	keys := make([]string, 0, len(env))
	for key := range env {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	combined := make([]string, 0, len(keys))
	for _, key := range keys {
		combined = append(combined, key+"="+env[key])
	}
	return combined
}
