package databaselifecycle

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/superblocksteam/agent/pkg/databaselifecycle/migrations"
)

type fakeMigrationRunner struct {
	called  bool
	dsn     string
	got     []migrations.Migration
	failErr error
}

func (f *fakeMigrationRunner) Apply(_ context.Context, dsn string, m []migrations.Migration) (migrations.Result, error) {
	f.called = true
	f.dsn = dsn
	f.got = m
	if f.failErr != nil {
		return migrations.Result{}, f.failErr
	}
	applied := make([]string, 0, len(m))
	for _, x := range m {
		applied = append(applied, x.Version)
	}
	return migrations.Result{Applied: applied}, nil
}

// noDSN is a sentinel DSNBuilder for tests where the migration path
// must not be exercised. Test fails loudly if the production code
// starts calling out unexpectedly.
func noDSN(t *testing.T) DSNBuilder {
	t.Helper()
	return func(_ context.Context, _ TerminalCallback) (string, error) {
		t.Fatal("DSNBuilder must not be called in this test")
		return "", nil
	}
}

func staticDSN(dsn string) DSNBuilder {
	return func(_ context.Context, _ TerminalCallback) (string, error) {
		return dsn, nil
	}
}

func failingDSN(err error) DSNBuilder {
	return func(_ context.Context, _ TerminalCallback) (string, error) {
		return "", err
	}
}

func TestProcessDispatchReportsReadyCallbackAfterRunnerSuccess(t *testing.T) {
	var reported TerminalCallback
	result, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			require.Equal(t, "app:prod:orders", job.BindingKey)
			return Result{OutputJSON: `{"connection_metadata":{"value":{"host":"orders.internal"}},"runtime_credential_refs":{"value":{"password":{"resolver":"vault","ref":"database/orders","field":"password"}}}}`}, nil
		}),
		nil,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_prod_database",
			RequestID:  "request-1",
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.Equal(t, "ready", result.RequestState)
	require.Equal(t, TerminalCallback{
		BindingKey:     "app:prod:orders",
		LifecycleState: "ready",
		MigrationState: "pending",
		RequestID:      "request-1",
		ConnectionMetadata: map[string]any{
			"host": "orders.internal",
		},
		RuntimeCredentialRefs: map[string]any{
			"password": map[string]any{
				"resolver": "vault",
				"ref":      "database/orders",
				"field":    "password",
			},
		},
	}, reported)
}

func TestProcessDispatchReportsFailedCallbackForTerminalRunnerError(t *testing.T) {
	var reported TerminalCallback
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{}, &LifecycleError{Code: ErrorCodePolicyBlocked, Err: errors.New("policy blocked")}
		}),
		nil,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "failed"}, nil
		}),
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.Equal(t, "failed", reported.LifecycleState)
	// policy_blocked is a plan-stage failure; the migration runner never
	// got a chance to run, so the binding's migrationState stays pending
	// so the next ensure() can pick it up (cursor r3236327922).
	require.Equal(t, "pending", reported.MigrationState)
	require.Equal(t, "policy_blocked", reported.Error.Code)
}

func TestProcessDispatchDoesNotReportRetryableRunnerErrors(t *testing.T) {
	reported := false
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{}, &LifecycleError{Code: ErrorCodeBackendLocked, Retryable: true, Err: errors.New("state lock")}
		}),
		nil,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = true
			return TerminalCallbackResult{}, nil
		}),
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		Job{BindingKey: "app:prod:orders"},
	)

	require.Error(t, err)
	require.False(t, reported)
}

func TestProcessDispatchReportsFailedCallbackForMalformedTerraformOutput(t *testing.T) {
	var reported TerminalCallback
	result, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{OutputJSON: `{"connection_metadata":`}, nil
		}),
		nil,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "failed"}, nil
		}),
		DispatchPayload{BindingKey: "app:prod:orders", RequestID: "request-1"},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.Equal(t, "failed", result.RequestState)
	require.Equal(t, "failed", reported.LifecycleState)
	require.Equal(t, "terraform_failed", reported.Error.Code)
}

