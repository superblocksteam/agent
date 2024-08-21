export const GET_DATSETS_QUERY = `SELECT schema_name as dataset FROM INFORMATION_SCHEMA.SCHEMATA`;

export const METADATA_BY_DATASET_QUERY = `
SELECT
  table_name,
  column_name,
  data_type
FROM
  @projectId.@dataset.INFORMATION_SCHEMA.COLUMNS;`;
