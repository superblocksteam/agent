package databaselifecycle

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPathJobBuilderBuildsDeterministicPerBindingPaths(t *testing.T) {
	builder := NewPathJobBuilder("/var/lib/superblocks/database-lifecycle")
	segment := safeBindingPathSegment("app:prod:prod:orders/db:postgres")

	job, err := builder.Build(DispatchPayload{
		BindingKey: "app:prod:prod:orders/db:postgres",
		RequestID:  "request-1",
	})

	require.NoError(t, err)
	require.Equal(t, Job{
		BindingKey:  "app:prod:prod:orders/db:postgres",
		WorkingDir:  "/var/lib/superblocks/database-lifecycle/" + segment,
		MainFile:    "/var/lib/superblocks/database-lifecycle/" + segment + "/main.tf",
		BackendFile: "/var/lib/superblocks/database-lifecycle/" + segment + "/backend.tfbackend",
		VarsFile:    "/var/lib/superblocks/database-lifecycle/" + segment + "/terraform.tfvars.json",
	}, job)
}

func TestPathJobBuilderRejectsMissingBindingKeys(t *testing.T) {
	builder := NewPathJobBuilder("/var/lib/superblocks/database-lifecycle")

	_, err := builder.Build(DispatchPayload{RequestID: "request-1"})

	require.ErrorContains(t, err, "binding key is required")
}

func TestPathJobBuilderRejectsMissingRootDir(t *testing.T) {
	builder := NewPathJobBuilder("")

	_, err := builder.Build(DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"})

	require.ErrorContains(t, err, "root directory is required")
}

func TestPathJobBuilderDoesNotAllowDotSegmentsToEscapeRoot(t *testing.T) {
	builder := NewPathJobBuilder("/var/lib/superblocks/database-lifecycle")

	job, err := builder.Build(DispatchPayload{BindingKey: "..", RequestID: "request-1"})

	require.NoError(t, err)
	require.Equal(t, "/var/lib/superblocks/database-lifecycle/"+safeBindingPathSegment(".."), job.WorkingDir)
}

func TestPathJobBuilderAvoidsSanitizedBindingKeyCollisions(t *testing.T) {
	builder := NewPathJobBuilder("/var/lib/superblocks/database-lifecycle")

	first, err := builder.Build(DispatchPayload{BindingKey: "orders/db", RequestID: "request-1"})
	require.NoError(t, err)
	second, err := builder.Build(DispatchPayload{BindingKey: "orders-db", RequestID: "request-2"})
	require.NoError(t, err)

	require.NotEqual(t, first.WorkingDir, second.WorkingDir)
	require.Contains(t, first.WorkingDir, "orders-db-")
	require.Contains(t, second.WorkingDir, "orders-db-")
}

func TestPathJobBuilderTruncatesLongBindingPathSegments(t *testing.T) {
	builder := NewPathJobBuilder("/var/lib/superblocks/database-lifecycle")
	longBindingKey := strings.Repeat("very-long-application-profile-resource-name-", 10)

	job, err := builder.Build(DispatchPayload{BindingKey: longBindingKey, RequestID: "request-1"})

	require.NoError(t, err)
	require.LessOrEqual(t, len(filepath.Base(job.WorkingDir)), 255)
	require.Regexp(t, `-[a-f0-9]{12}$`, filepath.Base(job.WorkingDir))
}
