import { BaseBulkEditProvider, ExecutionOutput, SQLQueryEnum, measureQueryTime } from '@superblocks/shared';
import { DEFAULT_SCHEMA_QUERY, KEYS_QUERY, PRIMARY_KEY_QUERY, SQL_SINGLE_TABLE_METADATA, TABLE_QUERY } from './queries';

export class OracleDbBulkEditProvider extends BaseBulkEditProvider {
  public readonly columnEscapeCharacter = '"';
  public readonly sqlQueryMap = {
    [SQLQueryEnum.SQL_KEYS]: KEYS_QUERY,
    [SQLQueryEnum.SQL_PRIMARY_KEY]: PRIMARY_KEY_QUERY,
    [SQLQueryEnum.SQL_SCHEMA]: DEFAULT_SCHEMA_QUERY,
    [SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]: SQL_SINGLE_TABLE_METADATA,
    [SQLQueryEnum.SQL_TABLE]: TABLE_QUERY
  };
  public readonly caseSensitivityWrapCharacter = '"';
  public readonly skipTransaction = true;
  public readonly tableAnalyzePrefix = 'ANALYZE TABLE';
  public readonly useSqlUpdateFromStatement = false;
  public readonly trailingSemicolon = false;

  constructor(params?: { parameterType: string }) {
    super(params);
    this.parameterType = params?.parameterType;
  }

  public getInsertStatements({
    databaseAndTable,
    insertedRows,
    placeholder,
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
    // plugin has bulk transaction logic built in, use it to generate insert statements
    const columns = Array.from(validColumnNames);
    const insertQuery = `INSERT INTO ${databaseAndTable} VALUES (${columns.map((columnName) => `${placeholder}${columnName}`).join(', ')})`;
    const params =
      insertedRows?.map((insertedRow) =>
        Object.assign(
          columns.reduce(
            (acc: Record<string, unknown>, column: string) => {
              acc[column] = null;
              return acc;
            },
            {} as Record<string, unknown>
          ) as Record<string, unknown>,
          insertedRow
        )
      ) ?? [];
    insertQueriesAndParams.push([insertQuery, params]);
    return insertQueriesAndParams;
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
    const updateQuery = `MERGE INTO ${databaseAndTable} USING (SELECT ${columnOrder
      .map((c) => this.escapeAsCol(joinColumnMapping[c]))
      .concat(filterBy.map((c) => this.escapeAsCol(c)))
      .join(', ')} 
    FROM ${tempTableName}) temptable ON (${filterBy
      .map((c) => `${databaseAndTable}.${this.escapeAsCol(c)} = temptable.${this.escapeAsCol(c)}`)
      .join(' AND ')})
    WHEN MATCHED THEN UPDATE SET ${columnOrder
      .map((c) => `${databaseAndTable}.${this.escapeAsCol(c)} = temptable.${this.escapeAsCol(joinColumnMapping[c] ?? c)}`)
      .join(', ')}`;
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
    const analyzeQuery = `${this.tableAnalyzePrefix} ${tempTableName} COMPUTE STATISTICS FOR TABLE`;
    mutableOutput.logInfo(analyzeQuery);
    const { time: measuredAnalyzeTime } = await measureQueryTime(async () => await queryFn(analyzeQuery));
    mutableOutput.logInfo(`Took ${measuredAnalyzeTime}ms`);
  }

  public async getAndExecuteInsertTempStatements({
    filterBy,
    lookupColumnName,
    mutableOutput,
    placeholder,
    potentiallyModifiedColumns,
    queryFn,
    tempTableName,
    updatedRows
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
    const columns = filterBy?.concat(Array.from(potentiallyModifiedColumns ?? new Set<string>()));
    const insertQuery = `INSERT INTO ${tempTableName} VALUES (${columns?.map((columnName) => `${placeholder}${columnName}`).join(', ')})`;
    const mappedUpdatedRows = this.retrieveMappedRows(updatedRows ?? [], lookupColumnName ?? {});
    const insertParams = mappedUpdatedRows.map((insertedRow) =>
      Object.assign(
        columns?.reduce(
          (acc: Record<string, unknown>, column: string) => {
            acc[column] = null;
            return acc;
          },
          {} as Record<string, unknown>
        ) as Record<string, unknown>,
        insertedRow
      )
    );
    mutableOutput.logInfo(`${insertQuery} - params ${JSON.stringify(insertParams)}`);
    const { time: updateTime } = await measureQueryTime(async () => await queryFn(insertQuery as string, insertParams as Array<unknown>));
    mutableOutput.logInfo(`Took ${updateTime}ms`);
  }
}
