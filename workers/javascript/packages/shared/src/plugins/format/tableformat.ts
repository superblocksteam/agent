import _ from 'lodash';
import { getNormalizedName } from './normalization';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeTableColumnNames = (rows: Record<string, any>): Record<string, any>[] => {
  // Check that rows is a non-empty array as mariadb/mysql returns
  // a record object as the result from an insert, update, or delete statement.
  // Every other statement returns a list of affected records.
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  const columnNames = Object.keys(rows[0]);
  const newColumnNames = columnNames.map((column) => getNormalizedName(column));
  // early exit if normalized names are the same as original names
  if (_.isEqual(columnNames, newColumnNames)) {
    return rows;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newRows: Record<string, any>[] = [];
  for (const row of rows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRow: Record<string, any> = {};
    for (let i = 0; i < columnNames.length; i++) {
      newRow[newColumnNames[i]] = row[columnNames[i]];
    }
    newRows.push(newRow);
  }
  return newRows;
};
