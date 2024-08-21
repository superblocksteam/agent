/* eslint-disable no-useless-escape */

export const DEFAULT_SCHEMA_QUERY = `SELECT current_catalog();`;

export const SQL_SINGLE_TABLE_METADATA = `SELECT column_name, data_type
FROM system.information_schema.columns
WHERE table_schema = {{PARAM_1}}
AND table_name = {{PARAM_2}};`;

export const TABLE_QUERY = `SELECT column_name,
table_name AS table_name,
table_schema AS schema_name,
data_type AS column_type,
table_catalog AS database_name
FROM system.information_schema.columns
WHERE TABLE_SCHEMA != 'information_schema'
ORDER BY CASE WHEN database_name = current_catalog() THEN 0 ELSE 1 END, TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;`;

export const KEYS_QUERY = `SELECT kcu.table_name AS table_name, kcu.column_name AS column_name, kcu.table_schema AS schema_name, kcu.table_catalog AS database_name
FROM system.information_schema.TABLE_CONSTRAINTS tc INNER JOIN system.information_schema.KEY_COLUMN_USAGE kcu
ON tc.table_catalog = kcu.table_catalog
AND tc.table_schema = kcu.table_schema
AND tc.table_name = kcu.table_name
WHERE kcu.table_schema != 'information_schema'
AND constraint_type = 'PRIMARY KEY'
ORDER BY kcu.table_schema, kcu.table_name, kcu.ordinal_position;`;

export const PRIMARY_KEY_QUERY = `SELECT kcu.table_name AS table_name, kcu.column_name AS column_name, kcu.table_schema AS schema_name, kcu.table_catalog AS database_name
FROM system.information_schema.TABLE_CONSTRAINTS tc INNER JOIN system.information_schema.KEY_COLUMN_USAGE kcu
ON tc.table_catalog = kcu.table_catalog
AND tc.table_schema = kcu.table_schema
AND tc.table_name = kcu.table_name
WHERE kcu.table_schema != 'information_schema'
AND constraint_type = 'PRIMARY KEY'
ORDER BY kcu.table_schema, kcu.table_name, kcu.ordinal_position;`;
