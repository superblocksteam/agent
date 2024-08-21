/* eslint-disable no-useless-escape */

export const DEFAULT_SCHEMA_QUERY = `SELECT current_schema();`;

export const SQL_SINGLE_TABLE_METADATA = `SELECT column_name, udt_name as data_type
FROM information_schema.columns
WHERE table_schema = $1 and table_name = $2;`;
// TODO: (JOEY) look into cases where quoted table names are always stored in their lower case form in information_schema.columns

export const SET_SEARCH_PATH = `
DO $$
DECLARE
    schema_list TEXT;
BEGIN
    SELECT array_to_string(array_agg(schema_name), ',') INTO schema_list FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name <> 'information_schema';
    EXECUTE 'SET search_path = "$user", public, ' || schema_list;
END $$;`;

// rows with default schema will be listed first
// pg_catalog is the fastest way to get table info in Postgres
// https://dba.stackexchange.com/questions/302587/what-is-faster-pg-catalog-or-information-schema
export const TABLE_QUERY = `SELECT a.attname AS name,
t1.typname AS column_type,
CASE WHEN a.atthasdef THEN pg_get_expr(d.adbin, d.adrelid) END AS default_expr,
c.relkind AS kind,
c.relname AS table_name,
n.nspname AS schema_name
FROM pg_catalog.pg_attribute a
LEFT JOIN pg_catalog.pg_type t1 ON t1.oid = a.atttypid
INNER JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
LEFT JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
WHERE a.attnum > 0
AND NOT a.attisdropped
AND n.nspname NOT IN ('information_schema', 'pg_catalog')
AND c.relkind IN ('r', 'v')
AND has_schema_privilege(current_user, n.nspname, 'USAGE')
AND has_table_privilege(current_user, c.oid, 'SELECT')
ORDER BY CASE WHEN n.nspname = current_schema() THEN 0 ELSE 1 END, n.nspname, c.relname, a.attnum;`;

export const KEYS_QUERY = `select c.conname as constraint_name,
  c.contype as constraint_type,
  sch.nspname as self_schema,
  tbl.relname as self_table,
  array_to_json(array_agg(col.attname order by u.attposition))     as self_columns,
  pg_get_constraintdef(c.oid)                       as definition
from pg_constraint c
  left join lateral unnest(c.conkey) with ordinality as u(attnum, attposition) on true
  left join lateral unnest(c.confkey) with ordinality as f_u(attnum, attposition)
            on f_u.attposition = u.attposition
  join pg_class tbl on tbl.oid = c.conrelid
  join pg_namespace sch on sch.oid = tbl.relnamespace
  left join pg_attribute col on (col.attrelid = tbl.oid and col.attnum = u.attnum)
group by constraint_name, constraint_type, self_schema, self_table, definition
order by self_schema, self_table`;

export const PRIMARY_KEY_QUERY = `SELECT a.attname as column_name, format_type(a.atttypid, a.atttypmod) AS data_type
FROM   pg_index i
JOIN   pg_attribute a ON a.attrelid = i.indrelid
AND a.attnum = ANY(i.indkey)
WHERE  i.indrelid = $1::regclass
AND    i.indisprimary;`;
