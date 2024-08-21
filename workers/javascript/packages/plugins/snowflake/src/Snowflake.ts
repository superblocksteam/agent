import * as SDK from 'snowflake-sdk';
import { Statement } from './Statement';
import { ConfigureOptions } from './types/ConfigureOptions';
import { ConnectionOptions } from './types/ConnectionOptions';
import { ExecuteOptions } from './types/ExecuteOptions';
import { LoggingOptions } from './types/LoggingOptions';

export class Snowflake {
  private readonly sdk_connection;
  private readonly logSql: (sqlText: string) => void;

  /**
   * Creates a new Snowflake instance.
   *
   * @param connectionOptions The Snowflake connection options
   * @param loggingOptions Controls query logging and SDK-level logging
   * @param configureOptions Additional configuration options
   */
  constructor(connectionOptions: ConnectionOptions, loggingOptions: LoggingOptions = {}, configureOptions?: ConfigureOptions | boolean) {
    if (loggingOptions && loggingOptions.logLevel) {
      // @ts-ignore
      SDK.configure({ logLevel: loggingOptions.logLevel });
    }
    this.logSql = (loggingOptions && loggingOptions.logSql) || null;

    // For backward compatibility, configureOptions is allowed to be a boolean, but it’s
    // ignored. The new default settings accomplish the same thing as the old
    // `insecureConnect` boolean.

    if (typeof configureOptions === 'boolean') {
      console.warn(
        '[snowflake-promise] the insecureConnect boolean argument is deprecated; ' +
          'please remove it or use the ocspFailOpen configure option'
      );
    } else if (typeof configureOptions === 'object') {
      SDK.configure(configureOptions);
    }

    this.sdk_connection = SDK.createConnection(connectionOptions);
  }

  /** the connection id */
  get id(): string {
    return this.sdk_connection.getId();
  }

  /** Establishes a connection if we aren't in a fatal state. */
  connect() {
    return new Promise<void>((resolve, reject) => {
      this.sdk_connection.connect((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /** Establishes a connection if we aren't in a fatal state. */
  connectAsync() {
    return new Promise<void>((resolve, reject) => {
      this.sdk_connection.connectAsync((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Immediately terminates the connection without waiting for currently
   * executing statements to complete.
   */
  destroy() {
    return new Promise<void>((resolve, reject) => {
      this.sdk_connection.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /** Create a Statement. */
  createStatement(options: ExecuteOptions) {
    return new Statement(this.sdk_connection, options, this.logSql);
  }

  /** A convenience function to execute a SQL statement and return the resulting rows. */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(sqlText: string, binds?: any[]): Promise<any[]> {
    const stmt = this.createStatement({ sqlText, binds });
    await stmt.execute();
    return stmt.getRows();
  }
}
