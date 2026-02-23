export const DEFAULT_SCHEMA_QUERY = `SELECT current_schema();`;

export const TABLE_QUERY = `SELECT a.attname AS name,
t1.typname AS column_type,
c.relname AS table_name,
n.nspname AS schema_name
FROM pg_catalog.pg_attribute a
LEFT JOIN pg_catalog.pg_type t1 ON t1.oid = a.atttypid
INNER JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
LEFT JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
WHERE a.attnum > 0
AND NOT a.attisdropped
AND n.nspname NOT IN ('information_schema', 'pg_catalog')
AND c.relkind IN ('r', 'v')
AND has_schema_privilege(current_user, n.nspname, 'USAGE')
AND has_table_privilege(current_user, c.oid, 'SELECT')
ORDER BY CASE WHEN n.nspname = current_schema() THEN 0 ELSE 1 END, n.nspname, c.relname, a.attnum;`;

export const KEYS_QUERY = `SELECT c.conname AS constraint_name,
c.contype AS constraint_type,
tbl.relname AS self_table,
array_to_json(array_agg(col.attname ORDER BY u.attposition)) AS self_columns
FROM pg_constraint c
LEFT JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS u(attnum, attposition) ON true
JOIN pg_class tbl ON tbl.oid = c.conrelid
JOIN pg_namespace sch ON sch.oid = tbl.relnamespace
LEFT JOIN pg_attribute col ON (col.attrelid = tbl.oid AND col.attnum = u.attnum)
WHERE sch.nspname NOT IN ('information_schema', 'pg_catalog')
GROUP BY constraint_name, constraint_type, self_table
ORDER BY self_table;`;
