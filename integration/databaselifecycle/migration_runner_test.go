package databaselifecycle_integration

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/superblocksteam/agent/pkg/databaselifecycle/migrations"
)

// Integration tests for the migration runner against a real Postgres
// container. Exercised in `make test-integration` only — kept out of
// `make test-unit` because it requires a live Docker daemon.
//
// Each test spins its own container (≈ 1.5–3 seconds with the alpine
// image) for full isolation. Three tests:
//   1. Single migration on a fresh DB + idempotent re-apply
//   2. Multi-migration ordering by Version (input shuffled)
//   3. Failing migration leaves earlier successes in the ledger

const testPostgresImage = "postgres:16-alpine"

func startPostgres(t *testing.T) string {
	t.Helper()
	ctx := context.Background()
	container, err := postgres.Run(ctx, testPostgresImage,
		postgres.WithDatabase("migrations_test"),
		postgres.WithUsername("postgres"),
		postgres.WithPassword("postgres"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(60*time.Second),
		),
	)
	require.NoError(t, err, "start postgres container")
	t.Cleanup(func() {
		_ = container.Terminate(context.Background())
	})
	dsn, err := container.ConnectionString(ctx, "sslmode=disable")
	require.NoError(t, err, "postgres connection string")
	return dsn
}

func TestRunnerAppliesMigrationOnFreshDBAndIsIdempotent(t *testing.T) {
	dsn := startPostgres(t)
	runner := migrations.NewRunner()
	ctx := context.Background()

	migs := []migrations.Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY)"},
	}

	result, err := runner.Apply(ctx, dsn, migs)
	require.NoError(t, err)
	require.Equal(t, []string{"0001"}, result.Applied)
	require.Empty(t, result.Skipped)

	db, err := sql.Open("pgx", dsn)
	require.NoError(t, err)
	defer db.Close()

	// orders table exists and is empty.
	var n int
	require.NoError(t, db.QueryRowContext(ctx, "SELECT COUNT(*) FROM orders").Scan(&n))
	require.Equal(t, 0, n)

	// Ledger row recorded with filename + recent applied_at.
	var version, filename string
	var appliedAt time.Time
	require.NoError(t, db.QueryRowContext(ctx,
		`SELECT version, filename, applied_at FROM `+migrations.LedgerTable+` WHERE version=$1`, "0001",
	).Scan(&version, &filename, &appliedAt))
	require.Equal(t, "0001", version)
	require.Equal(t, "0001_init.sql", filename)
	require.WithinDuration(t, time.Now(), appliedAt, 1*time.Minute)

	// Re-applying the same set is a no-op.
	result, err = runner.Apply(ctx, dsn, migs)
	require.NoError(t, err)
	require.Empty(t, result.Applied)
	require.Equal(t, []string{"0001"}, result.Skipped)

	// Ledger still has exactly one row.
	require.NoError(t, db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM `+migrations.LedgerTable+` WHERE version=$1`, "0001",
	).Scan(&n))
	require.Equal(t, 1, n)
}

func TestRunnerAppliesMigrationsInVersionOrderRegardlessOfInput(t *testing.T) {
	dsn := startPostgres(t)
	runner := migrations.NewRunner()
	ctx := context.Background()

	// Two migrations with a dependency: 0002 alters the table created
	// by 0001. Pass them in reversed order to prove Apply sorts by
	// Version (not by slice position) before applying.
	migs := []migrations.Migration{
		{Version: "0002", Filename: "0002_add_total.sql", SQL: "ALTER TABLE orders ADD COLUMN total NUMERIC"},
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY)"},
	}

	result, err := runner.Apply(ctx, dsn, migs)
	require.NoError(t, err)
	require.Equal(t, []string{"0001", "0002"}, result.Applied)

	db, err := sql.Open("pgx", dsn)
	require.NoError(t, err)
	defer db.Close()

	// 0002's column exists, proving 0001 ran first.
	var col string
	require.NoError(t, db.QueryRowContext(ctx,
		`SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='total'`,
	).Scan(&col))
	require.Equal(t, "total", col)
}

func TestRunnerHaltsAndPreservesLedgerOnFailingMigration(t *testing.T) {
	dsn := startPostgres(t)
	runner := migrations.NewRunner()
	ctx := context.Background()

	// 0001 succeeds; 0002 fails (duplicate table). The runner stops at
	// 0002 and reports an error. The ledger reflects exactly which
	// migrations succeeded (just 0001).
	migs := []migrations.Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY)"},
		{Version: "0002", Filename: "0002_dup.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY)"},
	}

	_, err := runner.Apply(ctx, dsn, migs)
	require.Error(t, err)
	require.Contains(t, err.Error(), "0002")
	require.Contains(t, err.Error(), "0002_dup.sql")

	db, err := sql.Open("pgx", dsn)
	require.NoError(t, err)
	defer db.Close()

	var count int
	require.NoError(t, db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM `+migrations.LedgerTable+` WHERE version IN ('0001','0002')`,
	).Scan(&count))
	require.Equal(t, 1, count, "0001 must be in the ledger; 0002 must not")

	// Re-running with just 0001 + a fixed 0003 picks up cleanly:
	// 0001 is skipped (ledger), the fix lands, ledger ends at 2 rows.
	migs = []migrations.Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY)"},
		{Version: "0003", Filename: "0003_add_email.sql", SQL: "ALTER TABLE orders ADD COLUMN email TEXT"},
	}
	result, err := runner.Apply(ctx, dsn, migs)
	require.NoError(t, err)
	require.Equal(t, []string{"0003"}, result.Applied)
	require.Equal(t, []string{"0001"}, result.Skipped)
}
