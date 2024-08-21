export const SQL_SINGLE_TABLE_METADATA = `SELECT COLUMN_NAME as 'column_name', COLUMN_TYPE as 'data_type'
FROM information_schema.columns
WHERE table_schema = ?
AND table_name = ?;`;

export const DEFAULT_SCHEMA_QUERY = `SELECT DATABASE() as current_schema;`;

// rows with default schema will be listed first
export const TABLE_QUERY = `
SELECT COLUMN_NAME AS name,
TABLE_NAME AS table_name,
TABLE_SCHEMA AS schema_name,
COLUMN_TYPE AS column_type
FROM information_schema.columns
WHERE TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
ORDER BY CASE WHEN TABLE_SCHEMA = database() THEN 0 ELSE 1 END, TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;`;

export const KEYS_QUERY = `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, TABLE_SCHEMA as schema_name
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
AND CONSTRAINT_NAME = 'PRIMARY'
ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;`;

export const PRIMARY_KEY_QUERY = `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = ?
AND TABLE_NAME = ?
AND CONSTRAINT_NAME = 'PRIMARY'
ORDER BY ORDINAL_POSITION;`;
