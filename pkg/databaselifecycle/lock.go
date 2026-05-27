package databaselifecycle

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"syscall"
)

var ErrResourceLocked = errors.New("database lifecycle resource is locked")

type ReleaseFunc func()

type ResourceLocker interface {
	Lock(context.Context, string) (ReleaseFunc, error)
}

type MemoryLocker struct {
	mutex  sync.Mutex
	locked map[string]struct{}
}

func NewMemoryLocker() *MemoryLocker {
	return &MemoryLocker{locked: map[string]struct{}{}}
}

func (l *MemoryLocker) Lock(ctx context.Context, resourceKey string) (ReleaseFunc, error) {
	if resourceKey == "" {
		return nil, errors.New("database lifecycle resource key is required")
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}

	l.mutex.Lock()
	defer l.mutex.Unlock()
	if _, ok := l.locked[resourceKey]; ok {
		return nil, ErrResourceLocked
	}
	l.locked[resourceKey] = struct{}{}
	return func() {
		l.mutex.Lock()
		defer l.mutex.Unlock()
		delete(l.locked, resourceKey)
	}, nil
}

type FileLocker struct {
	dir string
}

func NewFileLocker(dir string) *FileLocker {
	return &FileLocker{dir: dir}
}

func (l *FileLocker) Lock(ctx context.Context, resourceKey string) (ReleaseFunc, error) {
	if l.dir == "" {
		return nil, errors.New("database lifecycle lock directory is required")
	}
	if resourceKey == "" {
		return nil, errors.New("database lifecycle resource key is required")
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(l.dir, 0o700); err != nil {
		return nil, err
	}

	path := filepath.Join(l.dir, safeLockFilename(resourceKey))
	file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0o600)
	if err != nil {
		return nil, err
	}
	if err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX|syscall.LOCK_NB); errors.Is(err, syscall.EWOULDBLOCK) {
		_ = file.Close()
		return nil, ErrResourceLocked
	} else if err != nil {
		_ = file.Close()
		return nil, err
	}

	return func() {
		_ = syscall.Flock(int(file.Fd()), syscall.LOCK_UN)
		_ = file.Close()
	}, nil
}

const (
	lockFileSuffix      = ".lock"
	lockFileHashLen     = 12
	maxLockFilenameByte = 255
)

func safeLockFilename(resourceKey string) string {
	escaped := url.PathEscape(resourceKey)
	if len(escaped)+len(lockFileSuffix) <= maxLockFilenameByte {
		return escaped + lockFileSuffix
	}
	sum := sha256.Sum256([]byte(resourceKey))
	hash := hex.EncodeToString(sum[:])[:lockFileHashLen]
	maxPrefixLen := maxLockFilenameByte - len(lockFileSuffix) - len("-") - len(hash)
	return escaped[:maxPrefixLen] + "-" + hash + lockFileSuffix
}
