import * as crypto from 'crypto';
import { SnowflakeDatasourceConfiguration, ErrorCode, IntegrationError } from '@superblocks/shared';
import { ConnectionOptions } from 'snowflake-sdk';

export function getPrivateKeyValue({ privateKey, password }: { privateKey: string; password: string }): string {
  const privateKeyObject = crypto.createPrivateKey({
    key: privateKey,
    format: 'pem',
    passphrase: password
  });
  return privateKeyObject.export({
    format: 'pem',
    type: 'pkcs8'
  }) as string;
}

export function connectionOptionsFromDatasourceConfiguration(datasourceConfiguration: SnowflakeDatasourceConfiguration): ConnectionOptions {
  const auth = datasourceConfiguration.authentication;
  if (!auth) {
    throw new IntegrationError('authentication expected but not present', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }

  const missingFields: string[] = [];

  // fields that are always required
  if (!auth.custom?.account?.value) {
    missingFields.push('account');
  }
  if (!auth.username) {
    missingFields.push('username');
  }

  switch (datasourceConfiguration.connectionType) {
    case 'key-pair': {
      // https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate#label-nodejs-key-pair-authentication

      if (!datasourceConfiguration?.keyPair?.privateKey) {
        missingFields.push('privateKey');
      }

      handleMissingFields(missingFields);
      // remove leading and trailing whitespace, as snowflake will not accept private keys with that
      let privateKey = datasourceConfiguration.keyPair.privateKey.trim();
      let password = datasourceConfiguration?.keyPair?.password;
      if (password) {
        privateKey = getPrivateKeyValue({ privateKey, password });
      }
      return {
        account: auth.custom.account.value,
        username: auth.username,
        authenticator: 'SNOWFLAKE_JWT',
        privateKey,
        database: auth.custom?.databaseName?.value,
        schema: auth.custom?.schema?.value,
        warehouse: auth.custom?.warehouse?.value,
        role: auth.custom?.role?.value
      };
    }
    case 'okta': {
      // https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate#using-native-sso-through-okta

      if (!auth.password) {
        missingFields.push('password');
      }
      if (!datasourceConfiguration?.okta?.authenticatorUrl) {
        missingFields.push('authenticatorUrl');
      }

      handleMissingFields(missingFields);
      return {
        account: auth.custom.account.value,
        username: auth.username,
        password: auth.password,
        authenticator: datasourceConfiguration.okta.authenticatorUrl,
        database: auth.custom?.databaseName?.value,
        schema: auth.custom?.schema?.value,
        warehouse: auth.custom?.warehouse?.value,
        role: auth.custom?.role?.value
      };
    }
    default: {
      if (!auth.password) {
        missingFields.push('password');
      }

      handleMissingFields(missingFields);
      return {
        account: auth.custom?.account?.value,
        username: auth.username,
        password: auth.password,
        database: auth.custom?.databaseName?.value,
        schema: auth.custom?.schema?.value,
        warehouse: auth.custom?.warehouse?.value,
        role: auth.custom?.role?.value
      };
    }
  }
}

export function getMetadataQuery(database: string, schema?: string, dbNameQuoted = true): string {
  let query: string;
  if (dbNameQuoted) {
    query = `select c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, t.TABLE_TYPE
      FROM "${database}"."INFORMATION_SCHEMA"."COLUMNS" as c
      LEFT JOIN "${database}"."INFORMATION_SCHEMA"."TABLES" AS t ON t.TABLE_NAME = c.TABLE_NAME`;
  } else {
    query = `select c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, t.TABLE_TYPE
      FROM ${database}."INFORMATION_SCHEMA"."COLUMNS" as c
      LEFT JOIN ${database}."INFORMATION_SCHEMA"."TABLES" AS t ON t.TABLE_NAME = c.TABLE_NAME`;
  }
  if (schema) {
    query += ` WHERE c.TABLE_SCHEMA ILIKE '${schema}'`;
  } else {
    query += ` WHERE c.TABLE_SCHEMA != 'INFORMATION_SCHEMA' `;
  }
  query += ` ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION ASC;`;

  return query;
}

function handleMissingFields(missingFields: string[]) {
  if (missingFields.length > 0) {
    throw new IntegrationError(`Missing required fields: ${missingFields}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }
}