func TestProcessDispatchFailsMigrationWhenDSNBuilderFails(t *testing.T) {
	// When dispatch.Migrations is non-empty the worker must derive a DSN
	// first. A DSN-builder error surfaces as code=migration_failed and
	// the runner is never called.
	var reported TerminalCallback
	fake := &fakeMigrationRunner{}
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{OutputJSON: `{}`}, nil
		}),
		fake,
		failingDSN(errors.New("runtime_credential_refs missing")),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "failed"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_prod_database",
			RequestID:  "request-1",
			Migrations: []migrations.Migration{{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE t();"}},
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.False(t, fake.called, "runner must not be called when DSN derivation fails")
	require.Equal(t, "failed", reported.LifecycleState)
	require.Equal(t, "migration_failed", reported.Error.Code)
	require.Contains(t, reported.Error.Message, "runtime_credential_refs missing")
}

func TestProcessDispatchSkipsMigrationsWhenNilField(t *testing.T) {
	// A nil Migrations slice means "this operation has no migration
	// concern" — runner is not invoked and MigrationState stays at the
	// default "pending".
	fake := &fakeMigrationRunner{}
	var reported TerminalCallback
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{OutputJSON: `{}`}, nil
		}),
		fake,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{BindingKey: "app:prod:orders", Operation: "retire_database", RequestID: "request-1"},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.False(t, fake.called)
	require.Equal(t, "pending", reported.MigrationState)
}

func TestProcessDispatchKeepsPendingForEmptyMigrationsSlice(t *testing.T) {
	// MigrationState is the contract of "did we actually apply SQL". An
	// empty (but non-nil) Migrations slice means the dispatcher arrived
	// without any work for us — typical of provisioning operations
	// (ensure_dev_database / ensure_prod_database) where the server
	// pre-loaded migrations but found none in the working state. The
	// worker must NOT lie about migrating here; MigrationState stays at
	// the default "pending" so a subsequent migrate_schema dispatch is
	// the only way to flip it to "migrated".
	fake := &fakeMigrationRunner{}
	var reported TerminalCallback
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{OutputJSON: `{}`}, nil
		}),
		fake,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_prod_database",
			RequestID:  "request-1",
			Migrations: []migrations.Migration{},
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.False(t, fake.called, "runner must not be called for empty migrations")
	require.Equal(t, "pending", reported.MigrationState)
}

func TestProcessDispatchMigrateSchemaSkipsTerraformAndAppliesAttachedMigrations(t *testing.T) {
	var reported TerminalCallback
	fake := &fakeMigrationRunner{}
	attached := []migrations.Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY);"},
	}
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			t.Fatal("migrate_schema must not invoke the Terraform runner")
			return Result{}, nil
		}),
		fake,
		func(_ context.Context, callback TerminalCallback) (string, error) {
			require.Equal(t, "orders.internal", callback.ConnectionMetadata["host"])
			require.Equal(t, "database/orders", callback.RuntimeCredentialRefs["username"].(map[string]any)["ref"])
			return "postgres://test@orders.internal:5432/orders", nil
		},
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			ConnectionMetadata: map[string]any{
				"host":     "orders.internal",
				"port":     float64(5432),
				"database": "orders",
			},
			RuntimeCredentialRefs: map[string]any{
				"username": map[string]any{"resolver": "aws_secrets_manager", "ref": "database/orders", "field": "username"},
				"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "database/orders", "field": "password"},
			},
			Operation:  "migrate_schema",
			RequestID:  "request-1",
			Migrations: attached,
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.True(t, fake.called)
	require.Equal(t, attached, fake.got)
	require.Equal(t, "ready", reported.LifecycleState)
	require.Equal(t, "migrated", reported.MigrationState)
	require.Equal(t, map[string]any{
		"host":     "orders.internal",
		"port":     float64(5432),
		"database": "orders",
	}, reported.ConnectionMetadata)
	require.Equal(t, map[string]any{
		"username": map[string]any{"resolver": "aws_secrets_manager", "ref": "database/orders", "field": "username"},
		"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "database/orders", "field": "password"},
	}, reported.RuntimeCredentialRefs)
}

