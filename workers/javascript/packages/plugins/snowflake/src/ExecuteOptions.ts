export interface ExecuteOptions {
  sqlText: string;
  // this will be ExecutionConext.preparedStatementContext
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  binds?: any[];
}
