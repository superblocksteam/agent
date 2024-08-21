import { isEmpty, isEqual, isNull, isObject, isPlainObject, isUndefined } from 'lodash';
import { ErrorCode, IntegrationError } from '../../errors';
import { DBActionConfiguration, DBSQLActionConfiguration, ExecutionOutput, PostgresActionConfiguration } from '../../types';
import { SQLMappingModeEnum } from '../templates';
import { measureQueryTime } from './BasePlugin';

export enum SQLQueryEnum {
  SQL_KEYS = 'SQL_KEYS',
  SQL_PRIMARY_KEY = 'SQL_PRIMARY_KEY',
  SQL_SCHEMA = 'SQL_SCHEMA',
  SQL_SEARCH_PATH = 'SQL_SEARCH_PATH',
  SQL_SINGLE_TABLE_METADATA = 'SQL_SINGLE_TABLE_METADATA',
  SQL_TABLE = 'SQL_TABLE'
}

export class BaseBulkEditProvider {
  // TODO (jason4012) pack these into a function
  public parameterType;
  public readonly columnEscapeCharacter: string = `"`;
  // Some DBs like MariaDB use ANALYZE TABLE statements
  public readonly tableAnalyzePrefix: string = `ANALYZE`;
  // Most DBs use "UPDATE table1 SET ... FROM table2"
  // but MariaDB & MySQL use "UPDATE table1, table2" instead
  public readonly useSqlUpdateFromStatement: boolean = true;
  // SQL query that returns Array<{ column_name: string; data_type: string }>
  public readonly sqlSingleTableMetadata: string;
  // SQL query map
  // eslint-disable-next-line @typescript-eslint/ban-types
  public readonly sqlQueryMap: Object;
  // For MsSQL, which wraps the whole connection in a transaction
  public readonly skipTransaction: boolean;
  // For databases that are case-insensitive by default but have special characters to make names case-sensitive
  public readonly caseSensitivityWrapCharacter: string | null = null;
  // Some SQL databases don't allow semicolon to end statements, others require them
  public readonly trailingSemicolon: boolean = true;

  constructor(params?: { parameterType: string }) {
    this.parameterType = params?.parameterType;
  }

  public async getPrimaryKeys({
    mutableOutput,
    params,
    queryFn
  }: {
    mutableOutput: ExecutionOutput;
    params: string[];
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
  }): Promise<Array<{ column_name: string; data_type: string }>> {
    mutableOutput.logInfo(`${this.sqlQueryMap[SQLQueryEnum.SQL_PRIMARY_KEY]} - params ${JSON.stringify(params)}`);
    const { time, result } = await measureQueryTime(() => {
      return queryFn(this.sqlQueryMap[SQLQueryEnum.SQL_PRIMARY_KEY], params);
    });
    mutableOutput.logInfo(`Took ${time}ms`);
    if (!result.length) {
      throw new IntegrationError(`Table ${params} has no primary keys`, ErrorCode.INTEGRATION_LOGIC);
    }
    return result;
  }

