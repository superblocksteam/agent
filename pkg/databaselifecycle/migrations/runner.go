package migrations

import (
	"context"
	"database/sql"
	"fmt"
	"sort"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// NewRunner returns a Runner backed by database/sql + pgx/v5/stdlib.
func NewRunner() Runner {
	return &sqlRunner{open: defaultOpen}
}

type sqlRunner struct {
	open func(dsn string) (*sql.DB, error)
}

func defaultOpen(dsn string) (*sql.DB, error) {
	return sql.Open("pgx", dsn)
}

func (r *sqlRunner) Apply(ctx context.Context, dsn string, migrations []Migration) (Result, error) {
	if len(migrations) == 0 {
		return Result{}, nil
	}

	db, err := r.open(dsn)
	if err != nil {
		return Result{}, fmt.Errorf("open db: %w", err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		return Result{}, fmt.Errorf("ping db: %w", err)
	}

	if _, err := db.ExecContext(ctx, LedgerDDL); err != nil {
		return Result{}, fmt.Errorf("create ledger: %w", err)
	}

	already, err := r.loadAppliedVersions(ctx, db)
	if err != nil {
		return Result{}, fmt.Errorf("load ledger: %w", err)
	}

	sorted := make([]Migration, len(migrations))
	copy(sorted, migrations)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Version < sorted[j].Version })

	result := Result{Applied: []string{}, Skipped: []string{}}
	for _, m := range sorted {
		if _, ok := already[m.Version]; ok {
			result.Skipped = append(result.Skipped, m.Version)
			continue
		}
		if err := r.applyOne(ctx, db, m); err != nil {
			return result, fmt.Errorf("apply %s (%s): %w", m.Version, m.Filename, err)
		}
		already[m.Version] = struct{}{}
		result.Applied = append(result.Applied, m.Version)
	}
	return result, nil
}

func (r *sqlRunner) loadAppliedVersions(ctx context.Context, db *sql.DB) (map[string]struct{}, error) {
	rows, err := db.QueryContext(ctx, `SELECT version FROM `+LedgerTable)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]struct{}{}
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		out[v] = struct{}{}
	}
	return out, rows.Err()
}

// applyOne runs the migration's SQL and inserts a ledger row in a
// single transaction. The forward-only contract means: either the SQL
// and the ledger row both succeed, or neither does. Multi-statement
// SQL in `m.SQL` is executed as a single Exec — pgx accepts a
// semicolon-separated batch. The whole batch lives inside the txn,
// so a failure mid-way rolls back every statement up to that point.
// V1 limitation: DDL that can't run inside a txn block (e.g.
// `CREATE INDEX CONCURRENTLY`) fails at apply time. An opt-out marker
// (e.g. `-- superblocks:no-transaction`) is tracked as a follow-up.
func (r *sqlRunner) applyOne(ctx context.Context, db *sql.DB, m Migration) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, m.SQL); err != nil {
		return fmt.Errorf("exec: %w", err)
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO `+LedgerTable+` (version, filename) VALUES ($1, $2)`,
		m.Version, m.Filename,
	); err != nil {
		return fmt.Errorf("insert ledger: %w", err)
	}
	return tx.Commit()
}
