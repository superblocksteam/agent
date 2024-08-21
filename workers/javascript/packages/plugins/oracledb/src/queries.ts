/* eslint-disable no-useless-escape */

// data_type calculation from https://stackoverflow.com/a/17194443
// oracle stores columns by default as uppercase, and oracledb returns column names as uppercase. Alias them with quotes to conform to the existing TS interface
export const DEFAULT_SCHEMA_QUERY = `SELECT table_name AS "table_name" FROM user_tables`;

export const SQL_SINGLE_TABLE_METADATA = `SELECT column_name AS "column_name", data_type || CASE
WHEN data_precision IS NOT NULL AND NVL(data_scale, 0) > 0 THEN '(' || data_precision || ',' || data_scale || ')'
WHEN data_precision IS NOT NULL AND NVL(data_scale, 0) = 0 THEN '(' || data_precision || ')'
WHEN data_precision IS NULL AND data_scale IS NOT NULL THEN '(*, ' || data_scale || ')'
WHEN char_length > 0 THEN '(' || char_length || CASE char_used 
WHEN 'C' THEN ' CHAR'
WHEN 'B' THEN ' BYTE'
ELSE NULL END || ')'
END || DECODE(nullable, 'N', ' NOT NULL') AS "data_type"
FROM all_tab_columns
WHERE all_tab_columns.owner = :1
AND all_tab_columns.table_name = :2`;

// rows belonging to the current user (which is the database) will be fetched. Otherwise there's ~21675 system records that get added if you use all_tab_columns
export const TABLE_QUERY = `SELECT user_cons_columns.owner AS "schema_name",
user_tab_columns.table_name AS "table_name",
user_tab_columns.column_name AS "column_name",
user_tab_columns.data_type || CASE
WHEN user_tab_columns.data_precision IS NOT NULL AND NVL(user_tab_columns.data_scale, 0) > 0 THEN '(' || user_tab_columns.data_precision || ',' || user_tab_columns.data_scale || ')'
WHEN user_tab_columns.data_precision IS NOT NULL AND NVL(user_tab_columns.data_scale, 0) = 0 THEN '(' || user_tab_columns.data_precision || ')'
WHEN user_tab_columns.data_precision IS NULL AND user_tab_columns.data_scale IS NOT NULL THEN '(*,'|| user_tab_columns.data_scale || ')'
WHEN user_tab_columns.char_length > 0 THEN '(' || user_tab_columns.char_length || CASE char_used 
WHEN 'C' THEN ' CHAR'
WHEN 'B' THEN ' BYTE'
ELSE NULL END || ')'
END || DECODE(nullable, 'N', ' NOT NULL') AS "column_type"
FROM user_cons_columns, user_tab_columns WHERE user_cons_columns.table_name = user_tab_columns.table_name
ORDER BY user_tab_columns.table_name, user_tab_columns.column_name`;

export const KEYS_QUERY = `SELECT
user_cons_columns.owner AS "schema_name",
user_cons_columns.table_name AS "table_name", 
user_cons_columns.column_name AS "column_name",
user_constraints.constraint_name AS "constraint_name",
user_constraints.constraint_type AS "constraint_type"
FROM user_constraints, user_cons_columns 
WHERE 
user_constraints.constraint_type = 'P'
AND user_constraints.constraint_name = user_cons_columns.constraint_name
AND user_constraints.owner = user_cons_columns.owner
ORDER BY
user_cons_columns.owner,
user_cons_columns.table_name, 
user_cons_columns.position`;

export const PRIMARY_KEY_QUERY = `SELECT
user_cons_columns.table_name AS "table_name", 
user_cons_columns.column_name AS "column_name",
all_tab_columns.data_type || CASE
WHEN all_tab_columns.data_precision IS NOT NULL AND NVL(all_tab_columns.data_scale, 0) > 0 THEN '(' || all_tab_columns.data_precision || ',' || all_tab_columns.data_scale || ')'
WHEN all_tab_columns.data_precision IS NOT NULL AND NVL(all_tab_columns.data_scale, 0) = 0 THEN '(' || all_tab_columns.data_precision || ')'
WHEN all_tab_columns.data_precision IS NULL AND all_tab_columns.data_scale IS NOT NULL THEN '(*,'|| all_tab_columns.data_scale || ')'
WHEN all_tab_columns.char_length > 0 THEN '(' || all_tab_columns.char_length || CASE char_used 
WHEN 'C' THEN ' CHAR'
WHEN 'B' THEN ' BYTE'
ELSE NULL END || ')'
END || DECODE(nullable, 'N', ' NOT NULL') AS "data_type"
FROM user_constraints, user_cons_columns, all_tab_columns 
WHERE
user_constraints.constraint_type = 'P'
AND user_constraints.constraint_name = user_cons_columns.constraint_name
AND user_constraints.owner = user_cons_columns.owner
AND all_tab_columns.column_name = user_cons_columns.column_name
AND all_tab_columns.table_name = user_cons_columns.table_name
AND all_tab_columns.owner = user_cons_columns.owner
AND UPPER(user_cons_columns.table_name) = :1
ORDER BY
user_cons_columns.owner,
user_cons_columns.table_name, 
user_cons_columns.position`;
