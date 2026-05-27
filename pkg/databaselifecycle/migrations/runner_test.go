package migrations

import (
	"context"
	"database/sql"
	"errors"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newSQLRunnerWithMock returns a sqlRunner wired to a go-sqlmock
// database/sql backend instead of the real pgx driver. Tests can
// then assert exact SQL statements, exec ordering, and transaction
// boundaries without needing a real Postgres (the integration suite
// at integration/databaselifecycle/migration_runner_test.go covers
// end-to-end behavior against testcontainers).
func newSQLRunnerWithMock(t *testing.T) (*sqlRunner, sqlmock.Sqlmock) {
	t.Helper()
	// QueryMatcherEqual asserts SQL text matches verbatim. The runner
	// emits stable SQL strings (constants for DDL + a fixed INSERT
	// shape) so exact matching keeps tests honest about what
	// statements are actually executed.
	db, mock, err := sqlmock.New(
		sqlmock.QueryMatcherOption(sqlmock.QueryMatcherEqual),
		// MonitorPingsOption(true) lets ExpectPing actually intercept
		// the runner's db.PingContext call. Without it sqlmock silently
		// no-ops the expectation and the next non-ping expectation
		// matches the ping by accident.
		sqlmock.MonitorPingsOption(true),
	)
	require.NoError(t, err)
	t.Cleanup(func() { _ = db.Close() })
	return &sqlRunner{open: func(string) (*sql.DB, error) { return db, nil }}, mock
}

func TestSQLRunnerEmptyMigrationsSliceIsNoOp(t *testing.T) {
	// Empty input must not open the DB at all — the Result is the
	// zero value and no SQL fires. Verifies the early-return before
	// the open() seam, so even a broken DSN can't cause spurious
	// errors when there's no work to do.
	r := &sqlRunner{open: func(string) (*sql.DB, error) {
		t.Fatal("open must not be called for an empty migration list")
		return nil, nil
	}}

	got, err := r.Apply(context.Background(), "postgres://unused", nil)
	require.NoError(t, err)
	assert.Equal(t, Result{}, got)
}

func TestSQLRunnerOpensCreatesLedgerAndAppliesNewMigrationInTransaction(t *testing.T) {
	// Happy path with a single new migration. Asserts the exact
	// statement sequence the runner emits:
	//   1. ping
	//   2. CREATE TABLE IF NOT EXISTS … (idempotent)
	//   3. SELECT version FROM ledger (loads applied set)
	//   4. BEGIN
	//   5. EXEC migration SQL
	//   6. INSERT INTO ledger
	//   7. COMMIT
	r, mock := newSQLRunnerWithMock(t)

	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery("SELECT version FROM " + LedgerTable).
		WillReturnRows(sqlmock.NewRows([]string{"version"}))
	mock.ExpectBegin()
	mock.ExpectExec("CREATE TABLE orders (id INT PRIMARY KEY);").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("INSERT INTO "+LedgerTable+" (version, filename) VALUES ($1, $2)").
		WithArgs("0001", "0001_init.sql").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	got, err := r.Apply(context.Background(), "postgres://unused", []Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT PRIMARY KEY);"},
	})
	require.NoError(t, err)
	assert.Equal(t, Result{Applied: []string{"0001"}, Skipped: []string{}}, got)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerSortsByVersionBeforeApply(t *testing.T) {
	// Versions arrive out of order in the dispatch payload; the
	// runner must apply them in sort order so a later DDL never
	// runs before its prerequisite. Two migrations submitted as
	// [0002, 0001] must apply 0001 then 0002 inside two distinct
	// transactions.
	r, mock := newSQLRunnerWithMock(t)

	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery("SELECT version FROM " + LedgerTable).
		WillReturnRows(sqlmock.NewRows([]string{"version"}))

	mock.ExpectBegin()
	mock.ExpectExec("SELECT 1 -- 0001 SQL").WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("INSERT INTO "+LedgerTable+" (version, filename) VALUES ($1, $2)").
		WithArgs("0001", "0001.sql").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	mock.ExpectBegin()
	mock.ExpectExec("SELECT 2 -- 0002 SQL").WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("INSERT INTO "+LedgerTable+" (version, filename) VALUES ($1, $2)").
		WithArgs("0002", "0002.sql").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	got, err := r.Apply(context.Background(), "postgres://unused", []Migration{
		{Version: "0002", Filename: "0002.sql", SQL: "SELECT 2 -- 0002 SQL"},
		{Version: "0001", Filename: "0001.sql", SQL: "SELECT 1 -- 0001 SQL"},
	})
	require.NoError(t, err)
	assert.Equal(t, []string{"0001", "0002"}, got.Applied)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerSkipsMigrationsAlreadyInLedger(t *testing.T) {
	// Re-running with overlapping versions: 0001 already exists in
	// the ledger so it is skipped (no BEGIN, no EXEC), 0002 is new
	// and gets applied. Confirms the idempotency contract Apply
	// promises in its doc comment.
	r, mock := newSQLRunnerWithMock(t)

	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery("SELECT version FROM " + LedgerTable).
		WillReturnRows(sqlmock.NewRows([]string{"version"}).AddRow("0001"))

	mock.ExpectBegin()
	mock.ExpectExec("CREATE TABLE customers (id INT);").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("INSERT INTO "+LedgerTable+" (version, filename) VALUES ($1, $2)").
		WithArgs("0002", "0002_customers.sql").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	got, err := r.Apply(context.Background(), "postgres://unused", []Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "should not run"},
		{Version: "0002", Filename: "0002_customers.sql", SQL: "CREATE TABLE customers (id INT);"},
	})
	require.NoError(t, err)
	assert.Equal(t, []string{"0002"}, got.Applied)
	assert.Equal(t, []string{"0001"}, got.Skipped)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerSkipsDuplicateVersionsAppliedEarlierInSameBatch(t *testing.T) {
	r, mock := newSQLRunnerWithMock(t)

	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery("SELECT version FROM " + LedgerTable).
		WillReturnRows(sqlmock.NewRows([]string{"version"}))

	mock.ExpectBegin()
	mock.ExpectExec("CREATE TABLE orders (id INT);").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("INSERT INTO "+LedgerTable+" (version, filename) VALUES ($1, $2)").
		WithArgs("0001", "0001_init.sql").
		WillReturnResult(sqlmock.NewResult(1, 1))
	mock.ExpectCommit()

	got, err := r.Apply(context.Background(), "postgres://unused", []Migration{
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT);"},
		{Version: "0001", Filename: "0001_init.sql", SQL: "CREATE TABLE orders (id INT);"},
	})
	require.NoError(t, err)
	assert.Equal(t, []string{"0001"}, got.Applied)
	assert.Equal(t, []string{"0001"}, got.Skipped)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerRollsBackAndHaltsOnFailingMigration(t *testing.T) {
	// A migration whose SQL fails must roll the transaction back
	// (so the ledger row is never inserted) AND prevent every
	// subsequent migration from running. The dispatch reports a
	// failure naming the version + filename of the offending
	// migration so the operator can inspect it.
	r, mock := newSQLRunnerWithMock(t)

	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery("SELECT version FROM " + LedgerTable).
		WillReturnRows(sqlmock.NewRows([]string{"version"}))

	mock.ExpectBegin()
	mock.ExpectExec("CREATE TABLE bad (id NOTATYPE);").
		WillReturnError(errors.New("ERROR: type \"notatype\" does not exist"))
	mock.ExpectRollback()
	// Critically: NO ExpectBegin for the second migration — the
	// runner must abort the loop, not press on after a failure.

	_, err := r.Apply(context.Background(), "postgres://unused", []Migration{
		{Version: "0003", Filename: "0003_bad.sql", SQL: "CREATE TABLE bad (id NOTATYPE);"},
		{Version: "0004", Filename: "0004_ok.sql", SQL: "SELECT 1;"},
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "0003")
	assert.Contains(t, err.Error(), "0003_bad.sql")
	assert.Contains(t, err.Error(), "notatype")
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerRollsBackOnFailingLedgerInsert(t *testing.T) {
	// Distinct failure mode: the migration SQL succeeds but the
	// ledger insert fails (e.g. unique-constraint race with a
	// concurrent worker). The transaction must roll back so the
	// migration's DDL doesn't get half-applied without a ledger
	// entry. This protects the "re-running is a no-op" contract
	// against partial application.
	r, mock := newSQLRunnerWithMock(t)

	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery("SELECT version FROM " + LedgerTable).
		WillReturnRows(sqlmock.NewRows([]string{"version"}))

	mock.ExpectBegin()
	mock.ExpectExec("CREATE TABLE inventory (id INT);").
		WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec("INSERT INTO "+LedgerTable+" (version, filename) VALUES ($1, $2)").
		WithArgs("0005", "0005_inv.sql").
		WillReturnError(errors.New("ERROR: duplicate key value violates unique constraint"))
	mock.ExpectRollback()

	_, err := r.Apply(context.Background(), "postgres://unused", []Migration{
		{Version: "0005", Filename: "0005_inv.sql", SQL: "CREATE TABLE inventory (id INT);"},
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "insert ledger")
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerSurfacesOpenError(t *testing.T) {
	// Bad DSN / driver init failure must surface as an Apply error
	// (not a panic), with a wrapped message that names the failure
	// point. Subsequent migration loop never runs.
	r := &sqlRunner{open: func(string) (*sql.DB, error) {
		return nil, errors.New("driver: bad dsn")
	}}

	_, err := r.Apply(context.Background(), "garbage", []Migration{{Version: "0001"}})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "open db")
	assert.Contains(t, err.Error(), "bad dsn")
}

func TestSQLRunnerSurfacesPingError(t *testing.T) {
	// Reach the DB but can't ping it (network blip, auth failure).
	// Apply must abort before touching the ledger.
	r, mock := newSQLRunnerWithMock(t)
	mock.ExpectPing().WillReturnError(errors.New("network is unreachable"))

	_, err := r.Apply(context.Background(), "postgres://unused", []Migration{{Version: "0001", SQL: "SELECT 1;"}})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "ping db")
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerSurfacesLedgerDDLError(t *testing.T) {
	// Worker can connect + ping but lacks CREATE TABLE privilege
	// against the customer DB. Apply must fail loud rather than
	// continuing into the apply loop (which would emit "relation
	// does not exist" errors that mask the root cause).
	r, mock := newSQLRunnerWithMock(t)
	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnError(errors.New("ERROR: permission denied for schema public"))

	_, err := r.Apply(context.Background(), "postgres://unused", []Migration{{Version: "0001", SQL: "SELECT 1;"}})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "create ledger")
	assert.Contains(t, err.Error(), "permission denied")
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestSQLRunnerSurfacesLedgerSelectError(t *testing.T) {
	// Ledger DDL succeeded but reading from it failed. Mirrors a
	// race where the ledger is being concurrently truncated by an
	// operator — surfacing it as "load ledger" with the underlying
	// driver error lets the operator find the cause.
	r, mock := newSQLRunnerWithMock(t)
	mock.ExpectPing()
	mock.ExpectExec(LedgerDDL).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectQuery("SELECT version FROM " + LedgerTable).
		WillReturnError(errors.New("connection reset"))

	_, err := r.Apply(context.Background(), "postgres://unused", []Migration{{Version: "0001", SQL: "SELECT 1;"}})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "load ledger")
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestLedgerDDLIsIdempotent(t *testing.T) {
	// Sanity check on the LedgerDDL exported constant: it uses CREATE
	// TABLE IF NOT EXISTS so a worker re-running against a database
	// that already has the ledger doesn't trip on "relation already
	// exists" errors. Locks in the contract that Apply() promises.
	require.Regexp(t, regexp.MustCompile(`(?i)CREATE TABLE IF NOT EXISTS`), LedgerDDL)
}

func TestNewRunnerReturnsSQLRunnerBoundToPgxDriver(t *testing.T) {
	// NewRunner is the production constructor; the rest of the test
	// suite swaps `open` for go-sqlmock via newSQLRunnerWithMock, so
	// this covers the production wiring path and pins that NewRunner
	// returns a *sqlRunner with `open` set (callers can rely on the
	// type for assembly-time wiring).
	r := NewRunner()
	require.NotNil(t, r)
	sqlR, ok := r.(*sqlRunner)
	require.True(t, ok, "NewRunner must return *sqlRunner")
	require.NotNil(t, sqlR.open, "production sqlRunner.open must be set")
}

func TestDefaultOpenUsesPgxDriver(t *testing.T) {
	// defaultOpen is the production seam invoked by NewRunner.
	// Driver registration happens in the `_ "github.com/jackc/pgx/v5/stdlib"`
	// import; sql.Open is lazy (no network) and must return a non-nil
	// *sql.DB even for a host that doesn't resolve. We never Ping, so
	// no connection is attempted in this test.
	db, err := defaultOpen("postgres://does-not-resolve:5432/nope?sslmode=disable")
	require.NoError(t, err)
	require.NotNil(t, db)
	require.NoError(t, db.Close())
}
