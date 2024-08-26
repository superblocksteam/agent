/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { IntegrationError } from '@superblocks/shared';
import { Connection } from 'snowflake-sdk';
import { ExecuteOptions } from './ExecuteOptions';

const CALL_EXECUTE_ERROR_MESSAGE = 'Statement not executed yet - call the execute() method';

export class Statement {
  private rows: any[] = null;
  private stmt: any = null;
  private executePromise: Promise<Statement> = null;

  /**
   * @param connection the connection object from the SDK
   * @param executeOptions the Statement configuration, including the sqlText
   * @param logSql function to use to log SQL statements
   */
  constructor(
    private readonly connection: Connection,
    private readonly executeOptions: ExecuteOptions,
    private readonly logSql: (sqlText: string) => void = null
  ) {}

  /**
   * Execute this Statement.
   * @throws if the statement was previously executed or an error occurs
   * @return Promise<void>
   */
  execute() {
    if (this.executePromise) {
      throw new IntegrationError('Statement already executed - it cannot be executed again');
    }

    this.executePromise = new Promise((resolve, reject) => {
      this.executeOptions['complete'] = (err, stmt, rows) => {
        const elapsed = Date.now() - startTime;
        if (err) {
          reject(err);
        }
        if (this.logSql) {
          this.log(elapsed);
        }
        this.rows = rows;
        // @ts-ignore
        resolve();
      };

      const startTime = Date.now();
      this.stmt = this.connection.execute(this.executeOptions);
    });

    return this.executePromise;
  }

  /**
   * Get the rows returned by the Statement.
   * @throws if the Statement was not in streaming mode
   */
  getRows() {
    if (!this.executePromise) {
      throw new IntegrationError(CALL_EXECUTE_ERROR_MESSAGE);
    }
    return this.executePromise.then(() => this.rows);
  }

  /** this statement's SQL text */
  getSqlText(): string {
    if (!this.executePromise) {
      throw new IntegrationError(CALL_EXECUTE_ERROR_MESSAGE);
    }
    return this.stmt.getSqlText();
  }

  /**
   * Returns an object that contains information about the values of the
   * current warehouse, current database, etc., when this statement finished
   * executing.
   */
  getSessionState() {
    if (!this.executePromise) {
      throw new IntegrationError(CALL_EXECUTE_ERROR_MESSAGE);
    }
    return this.stmt.getSessionState();
  }

  /** log execution details */
  private log(elapsedTime: number) {
    let logMessage = 'Executed';

    const state = this.getSessionState();
    if (state) {
      logMessage += ` (${state.getCurrentDatabase()}.${state.getCurrentSchema()})`;
    }

    logMessage += `: ${this.getSqlText()}`;
    if (logMessage[logMessage.length - 1] !== ';') {
      logMessage += ';';
    }

    if (this.executeOptions.binds) {
      logMessage += `  with binds: ${JSON.stringify(this.executeOptions.binds)};`;
    }

    logMessage += `  Elapsed time: ${elapsedTime}ms`;

    this.logSql(logMessage);
  }
}
