package databaselifecycle

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"path/filepath"
	"regexp"
	"strings"
)

type PathJobBuilder struct {
	rootDir string
}

func NewPathJobBuilder(rootDir string) *PathJobBuilder {
	return &PathJobBuilder{rootDir: rootDir}
}

func (b *PathJobBuilder) Build(dispatch DispatchPayload) (Job, error) {
	if b.rootDir == "" {
		return Job{}, errors.New("database lifecycle root directory is required")
	}
	if dispatch.BindingKey == "" {
		return Job{}, errors.New("database lifecycle binding key is required")
	}

	segment := safeBindingPathSegment(dispatch.BindingKey)
	if segment == "" {
		return Job{}, errors.New("database lifecycle binding key has no safe path segment")
	}
	workingDir := filepath.Join(b.rootDir, segment)
	rel, err := filepath.Rel(b.rootDir, workingDir)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || filepath.IsAbs(rel) {
		return Job{}, errors.New("database lifecycle working directory escapes root directory")
	}
	return Job{
		BindingKey:  dispatch.BindingKey,
		WorkingDir:  workingDir,
		MainFile:    filepath.Join(workingDir, "main.tf"),
		BackendFile: filepath.Join(workingDir, "backend.tfbackend"),
		VarsFile:    filepath.Join(workingDir, "terraform.tfvars.json"),
	}, nil
}

var unsafePathSegmentPattern = regexp.MustCompile(`[^A-Za-z0-9._-]+`)

const (
	maxPathSegmentBytes = 255
	pathSegmentHashLen  = 12
)

func safeBindingPathSegment(value string) string {
	sanitized := unsafePathSegmentPattern.ReplaceAllString(value, "-")
	sanitized = strings.Trim(sanitized, "-")
	if strings.Trim(sanitized, "._-") == "" {
		sanitized = "binding"
	}
	sum := sha256.Sum256([]byte(value))
	hash := hex.EncodeToString(sum[:])[:pathSegmentHashLen]
	maxPrefixLen := maxPathSegmentBytes - len("-") - len(hash)
	if len(sanitized) > maxPrefixLen {
		sanitized = strings.Trim(sanitized[:maxPrefixLen], "-")
		if strings.Trim(sanitized, "._-") == "" {
			sanitized = "binding"
		}
	}
	return sanitized + "-" + hash
}
