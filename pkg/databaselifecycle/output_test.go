package databaselifecycle

import (
	"errors"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestReadyCallbackFromTerraformOutputUsesOnlyConnectionMetadataAndRuntimeCredentialRefs(t *testing.T) {
	callback, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_database",
			RequestID:  "request-1",
		},
		Result{
			OutputJSON: `{
				"connection_metadata":{"sensitive":false,"type":["object",{}],"value":{"database":"orders","host":"orders.internal","port":5432}},
				"runtime_credential_refs":{"sensitive":false,"type":["object",{}],"value":{"password":{"resolver":"vault","ref":"database/orders/runtime","field":"password"}}},
				"migration_credential_refs":{"sensitive":false,"type":["object",{}],"value":{"password":{"resolver":"vault","ref":"database/orders/migration","field":"password"}}},
				"password":{"sensitive":true,"type":"string","value":"[REDACTED]"}
			}`,
		},
	)

	require.NoError(t, err)
	require.Equal(t, TerminalCallback{
		BindingKey:     "app:prod:orders",
		LifecycleState: "ready",
		MigrationState: "pending",
		RequestID:      "request-1",
		ConnectionMetadata: map[string]any{
			"database": "orders",
			"host":     "orders.internal",
			"port":     float64(5432),
		},
		RuntimeCredentialRefs: map[string]any{
			"password": map[string]any{
				"resolver": "vault",
				"ref":      "database/orders/runtime",
				"field":    "password",
			},
		},
		MigrationCredentialRefs: map[string]any{
			"password": map[string]any{
				"resolver": "vault",
				"ref":      "database/orders/migration",
				"field":    "password",
			},
		},
	}, callback)
	require.NotContains(t, callback.RuntimeCredentialRefs, "password.value")
}

func TestReadyCallbackFromTerraformOutputCanParseSecretLikeUnusedOutputs(t *testing.T) {
	callback, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_database",
			RequestID:  "request-1",
		},
		Result{
			OutputJSON: `{
				"connection_metadata":{"sensitive":false,"type":["object",{}],"value":{"database":"orders"}},
				"password":{"sensitive":true,"type":"string","value":"raw-secret"}
			}`,
		},
	)

	require.NoError(t, err)
	require.Equal(t, map[string]any{"database": "orders"}, callback.ConnectionMetadata)
	require.Nil(t, callback.RuntimeCredentialRefs)
}

func TestReadyCallbackFromTerraformOutputIncludesReservedPhysicalDatabaseInstanceRef(t *testing.T) {
	callback, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			BindingKey:                 "app:prod:orders",
			Operation:                  "ensure_database",
			PhysicalDatabaseInstanceID: "11111111-1111-4111-8111-111111111111",
			RequestID:                  "request-1",
		},
		Result{
			OutputJSON: `{
				"connection_metadata":{"sensitive":false,"type":["object",{}],"value":{"database":"orders","host":"orders.internal","port":5432}}
			}`,
		},
	)

	require.NoError(t, err)
	require.Equal(t, map[string]any{
		"database":                       "orders",
		"host":                           "orders.internal",
		"physical_database_instance_ref": "11111111-1111-4111-8111-111111111111",
		"port":                           float64(5432),
	}, callback.ConnectionMetadata)
}

func TestReadyCallbackFromTerraformOutputDefaultsMigrationStateToPending(t *testing.T) {
	// MigrationState defaults to "pending" out of ReadyCallbackFromTerraformOutput;
	// the migration runner upgrades it to "migrated" inside ProcessDispatch
	// once the SQL apply succeeds.
	callback, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "migrate_schema",
			RequestID:  "request-1",
		},
		Result{OutputJSON: `{}`},
	)

	require.NoError(t, err)
	require.Equal(t, "pending", callback.MigrationState)
}

func TestReadyCallbackFromTerraformOutputRejectsMalformedOutput(t *testing.T) {
	_, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		Result{OutputJSON: `{`},
	)

	require.ErrorContains(t, err, "decode terraform output")
}

func TestFailedCallbackFromErrorUsesLifecycleErrorTaxonomy(t *testing.T) {
	callback := FailedCallbackFromError(
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		&LifecycleError{
			Code: ErrorCodePolicyBlocked,
			Err:  errors.New("OPA policy blocked plan"),
		},
	)

	require.Equal(t, TerminalCallback{
		BindingKey:     "app:prod:orders",
		LifecycleState: "failed",
		// policy_blocked happens during the plan stage, BEFORE any
		// migration has been attempted, so the binding's migrationState
		// must stay pending rather than be silently marked failed
		// (cursor r3236327922). The dedicated
		// TestFailedCallbackFromErrorMigrationFailedSetsMigrationState
		// below pins the migration_failed → "failed" branch.
		MigrationState:          "pending",
		RequestID:               "request-1",
		ConnectionMetadata:      nil,
		RuntimeCredentialRefs:   nil,
		MigrationCredentialRefs: nil,
		Error: &TerminalCallbackError{
			Code:    "policy_blocked",
			Message: "policy_blocked: OPA policy blocked plan",
		},
	}, callback)
}

func TestFailedCallbackFromErrorMigrationFailedSetsMigrationState(t *testing.T) {
	// Regression: cursor r3236327922. Only ErrorCodeMigrationFailed should
	// land the binding's migrationState in "failed"; every other lifecycle
	// error class happened BEFORE the migration runner ran (or in a
	// non-migration operation entirely), so the migration is conceptually
	// still pending and the next ensure() can pick it up.
	callback := FailedCallbackFromError(
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		&LifecycleError{
			Code: ErrorCodeMigrationFailed,
			Err:  errors.New("schema migration 003 failed: relation already exists"),
		},
	)
	require.Equal(t, "failed", callback.MigrationState)
}

func TestFailedCallbackFromErrorDefaultsUnknownErrorsToTerraformFailed(t *testing.T) {
	callback := FailedCallbackFromError(
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		errors.New("exit status 1"),
	)

	require.Equal(t, "terraform_failed", callback.Error.Code)
	require.Equal(t, "exit status 1", callback.Error.Message)
}

func TestFailedCallbackFromErrorWithLogsDoesNotForwardCommandOutput(t *testing.T) {
	callback := FailedCallbackFromErrorWithLogs(
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		errors.New("exit status 1"),
		[]string{
			"Initializing the backend...",
			`Error: password=super-secret dsn=postgres://user:pass@db.internal/orders`,
		},
	)

	require.Equal(t, "terraform_failed", callback.Error.Code)
	require.Equal(t, "exit status 1", callback.Error.Message)
	require.NotContains(t, callback.Error.Message, "super-secret")
	require.NotContains(t, callback.Error.Message, "pass@")
}

func TestFailedCallbackFromErrorWithLogsIgnoresLargeCommandOutput(t *testing.T) {
	bigEntry := strings.Repeat("x", 8192)
	callback := FailedCallbackFromErrorWithLogs(
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		errors.New("exit status 1"),
		[]string{"early-noise", bigEntry, "final error line"},
	)

	require.Equal(t, "exit status 1", callback.Error.Message)
	require.NotContains(t, callback.Error.Message, "final error line")
	require.NotContains(t, callback.Error.Message, "early-noise")
}

func TestFailedCallbackFromErrorEmptyLogsLeavesMessageUntouched(t *testing.T) {
	callback := FailedCallbackFromErrorWithLogs(
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		errors.New("exit status 1"),
		nil,
	)

	require.Equal(t, "exit status 1", callback.Error.Message)
	require.NotContains(t, callback.Error.Message, "tofu output")
}
