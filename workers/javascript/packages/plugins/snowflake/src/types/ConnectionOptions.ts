// https://github.com/snowflakedb/snowflake-connector-nodejs/blob/5cd97375e7dffe246619c9154a5a53f287b5798c/index.d.ts#L239
export interface ConnectionOptions {
  /**
   * The full name of your account (provided by Snowflake). Note that your full account
   * name might include ***additional*** segments that identify the region and cloud
   * platform where your account is hosted.
   *
   * Please see the following Snowflake document for more information:
   * https://docs.snowflake.com/en/user-guide/nodejs-driver-use.html#required-connection-options
   */
  account: string;
  //  The login name for your Snowflake user or your Identity Provider (e.g. your login name for Okta).
  username?: string;
  //  Password for the user.
  password?: string;
  /**
   * Specifies the authenticator to use for verifying user login credentials.
   */
  authenticator?: string;
  /** Specifies the OAuth token to use for authentication. */
  token?: string;
  /** Specifies the private key (in PEM format) for key pair authentication. */
  privateKey?: string;
  /** Specifies the local path to the private key file (e.g. rsa_key.p8). */
  privateKeyPath?: string;
  /** Specifies the passcode to decrypt the private key file, if the file is encrypted. */
  privateKeyPass?: string;
  /**
   * The ID for the region where your account is located.
   *
   * @deprecated This parameter is no longer used because the region information, if
   * required, is included as part of the full account name. It is documented here only
   * for backward compatibility.
   */
  region?: string;
  /** The default database to use for the session after connecting. */
  database?: string;
  /** The default schema to use for the session after connecting. */
  schema?: string;
  /**
   * The default virtual warehouse to use for the session after connecting. Used for
   * performing queries, loading data, etc.
   */
  warehouse?: string;
  /** The default security role to use for the session after connecting. */
  role?: string;
  /**
   * By default, client connections typically time out approximately 3-4 hours after the
   * most recent query was executed.
   *
   * If the parameter clientSessionKeepAlive is set to true, the client’s connection to
   * the server will be kept alive indefinitely, even if no queries are executed.
   *
   * The  default setting of this parameter is false.
   *
   * If you set this parameter to true, make sure that your program explicitly disconnects
   * from the server when your program has finished. Do not exit without disconnecting.
   */
  clientSessionKeepAlive?: boolean;
  /**
   * (Applies only when `clientSessionKeepAlive` is true)
   *
   * This parameter sets the frequency (interval in seconds) between heartbeat messages.
   *
   * You can loosely think of a connection heartbeat message as substituting for a query
   * and restarting the timeout countdown for the connection. In other words, if the
   * connection would time out after at least 4 hours of inactivity, the heartbeat resets
   * the timer so that the timeout will not occur until at least 4 hours after the most
   * recent heartbeat (or query).
   *
   * The default value is 3600 seconds (one hour). The valid range of values is 900 -
   * 3600. Because timeouts usually occur after at least 4 hours, a heartbeat every 1 hour
   * is normally sufficient to keep the connection alive. Heartbeat intervals of less than
   * 3600 seconds are rarely necessary or useful.
   */
  clientSessionKeepAliveHeartbeatFrequency?: number;
}
