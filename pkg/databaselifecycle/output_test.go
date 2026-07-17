package databaselifecycle

import (
	"encoding/json"
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
				"runtime_credential_refs":{"sensitive":false,"type":["object",{}],"value":{"password":{"resolver":"vault","ref":"database/orders/migrator","field":"password"}}},
				"migration_credential_refs":{"sensitive":false,"type":["object",{}],"value":{"password":{"resolver":"vault","ref":"database/orders/migrator","field":"password"}}},
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
				"ref":      "database/orders/migrator",
				"field":    "password",
			},
		},
		MigrationCredentialRefs: map[string]any{
			"password": map[string]any{
				"resolver": "vault",
				"ref":      "database/orders/migrator",
				"field":    "password",
			},
		},
	}, callback)
	require.NotContains(t, callback.RuntimeCredentialRefs, "password.value")
}

func TestReadyCallbackFromTerraformOutputMirrorsRuntimeRefsWhenMigrationRefsMissing(t *testing.T) {
	callback, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_database",
			RequestID:  "request-1",
		},
		Result{
			OutputJSON: `{
				"connection_metadata":{"sensitive":false,"type":["object",{}],"value":{"database":"orders"}},
				"runtime_credential_refs":{"sensitive":false,"type":["object",{}],"value":{"password":{"resolver":"vault","ref":"database/orders/migrator","field":"password"}}}
			}`,
		},
	)

	require.NoError(t, err)
	require.Equal(t, map[string]any{
		"password": map[string]any{
			"resolver": "vault",
			"ref":      "database/orders/migrator",
			"field":    "password",
		},
	}, callback.RuntimeCredentialRefs)
	require.Equal(t, callback.RuntimeCredentialRefs, callback.MigrationCredentialRefs)

	callback.MigrationCredentialRefs["database"] = "orders"
	require.NotContains(t, callback.RuntimeCredentialRefs, "database")
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

func TestReadyCallbackFromTerraformOutputIAMOmitsCredentialRefs(t *testing.T) {
	callback, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			ApplicationID: validIAMApplicationID,
			BindingID:     validIAMBindingID,
			BindingKey:    "app:prod:orders",
			Operation:     "ensure_database",
			RequestID:     "request-1",
		},
		Result{
			OutputJSON: `{
				"connection_metadata":{"sensitive":false,"value":{
					"application_id":"application-1",
					"auth_descriptor_version":1,
					"auth_mode":"aws_iam_role",
					"aws_account_id":"123456789012",
					"binding_id":"binding-1",
					"cluster_resource_id":"cluster-ABC123DEF456EXAMPLE",
					"connector_role_arn":"arn:aws:iam::123456789012:role/superblocks-native-db-connector",
					"database":"sbndb_0123456789ab_96883863630a181689324e37",
					"host":"orders.cluster-abc123.us-east-1.rds.amazonaws.com",
					"port":5432,
					"region":"us-east-1",
					"username":"sbndb_0123456789ab_135c0d252350f3bba710c990_runtime"
				}},
				"runtime_credential_refs":{"sensitive":false,"value":{"password":{"resolver":"vault","ref":"should-not-escape"}}},
				"migration_credential_refs":{"sensitive":false,"value":{"password":{"resolver":"vault","ref":"should-not-escape"}}}
			}`,
		},
	)

	require.NoError(t, err)
	require.Equal(t, "aws_iam_role", callback.ConnectionMetadata["auth_mode"])
	require.Nil(t, callback.RuntimeCredentialRefs)
	require.Nil(t, callback.MigrationCredentialRefs)
}

func TestReadyCallbackFromTerraformOutputRejectsInvalidIAMMetadata(t *testing.T) {
	_, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			ApplicationID: validIAMApplicationID,
			BindingID:     validIAMBindingID,
			BindingKey:    "app:prod:orders",
			RequestID:     "request-1",
		},
		Result{
			OutputJSON: `{
				"connection_metadata":{"sensitive":false,"value":{
					"auth_descriptor_version":2,
					"auth_mode":"aws_iam_role"
				}}
			}`,
		},
	)

	require.ErrorContains(t, err, "validate IAM connection metadata")
	require.ErrorContains(t, err, "auth_descriptor_version must be 1")
}

func TestReadyCallbackFromTerraformOutputBindsTrustedDispatchIdentityIntoIAMCallback(t *testing.T) {
	metadata := validIAMMetadata()
	delete(metadata, "application_id")
	delete(metadata, "binding_id")
	encodedMetadata, err := json.Marshal(metadata)
	require.NoError(t, err)

	callback, err := ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			ApplicationID: validIAMApplicationID,
			BindingID:     validIAMBindingID,
			BindingKey:    "app:prod:orders",
			RequestID:     "request-1",
		},
		Result{OutputJSON: `{"connection_metadata":{"value":` + string(encodedMetadata) + `}}`},
	)

	require.NoError(t, err)
	require.Equal(t, validIAMApplicationID, callback.ConnectionMetadata["application_id"])
	require.Equal(t, validIAMBindingID, callback.ConnectionMetadata["binding_id"])
}

func TestReadyCallbackFromTerraformOutputRejectsMismatchedIAMWireIdentity(t *testing.T) {
	metadata := validIAMMetadata()
	encodedMetadata, err := json.Marshal(metadata)
	require.NoError(t, err)

	_, err = ReadyCallbackFromTerraformOutput(
		DispatchPayload{
			ApplicationID: validIAMApplicationID,
			BindingID:     "binding-2",
			BindingKey:    "app:prod:orders",
			RequestID:     "request-1",
		},
		Result{OutputJSON: `{"connection_metadata":{"value":` + string(encodedMetadata) + `}}`},
	)

	require.ErrorContains(t, err, "connection_metadata.binding_id does not match dispatch bindingId")
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
