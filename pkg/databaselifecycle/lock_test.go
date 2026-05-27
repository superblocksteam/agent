package databaselifecycle

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMemoryLockerAllowsOneHolderPerResourceKey(t *testing.T) {
	locker := NewMemoryLocker()

	release, err := locker.Lock(context.Background(), "resource-1")
	require.NoError(t, err)

	_, err = locker.Lock(context.Background(), "resource-1")
	require.ErrorIs(t, err, ErrResourceLocked)

	release()
	_, err = locker.Lock(context.Background(), "resource-1")
	require.NoError(t, err)
}

func TestFileLockerPreventsConcurrentResourceUse(t *testing.T) {
	locker := NewFileLocker(t.TempDir())

	release, err := locker.Lock(context.Background(), "app/prod/orders")
	require.NoError(t, err)
	defer release()

	_, err = locker.Lock(context.Background(), "app/prod/orders")
	require.ErrorIs(t, err, ErrResourceLocked)

	release()
	_, err = locker.Lock(context.Background(), "app/prod/orders")
	require.NoError(t, err)
}

func TestFileLockerRequiresRootDir(t *testing.T) {
	locker := NewFileLocker("")

	_, err := locker.Lock(context.Background(), "resource-1")

	require.ErrorContains(t, err, "database lifecycle lock directory is required")
}

func TestMemoryLockerRejectsMissingResourceKeys(t *testing.T) {
	locker := NewMemoryLocker()

	_, err := locker.Lock(context.Background(), "")

	require.ErrorContains(t, err, "resource key is required")
}

func TestFileLockerRejectsMissingResourceKey(t *testing.T) {
	locker := NewFileLocker(t.TempDir())

	_, err := locker.Lock(context.Background(), "")
	require.ErrorContains(t, err, "resource key is required")
}

func TestFileLockerRespectsCanceledContext(t *testing.T) {
	// FileLocker.Lock checks ctx.Err() before any filesystem work so a
	// caller that already canceled (e.g. shutdown signal mid-claim) gets
	// a clean exit rather than a stale .lock file.
	locker := NewFileLocker(t.TempDir())
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err := locker.Lock(ctx, "binding-A")
	require.ErrorIs(t, err, context.Canceled)
}

func TestFileLockerEscapesResourceKeyWithSlashesInFilename(t *testing.T) {
	// Resource keys like "app/prod/orders" are url-PathEscape'd into a
	// single .lock filename — locks across orgs that happen to share
	// path components cannot collide via filesystem hierarchy. Verifies
	// the resulting filename has no embedded separator and reflects the
	// escape.
	dir := t.TempDir()
	locker := NewFileLocker(dir)

	release, err := locker.Lock(context.Background(), "app/prod/orders")
	require.NoError(t, err)
	defer release()

	entries, err := os.ReadDir(dir)
	require.NoError(t, err)
	require.Len(t, entries, 1)
	require.Equal(t, "app%2Fprod%2Forders.lock", entries[0].Name())
}

func TestFileLockerTruncatesLongResourceKeyLockFilenames(t *testing.T) {
	dir := t.TempDir()
	locker := NewFileLocker(dir)
	resourceKey := strings.Repeat("very-long-app:profile:resource:", 12)

	release, err := locker.Lock(context.Background(), resourceKey)
	require.NoError(t, err)
	defer release()

	entries, err := os.ReadDir(dir)
	require.NoError(t, err)
	require.Len(t, entries, 1)
	require.LessOrEqual(t, len(entries[0].Name()), 255)
	require.Regexp(t, `-[a-f0-9]{12}\.lock$`, entries[0].Name())
}

func TestFileLockerReturnsErrorWhenLockPathIsADirectory(t *testing.T) {
	// If a stale directory (e.g. from a previous failed run) sits where
	// the lock file should live, os.OpenFile returns EISDIR / "is a
	// directory" — surface it as an error rather than panicking.
	root := t.TempDir()
	locker := NewFileLocker(root)
	require.NoError(t, os.MkdirAll(filepath.Join(root, "binding-Z.lock"), 0o700))

	_, err := locker.Lock(context.Background(), "binding-Z")
	require.Error(t, err)
}
