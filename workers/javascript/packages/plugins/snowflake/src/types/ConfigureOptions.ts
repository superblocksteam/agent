export interface ConfigureOptions {
  /**
   * If true, don’t fail the connection if OCSP validation doesn’t provide a valid
   * response. (Default: true)
   */
  ocspFailOpen?: boolean;

  /**
   * If true, disable OCSP check at connection. See
   * https://community.snowflake.com/s/article/How-to-turn-off-OCSP-checking-in-Snowflake-client-drivers
   * for additional details. (Default: false)
   */
  insecureConnect?: boolean;
}
