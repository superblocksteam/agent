// Package migrations applies forward-only SQL migrations to a freshly-
// provisioned database. It is invoked by the lifecycle worker after
// tofu apply succeeds and before the terminal callback is sent.
// Idempotent: re-running with the same migration set is a no-op.
package migrations

import "context"

// Migration is one forward-only SQL file delivered via the dispatch
// payload. Version is the sort key and the primary key in the in-DB
// ledger.
type Migration struct {
	Version  string `json:"version"`
	Filename string `json:"filename"`
	SQL      string `json:"sql"`
}

// Result describes what the runner did. Applied lists versions newly
// inserted into the ledger this run; Skipped lists versions that were
// already in the ledger. The lists are returned sorted by Version.
type Result struct {
	Applied []string
	Skipped []string
}

// Runner is the migration application engine. Implementations open a
// connection to dsn, ensure the ledger table exists, then apply each
// migration in Version order if it is not already in the ledger.
type Runner interface {
	Apply(ctx context.Context, dsn string, migrations []Migration) (Result, error)
}

// LedgerTable is the in-DB table the runner creates and maintains in
// the target customer database. Exported so tests and tooling can
// inspect it.
const LedgerTable = "superblocks_schema_migrations"

// LedgerDDL is the schema for the ledger table. Idempotent.
const LedgerDDL = `CREATE TABLE IF NOT EXISTS ` + LedgerTable + ` (
  version    TEXT PRIMARY KEY,
  filename   TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`
