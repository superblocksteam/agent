import { SnowflakeDatasourceConfiguration, ErrorCode, IntegrationError } from '@superblocks/shared';
import { ConnectionOptions } from './types/ConnectionOptions';

export function connectionOptionsFromDatasourceConfiguration(datasourceConfiguration: SnowflakeDatasourceConfiguration): ConnectionOptions {
  const auth = datasourceConfiguration.authentication;
  if (!auth) {
    throw new IntegrationError('authentication expected but not present', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }

  const missingFields: string[] = [];

  // these fields are always required regardless of auth type
  if (!auth.username) {
    missingFields.push('username');
  }
  if (!auth.password) {
    missingFields.push('password');
  }
  if (!auth.custom?.account?.value) {
    missingFields.push('account');
  }

  switch (datasourceConfiguration.connectionType) {
    case 'okta': {
      // https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate#using-native-sso-through-okta

      if (!datasourceConfiguration?.okta?.authenticatorUrl) {
        missingFields.push('authenticatorUrl');
      }
      handleMissingFields(missingFields);
      return {
        account: auth.custom.account.value,
        username: auth.username,
        password: auth.password,
        authenticator: datasourceConfiguration.okta.authenticatorUrl
      };
    }
    default: {
      if (!auth.custom?.databaseName?.value) {
        missingFields.push('databaseName');
      }

      handleMissingFields(missingFields);
      return {
        account: auth.custom?.account?.value,
        username: auth.username,
        password: auth.password,
        database: auth.custom?.databaseName?.value,
        schema: auth.custom?.schema?.value ?? '',
        warehouse: auth.custom?.warehouse?.value ?? '',
        role: auth.custom?.role?.value
      };
    }
  }
}

function handleMissingFields(missingFields: string[]) {
  if (missingFields.length > 0) {
    throw new IntegrationError(`Missing required fields: ${missingFields}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }
}
