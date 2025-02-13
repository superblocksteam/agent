import { createConnection, configure, ConnectionOptions, ConfigureOptions } from 'snowflake-sdk';
import { ExecuteOptions } from './ExecuteOptions';
import { Statement } from './Statement';

export class Snowflake {
  private readonly sdkConnection;
  private readonly logSql: (sqlText: string) => void;

  /**
   * Creates a new Snowflake instance.
   *
   * @param connectionOptions The Snowflake connection options
   * @param loggingOptions Controls query logging and SDK-level logging
   * @param configureOptions Additional configuration options
   */
  constructor(connectionOptions: ConnectionOptions) {
    // We set insecureConnect to true here to disable OCSP checking.
    //
    // There's a bug in the snowflake-sdk version we're using that causes
    // the event loop to be blocked (indefinitely) when attempting to write
    // the OCSP cache file to disk, when running in an OPA. This causes the
    // worker to become unresponsive and unable to execute any plugins.
    configure({ logLevel: 'DEBUG', insecureConnect: true } as ConfigureOptions);

    // here we set timeout globally
    // maximum amount of time to keep the connection alive with no response (ms)
    connectionOptions.timeout = 10000;
    // number of retries
    connectionOptions.sfRetryMaxLoginRetries = 2;
    this.sdkConnection = createConnection(connectionOptions);
  }

  /** Establishes a connection if we aren't in a fatal state. */
  connectAsync() {
    return new Promise<void>((resolve, reject) => {
      this.sdkConnection.connectAsync((err) => {
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
      this.sdkConnection.destroy((err) => {
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
    return new Statement(this.sdkConnection, options, this.logSql);
  }

  /** A convenience function to execute a SQL statement and return the resulting rows. */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(sqlText: string, binds?: any[]): Promise<any[]> {
    const stmt = this.createStatement({ sqlText, binds });
    await stmt.execute();
    return stmt.getRows();
  }
}