func TestProcessDispatchMigrateSchemaUsesDispatchMigrationRefs(t *testing.T) {
	fake := &fakeMigrationRunner{}
	attached := []migrations.Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY);"},
	}
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			t.Fatal("migrate_schema must not invoke the Terraform runner")
			return Result{}, nil
		}),
		fake,
		func(_ context.Context, callback TerminalCallback) (string, error) {
			require.Equal(t, "database/orders/migration", callback.MigrationCredentialRefs["username"].(map[string]any)["ref"])
			return "postgres://test@orders.internal:5432/orders", nil
		},
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			ConnectionMetadata: map[string]any{
				"host":     "orders.internal",
				"port":     float64(5432),
				"database": "orders",
			},
			MigrationCredentialRefs: map[string]any{
				"username": map[string]any{"resolver": "aws_secrets_manager", "ref": "database/orders/migration", "field": "username"},
				"password": map[string]any{"resolver": "aws_secrets_manager", "ref": "database/orders/migration", "field": "password"},
			},
			Operation:  "migrate_schema",
			RequestID:  "request-1",
			Migrations: attached,
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.True(t, fake.called)
}

func TestProcessDispatchMigrateSchemaMarksEmptyMigrationSetMigrated(t *testing.T) {
	fake := &fakeMigrationRunner{}
	var reported TerminalCallback
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			t.Fatal("migrate_schema must not invoke the Terraform runner")
			return Result{}, nil
		}),
		fake,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "migrate_schema",
			RequestID:  "request-1",
			Migrations: []migrations.Migration{},
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.False(t, fake.called)
	require.Equal(t, "ready", reported.LifecycleState)
	require.Equal(t, "migrated", reported.MigrationState)
}

func TestProcessDispatchMigrateSchemaMarksOmittedMigrationSetMigrated(t *testing.T) {
	fake := &fakeMigrationRunner{}
	var reported TerminalCallback
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			t.Fatal("migrate_schema must not invoke the Terraform runner")
			return Result{}, nil
		}),
		fake,
		noDSN(t),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "migrate_schema",
			RequestID:  "request-1",
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.False(t, fake.called)
	require.Equal(t, "ready", reported.LifecycleState)
	require.Equal(t, "migrated", reported.MigrationState)
}

func TestProcessDispatchAppliesAttachedMigrationsAndMarksMigrated(t *testing.T) {
	// Happy path: non-empty Migrations → DSN built → runner applies them
	// in the order received → MigrationState flips to "migrated".
	var reported TerminalCallback
	fake := &fakeMigrationRunner{}
	attached := []migrations.Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY);"},
		{Version: "0002", Filename: "0002_add_total.sql", SQL: "ALTER TABLE orders ADD COLUMN total NUMERIC;"},
	}
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{OutputJSON: `{"connection_metadata":{"value":{"host":"orders.internal","port":5432,"database":"orders"}}}`}, nil
		}),
		fake,
		staticDSN("postgres://test@orders.internal:5432/orders"),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "ready"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_prod_database",
			RequestID:  "request-1",
			Migrations: attached,
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.True(t, fake.called, "runner must be invoked when migrations are attached")
	require.Equal(t, "postgres://test@orders.internal:5432/orders", fake.dsn)
	require.Equal(t, attached, fake.got)
	require.Equal(t, "ready", reported.LifecycleState)
	require.Equal(t, "migrated", reported.MigrationState)
}

func TestProcessDispatchFailsMigrationWhenRunnerErrors(t *testing.T) {
	// A runner error surfaces as code=migration_failed; lifecycle state
	// flips to "failed" and the migration state record stays at "failed".
	var reported TerminalCallback
	fake := &fakeMigrationRunner{failErr: errors.New("syntax error at or near \"WIBBLE\"")}
	_, err := ProcessDispatch(
		context.Background(),
		RunnerFunc(func(ctx context.Context, job Job) (Result, error) {
			return Result{OutputJSON: `{}`}, nil
		}),
		fake,
		staticDSN("postgres://test"),
		CallbackReporterFunc(func(ctx context.Context, callback TerminalCallback) (TerminalCallbackResult, error) {
			reported = callback
			return TerminalCallbackResult{RequestID: callback.RequestID, RequestState: "failed"}, nil
		}),
		DispatchPayload{
			BindingKey: "app:prod:orders",
			Operation:  "ensure_prod_database",
			RequestID:  "request-1",
			Migrations: []migrations.Migration{{Version: "0001", Filename: "broken.sql", SQL: "WIBBLE"}},
		},
		Job{BindingKey: "app:prod:orders"},
	)

	require.NoError(t, err)
	require.True(t, fake.called)
	require.Equal(t, "failed", reported.LifecycleState)
	require.Equal(t, "migration_failed", reported.Error.Code)
}
