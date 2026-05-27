package databaselifecycle

import (
	"bytes"
	"context"
	"errors"
	"os/exec"
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