  public async getAllColumns({
    mutableOutput,
    params,
    queryFn
  }: {
    mutableOutput: ExecutionOutput;
    params: string[];
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
  }): Promise<Array<{ column_name: string; data_type: string }>> {
    mutableOutput.logInfo(`${this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]} - params ${JSON.stringify(params)}`);
    const { time, result } = await measureQueryTime(() => {
      return queryFn(this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA], params);
    });
    mutableOutput.logInfo(`Took ${time}ms`);
    if (!result.length) {
      throw new IntegrationError(`Could not find column schema for ${params.join('.')}`, ErrorCode.INTEGRATION_LOGIC);
    }
    return result;
  }

  public getInsertStatements({
    databaseAndTable,
    includeIndex,
    placeholder,
    rowsByColumns,
    validColumnNames
  }: {
    databaseAndTable: string;
    includeIndex?: boolean;
    insertedRows?: Record<string, unknown>[];
    placeholder: string;
    rowsByColumns?: { [key: string]: unknown[] };
    validColumnNames: Set<string>;
  }): Array<Array<string | Array<unknown>>> {
    const insertQueriesAndParams: Array<Array<string | Array<unknown>>> = [];
    // create insert statements for each group of rows with the same columns
    for (const columnsKey in rowsByColumns) {
      const columns = columnsKey.split(',');
      const params: unknown[] = [];
      const insertQuery = `INSERT INTO ${databaseAndTable} (${columns.map(this.wrapForCaseIfNeeded.bind(this)).join(', ')})
        VALUES ${rowsByColumns[columnsKey]
          .map((row) => {
            const rowParams: Array<string> = [];
            const typedRow = row as Record<string, unknown>;
            for (const column of columns) {
              if (typedRow[column] == null) {
                params.push(null);
              } else {
                params.push(typedRow[column]);
              }
              rowParams.push(`${placeholder}${includeIndex ? params.length : ''}`);
            }
            return `(${rowParams.join(', ')})`;
          })
          .join(', ')}${this.trailingSemicolon ? ';' : ''}`;
      insertQueriesAndParams.push([insertQuery, params]);
    }
    return insertQueriesAndParams;
  }

  public getDeleteStatements({
    columns,
    columnsKey,
    databaseAndTable,
    includeIndex,
    paramIndex,
    placeholder,
    rowsByColumns
  }: {
    columns: string[];
    columnsKey: string;
    databaseAndTable: string;
    includeIndex: boolean;
    paramIndex: number;
    placeholder: string;
    rowsByColumns: { [key: string]: unknown[] };
  }): Array<Array<string | Array<unknown>>> {
    const deleteQueriesAndParams: Array<Array<string | Array<unknown>>> = [];
    const deleteParams: unknown[] = [];
    const deleteQuery = `DELETE FROM ${databaseAndTable}
      WHERE ${rowsByColumns[columnsKey]
        .map((row) => {
          const rowParams: Array<string> = [];
          const typedRow = row as Record<string, unknown>;
          for (const column of columns) {
            if (typedRow[column] == null) {
              rowParams.push(`${this.escapeAsCol(column)} IS NULL`);
            } else {
              rowParams.push(`${this.escapeAsCol(column)} = ${placeholder}${includeIndex ? paramIndex++ : ''}`);
              deleteParams.push(typedRow[column]);
            }
          }
          return `(${rowParams.join(' AND ')})`;
        })
        .join(' OR ')}${this.trailingSemicolon ? ';' : ''}`;
    deleteQueriesAndParams.push([deleteQuery, deleteParams]);
    return deleteQueriesAndParams;
  }

  public getUpdateStatements({
    columnOrder,
    databaseAndTable,
    filterBy,
    joinColumnMapping,
    tempTableName
  }: {
    columnOrder: string[];
    databaseAndTable: string;
    filterBy: string[];
    joinColumnMapping: Record<string, string>;
    tempTableName: string;
  }): string {
    const updateQuery = `UPDATE ${databaseAndTable}${!this.useSqlUpdateFromStatement ? `, ${tempTableName}` : ``}
SET ${columnOrder
      .map(
        (c) =>
          `${!this.useSqlUpdateFromStatement ? `${databaseAndTable}.` : ``}${this.escapeAsCol(c)} = ${tempTableName}.${this.escapeAsCol(
            joinColumnMapping[c] ?? c
          )}`
      )
      .join(', ')}${
      this.useSqlUpdateFromStatement
        ? `
FROM ${tempTableName}`
        : ``
    }
WHERE ${filterBy.map((c) => `${databaseAndTable}.${this.escapeAsCol(c)} = ${tempTableName}.${this.escapeAsCol(c)}`).join(' AND ')}${
      this.trailingSemicolon ? ';' : ''
    }`;
    return updateQuery;
  }

  public async getAndExecuteAnalyze({
    mutableOutput,
    queryFn,
    tempTableName
  }: {
    mutableOutput: ExecutionOutput;
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    tempTableName: string;
  }): Promise<void> {
    const analyzeQuery = `${this.tableAnalyzePrefix} ${tempTableName}`;
    mutableOutput.logInfo(analyzeQuery);
    const { time: measuredAnalyzeTime } = await measureQueryTime(async () => await queryFn(analyzeQuery));
    mutableOutput.logInfo(`Took ${measuredAnalyzeTime}ms`);
  }

  public async getAndExecuteDistinctCounts({
    databaseAndTable,
    filterBy,
    mutableOutput,
    queryFn,
    tempTableName
  }: {
    databaseAndTable: string;
    filterBy: string[];
    mutableOutput: ExecutionOutput;
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    tempTableName: string;
  }): Promise<Array<{ count: number; non_null: number }>> {
    const distinctQuery = `SELECT COUNT(*) as ${this.escapeAsCol('count')}, COUNT(${databaseAndTable}.${this.escapeAsCol(
      filterBy[0]
    )}) as ${this.escapeAsCol('non_null')} FROM ${tempTableName}
LEFT JOIN ${databaseAndTable} ON ${filterBy
      .map((c) => `${databaseAndTable}.${this.escapeAsCol(c)} = ${tempTableName}.${this.escapeAsCol(c)}`)
      .join(' AND ')}`;
    mutableOutput.logInfo(distinctQuery);
    const { time: distinctTime, result: distinctResults } = await measureQueryTime(async () => await queryFn(distinctQuery));
    mutableOutput.logInfo(`Took ${distinctTime}ms`);
    return distinctResults;
  }

  public async getAndExecuteIndexTempTable({
    indexedCols,
    mutableOutput,
    queryFn,
    tempTableName
  }: {
    indexedCols: string[];
    mutableOutput: ExecutionOutput;
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    tempTableName: string;
  }): Promise<void> {
    const applyIndex =
      this.parameterType === '@'
        ? `CREATE INDEX ${tempTableName.substring(2)}_idx ON ${tempTableName} (${indexedCols.join(', ')})`
        : `CREATE INDEX ${tempTableName.substring(0, tempTableName.length - 1)}_idx${
            this.columnEscapeCharacter
          } ON ${tempTableName} (${indexedCols.join(', ')})`;
    mutableOutput.logInfo(applyIndex);
    const measuredIndex = await measureQueryTime(async () => await queryFn(applyIndex));
    mutableOutput.logInfo(`Took ${measuredIndex.time}ms`);
  }

  public async getAndExecuteCountDeletionStatements({
    columns,
    columnsKey,
    databaseAndTable,
    includeIndex,
    mutableOutput,
    paramIndex,
    placeholder,
    queryFn,
    rowsByColumns
  }: {
    columns: string[];
    columnsKey: string;
    databaseAndTable: string;
    includeIndex: boolean;
    mutableOutput: ExecutionOutput;
    paramIndex: number;
    placeholder: string;
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    rowsByColumns: { [key: string]: unknown[] };
  }): Promise<Array<{ count: number }>> {
    const selectParams: unknown[] = [];
    const countRowsForDeletionQuery = `SELECT COUNT(*) as ${this.escapeAsCol('count')} FROM ${databaseAndTable}
      WHERE ${rowsByColumns[columnsKey]
        .map((row) => {
          const rowParams: Array<string> = [];
          const typedRow = row as Record<string, unknown>;
          for (const column of columns) {
            const value = typedRow[column];
            if (value == null) {
              rowParams.push(`${this.escapeAsCol(column)} IS NULL`);
            } else {
              rowParams.push(`${this.escapeAsCol(column)} = ${placeholder}${includeIndex ? paramIndex++ : ''}`);
              selectParams.push(value);
            }
          }
          return `(${rowParams.join(' AND ')})`;
        })
        .join(' OR ')}${this.trailingSemicolon ? ';' : ''}`;

    mutableOutput.logInfo('Validating deletion count');
    mutableOutput.logInfo(`${countRowsForDeletionQuery} - params ${JSON.stringify(selectParams)}`);
    const { time: updateTime, result } = await measureQueryTime(async () => await queryFn(countRowsForDeletionQuery, selectParams));

    mutableOutput.logInfo(`Took ${updateTime}ms`);
    return result;
  }

  public async getAndExecuteInsertTempStatements({
    branches,
    mutableOutput,
    parameters,
    queryFn,
    tempTableName
  }: {
    branches?: string[];
    filterBy?: string[];
    lookupColumnName?: {
      [k: string]: string;
    };
    mutableOutput: ExecutionOutput;
    parameters?: unknown[];
    placeholder?: string;
    potentiallyModifiedColumns?: Set<string>;
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    tempTableName: string;
    updatedRows?: Record<string, unknown>[];
  }): Promise<void> {
    const insertValues = `INSERT INTO ${tempTableName} VALUES ${branches?.join(',\n')}`;
    mutableOutput.logInfo(`${insertValues} - params ${JSON.stringify(parameters)}`);
    const measuredInsert = await measureQueryTime(async () => await queryFn(insertValues, parameters));
    mutableOutput.logInfo(`Took ${measuredInsert.time}ms`);
  }

  public async executeInsertStatements({
    insertQueriesAndParams,
    mutableOutput,
    queryFn
  }: {
    insertQueriesAndParams: Array<Array<string | Array<unknown>>>;
    mutableOutput: ExecutionOutput;
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
  }): Promise<void> {
    for (const [insertQuery, insertParams] of insertQueriesAndParams) {
      mutableOutput.logInfo(`${insertQuery} - params ${JSON.stringify(insertParams)}`);
      const { time: updateTime } = await measureQueryTime(async () => await queryFn(insertQuery as string, insertParams as Array<unknown>));
      mutableOutput.logInfo(`Took ${updateTime}ms`);
    }
  }

  public _validateActionConfigurationForUpdate(actionConfiguration: DBActionConfiguration): void {
    if (!actionConfiguration.table) {
      throw new IntegrationError('Table is required', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (!actionConfiguration.schema) {
      throw new IntegrationError('Schema is required', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (!actionConfiguration.insertedRows && !actionConfiguration.newValues && !actionConfiguration.deletedRows) {
      throw new IntegrationError(
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
  }

  public async _executeUpdateRowsPrimary(
    {
      provider,
      mutableOutput,
      actionConfiguration,
      onlyTableInPrimaryKeyQuery,
      separateSchemaAndTableInPrimaryKeyQuery,
      capitalizeSchemaOrTable
    }: {
      provider: BaseBulkEditProvider;
      mutableOutput: ExecutionOutput;
      actionConfiguration: PostgresActionConfiguration;
      onlyTableInPrimaryKeyQuery?: boolean;
      separateSchemaAndTableInPrimaryKeyQuery?: boolean;
      capitalizeSchemaOrTable?: boolean;
    },
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>,
    executeQuery: <T>(queryFunc: () => Promise<T>, additionalTraceTags?: Record<string, string>) => Promise<T>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseActionConfiguration(actionConfiguration);
    if (isEmpty(updatedRows) && isEmpty(deletedRows) && isEmpty(insertedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }
    let mappedColumns = actionConfiguration.mappedColumns ?? [];
    if (actionConfiguration.mappingMode === 'manual' && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.mappingMode !== 'manual') {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    try {
      let escapedTable = this.wrapForCaseIfNeeded(actionConfiguration.table ?? '');
      escapedTable = capitalizeSchemaOrTable ? (actionConfiguration.table ?? '').toUpperCase() : escapedTable;
      let escapedSchema = this.wrapForCaseIfNeeded(actionConfiguration.schema ?? '');
      escapedSchema = capitalizeSchemaOrTable ? (actionConfiguration.schema ?? '').toUpperCase() : escapedSchema;
      let params = [`${escapedSchema}.${escapedTable}`];
      if (onlyTableInPrimaryKeyQuery) {
        params = [escapedTable];
      } else if (separateSchemaAndTableInPrimaryKeyQuery) {
        params = [escapedSchema, escapedTable];
      }
      const primaryColumns: Array<{ column_name: string; data_type: string }> = await this.getPrimaryKeys({
        mutableOutput,
        params,
        queryFn
      });

      const allColumns: Array<{ column_name: string; data_type: string }> = await executeQuery(async () => {
        const params = [actionConfiguration.schema ?? '', actionConfiguration.table ?? ''];
        params[0] = capitalizeSchemaOrTable && params[0] ? params[0].toUpperCase() : params[0];
        params[1] = capitalizeSchemaOrTable && params[1] ? params[1].toUpperCase() : params[1];
        mutableOutput.logInfo(`${this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]} - params ${JSON.stringify(params)}`);
        const { time, result } = await measureQueryTime(() => {
          return queryFn(this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA], params);
        });
        mutableOutput.logInfo(`Took ${time}ms`);
        return result;
      });
      if (!allColumns.length) {
        throw new IntegrationError(
          `Could not find column schema for ${actionConfiguration.schema}.${actionConfiguration.table}`,
          ErrorCode.INTEGRATION_LOGIC
        );
      }

      await this._runUpdateTransaction({
        provider,
        queryFn,
        schema: actionConfiguration.schema as string,
        table: actionConfiguration.table as string,
        oldRows: updatedRows,
        insertedRows: insertedRows,
        updatedRows: updatedRows,
        deletedRows: deletedRows,
        filterBy: primaryColumns.map((row) => row.column_name),
        tableColumns: allColumns,
        isManualMapping: actionConfiguration.mappingMode === 'manual',
        isPrimaryKeyMode: true,
        mappedColumns: mappedColumns,
        mutableOutput,
        capitalizeSchemaOrTable
      });
    } catch (e) {
      if (e instanceof IntegrationError) {
        throw e;
      }
      throw new IntegrationError(e.message, ErrorCode.UNSPECIFIED, { stack: e.stack });
    }

    mutableOutput.output = null;
  }

  private async _executeUpdateRowsByCols(
    {
      provider,
      mutableOutput,
      actionConfiguration,
      capitalizeSchemaOrTable
    }: {
      provider: BaseBulkEditProvider;
      mutableOutput: ExecutionOutput;
      actionConfiguration: PostgresActionConfiguration;
      capitalizeSchemaOrTable?: boolean;
    },
    executeQuery: <T>(queryFunc: () => Promise<T>, additionalTraceTags?: Record<string, string>) => Promise<T>,
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const oldRows = this._validateAndParseRowValues(actionConfiguration.oldValues, 'Rows to Filter by');
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseActionConfiguration(actionConfiguration);
    let filterBy = actionConfiguration.filterBy;
    if (typeof filterBy === 'string') {
      // This one shouldn't happen in practice because the form is structured
      try {
        filterBy = JSON.parse(filterBy);
      } catch (e) {
        throw new IntegrationError(
          `Validation failed, list of columns to filter must be valid JSON. Bindings {{}} are recommended.`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      }
    }
    if (!Array.isArray(filterBy) || !filterBy.length || filterBy.some((col) => typeof col !== 'string')) {
      throw new IntegrationError(`Query failed, no columns to filter by`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (oldRows.length !== updatedRows.length) {
      throw new IntegrationError(`Mismatched length on filter rows and new rows`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    let mappedColumns = actionConfiguration.mappedColumns ?? [];
    if (actionConfiguration.mappingMode === 'manual' && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.mappingMode !== 'manual') {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    mutableOutput.logInfo('Fetching table columns');
    const allColumns: Array<{ column_name: string; data_type: string }> = await executeQuery(() => {
      const params = [actionConfiguration.schema, actionConfiguration.table];
      params[0] = capitalizeSchemaOrTable && params[0] ? params[0].toUpperCase() : params[0];
      params[1] = capitalizeSchemaOrTable && params[1] ? params[1].toUpperCase() : params[1];
      mutableOutput.logInfo(`${this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]} - params ${JSON.stringify(params)}`);
      return queryFn(this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA], params) as Promise<
        Array<{ column_name: string; data_type: string }>
      >;
    });

    const allColumnNames = allColumns.map((c) => c.column_name);
    filterBy.forEach((col) => {
      if (!allColumnNames.includes(col)) {
        throw new IntegrationError(
          `Can't filter using column ${col}, that column name is missing in table ${actionConfiguration.table}`,
          ErrorCode.INTEGRATION_SYNTAX
        );
      }
    });

    if (isEmpty(insertedRows) && isEmpty(updatedRows) && isEmpty(deletedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }

    await this._runUpdateTransaction({
      provider,
      queryFn,
      schema: actionConfiguration.schema as string,
      table: actionConfiguration.table as string,
      oldRows: oldRows,
      insertedRows: insertedRows,
      updatedRows: updatedRows,
      deletedRows: deletedRows,
      filterBy: filterBy as string[],
      tableColumns: allColumns,
      isManualMapping: actionConfiguration.mappingMode === 'manual',
      isPrimaryKeyMode: false,
      mappedColumns: mappedColumns,
      mutableOutput,
      capitalizeSchemaOrTable
    });
    mutableOutput.output = null;
  }

  public async executeSQLUpdateRowsPrimary(
    {
      provider,
      mutableOutput,
      actionConfiguration,
      onlyTableInPrimaryKeyQuery,
      separateSchemaAndTableInPrimaryKeyQuery,
      capitalizeSchemaOrTable
    }: {
      provider: BaseBulkEditProvider;
      mutableOutput: ExecutionOutput;
      actionConfiguration: DBSQLActionConfiguration;
      onlyTableInPrimaryKeyQuery?: boolean;
      separateSchemaAndTableInPrimaryKeyQuery?: boolean;
      capitalizeSchemaOrTable?: boolean;
    },
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>,
    queryFnMany?: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.bulkEdit?.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseSQLActionConfiguration(actionConfiguration);
    if (isEmpty(updatedRows) && isEmpty(deletedRows) && isEmpty(insertedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }
    let mappedColumns = actionConfiguration.bulkEdit?.mappedColumns ?? [];
    if (actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.bulkEdit?.mappingMode !== SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL) {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    try {
      let escapedTable = this.wrapForCaseIfNeeded(actionConfiguration.bulkEdit?.table ?? '');
      escapedTable = capitalizeSchemaOrTable ? (actionConfiguration.bulkEdit?.table ?? '').toUpperCase() : escapedTable;
      let escapedSchema = this.wrapForCaseIfNeeded(actionConfiguration.bulkEdit?.schema ?? '');
      escapedSchema = capitalizeSchemaOrTable ? (actionConfiguration.bulkEdit?.schema ?? '').toUpperCase() : escapedSchema;
      let params = [`${escapedSchema}.${escapedTable}`];
      if (onlyTableInPrimaryKeyQuery) {
        params = [escapedTable];
      } else if (separateSchemaAndTableInPrimaryKeyQuery) {
        params = [escapedSchema, escapedTable];
      }
      const primaryColumns: Array<{ column_name: string; data_type: string }> = await this.getPrimaryKeys({
        mutableOutput,
        params,
        queryFn
      });

      params = [escapedSchema, escapedTable];

      const allColumns: Array<{ column_name: string; data_type: string }> = await this.getAllColumns({
        mutableOutput,
        params,
        queryFn
      });

      await this._runUpdateTransaction({
        provider,
        queryFn,
        queryFnMany,
        schema: actionConfiguration.bulkEdit?.schema as string,
        table: actionConfiguration.bulkEdit?.table as string,
        oldRows: updatedRows,
        insertedRows: insertedRows,
        updatedRows: updatedRows,
        deletedRows: deletedRows,
        filterBy: primaryColumns.map((row) => row.column_name),
        tableColumns: allColumns,
        isManualMapping: actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL,
        isPrimaryKeyMode: true,
        mappedColumns: mappedColumns,
        mutableOutput,
        capitalizeSchemaOrTable
      });
    } catch (e) {
      if (e instanceof IntegrationError) {
        throw e;
      }
      throw new IntegrationError(e.message, ErrorCode.UNSPECIFIED, { stack: e.stack });
    }

    mutableOutput.output = null;
  }

  public async executeSQLUpdateRowsByCols(
    {
      provider,
      mutableOutput,
      actionConfiguration,
      capitalizeSchemaOrTable
    }: {
      provider: BaseBulkEditProvider;
      mutableOutput: ExecutionOutput;
      actionConfiguration: DBSQLActionConfiguration;
      capitalizeSchemaOrTable?: boolean;
    },
    executeQuery: <T>(queryFunc: () => Promise<T>, additionalTraceTags?: Record<string, string>) => Promise<T>,
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>,
    queryFnMany?: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.bulkEdit?.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const oldRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.oldRows, 'Rows to Filter by');
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseSQLActionConfiguration(actionConfiguration);
    let filterBy = actionConfiguration.bulkEdit?.filterBy;
    if (typeof filterBy === 'string') {
      // This one shouldn't happen in practice because the form is structured
      try {
        filterBy = JSON.parse(filterBy);
      } catch (e) {
        throw new IntegrationError(
          `Validation failed, list of columns to filter must be valid JSON. Bindings {{}} are recommended.`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      }
    }
    if (!Array.isArray(filterBy) || !filterBy.length || filterBy.some((col) => typeof col !== 'string')) {
      throw new IntegrationError(`Query failed, no columns to filter by`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (oldRows.length !== updatedRows.length) {
      throw new IntegrationError(`Mismatched length on filter rows and new rows`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    let mappedColumns = actionConfiguration.bulkEdit?.mappedColumns ?? [];
    if (actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.bulkEdit?.mappingMode !== SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL) {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    mutableOutput.logInfo('Fetching table columns');
    const allColumns: Array<{ column_name: string; data_type: string }> = await executeQuery(() => {
      const params = [actionConfiguration.bulkEdit?.schema, actionConfiguration.bulkEdit?.table];
      params[0] = capitalizeSchemaOrTable && params[0] ? params[0].toUpperCase() : params[0];
      params[1] = capitalizeSchemaOrTable && params[1] ? params[1].toUpperCase() : params[1];
      mutableOutput.logInfo(`${this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]} - params ${JSON.stringify(params)}`);
      return queryFn(this.sqlQueryMap[SQLQueryEnum.SQL_SINGLE_TABLE_METADATA], params) as Promise<
        Array<{ column_name: string; data_type: string }>
      >;
    });

    const allColumnNames = allColumns.map((c) => c.column_name);
    filterBy.forEach((col) => {
      if (!allColumnNames.includes(col)) {
        throw new IntegrationError(
          `Can't filter using column ${col}, that column name is missing in table ${actionConfiguration.bulkEdit?.table}`,
          ErrorCode.INTEGRATION_SYNTAX
        );
      }
    });

    if (isEmpty(insertedRows) && isEmpty(updatedRows) && isEmpty(deletedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }

    await this._runUpdateTransaction({
      provider,
      queryFn,
      queryFnMany,
      schema: actionConfiguration.bulkEdit?.schema as string,
      table: actionConfiguration.bulkEdit?.table as string,
      oldRows: oldRows,
      insertedRows: insertedRows,
      updatedRows: updatedRows,
      deletedRows: deletedRows,
      filterBy: filterBy as string[],
      tableColumns: allColumns,
      isManualMapping: actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL,
      isPrimaryKeyMode: false,
      mappedColumns: mappedColumns,
      mutableOutput,
      capitalizeSchemaOrTable
    });
    mutableOutput.output = null;
  }

  // DEFER(jason4012) remove the legacy path by migrating all SQL DB plugins to use the bulkEdit format
  private _validateAndParseActionConfiguration(actionConfiguration: DBActionConfiguration): {
    insertedRows: Array<Record<string, unknown>>;
    updatedRows: Array<Record<string, unknown>>;
    deletedRows: Array<Record<string, unknown>>;
  } {
    let notGivenCount = 0;
    const allInitialValues = {
      insertedRows: [] as Array<Record<string, unknown>>,
      updatedRows: [] as Array<Record<string, unknown>>,
      deletedRows: [] as Array<Record<string, unknown>>
    };

    try {
      allInitialValues.insertedRows = this._validateAndParseRowValues(actionConfiguration.insertedRows, 'Inserted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.updatedRows = this._validateAndParseRowValues(actionConfiguration.newValues, 'Updated Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.deletedRows = this._validateAndParseRowValues(actionConfiguration.deletedRows, 'Deleted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    if (notGivenCount === 3) {
      throw new IntegrationError(
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
    return allInitialValues;
  }

  private _validateAndParseSQLActionConfiguration(actionConfiguration: DBSQLActionConfiguration): {
    insertedRows: Array<Record<string, unknown>>;
    updatedRows: Array<Record<string, unknown>>;
    deletedRows: Array<Record<string, unknown>>;
  } {
    let notGivenCount = 0;
    const allInitialValues = {
      insertedRows: [] as Array<Record<string, unknown>>,
      updatedRows: [] as Array<Record<string, unknown>>,
      deletedRows: [] as Array<Record<string, unknown>>
    };

    try {
      allInitialValues.insertedRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.insertedRows, 'Inserted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.updatedRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.updatedRows, 'Updated Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.deletedRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.deletedRows, 'Deleted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    if (notGivenCount === 3) {
      throw new IntegrationError(
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
    return allInitialValues;
  }

  private _validateAndParseRowValues(values, description: string): Array<Record<string, unknown>> {
    // description is something like 'Inserted Rows', 'Updated Rows', 'Deleted Rows'
    if (values === undefined) {
      throw new TypeError(`${description} was not given.`);
    }
    let validatedValues = values;
    if (typeof values === 'string') {
      if (values.trim() === '') {
        validatedValues = [];
      } else {
        try {
          validatedValues = JSON.parse(values);
        } catch (e) {
          throw new IntegrationError(
            `Validation failed, list of ${description} must be valid JSON. Given '${JSON.stringify(
              values
            )}'. Bindings {{}} are recommended.`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
          );
        }
      }
    }
    if (!Array.isArray(validatedValues) || validatedValues === null) {
      throw new IntegrationError(
        `Validation failed, ${description} is not an array. Given '${JSON.stringify(values)}'`,
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
    // check that everything in validated values is an object and not an empty object {}
    for (const row of validatedValues) {
      if (typeof row !== 'object' || Array.isArray(row)) {
        throw new IntegrationError(
          `Validation failed, ${description} has a row that is not a plain object: '${String(row)}'`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      } else if (Object.keys(row).length === 0) {
        throw new IntegrationError(
          `Validation failed, ${description} must not contain any empty rows. Given '${JSON.stringify(values)}'`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      }
    }
    return validatedValues;
  }

  protected async _runUpdateTransaction({
    provider,
    queryFn,
    queryFnMany,
    schema,
    table,
    oldRows,
    insertedRows,
    updatedRows,
    deletedRows,
    filterBy,
    tableColumns,
    mutableOutput,
    isManualMapping,
    isPrimaryKeyMode,
    mappedColumns,
    capitalizeSchemaOrTable
  }: {
    provider: BaseBulkEditProvider;
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    queryFnMany?: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    table: string;
    schema: string;
    oldRows: unknown[];
    insertedRows: Array<Record<string, unknown>>;
    updatedRows: Array<Record<string, unknown>>;
    deletedRows: Array<Record<string, unknown>>;
    filterBy: string[];
    tableColumns: Array<{ column_name: string; data_type: string }>;
    isManualMapping: boolean;
    isPrimaryKeyMode: boolean;
    mappedColumns: Exclude<PostgresActionConfiguration['mappedColumns'], undefined>;
    mutableOutput: ExecutionOutput;
    capitalizeSchemaOrTable?: boolean;
  }): Promise<void> {
    const branches: string[] = [];
    const parameters: unknown[] = [];
    const placeholder = this.parameterType === '@' ? '@PARAM_' : ['$', ':'].includes(this.parameterType) ? this.parameterType : '?';
    const includeIndex = ['@PARAM_', '$', ':'].includes(placeholder);
    mutableOutput.logInfo('Validating columns for filtering');
    const validColumnNames = new Set(tableColumns.map((m) => m.column_name));
    if (isManualMapping) {
      mutableOutput.logInfo('Validating manual column mappings');
      mappedColumns.forEach((col) => {
        if (!validColumnNames.has(col.sql)) {
          throw new IntegrationError(
            `Manual mapping failed because ${col.sql} is not a valid column in ${this.escapeAsCol(table)}`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
          );
        }
      });
    }

    const databaseAndTable = `${this.escapeAsCol(capitalizeSchemaOrTable ? schema.toUpperCase() : schema)}.${this.escapeAsCol(
      capitalizeSchemaOrTable ? table.toUpperCase() : table
    )}`;

    const lookupColumnName = isManualMapping
      ? Object.fromEntries(
          mappedColumns.map((col) => {
            return [col.json, col.sql];
          })
        )
      : Object.fromEntries(tableColumns.map((col) => [col.column_name, col.column_name]));

    const lookupJsonKey = isManualMapping
      ? Object.fromEntries(
          mappedColumns.map((col) => {
            return [col.sql, col.json];
          })
        )
      : Object.fromEntries(tableColumns.map((col) => [col.column_name, col.column_name]));

    const previouslySeenFilters: Array<Array<unknown>> = [];
    oldRows.forEach((row) => {
      if (!isObject(row) || !isPlainObject(row)) {
        throw new IntegrationError(`One of the rows in the filter rows is not a plain object: ${String(row)}`, ErrorCode.INTEGRATION_LOGIC);
      }
      if (!isManualMapping) {
        Object.keys(row).forEach((k) => {
          if (!validColumnNames.has(lookupColumnName[k])) {
            throw new IntegrationError(`Column "${k}" doesn't exist in table ${databaseAndTable}`, ErrorCode.INTEGRATION_SYNTAX);
          }
        });
      }
      const filterValues: unknown[] = [];
      filterBy.forEach((col) => {
        const jsonKey = lookupJsonKey[col];
        if (isUndefined(jsonKey)) {
          throw new IntegrationError(`Can't filter by "${col}" because it's missing in the column mapping`, ErrorCode.INTEGRATION_SYNTAX);
        }
        const val = row[jsonKey];
        if (isUndefined(val)) {
          throw new IntegrationError(
            `Missing ${isPrimaryKeyMode ? 'primary key column' : 'filter column'} "${
              isManualMapping ? lookupJsonKey[col] : col
            }" in row: ${JSON.stringify(row)}`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        if (isNull(val)) {
          throw new IntegrationError(
            `Null is not allowed in ${isPrimaryKeyMode ? 'primary key column' : 'filter column'} "${
              isManualMapping ? lookupJsonKey[col] : col
            }" in row: ${JSON.stringify(row)}`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        filterValues.push(val);
      });
      if (previouslySeenFilters.find((f) => isEqual(f, filterValues))) {
        throw new IntegrationError(`Some rows are duplicates, found ${JSON.stringify(filterValues)}`, ErrorCode.INTEGRATION_LOGIC);
      } else {
        // Tracks duplicates
        previouslySeenFilters.push(filterValues);
      }
    });

    let insertQueriesAndParams: Array<Array<string | Array<unknown>>> = [];
    if (insertedRows.length > 0) {
      // remap the column names if this is a manually mapped table
      if (isManualMapping) {
        insertedRows = this.retrieveMappedRows(insertedRows, lookupColumnName);
      }

      // group the rows by the columns they contain
      const rowsByColumns: { [key: string]: unknown[] } = {};
      insertedRows.forEach((row) => {
        const columns = Object.keys(row);
        const columnsKey = columns.sort().join(',');
        if (!rowsByColumns[columnsKey]) {
          rowsByColumns[columnsKey] = [];
        }
        rowsByColumns[columnsKey].push(row);
      });

      insertQueriesAndParams = this.getInsertStatements({
        databaseAndTable,
        includeIndex,
        insertedRows,
        placeholder,
        rowsByColumns,
        validColumnNames
      });
    }

    let deleteQueriesAndParams: Array<Array<string | Array<unknown>>> = [];
    if (deletedRows.length > 0) {
      if (isManualMapping) {
        deletedRows = this.retrieveMappedRows(deletedRows, lookupColumnName);
      }
      const rowsByColumns: { [key: string]: unknown[] } = {};
      deletedRows.forEach((row) => {
        const columns = Object.keys(row);
        const columnsKey = JSON.stringify(columns.sort());
        if (!rowsByColumns[columnsKey]) {
          rowsByColumns[columnsKey] = [];
        }
        rowsByColumns[columnsKey].push(row);
      });

      for (const columnsKey in rowsByColumns) {
        const columns = JSON.parse(columnsKey);

        let paramIndex = 1;
        const result = await this.getAndExecuteCountDeletionStatements({
          columns,
          columnsKey,
          databaseAndTable,
          includeIndex,
          mutableOutput,
          paramIndex,
          placeholder,
          queryFn,
          rowsByColumns
        });
        // NOTE: There can still be edge cases where a row A matches no existing rows and row B
        // matches 2 existing rows instead of 1 and this criteria passes.
        // TODO: Use the temp table method for deletion to ensure we only delete the intended rows 100% of the time.
        let selectedCount;
        if (result[0].count != null) {
          selectedCount = result[0].count;
          selectedCount = typeof selectedCount === 'string' ? parseInt(selectedCount, 10) : (selectedCount as number);
        } else {
          throw new IntegrationError(`Unexpected result from count query: ${JSON.stringify(result)}`, ErrorCode.INTEGRATION_SYNTAX);
        }
        if (parseInt(selectedCount) > rowsByColumns[columnsKey].length) {
          throw new IntegrationError(
            `The number of rows given to delete (${deletedRows.length}) is less than the number of rows that would be deleted (${result[0].count}).`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        } else {
          mutableOutput.logInfo(`${selectedCount} existing rows match the delete query.`);
        }

        paramIndex = 1;
        deleteQueriesAndParams = deleteQueriesAndParams.concat(
          this.getDeleteStatements({
            columns,
            columnsKey,
            databaseAndTable,
            includeIndex,
            paramIndex,
            placeholder,
            rowsByColumns
          })
        );
      }
    }

    // only need temp table for updates
    if (updatedRows.length > 0) {
      // there are updates and possibly inserts and deletes
      mutableOutput.logInfo('Validating columns for updates');
      const potentiallyModifiedColumns = new Set<string>();
      let hasAnyPrimaryKeyDiffs = false;
      updatedRows.forEach((row, index) => {
        if (!isObject(row) || !isPlainObject(row)) {
          throw new IntegrationError(
            `One of the rows in the update rows is not a plain object: ${String(row)}`,
            ErrorCode.INTEGRATION_LOGIC
          );
        }
        if (isManualMapping) {
          mappedColumns.forEach((c) => {
            if (!isUndefined(row[c.json])) {
              potentiallyModifiedColumns.add(c.sql);
            }
          });
        } else {
          Object.keys(row).forEach((k) => {
            if (!validColumnNames.has(lookupColumnName[k])) {
              throw new IntegrationError(`Column "${k}" doesn't exist in table ${databaseAndTable}`, ErrorCode.INTEGRATION_SYNTAX);
            }
            potentiallyModifiedColumns.add(k);
          });
        }
        const oldRow = oldRows[index] as Record<string, unknown>;
        for (const primaryColumn of filterBy) {
          if (!isEqual(oldRow[lookupJsonKey[primaryColumn]], row[lookupJsonKey[primaryColumn]])) {
            hasAnyPrimaryKeyDiffs = true;
            break;
          }
        }
      });
      // If the user has modified any primary keys then we need to include the old ID & new ID,
      // otherwise we can include only one
      if (!hasAnyPrimaryKeyDiffs) {
        for (const primaryColumn of filterBy) {
          potentiallyModifiedColumns.delete(primaryColumn);
        }
      }

      if (!potentiallyModifiedColumns.size) {
        throw new IntegrationError(`Couldn't detect any columns to update in the list of new rows`, ErrorCode.INTEGRATION_LOGIC);
      }

      const tempTableName = this.getTempTableName();
      try {
        const indexedCols: string[] = [];
        let tableTypeString =
          filterBy
            .map((col) => {
              const match = tableColumns.find((m) => m.column_name === col);
              if (match) {
                indexedCols.push(this.escapeAsCol(col));
                return `${this.escapeAsCol(col)} ${match.data_type}`;
              }
              throw new IntegrationError(`Missing data type for column ${this.escapeAsCol(col)}`, ErrorCode.INTEGRATION_SYNTAX);
            })
            .join(',\n') + ',\n';

        const joinColumnMapping: Record<string, string> = {};

        const columnOrder = Array.from(potentiallyModifiedColumns);
        tableTypeString += columnOrder
          .map((col) => {
            const match = tableColumns.find((m) => m.column_name === col);
            if (match) {
              let uniqueName = col;
              if (hasAnyPrimaryKeyDiffs) {
                uniqueName += '2';
                // Continue appending the number 2 to our column name until it's not a duplicate
                while (validColumnNames.has(uniqueName) || Object.values(joinColumnMapping).includes(uniqueName)) {
                  uniqueName += '2';
                }
              }
              joinColumnMapping[col] = uniqueName;
              return `${this.escapeAsCol(uniqueName)} ${match.data_type}`;
            }
            throw new IntegrationError(`Missing data type for column ${this.escapeAsCol(col)}`, ErrorCode.INTEGRATION_SYNTAX);
          })
          .join(',\n');

        for (let i = 0; i < updatedRows.length; i++) {
          // Important: this is 1-indexed for SQL
          const oldRow = oldRows[i] as Record<string, unknown>;
          const newRow = updatedRows[i] as Record<string, unknown>;
          const indices = Array(filterBy.length + columnOrder.length)
            .fill('')
            .map((v, j) => {
              if (['@', '$', ':'].includes(this.parameterType)) {
                const index = i * (filterBy.length + columnOrder.length) + j + 1;
                if (this.parameterType === '@') {
                  return `@PARAM_${index}`;
                }
                return `${this.parameterType}${index}`;
              }
              return '?';
            });
          branches.push(`(${indices.join(', ')})`);
          filterBy.forEach((filterSql) => {
            parameters.push(oldRow[lookupJsonKey[filterSql]]);
          });
          columnOrder.forEach((columnSql) => {
            parameters.push(newRow[lookupJsonKey[columnSql]]);
          });
        }
        if (!this.skipTransaction) {
          mutableOutput.logInfo('Beginning transaction');
          await queryFn(`BEGIN`);
        }

        const createTable = `CREATE ${!['@', ':'].includes(this.parameterType) ? 'TEMPORARY TABLE' : 'TABLE'} ${tempTableName}
(
${tableTypeString}
)`;
        mutableOutput.logInfo(createTable);
        const measuredCreate = await measureQueryTime(async () => await queryFn(createTable));
        mutableOutput.logInfo(`Took ${measuredCreate.time}ms`);

        // insert rows into the temp table
        await this.getAndExecuteInsertTempStatements({
          branches,
          filterBy,
          lookupColumnName,
          mutableOutput,
          parameters,
          placeholder,
          potentiallyModifiedColumns,
          queryFn: queryFnMany ? queryFnMany : queryFn,
          tempTableName,
          updatedRows
        });

        // create an index for the temp table
        await this.getAndExecuteIndexTempTable({
          indexedCols,
          mutableOutput,
          queryFn,
          tempTableName
        });

        // run analysis and statistics on temp table
        await this.getAndExecuteAnalyze({
          mutableOutput,
          queryFn,
          tempTableName
        });

        const distinctResults = await this.getAndExecuteDistinctCounts({
          databaseAndTable,
          filterBy,
          mutableOutput,
          queryFn,
          tempTableName
        });
        const count = typeof distinctResults?.[0]?.count === 'string' ? parseInt(distinctResults?.[0]?.count) : distinctResults?.[0]?.count;
        const nonNullCount =
          typeof distinctResults?.[0]?.non_null === 'string' ? parseInt(distinctResults?.[0]?.non_null) : distinctResults?.[0]?.non_null;
        if (!count) {
          throw new IntegrationError(
            `Update rolled back because no matches were found on ${this.escapeAsCol(table)} on columns ${filterBy.join(', ')}`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        if (count !== updatedRows.length) {
          throw new IntegrationError(
            `Update rolled back because the uniqueness constraint was not met by ${this.escapeAsCol(table)}. You provided ${
              updatedRows.length
            } rows, and ${count} rows were matched. `,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        if (nonNullCount !== updatedRows.length) {
          throw new IntegrationError(
            `Update rolled back because you provided ${updatedRows.length} rows, but table ${this.escapeAsCol(
              table
            )} contains ${nonNullCount} matching rows. `,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        // insert if we have rows to insert
        if (insertedRows.length > 0) {
          await this.executeInsertStatements({
            insertQueriesAndParams,
            mutableOutput,
            queryFn: queryFnMany ? queryFnMany : queryFn
          });
        }

        // If a bulk edit function isn't passed, there are two possible multi-table UPDATE statements based on the SQL dialect
        const updateQuery = this.getUpdateStatements({
          columnOrder,
          databaseAndTable,
          filterBy,
          joinColumnMapping,
          tempTableName
        });
        mutableOutput.logInfo(updateQuery);

        const { time: updateTime } = await measureQueryTime(async () => await queryFn(updateQuery));
        mutableOutput.logInfo(`Took ${updateTime}ms`);

        // delete if we have rows to delete
        if (deletedRows.length > 0) {
          for (const [deleteQuery, deleteParams] of deleteQueriesAndParams) {
            mutableOutput.logInfo(`${deleteQuery} - params ${JSON.stringify(deleteParams)}`);
            const { time: updateTime } = await measureQueryTime(
              async () => await queryFn(deleteQuery as string, deleteParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${updateTime}ms`);
          }
        }

        if (!this.skipTransaction) {
          mutableOutput.logInfo('COMMIT');
          const { time: commitTime } = await measureQueryTime(async () => await queryFn('COMMIT'));
          mutableOutput.logInfo(`Took ${commitTime}ms`);
        }
      } catch (err) {
        if (!this.skipTransaction) {
          mutableOutput.logInfo('ROLLBACK');
          const { time: rollbackTime } = await measureQueryTime(async () => await queryFn('ROLLBACK'));
          mutableOutput.logInfo(`Took ${rollbackTime}ms`);
        }
        throw new IntegrationError(`Query failed, ${err.message}`, ErrorCode.INTEGRATION_SYNTAX);
      }
    } else if (deletedRows.length > 0 || insertedRows.length > 0) {
      // have inserts or deletes but not updates
      try {
        if (!this.skipTransaction && (insertQueriesAndParams.length > 1 || deleteQueriesAndParams.length > 1)) {
          mutableOutput.logInfo('Beginning transaction');
          await queryFn(`BEGIN`);
        }

        if (insertedRows.length > 0) {
          await this.executeInsertStatements({
            insertQueriesAndParams,
            mutableOutput,
            queryFn: queryFnMany ? queryFnMany : queryFn
          });
        }

        if (deletedRows.length > 0) {
          for (const [deleteQuery, deleteParams] of deleteQueriesAndParams) {
            mutableOutput.logInfo(`${deleteQuery} - params ${JSON.stringify(deleteParams)}`);
            const { time: deleteTime } = await measureQueryTime(
              async () => await queryFn(deleteQuery as string, deleteParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${deleteTime}ms`);
          }
        }

        if (!this.skipTransaction && (insertQueriesAndParams.length > 1 || deleteQueriesAndParams.length > 1)) {
          mutableOutput.logInfo('COMMIT');
          const { time: commitTime } = await measureQueryTime(async () => await queryFn('COMMIT'));
          mutableOutput.logInfo(`Took ${commitTime}ms`);
        }
      } catch (err) {
        if (!this.skipTransaction && deletedRows.length > 0 && insertedRows.length > 0) {
          mutableOutput.logInfo('ROLLBACK');
          const { time: rollbackTime } = await measureQueryTime(async () => await queryFn('ROLLBACK'));
          mutableOutput.logInfo(`Took ${rollbackTime}ms`);
        }
        throw new IntegrationError(`Query failed, ${err.message}`, ErrorCode.UNSPECIFIED, { stack: err.stack });
      }
    }
  }

  public retrieveMappedRows(rows: Record<string, unknown>[], lookupColumnName: Record<string, string>): Record<string, unknown>[] {
    rows = rows.map((row) => {
      const newRow = {};
      for (const [column, value] of Object.entries(row)) {
        // only get mapped columns
        if (column in lookupColumnName) {
          newRow[lookupColumnName[column]] = value;
        }
      }
      return newRow;
    });
    return rows;
  }

  // if needed, this will format a string if it is mixed case
  public wrapForCaseIfNeeded(originalString: string): string {
    // check if we have a wrap character and this is a mixed case string
    let newString = originalString;
    if (this.caseSensitivityWrapCharacter) {
      newString = `${this.caseSensitivityWrapCharacter}${originalString}${this.caseSensitivityWrapCharacter}`;
    }
    return newString;
  }

  public escapeAsCol(str: string): string {
    if (this.columnEscapeCharacter.length === 2) {
      // Some SQL engines use [] for identifier references, such as [tablename].[column]
      // In this case we need to escape using [[ or ]]
      let newStr = str;
      for (const char of this.columnEscapeCharacter) {
        // Escape the special characters [ and ]
        newStr = newStr.replace(new RegExp('\\' + char, 'g'), `${char}${char}`);
      }
      return this.columnEscapeCharacter[0] + newStr + this.columnEscapeCharacter[1];
    }

    // Typical SQL engines use " or ` for identifier references, such as "tablename". To escape a quote inside the identifier, most engines
    // support doubling.
    return (
      this.columnEscapeCharacter +
      str.replace(new RegExp(this.columnEscapeCharacter, 'g'), `${this.columnEscapeCharacter}${this.columnEscapeCharacter}`) +
      this.columnEscapeCharacter
    );
  }

  // This function is mocked for testing since it relies on dates. The use of dates is because
  // using an existing table name can throw errors, especially if we're using the same DB connection
  getTempTableName(): string {
    return this.escapeAsCol(`sbwritetable${+new Date()}`);
  }
}
