import {
  ClientWrapper,
  ConnectionPoolCoordinator,
  DatabasePlugin,
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_DB_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_QUERY_RESULT,
  ErrorCode,
  ExecutionOutput,
  getAwsClientConfigWithTempCreds,
  PluginCommon,
  PluginExecutionProps,
  PostgresActionConfiguration,
  PostgresDatasourceConfiguration,
  SharedSSHAuthMethod,
  SqlOperations
} from '@superblocks/shared';

jest.mock('@superblocks/shared', () => {
  const originalModule = jest.requireActual('@superblocks/shared');
  return {
    __esModule: true,
    ...originalModule,
    CreateConnection: jest.fn((target, name, descriptor) => {
      return descriptor;
    }),
    DestroyConnection: jest.fn((target, name, descriptor) => {
      return descriptor;
    }),
    getAwsClientConfigWithTempCreds: jest.fn()
  };
});

import { Signer } from '@aws-sdk/rds-signer';
import { Client } from 'pg';
import { Client as ssh2Client } from 'ssh2';
jest.mock('@aws-sdk/rds-signer');
jest.mock('pg');

import PostgresPlugin from '.';
import { KEYS_QUERY, TABLE_QUERY } from './queries';
import { getAwsRdsTlsCaCertificates } from './rds-ca';

const plugin: PostgresPlugin = new PostgresPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };
plugin.getTempTableName = jest.fn().mockReturnValue('"mocktablename"');

const clientWrapper: ClientWrapper<Client, ssh2Client> = {
  client: null,
  tunnel: null
};

// dummy queries
export const DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY = `SELECT current_schema();`;

const DUMMY_TABLE_RESULT = [
  {
    name: 'id',
    column_type: 'int4',
    default_expr: null,
    kind: 'r',
    table_name: 'orders',
    schema_name: 'public'
  },
  {
    name: 'user_id',
    column_type: 'int8',
    default_expr: null,
    kind: 'r',
    table_name: 'orders',
    schema_name: 'public'
  }
];
const DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY_RESULT = {
  rows: [
    {
      current_schema: 'public'
    }
  ]
};
const DUMMY_POSTGRES_QUERY_RESULT = {
  rows: DUMMY_QUERY_RESULT
};
const DUMMY_POSTGRES_TABLE_RESULT = {
  rows: DUMMY_TABLE_RESULT
};
const DUMMY_POSTGRES_KEY_RESULT = {
  rows: [
    {
      constraint_name: 'orders_pkey',
      constraint_type: 'p',
      self_schema: 'public',
      self_table: 'orders',
      self_columns: ['id'],
      foreign_schema: null,
      foreign_table: null,
      foreign_columns: '{NULL}',
      definition: 'PRIMARY KEY (id)'
    }
  ]
};
const MOCK_PRIMARY_COLUMNS_FOR_UPDATE = { rows: [{ column_name: 'id', data_type: 'uuid' }] };
const MOCK_ALL_COLUMNS_FOR_UPDATE = {
  rows: [
    { column_name: 'price', data_type: 'int4' },
    { column_name: 'id', data_type: 'uuid' },
    { column_name: 'updated', data_type: 'datetime' }
  ]
};

const context = DUMMY_EXECUTION_CONTEXT;
const datasourceConfiguration = DUMMY_DB_DATASOURCE_CONFIGURATION as PostgresDatasourceConfiguration;
const actionConfiguration = {
  ...DUMMY_ACTION_CONFIGURATION,
  operation: SqlOperations.RUN_SQL
};
const props: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

function createPooledExecutionProps(
  pooledDatasourceConfiguration: PostgresDatasourceConfiguration
): PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration> {
  return {
    ...props,
    datasourceConfiguration: pooledDatasourceConfiguration,
    mutableOutput: new ExecutionOutput()
  };
}

type TunnelConfiguration = NonNullable<PostgresDatasourceConfiguration['tunnel']>;

function createTestTunnelConfiguration(
  {
    legacyAuthMethod,
    protobufAuthMethod
  }: {
    legacyAuthMethod?: number;
    protobufAuthMethod?: PluginCommon.SSHAuthMethod;
  } = {
    legacyAuthMethod: SharedSSHAuthMethod.PUB_KEY_RSA
  }
): TunnelConfiguration {
  const tunnel = new PluginCommon.SSHConfiguration({
    authenticationMethod: protobufAuthMethod,
    enabled: false,
    host: 'bastion.example.com',
    passphrase: 'tunnel-passphrase',
    password: 'tunnel-password',
    port: 22,
    privateKey: 'tunnel-private-key',
    publicKey: 'tunnel-public-key',
    username: 'tunnel-user'
  });
  if (legacyAuthMethod !== undefined) {
    Reflect.set(tunnel, 'authMethod', legacyAuthMethod);
  }
  return tunnel;
}

function createPoolTestDatasourceConfiguration(
  authType: 'password' | 'aws_iam_role' | undefined,
  password: string,
  tunnel: TunnelConfiguration = createTestTunnelConfiguration()
): PostgresDatasourceConfiguration {
  return {
    ...datasourceConfiguration,
    authentication: {
      ...datasourceConfiguration.authentication,
      authType,
      custom: {
        ...datasourceConfiguration.authentication?.custom,
        iamRoleArn: {
          key: 'iamRoleArn',
          value: 'arn:aws:iam::123456789012:role/postgres'
        },
        region: {
          key: 'region',
          value: 'us-east-1'
        },
        sessionPolicy: {
          key: 'sessionPolicy',
          value: '{"Version":"2012-10-17"}'
        }
      },
      password,
      username: 'database-user'
    },
    connection: {
      ...datasourceConfiguration.connection,
      ca: 'certificate-authority',
      cert: 'client-certificate',
      key: 'client-key',
      useSelfSignedSsl: true,
      useSsl: true
    },
    connectionType: 'fields',
    endpoint: {
      host: 'database.example.com',
      port: 5432
    },
    tunnel
  };
}

function createIamDatasourceConfiguration(): PostgresDatasourceConfiguration {
  return {
    authentication: {
      authType: 'aws_iam_role',
      custom: {
        databaseName: {
          key: 'databaseName',
          value: 'application_database'
        },
        iamRoleArn: {
          key: 'iamRoleArn',
          value: 'arn:aws:iam::123456789012:role/postgres'
        },
        region: {
          key: 'region',
          value: 'us-east-1'
        },
        sessionPolicy: {
          key: 'sessionPolicy',
          value: '{"Version":"2012-10-17","Statement":[]}'
        }
      },
      password: 'configured-value-must-not-be-used-or-mutated',
      username: 'application_user'
    },
    connection: {
      useSsl: true
    },
    connectionType: 'fields',
    endpoint: {
      host: 'database.cluster-example.us-east-1.rds.amazonaws.com',
      port: 5432
    },
    id: 'integration-id',
    name: 'Postgres integration'
  };
}

function createIamDatasourceConfigurationForRole(roleArn: string): PostgresDatasourceConfiguration {
  const configuration = createIamDatasourceConfiguration();
  return {
    ...configuration,
    authentication: {
      ...configuration.authentication,
      custom: {
        ...configuration.authentication?.custom,
        iamRoleArn: {
          key: 'iamRoleArn',
          value: roleArn
        }
      }
    }
  };
}

const passwordAuthTypes: Array<'password' | undefined> = [undefined, 'password'];

type MissingIamFieldCase = {
  expectedMessage: string;
  fieldName: string;
  removeField: (configuration: PostgresDatasourceConfiguration) => PostgresDatasourceConfiguration;
};

const missingIamFieldCases: MissingIamFieldCase[] = [
  {
    expectedMessage: 'Endpoint host not specified',
    fieldName: 'endpoint host',
    removeField: (configuration) => ({
      ...configuration,
      endpoint: {
        ...configuration.endpoint,
        host: undefined
      }
    })
  },
  {
    expectedMessage: 'Endpoint port not specified',
    fieldName: 'endpoint port',
    removeField: (configuration) => ({
      ...configuration,
      endpoint: {
        ...configuration.endpoint,
        port: undefined
      }
    })
  },
  {
    expectedMessage: 'Database username not specified',
    fieldName: 'database username',
    removeField: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        username: undefined
      }
    })
  },
  {
    expectedMessage: 'Database not specified',
    fieldName: 'database name',
    removeField: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        custom: {
          ...configuration.authentication?.custom,
          databaseName: undefined
        }
      }
    })
  },
  {
    expectedMessage: 'IAM role ARN not specified',
    fieldName: 'IAM role ARN',
    removeField: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        custom: {
          ...configuration.authentication?.custom,
          iamRoleArn: undefined
        }
      }
    })
  },
  {
    expectedMessage: 'AWS region not specified',
    fieldName: 'AWS region',
    removeField: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        custom: {
          ...configuration.authentication?.custom,
          region: undefined
        }
      }
    })
  }
];

type TunnelConfigurationChanges = Pick<
  TunnelConfiguration,
  'authMethod' | 'enabled' | 'host' | 'passphrase' | 'password' | 'port' | 'privateKey' | 'publicKey' | 'username'
>;

function changeTunnelConfiguration(
  configuration: PostgresDatasourceConfiguration,
  changes: TunnelConfigurationChanges
): PostgresDatasourceConfiguration {
  const tunnel = new PluginCommon.SSHConfiguration({
    ...configuration.tunnel,
    ...changes
  });
  return {
    ...configuration,
    tunnel: Object.assign(tunnel, {
      authMethod: changes.authMethod ?? configuration.tunnel?.authMethod
    })
  };
}

type StablePoolIdentityCase = {
  fieldName: string;
  changeConfiguration: (configuration: PostgresDatasourceConfiguration) => PostgresDatasourceConfiguration;
};

const stablePoolIdentityCases: StablePoolIdentityCase[] = [
  {
    fieldName: 'role ARN',
    changeConfiguration: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        custom: {
          ...configuration.authentication?.custom,
          iamRoleArn: {
            key: 'iamRoleArn',
            value: 'arn:aws:iam::123456789012:role/different-postgres'
          }
        }
      }
    })
  },
  {
    fieldName: 'region',
    changeConfiguration: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        custom: {
          ...configuration.authentication?.custom,
          region: {
            key: 'region',
            value: 'us-west-2'
          }
        }
      }
    })
  },
  {
    fieldName: 'session policy',
    changeConfiguration: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        custom: {
          ...configuration.authentication?.custom,
          sessionPolicy: {
            key: 'sessionPolicy',
            value: '{"Version":"2012-10-17","Statement":[]}'
          }
        }
      }
    })
  },
  {
    fieldName: 'username',
    changeConfiguration: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        username: 'different-database-user'
      }
    })
  },
  {
    fieldName: 'endpoint host',
    changeConfiguration: (configuration) => ({
      ...configuration,
      endpoint: {
        ...configuration.endpoint,
        host: 'different-database.example.com'
      }
    })
  },
  {
    fieldName: 'endpoint port',
    changeConfiguration: (configuration) => ({
      ...configuration,
      endpoint: {
        ...configuration.endpoint,
        port: 6432
      }
    })
  },
  {
    fieldName: 'database',
    changeConfiguration: (configuration) => ({
      ...configuration,
      authentication: {
        ...configuration.authentication,
        custom: {
          ...configuration.authentication?.custom,
          databaseName: {
            key: 'databaseName',
            value: 'different-database'
          }
        }
      }
    })
  },
  {
    fieldName: 'TLS enabled setting',
    changeConfiguration: (configuration) => ({
      ...configuration,
      connection: {
        ...configuration.connection,
        useSsl: 'checked'
      }
    })
  },
  {
    fieldName: 'self-signed TLS setting',
    changeConfiguration: (configuration) => ({
      ...configuration,
      connection: {
        ...configuration.connection,
        useSelfSignedSsl: false
      }
    })
  },
  {
    fieldName: 'TLS certificate authority',
    changeConfiguration: (configuration) => ({
      ...configuration,
      connection: {
        ...configuration.connection,
        ca: 'different-certificate-authority'
      }
    })
  },
  {
    fieldName: 'TLS client certificate',
    changeConfiguration: (configuration) => ({
      ...configuration,
      connection: {
        ...configuration.connection,
        cert: 'different-client-certificate'
      }
    })
  },
  {
    fieldName: 'TLS client key',
    changeConfiguration: (configuration) => ({
      ...configuration,
      connection: {
        ...configuration.connection,
        key: 'different-client-key'
      }
    })
  },
  {
    fieldName: 'tunnel auth method',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        authMethod: SharedSSHAuthMethod.PUB_KEY_ED25519
      })
  },
  {
    fieldName: 'tunnel enabled setting',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        enabled: undefined
      })
  },
  {
    fieldName: 'tunnel host',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        host: 'different-bastion.example.com'
      })
  },
  {
    fieldName: 'tunnel passphrase',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        passphrase: 'different-tunnel-passphrase'
      })
  },
  {
    fieldName: 'tunnel password',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        password: 'different-tunnel-password'
      })
  },
  {
    fieldName: 'tunnel private key',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        privateKey: 'different-tunnel-private-key'
      })
  },
  {
    fieldName: 'tunnel public key',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        publicKey: 'different-tunnel-public-key'
      })
  },
  {
    fieldName: 'tunnel port',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        port: 2222
      })
  },
  {
    fieldName: 'tunnel username',
    changeConfiguration: (configuration) =>
      changeTunnelConfiguration(configuration, {
        username: 'different-tunnel-user'
      })
  }
];

type TunnelIdentityCollisionCase = {
  description: string;
  expectedConnectionCount: 1 | 2;
  firstTunnel: () => TunnelConfiguration;
  secondTunnel: () => TunnelConfiguration;
};

const tunnelIdentityCollisionCases: TunnelIdentityCollisionCase[] = [
  {
    description: 'separates an absent auth method from an unknown legacy auth method',
    expectedConnectionCount: 2,
    firstTunnel: () => createTestTunnelConfiguration({}),
    secondTunnel: () => createTestTunnelConfiguration({ legacyAuthMethod: 999 })
  },
  {
    description: 'separates an absent auth method from legacy PASSWORD=0',
    expectedConnectionCount: 2,
    firstTunnel: () => createTestTunnelConfiguration({}),
    secondTunnel: () => createTestTunnelConfiguration({ legacyAuthMethod: SharedSSHAuthMethod.PASSWORD })
  },
  {
    description: 'separates legacy PASSWORD=0 from protobuf PASSWORD',
    expectedConnectionCount: 2,
    firstTunnel: () => createTestTunnelConfiguration({ legacyAuthMethod: SharedSSHAuthMethod.PASSWORD }),
    secondTunnel: () =>
      createTestTunnelConfiguration({
        protobufAuthMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PASSWORD
      })
  },
  {
    description: 'separates distinct protobuf authentication methods',
    expectedConnectionCount: 2,
    firstTunnel: () =>
      createTestTunnelConfiguration({
        protobufAuthMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PASSWORD
      }),
    secondTunnel: () =>
      createTestTunnelConfiguration({
        protobufAuthMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA
      })
  },
  {
    description: 'separates conflicting forms that share a legacy auth method but differ in protobuf auth method',
    expectedConnectionCount: 2,
    firstTunnel: () =>
      createTestTunnelConfiguration({
        legacyAuthMethod: SharedSSHAuthMethod.PUB_KEY_RSA,
        protobufAuthMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PASSWORD
      }),
    secondTunnel: () =>
      createTestTunnelConfiguration({
        legacyAuthMethod: SharedSSHAuthMethod.PUB_KEY_RSA,
        protobufAuthMethod: PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_ED25519
      })
  },
  {
    description: 'reuses exactly equal raw tunnel identities',
    expectedConnectionCount: 1,
    firstTunnel: () => createTestTunnelConfiguration({}),
    secondTunnel: () => createTestTunnelConfiguration({})
  }
];

function makeTestablePromise() {
  let resolver;
  let rejecter;
  const promise = new Promise((resolve, reject) => {
    resolver = resolve;
    rejecter = reject;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (promise as any).resolver = resolver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (promise as any).rejecter = rejecter;
  return promise as Promise<unknown> & {
    resolver: (...args: unknown[]) => void;
    rejecter: (...args: unknown[]) => void;
  };
}

describe('Postgres Plugin', () => {
  let client: Client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new Client({});
    clientWrapper.client = client;
    jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
    Client.prototype.connect.mockClear?.();
    props.mutableOutput = new ExecutionOutput();
  });

  afterEach(() => {
    // Only works with jest.spyOn()
    jest.restoreAllMocks();
    Client.prototype.query.mockReset?.();
  });

  describe('AWS IAM role authentication', () => {
    const allowlistEnvironmentVariable = 'SUPERBLOCKS_POSTGRES_IAM_ALLOWED_ROLE_ARN_PREFIXES';
    const assumedCredentials = {
      accessKeyId: 'assumed-access-key',
      secretAccessKey: 'assumed-secret-key',
      sessionToken: 'assumed-session-token'
    };
    let previousAllowedRolePrefixes: string | undefined;

    function setAllowedRoles(...roleArns: string[]): void {
      process.env[allowlistEnvironmentVariable] = JSON.stringify(roleArns);
    }

    beforeEach(() => {
      previousAllowedRolePrefixes = process.env[allowlistEnvironmentVariable];
      setAllowedRoles('arn:aws:iam::123456789012:role/');
      jest.mocked(getAwsClientConfigWithTempCreds).mockReset();
      jest.mocked(getAwsClientConfigWithTempCreds).mockResolvedValue({
        credentials: assumedCredentials,
        region: 'us-east-1'
      });
      jest.spyOn(Signer.prototype, 'getAuthToken').mockResolvedValue('generated-rds-auth-token');
    });

    afterEach(() => {
      if (previousAllowedRolePrefixes === undefined) {
        delete process.env[allowlistEnvironmentVariable];
      } else {
        process.env[allowlistEnvironmentVariable] = previousAllowedRolePrefixes;
      }
    });

    it('rejects IAM authentication for URI connections before calling AWS', async () => {
      const configuration: PostgresDatasourceConfiguration = {
        ...createIamDatasourceConfiguration(),
        connectionType: 'url',
        connectionUrl: 'postgres://application_user@database.example.com/application_database'
      };

      await expect(plugin.test(configuration)).rejects.toThrow('IAM authentication requires a field-based connection');

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it('accepts omitted connectionType as a field-based IAM connection', async () => {
      const configuration = createIamDatasourceConfiguration();
      configuration.connectionType = undefined;

      await plugin.test(configuration);

      expect(getAwsClientConfigWithTempCreds).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['missing', undefined],
      ['boolean false', false],
      ['string false', 'false']
    ])('rejects %s TLS before calling AWS', async (_description, useSsl) => {
      const configuration = createIamDatasourceConfiguration();
      configuration.connection = {
        ...configuration.connection,
        useSsl
      };

      await expect(plugin.test(configuration)).rejects.toThrow('TLS must be enabled for Postgres IAM authentication');

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it.each(missingIamFieldCases)('rejects a missing $fieldName before calling AWS', async ({ expectedMessage, removeField }) => {
      const configuration = removeField(createIamDatasourceConfiguration());

      await expect(plugin.test(configuration)).rejects.toThrow(expectedMessage);

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it.each([0, -1, 65536, Number.NaN])('rejects invalid endpoint port %s before calling AWS', async (port) => {
      const configuration = createIamDatasourceConfiguration();
      configuration.endpoint = {
        ...configuration.endpoint,
        port
      };

      await expect(plugin.test(configuration)).rejects.toThrow('Valid endpoint port not specified');

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it('accepts the numeric string port submitted by the integration form', async () => {
      const configuration = createIamDatasourceConfiguration();
      configuration.endpoint = {
        ...configuration.endpoint,
        port: '5432' as unknown as number
      };

      await plugin.test(configuration);

      expect(Signer).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 5432
        })
      );
    });

    it.each([
      ['an absent allowlist', undefined],
      ['an empty allowlist', ''],
      ['an empty JSON array', '[]'],
      ['an allowlist containing only empty entries', '["", " "]']
    ])('denies IAM roles when the operator configures %s', async (_description, allowedPrefixes) => {
      if (allowedPrefixes === undefined) {
        delete process.env[allowlistEnvironmentVariable];
      } else {
        process.env[allowlistEnvironmentVariable] = allowedPrefixes;
      }

      await expect(plugin.test(createIamDatasourceConfiguration())).rejects.toThrow('IAM role is not allowed');

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it.each([
      ['malformed JSON', 'not-json'],
      ['a non-array JSON value', '{}'],
      ['a null JSON value', 'null'],
      ['a non-string array item', '["arn:aws:iam::123456789012:role/postgres", 42]']
    ])('rejects %s before calling AWS', async (_description, allowedRoles) => {
      process.env[allowlistEnvironmentVariable] = allowedRoles;
      const connection = plugin.test(createIamDatasourceConfiguration());

      await expect(connection).rejects.toThrow('Invalid Postgres IAM role allowlist configuration');
      await expect(connection).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      });
      await expect(connection).rejects.not.toThrow(allowedRoles);

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it('rejects a role outside the trimmed prefix allowlist before calling AWS', async () => {
      setAllowedRoles(' arn:aws:iam::123456789012:role/allowed-one ', '', 'arn:aws:iam::123456789012:role/allowed-two');

      await expect(plugin.test(createIamDatasourceConfiguration())).rejects.toThrow('IAM role is not allowed');

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it('allows an exact role ARN match', async () => {
      setAllowedRoles(' arn:aws:iam::123456789012:role/postgres ');

      await plugin.test(createIamDatasourceConfiguration());

      expect(getAwsClientConfigWithTempCreds).toHaveBeenCalledTimes(1);
    });

    it('trims the configured role ARN before allowlist matching and role assumption', async () => {
      const roleArn = 'arn:aws:iam::123456789012:role/postgres';
      setAllowedRoles(roleArn);
      const configuration = createIamDatasourceConfigurationForRole(`  ${roleArn}  `);

      await plugin.test(configuration);

      expect(getAwsClientConfigWithTempCreds).toHaveBeenCalledWith(
        { region: 'us-east-1' },
        'integration-id',
        'us-east-1',
        roleArn,
        '{"Version":"2012-10-17","Statement":[]}'
      );
    });

    it('trims IAM connection fields before signing and connecting', async () => {
      const configuration = createIamDatasourceConfiguration();
      configuration.endpoint.host = '  database.cluster-example.us-east-1.rds.amazonaws.com  ';
      configuration.authentication.username = '  application_user  ';
      configuration.authentication.custom.databaseName.value = '  application_database  ';
      configuration.authentication.custom.region.value = '  us-east-1  ';

      await plugin.test(configuration);

      expect(Signer).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'database.cluster-example.us-east-1.rds.amazonaws.com',
          region: 'us-east-1',
          username: 'application_user'
        })
      );
      expect(Client).toHaveBeenLastCalledWith(
        expect.objectContaining({
          database: 'application_database',
          host: 'database.cluster-example.us-east-1.rds.amazonaws.com',
          user: 'application_user'
        })
      );
    });

    it('allows an exact role ARN containing a comma', async () => {
      const roleArn = 'arn:aws:iam::123456789012:role/postgres,reporting';
      setAllowedRoles(roleArn);

      await plugin.test(createIamDatasourceConfigurationForRole(roleArn));

      expect(getAwsClientConfigWithTempCreds).toHaveBeenCalledTimes(1);
    });

    it.each(['arn:aws-cn', 'arn:aws-us-gov'])('rejects the unsupported %s partition before calling AWS', async (partition) => {
      const roleArn = `${partition}:iam::123456789012:role/postgres`;
      setAllowedRoles(roleArn);

      await expect(plugin.test(createIamDatasourceConfigurationForRole(roleArn))).rejects.toThrow(
        'Postgres IAM authentication currently supports commercial AWS Regions only'
      );

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it.each(['cn-north-1', 'us-gov-west-1'])('rejects the unsupported %s Region before calling AWS', async (region) => {
      const configuration = createIamDatasourceConfiguration();
      configuration.authentication.custom.region.value = region;

      await expect(plugin.test(configuration)).rejects.toThrow(
        'Postgres IAM authentication currently supports commercial AWS Regions only'
      );

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it('rejects a near match for an exact role ARN before calling AWS', async () => {
      setAllowedRoles('arn:aws:iam::123456789012:role/postgres');
      const configuration = createIamDatasourceConfigurationForRole('arn:aws:iam::123456789012:role/postgres-admin');

      await expect(plugin.test(configuration)).rejects.toThrow('IAM role is not allowed');

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it('allows an intentional trailing-slash role path prefix', async () => {
      setAllowedRoles('arn:aws:iam::123456789012:role/application/');
      const configuration = createIamDatasourceConfigurationForRole('arn:aws:iam::123456789012:role/application/postgres');

      await plugin.test(configuration);

      expect(getAwsClientConfigWithTempCreds).toHaveBeenCalledTimes(1);
    });

    it('rejects a sibling role path outside an intentional prefix before calling AWS', async () => {
      setAllowedRoles('arn:aws:iam::123456789012:role/application/');
      const configuration = createIamDatasourceConfigurationForRole('arn:aws:iam::123456789012:role/application-admin/postgres');

      await expect(plugin.test(configuration)).rejects.toThrow('IAM role is not allowed');

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
    });

    it.each([true, 'checked'])('uses assumed credentials to generate a token when TLS is represented as %s', async (useSsl) => {
      const configuration = createIamDatasourceConfiguration();
      configuration.connection = {
        ...configuration.connection,
        useSsl
      };
      const configurationBeforeConnection = structuredClone(configuration);

      await plugin.test(configuration);

      expect(getAwsClientConfigWithTempCreds).toHaveBeenCalledWith(
        { region: 'us-east-1' },
        'integration-id',
        'us-east-1',
        'arn:aws:iam::123456789012:role/postgres',
        '{"Version":"2012-10-17","Statement":[]}'
      );
      expect(Signer).toHaveBeenCalledWith({
        credentials: assumedCredentials,
        hostname: 'database.cluster-example.us-east-1.rds.amazonaws.com',
        port: 5432,
        region: 'us-east-1',
        username: 'application_user'
      });
      expect(Signer.prototype.getAuthToken).toHaveBeenCalledTimes(1);
      expect(Client).toHaveBeenLastCalledWith(
        expect.objectContaining({
          database: 'application_database',
          host: 'database.cluster-example.us-east-1.rds.amazonaws.com',
          password: 'generated-rds-auth-token',
          port: 5432,
          ssl: {
            ca: getAwsRdsTlsCaCertificates(),
            rejectUnauthorized: true,
            servername: 'database.cluster-example.us-east-1.rds.amazonaws.com'
          },
          user: 'application_user'
        })
      );
      expect(configuration).toEqual(configurationBeforeConnection);
    });

    it('passes configured TLS materials while verifying the original RDS hostname', async () => {
      const configuration = createIamDatasourceConfiguration();
      configuration.connection = {
        ca: 'configured-ca',
        cert: 'configured-client-cert',
        key: 'configured-client-key',
        useSelfSignedSsl: true,
        useSsl: true
      };

      await plugin.test(configuration);

      expect(Client).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ssl: {
            ca: 'configured-ca',
            cert: 'configured-client-cert',
            key: 'configured-client-key',
            rejectUnauthorized: true,
            servername: 'database.cluster-example.us-east-1.rds.amazonaws.com'
          }
        })
      );
    });

    it.each([undefined, false, 'false'])(
      'ignores stale custom TLS materials when the custom CA setting is %s',
      async (useSelfSignedSsl) => {
        const configuration = createIamDatasourceConfiguration();
        configuration.connection = {
          ca: 'stale-ca',
          cert: 'stale-client-cert',
          key: 'stale-client-key',
          useSelfSignedSsl,
          useSsl: true
        };

        await plugin.test(configuration);

        expect(Client).toHaveBeenLastCalledWith(
          expect.objectContaining({
            ssl: {
              ca: getAwsRdsTlsCaCertificates(),
              rejectUnauthorized: true,
              servername: 'database.cluster-example.us-east-1.rds.amazonaws.com'
            }
          })
        );
      }
    );

    it('signs and verifies the original RDS endpoint while connecting through the final tunnel endpoint', async () => {
      const configuration = createIamDatasourceConfiguration();
      const tunnel = createTestTunnelConfiguration();
      tunnel.enabled = true;
      configuration.tunnel = tunnel;
      jest.spyOn(DatabasePlugin.prototype, 'createTunnel').mockResolvedValue({
        host: '127.0.0.1',
        port: 15432
      });

      await plugin.test(configuration);

      expect(Signer).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: 'database.cluster-example.us-east-1.rds.amazonaws.com',
          port: 5432
        })
      );
      expect(Client).toHaveBeenLastCalledWith(
        expect.objectContaining({
          host: '127.0.0.1',
          password: 'generated-rds-auth-token',
          port: 15432,
          ssl: {
            ca: getAwsRdsTlsCaCertificates(),
            rejectUnauthorized: true,
            servername: 'database.cluster-example.us-east-1.rds.amazonaws.com'
          }
        })
      );
    });

    it('closes an opened SSH tunnel when IAM role assumption fails', async () => {
      const configuration = createIamDatasourceConfiguration();
      const tunnel = createTestTunnelConfiguration();
      tunnel.enabled = true;
      configuration.tunnel = tunnel;
      const tunnelClient = new ssh2Client();
      const endTunnel = jest.spyOn(tunnelClient, 'end');
      jest.spyOn(DatabasePlugin.prototype, 'createTunnel').mockResolvedValue({
        client: tunnelClient,
        host: '127.0.0.1',
        port: 15432
      });
      jest.mocked(getAwsClientConfigWithTempCreds).mockRejectedValueOnce(new Error('role assumption denied'));

      await expect(plugin.test(configuration)).rejects.toThrow('role assumption denied');

      expect(endTunnel).toHaveBeenCalledTimes(1);
    });

    it('closes an opened SSH tunnel when RDS token generation fails', async () => {
      const configuration = createIamDatasourceConfiguration();
      const tunnel = createTestTunnelConfiguration();
      tunnel.enabled = true;
      configuration.tunnel = tunnel;
      const tunnelClient = new ssh2Client();
      const endTunnel = jest.spyOn(tunnelClient, 'end');
      jest.spyOn(DatabasePlugin.prototype, 'createTunnel').mockResolvedValue({
        client: tunnelClient,
        host: '127.0.0.1',
        port: 15432
      });
      jest.spyOn(Signer.prototype, 'getAuthToken').mockRejectedValueOnce(new Error('token generation failed'));

      await expect(plugin.test(configuration)).rejects.toThrow('token generation failed');

      expect(endTunnel).toHaveBeenCalledTimes(1);
    });

    it('closes the Postgres client and SSH tunnel when the physical connection fails', async () => {
      const configuration = createIamDatasourceConfiguration();
      const tunnel = createTestTunnelConfiguration();
      tunnel.enabled = true;
      configuration.tunnel = tunnel;
      const tunnelClient = new ssh2Client();
      const endTunnel = jest.spyOn(tunnelClient, 'end');
      jest.spyOn(DatabasePlugin.prototype, 'createTunnel').mockResolvedValue({
        client: tunnelClient,
        host: '127.0.0.1',
        port: 15432
      });
      jest
        .spyOn(Client.prototype, 'connect')
        .mockRejectedValueOnce(Object.assign(new Error('connection failed'), { code: 'ECONNREFUSED' }));
      const endClient = jest.spyOn(Client.prototype, 'end').mockResolvedValueOnce();

      await expect(plugin.test(configuration)).rejects.toThrow('Postgres network connection failed');

      expect(endClient).toHaveBeenCalledTimes(1);
      expect(endTunnel).toHaveBeenCalledTimes(1);
    });

    it.each(passwordAuthTypes)('keeps configured passwords and avoids AWS when auth type is %s', async (authType) => {
      const configuration: PostgresDatasourceConfiguration = {
        ...datasourceConfiguration,
        authentication: {
          ...datasourceConfiguration.authentication,
          authType,
          password: 'configured-password'
        }
      };

      await plugin.test(configuration);

      expect(getAwsClientConfigWithTempCreds).not.toHaveBeenCalled();
      expect(Signer).not.toHaveBeenCalled();
      expect(Client).toHaveBeenLastCalledWith(
        expect.objectContaining({
          password: 'configured-password',
          ssl: {
            rejectUnauthorized: false
          }
        })
      );
    });

    it.each(passwordAuthTypes)('preserves useful connection errors when auth type is %s', async (authType) => {
      const configuration: PostgresDatasourceConfiguration = {
        ...datasourceConfiguration,
        authentication: {
          ...datasourceConfiguration.authentication,
          authType,
          password: 'configured-password'
        }
      };
      jest.spyOn(Client.prototype, 'connect').mockRejectedValueOnce(new Error('password authentication failed for configured user'));

      await expect(plugin.test(configuration)).rejects.toThrow('password authentication failed for configured user');
    });

    it('wraps IAM failures as integration authorization errors without credential material', async () => {
      jest.mocked(getAwsClientConfigWithTempCreds).mockRejectedValueOnce(new Error('role assumption denied'));

      const connection = plugin.test(createIamDatasourceConfiguration());

      await expect(connection).rejects.toMatchObject({
        code: ErrorCode.INTEGRATION_AUTHORIZATION
      });
      await expect(connection).rejects.not.toThrow(/assumed-access-key|assumed-secret-key|assumed-session-token|generated-rds-auth-token/);
    });

    it('identifies TLS certificate verification failures without exposing raw connection details', async () => {
      jest
        .spyOn(Client.prototype, 'connect')
        .mockRejectedValueOnce(
          Object.assign(new Error('certificate rejected for database.internal'), { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' })
        );

      const connection = plugin.test(createIamDatasourceConfiguration());

      await expect(connection).rejects.toThrow('Postgres TLS certificate verification failed');
      await expect(connection).rejects.not.toThrow('database.internal');
    });

    it.each([
      ['28P01', 'Postgres database authentication failed', ErrorCode.INTEGRATION_AUTHORIZATION],
      ['ECONNREFUSED', 'Postgres network connection failed', ErrorCode.INTEGRATION_NETWORK],
      ['ENOTFOUND', 'Postgres hostname resolution failed', ErrorCode.INTEGRATION_NETWORK]
    ])('classifies physical connection error %s without exposing raw details', async (code, expectedMessage, expectedCode) => {
      jest
        .spyOn(Client.prototype, 'connect')
        .mockRejectedValueOnce(Object.assign(new Error('connection failed for database.internal'), { code }));

      const connection = plugin.test(createIamDatasourceConfiguration());

      await expect(connection).rejects.toMatchObject({
        code: expectedCode,
        message: expect.stringContaining(expectedMessage)
      });
      await expect(connection).rejects.not.toThrow('database.internal');
    });

    it('does not surface or persist a generated token when the physical connection fails', async () => {
      const configuration = createIamDatasourceConfiguration();
      const configurationBeforeConnection = structuredClone(configuration);
      jest.spyOn(Client.prototype, 'connect').mockRejectedValueOnce(new Error('connection rejected: generated-rds-auth-token'));

      const connection = plugin.test(configuration);

      await expect(connection).rejects.not.toThrow('generated-rds-auth-token');
      expect(Signer.prototype.getAuthToken).toHaveBeenCalledTimes(1);
      expect(configuration).toEqual(configurationBeforeConnection);
    });
  });

  describe('connection pool identity', () => {
    const allowlistEnvironmentVariable = 'SUPERBLOCKS_POSTGRES_IAM_ALLOWED_ROLE_ARN_PREFIXES';
    let previousAllowedRolePrefixes: string | undefined;

    beforeEach(() => {
      previousAllowedRolePrefixes = process.env[allowlistEnvironmentVariable];
      process.env[allowlistEnvironmentVariable] = JSON.stringify(['arn:aws:iam::123456789012:role/']);
      jest.mocked(getAwsClientConfigWithTempCreds).mockResolvedValue({
        credentials: {
          accessKeyId: 'assumed-access-key',
          secretAccessKey: 'assumed-secret-key',
          sessionToken: 'assumed-session-token'
        },
        region: 'us-east-1'
      });
      jest.spyOn(Signer.prototype, 'getAuthToken').mockResolvedValue('generated-rds-auth-token');
      plugin.configure({
        connectionPoolIdleTimeoutMs: 60_000,
        javascriptExecutionTimeoutMs: '1000',
        pythonExecutionTimeoutMs: '1000',
        restApiExecutionTimeoutMs: 1000,
        restApiMaxContentLengthBytes: 1_000_000,
        workflowFetchAndExecuteFunc: null
      });
      plugin.attachConnectionPool(
        new ConnectionPoolCoordinator({
          maxConnections: 10,
          maxConnectionsPerKey: 3,
          tracer: plugin.tracer
        })
      );
      jest.spyOn(Client.prototype, 'query').mockResolvedValue({ rows: [] });
    });

    afterEach(() => {
      if (previousAllowedRolePrefixes === undefined) {
        delete process.env[allowlistEnvironmentVariable];
      } else {
        process.env[allowlistEnvironmentVariable] = previousAllowedRolePrefixes;
      }
    });

    it('reuses one physical connection when IAM tokens differ', async () => {
      const firstConfiguration = createPoolTestDatasourceConfiguration('aws_iam_role', 'token-1');
      const secondConfiguration = createPoolTestDatasourceConfiguration('aws_iam_role', 'token-2');

      await plugin.execute(createPooledExecutionProps(firstConfiguration));
      await plugin.execute(createPooledExecutionProps(secondConfiguration));

      expect(Client.prototype.connect).toHaveBeenCalledTimes(1);
      expect(Client).toHaveBeenLastCalledWith(expect.objectContaining({ password: 'generated-rds-auth-token' }));
    });

    it.each(passwordAuthTypes)('separates physical connections when %s auth passwords differ', async (authType) => {
      const firstConfiguration = createPoolTestDatasourceConfiguration(authType, 'password-1');
      const secondConfiguration = createPoolTestDatasourceConfiguration(authType, 'password-2');

      await plugin.execute(createPooledExecutionProps(firstConfiguration));
      await plugin.execute(createPooledExecutionProps(secondConfiguration));

      expect(Client.prototype.connect).toHaveBeenCalledTimes(2);
    });

    it.each(stablePoolIdentityCases)('separates physical connections when IAM $fieldName differs', async ({ changeConfiguration }) => {
      const firstConfiguration = createPoolTestDatasourceConfiguration('aws_iam_role', 'token');
      const secondConfiguration = changeConfiguration(firstConfiguration);

      await plugin.execute(createPooledExecutionProps(firstConfiguration));
      await plugin.execute(createPooledExecutionProps(secondConfiguration));

      expect(Client.prototype.connect).toHaveBeenCalledTimes(2);
    });

    it.each(tunnelIdentityCollisionCases)('$description', async ({ expectedConnectionCount, firstTunnel, secondTunnel }) => {
      const firstTunnelConfiguration = firstTunnel();
      const secondTunnelConfiguration = secondTunnel();
      const firstConfiguration = createPoolTestDatasourceConfiguration('aws_iam_role', 'token', firstTunnelConfiguration);
      const secondConfiguration = createPoolTestDatasourceConfiguration('aws_iam_role', 'token', secondTunnelConfiguration);

      const rawTunnelIdentitiesAreEqual =
        JSON.stringify(structuredClone(firstTunnelConfiguration)) === JSON.stringify(structuredClone(secondTunnelConfiguration));
      expect(rawTunnelIdentitiesAreEqual).toBe(expectedConnectionCount === 1);

      await plugin.execute(createPooledExecutionProps(firstConfiguration));
      await plugin.execute(createPooledExecutionProps(secondConfiguration));

      expect(Client.prototype.connect).toHaveBeenCalledTimes(expectedConnectionCount);
    });

    it('does not mutate IAM datasource configurations when computing pool identity', async () => {
      const firstConfiguration = createPoolTestDatasourceConfiguration('aws_iam_role', 'token-1');
      const secondConfiguration = createPoolTestDatasourceConfiguration('aws_iam_role', 'token-2');
      const firstConfigurationBeforeExecution = structuredClone(firstConfiguration);
      const secondConfigurationBeforeExecution = structuredClone(secondConfiguration);

      await plugin.execute(createPooledExecutionProps(firstConfiguration));
      await plugin.execute(createPooledExecutionProps(secondConfiguration));

      expect(firstConfiguration).toEqual(firstConfigurationBeforeExecution);
      expect(secondConfiguration).toEqual(secondConfigurationBeforeExecution);
    });
  });

  it('test connection', async () => {
    jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

    await plugin.test(datasourceConfiguration);

    expect(Client.prototype.connect).toBeCalledTimes(1);
  });

  it('get metadata', async () => {
    const DUMMY_EXPECTED_METADATA = {
      name: 'orders',
      schema: 'public',
      type: 'TABLE',
      columns: [
        { name: 'id', type: 'int4', escapedName: '"id"' },
        { name: 'user_id', type: 'int8', escapedName: '"user_id"' }
      ],
      keys: [{ name: 'orders_pkey', type: 'primary key', columns: ['id'] }],
      templates: []
    };
    jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
      if (query === KEYS_QUERY) {
        return DUMMY_POSTGRES_KEY_RESULT;
      } else if (query === TABLE_QUERY) {
        return DUMMY_POSTGRES_TABLE_RESULT;
      } else {
        return {};
      }
    });

    const res = await plugin.metadata(datasourceConfiguration);

    expect(res.dbSchema?.tables[0]).toEqual(DUMMY_EXPECTED_METADATA);
  });

  it('execute query', async () => {
    jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
      if (query === actionConfiguration.body) {
        return DUMMY_POSTGRES_QUERY_RESULT;
      } else {
        return {};
      }
    });

    await plugin.executePooled(props, clientWrapper);

    expect(props.mutableOutput.output).toEqual(DUMMY_POSTGRES_QUERY_RESULT.rows);
    expect(clientWrapper.client.query).toBeCalledTimes(1);
  });

  it('execute query with invalid syntax', async () => {
    jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
      throw new TypeError('Invalid syntax');
    });

    expect(props.mutableOutput.output).toEqual({});
    await expect(plugin.executePooled(props, clientWrapper)).rejects.toThrow('Query failed: Invalid syntax');

    expect(props.mutableOutput.output).toEqual({});
    expect(clientWrapper.client.query).toBeCalledTimes(1);
  });

  describe('update by primary key', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [{ table: 'products' }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        {
          table: 'products',
          newValues: {} // should be []
        },
        "Validation failed, Updated Rows is not an array. Given '{}'"
      ],
      [{ table: 'products', newValues: null, insertedRows: '[]' }, "Validation failed, Updated Rows is not an array. Given 'null'"],
      [
        { table: 'products', newValues: 'asfd' },
        'Validation failed, list of Updated Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
          if (query === DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY) {
            return DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY_RESULT;
          } else {
            throw new TypeError('Invalid syntax');
          }
        });

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                ...config
              }
            },
            clientWrapper
          );
        }).rejects.toThrow(message);
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', newValues: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          clientWrapper
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(Client.prototype, 'query').mockImplementation(() => {
        throw new Error('Example failure for a user with restricted permissions');
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              newValues: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          clientWrapper
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });

    it('fails if there are no primary keys', async () => {
      jest.spyOn(Client.prototype, 'query').mockImplementation(() => {
        return { rows: [] };
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              newValues: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          clientWrapper
        );
      }).rejects.toThrow('Table "public"."products" has no primary keys');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
    });

    describe.each([
      [{ newValues: [null] }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [{ newValues: [undefined] }, "Validation failed, Updated Rows has a row that is not a plain object: 'undefined'"],
      [
        {
          newValues: [{ id: 'a1' }, new Promise((r) => r)]
        },
        'Validation failed, Updated Rows must not contain any empty rows. Given \'[{"id":"a1"},{}]\''
      ],
      [
        {
          newValues: [{ id: 'a1', asdf: true }]
        },
        'Column "asdf" doesn\'t exist in table "public"."products"'
      ],
      [
        {
          newValues: [
            { id: 'a1', price: 1234 },
            { id: 'a2', asdf: true }
          ]
        },
        'Column "asdf" doesn\'t exist in table "public"."products"'
      ],
      [
        {
          newValues: [{ price: 1000 }]
        },
        `Missing primary key column "id" in row: {"price":1000}`
      ],
      [
        {
          newValues: [{ id: 'a1' }]
        },
        `Couldn't detect any columns to update in the list of new rows`
      ],
      [
        {
          newValues: [
            { id: '1234', price: 1234 },
            { id: null, price: 1234 }
          ]
        },
        `Null is not allowed in primary key column "id" in row: {"id":null,"price":1234}`
      ],
      [
        {
          newValues: [{ id: '1234', price: 1234 }],
          mappingMode: 'manual' as const,
          // simulating bad input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mappedColumns: '' as any
        },
        `Query failed, manual mappings are not defined`
      ],
      [
        {
          newValues: [{ id: '1234', price: 1234 }],
          mappingMode: 'manual' as const,
          mappedColumns: [{ json: 'asdf', sql: 'asdf' }]
        },
        `Manual mapping failed because asdf is not a valid column in "products"`
      ]
    ])('invalid columns %o', (config, message) => {
      it('has expected error', async () => {
        jest
          .spyOn(Client.prototype, 'query')
          .mockImplementationOnce(() => {
            // Primary keys
            return { rows: [{ column_name: 'id', data_type: 'uuid' }] };
          })
          .mockImplementationOnce(() => {
            return {
              rows: [
                { column_name: 'price', data_type: 'int4' },
                { column_name: 'id', data_type: 'uuid' },
                { column_name: 'updated', data_type: 'datetime' }
              ]
            };
          });

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                table: 'products',
                ...config
              }
            },
            clientWrapper
          );
        }).rejects.toThrow(message);
      });
    });

    describe('transactions', () => {
      let queryStartPromise = makeTestablePromise();
      let queryResponsePromise = makeTestablePromise();
      let promise: Promise<undefined>;

      beforeEach(async () => {
        queryStartPromise = makeTestablePromise();
        queryResponsePromise = makeTestablePromise();
        jest.spyOn(Client.prototype, 'query').mockImplementation(() => {
          queryStartPromise.resolver();
          return queryResponsePromise;
        });

        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              newValues: [{ id: 'a1', price: 1000 }]
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(
          `SELECT a.attname as column_name, format_type(a.atttypid, a.atttypmod) AS data_type
FROM   pg_index i
JOIN   pg_attribute a ON a.attrelid = i.indrelid
AND a.attnum = ANY(i.indkey)
WHERE  i.indrelid = $1::regclass
AND    i.indisprimary;`,
          ['"public"."products"']
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_PRIMARY_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(
          `SELECT column_name, udt_name as data_type
FROM information_schema.columns
WHERE table_schema = $1 and table_name = $2;`,
          ['public', 'products']
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
      });

      it('commits on success', async () => {
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`INSERT INTO "mocktablename" VALUES ($1, $2)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("id")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."id") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."id" = "mocktablename"."id"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '1', non_null: '1' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`UPDATE "public"."products"
SET "price" = "mocktablename"."price"
FROM "mocktablename"
WHERE "public"."products"."id" = "mocktablename"."id";`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('rolls back on failure during update step', async () => {
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`INSERT INTO "mocktablename" VALUES ($1, $2)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("id")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."id") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."id" = "mocktablename"."id"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '1', non_null: '1' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`UPDATE "public"."products"
SET "price" = "mocktablename"."price"
FROM "mocktablename"
WHERE "public"."products"."id" = "mocktablename"."id";`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.rejecter(new Error('Permissions failure of some kind'));
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow('Query failed, Permissions failure of some kind');
      });

      it('rolls back on permissions failure in CREATE TEMPORARY TABLE', async () => {
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.rejecter(new Error("User doesn't have permissions"));
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow(`Query failed, User doesn't have permissions`);
      });

      it('rolls back if the uniqueness check fails', async () => {
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`INSERT INTO "mocktablename" VALUES ($1, $2)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("id")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."id") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."id" = "mocktablename"."id"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '1', non_null: '0' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow(
          'Query failed, Update rolled back because you provided 1 rows, but table "products" contains 0 matching rows'
        );
      });

      it('rolls back if the uniqueness check fails', async () => {
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`INSERT INTO "mocktablename" VALUES ($1, $2)`, ['a1', 1000]);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("id")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."id") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."id" = "mocktablename"."id"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '2', non_null: '2' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ROLLBACK`);
        queryResponsePromise.resolver();

        await expect(promise).rejects.toThrow(
          'Query failed, Update rolled back because the uniqueness constraint was not met by "products". You provided 1 rows, and 2 rows were matched.'
        );
      });
    });
  });

  describe('update by any columns', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [
        { oldValues: 'asfd', insertedRows: [] },
        'Validation failed, list of Rows to Filter by must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ],
      [{ oldValues: {}, insertedRows: [] }, "Validation failed, Rows to Filter by is not an array. Given '{}'"],
      [{ oldValues: null, insertedRows: [] }, "Validation failed, Rows to Filter by is not an array. Given 'null'"],
      [{ oldValues: null, newValues: null, insertedRows: [] }, "Validation failed, Rows to Filter by is not an array. Given 'null'"],
      [{ oldValues: [], newValues: {} }, "Validation failed, Updated Rows is not an array. Given '{}'"],
      [{ oldValues: [], newValues: [] }, 'Query failed, no columns to filter by'],
      [
        { oldValues: [], newValues: 'asdf' },
        'Validation failed, list of Updated Rows must be valid JSON. Given \'"asdf"\'. Bindings {{}} are recommended.'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: null
        },
        'Query failed, no columns to filter by'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: [null]
        },
        'Query failed, no columns to filter by'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: 'asdf'
        },
        'Validation failed, list of columns to filter must be valid JSON. Bindings {{}} are recommended.'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: []
        },
        'Query failed, no columns to filter by'
      ],
      [
        {
          oldValues: [],
          newValues: [],
          filterBy: ['asdf']
        },
        `Can't filter using column asdf, that column name is missing in table products`
      ],
      [
        {
          oldValues: [{}],
          newValues: [{}, {}],
          filterBy: ['asdf']
        },
        "Validation failed, Rows to Filter by must not contain any empty rows. Given '[{}]'"
      ],
      [
        { oldValues: [{ id: 'a1' }], newValues: [null], filterBy: ['id'] },
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'
      ],
      [
        { oldValues: [{ id: 'a1' }], newValues: [undefined], filterBy: ['id'] },
        "Validation failed, Updated Rows has a row that is not a plain object: 'undefined'"
      ],
      [
        {
          // Invalid oldValues
          oldValues: [{ id: 'a1', asdf: true }],
          newValues: [{ id: 'a1', price: 1 }],
          filterBy: ['id']
        },
        'Column "asdf" doesn\'t exist in table "public"."products"'
      ],
      [
        {
          // Invalid newValues
          oldValues: [{ id: 'a1' }],
          newValues: [{ id: 'a1', asdf: true }],
          filterBy: ['id']
        },
        'Column "asdf" doesn\'t exist in table "public"."products"'
      ],
      [
        {
          oldValues: [{ price: 1000 }],
          newValues: [{ price: 1000, id: 'a1' }],
          filterBy: ['id']
        },
        `Missing filter column "id" in row: {"price":1000}`
      ],
      [
        {
          oldValues: [{ id: 'a1', price: 1000 }],
          newValues: [{ updated: '', price: 1000 }],
          filterBy: ['id', 'updated']
        },
        `Missing filter column "updated" in row: {"id":"a1","price":1000}`
      ],
      [
        {
          oldValues: [
            { id: '1234', price: 1234 },
            { id: null, price: 1234 }
          ],
          newValues: [
            { id: '1234', price: 1234 },
            { id: null, price: 1234 }
          ],
          filterBy: ['id']
        },
        `Null is not allowed in filter column "id" in row: {"id":null,"price":1234}`
      ],
      [
        {
          oldValues: [{ id: '1234' }],
          newValues: [{ id: '1234', price: 1234 }],
          filterBy: ['id'],
          mappingMode: 'manual' as const,
          // simulating bad input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mappedColumns: '' as any
        },
        `Query failed, manual mappings are not defined`
      ],
      [
        {
          oldValues: [{ id: '1234' }],
          newValues: [{ id: '1234', price: 1234 }],
          filterBy: ['id'],
          mappingMode: 'manual' as const,
          mappedColumns: [{ json: 'asdf', sql: 'asdf' }]
        },
        `Manual mapping failed because asdf is not a valid column in "products"`
      ]
    ])('invalid query %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(Client.prototype, 'query').mockImplementationOnce(() => {
          return {
            rows: [
              { column_name: 'price', data_type: 'int4' },
              { column_name: 'id', data_type: 'uuid' },
              { column_name: 'updated', data_type: 'datetime' }
            ]
          };
        });

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                useAdvancedMatching: 'advanced',
                table: 'products',
                ...config
              }
            },
            clientWrapper
          );
        }).rejects.toThrow(message);
      });
    });

    describe('behavior in doUpdate transaction', () => {
      let queryStartPromise = makeTestablePromise();
      let queryResponsePromise = makeTestablePromise();
      let promise: Promise<undefined>;

      beforeEach(async () => {
        queryStartPromise = makeTestablePromise();
        queryResponsePromise = makeTestablePromise();
        jest.spyOn(Client.prototype, 'query').mockImplementation(() => {
          queryStartPromise.resolver();
          return queryResponsePromise;
        });
      });

      it('commits on success', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              // We want to test queries where the primary keys are modified
              oldValues: [
                { id: 'a1', price: 1000 },
                { id: 'a2', price: 25 }
              ],
              newValues: [
                { id: 'z5', price: 5 },
                { id: 'a2', price: 20 }
              ],
              filterBy: ['id', 'price']
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          rows: [
            { column_name: 'price', data_type: 'int4' },
            { column_name: 'price2', data_type: 'int4' },
            { column_name: 'price22', data_type: 'int4' },
            { column_name: 'id', data_type: 'uuid' },
            { column_name: 'id2', data_type: 'uuid' },
            { column_name: 'updated', data_type: 'datetime' }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price" int4,
"id22" uuid,
"price222" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(
          `INSERT INTO "mocktablename" VALUES ($1, $2, $3, $4),
($5, $6, $7, $8)`,
          ['a1', 1000, 'z5', 5, 'a2', 25, 'a2', 20]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("id", "price")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."id") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."id" = "mocktablename"."id" AND "public"."products"."price" = "mocktablename"."price"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '2', non_null: '2' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`UPDATE "public"."products"
SET "id" = "mocktablename"."id22", "price" = "mocktablename"."price222"
FROM "mocktablename"
WHERE "public"."products"."id" = "mocktablename"."id" AND "public"."products"."price" = "mocktablename"."price";`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('commits on success where oldValues only has id and newValues only has updates', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              // No schema overlap
              oldValues: JSON.stringify([{ id: 'a1' }, { id: 'a2' }]),
              newValues: JSON.stringify([{ price: 5 }, { price: 10 }]),
              filterBy: JSON.stringify(['id'])
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price2" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(
          `INSERT INTO "mocktablename" VALUES ($1, $2),
($3, $4)`,
          ['a1', 5, 'a2', 10]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("id")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."id") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."id" = "mocktablename"."id"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '2', non_null: '2' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`UPDATE "public"."products"
SET "price" = "mocktablename"."price2"
FROM "mocktablename"
WHERE "public"."products"."id" = "mocktablename"."id";`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('automatically escapes special chars', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              schema: 'public',
              table: 'products',
              // We want to test queries where the primary keys are modified
              mappingMode: 'auto',
              oldValues: [
                { userId: 'a1', 'with spaces': 1000 },
                { userId: 'a2', 'with spaces': 25 }
              ],
              newValues: [
                { userId: 'z5', 'with spaces': 5 },
                { userId: 'a2', 'with spaces': 20 }
              ],
              filterBy: ['userId']
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          rows: [
            { column_name: 'with spaces', data_type: 'int4' },
            { column_name: 'userId', data_type: 'uuid' },
            { column_name: 'updated', data_type: 'datetime' }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"userId" uuid,
"userId2" uuid,
"with spaces2" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(
          `INSERT INTO "mocktablename" VALUES ($1, $2, $3),
($4, $5, $6)`,
          ['a1', 'z5', 5, 'a2', 'a2', 20]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("userId")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."userId") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."userId" = "mocktablename"."userId"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '2', non_null: '2' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`UPDATE "public"."products"
SET "userId" = "mocktablename"."userId2", "with spaces" = "mocktablename"."with spaces2"
FROM "mocktablename"
WHERE "public"."products"."userId" = "mocktablename"."userId";`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('succeeds when mapping columns values', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              schema: 'public',
              table: 'products',
              // No schema overlap
              oldValues: JSON.stringify([{ id: 'a1' }, { id: 'a2' }]),
              newValues: JSON.stringify([{ customColumn: 1234 }, { customColumn: 987 }]),
              filterBy: JSON.stringify(['id']),
              mappingMode: 'manual',
              mappedColumns: [
                {
                  json: 'id',
                  sql: 'id'
                },
                {
                  json: 'customColumn',
                  sql: 'price'
                }
              ]
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver(MOCK_ALL_COLUMNS_FOR_UPDATE);
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith('BEGIN');
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();
        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE TEMPORARY TABLE "mocktablename"
(
"id" uuid,
"price2" int4
)`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(
          `INSERT INTO "mocktablename" VALUES ($1, $2),
($3, $4)`,
          ['a1', 1234, 'a2', 987]
        );
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`CREATE INDEX "mocktablename_idx" ON "mocktablename" ("id")`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`ANALYZE "mocktablename"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query)
          .toHaveBeenLastCalledWith(`SELECT COUNT(*) as "count", COUNT("public"."products"."id") as "non_null" FROM "mocktablename"
LEFT JOIN "public"."products" ON "public"."products"."id" = "mocktablename"."id"`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({ rows: [{ count: '2', non_null: '2' }] });
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`UPDATE "public"."products"
SET "price" = "mocktablename"."price2"
FROM "mocktablename"
WHERE "public"."products"."id" = "mocktablename"."id";`);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver();
        queryResponsePromise = makeTestablePromise();

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(`COMMIT`);
        queryResponsePromise.resolver();

        await expect(promise).resolves.toBeUndefined();
        expect(props.mutableOutput.output).toBeNull();
      });

      it('throws a validation error if manual mapping is missing filters', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              table: 'products',
              mappingMode: 'manual',
              oldValues: [
                { userId: 'a1', price: 1000 },
                { userId: 'a2', price: 25 }
              ],
              newValues: [
                { userId: 'z5', price: 5 },
                { userId: 'a2', price: 20 }
              ],
              filterBy: ['userId'],
              mappedColumns: [
                {
                  json: 'p',
                  sql: 'price'
                }
              ]
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          rows: [
            { column_name: 'price', data_type: 'int4' },
            { column_name: 'userId', data_type: 'uuid' },
            { column_name: 'updated', data_type: 'datetime' }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow(`Can't filter by "userId" because it's missing in the column mapping`);
      });

      it('throws a validation error if filters are duplicated', async () => {
        promise = plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              useAdvancedMatching: 'advanced',
              schema: 'public',
              table: 'products',
              mappingMode: 'auto',
              oldValues: [
                { id: 'a1', price: 1000 },
                { id: 'a1', price: 25 }
              ],
              newValues: [
                { id: 'a2', price: 5 },
                { id: 'a2', price: 20 }
              ],
              filterBy: ['id']
            }
          },
          clientWrapper
        );

        await queryStartPromise;
        expect(Client.prototype.query).toHaveBeenLastCalledWith(expect.stringContaining('information_schema'), ['public', 'products']);
        queryStartPromise = makeTestablePromise();
        queryResponsePromise.resolver({
          rows: [
            { column_name: 'price', data_type: 'int4' },
            { column_name: 'id', data_type: 'uuid' },
            { column_name: 'updated', data_type: 'datetime' }
          ]
        });
        queryResponsePromise = makeTestablePromise();

        await expect(promise).rejects.toThrow(`Some rows are duplicates, found ["a1"]`);
      });
    });
  });

  describe('insert by primary key', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [{ table: 'products' }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        {
          table: 'products',
          insertedRows: {} // should be []
        },
        "Validation failed, Inserted Rows is not an array. Given '{}'"
      ],
      [{ table: 'products', insertedRows: null, deletedRows: '[]' }, "Validation failed, Inserted Rows is not an array. Given 'null'"],
      [
        { table: 'products', insertedRows: 'asfd' },
        'Validation failed, list of Inserted Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
          if (query === DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY) {
            return DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY_RESULT;
          } else {
            throw new TypeError('Invalid syntax');
          }
        });

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                ...config
              }
            },
            clientWrapper
          );
        }).rejects.toThrow(message);
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', insertedRows: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          clientWrapper
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(Client.prototype, 'query').mockImplementation(() => {
        throw new Error('Example failure for a user with restricted permissions');
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              insertedRows: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          clientWrapper
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });
  });

  describe('delete by primary key', () => {
    describe.each([
      [{ table: undefined }, 'Table is required'],
      [{ table: 'products' }, 'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows'],
      [
        {
          table: 'products',
          deletedRows: {} // should be []
        },
        "Validation failed, Deleted Rows is not an array. Given '{}'"
      ],
      [{ table: 'products', deletedRows: null, insertedRows: '[]' }, "Validation failed, Deleted Rows is not an array. Given 'null'"],
      [
        { table: 'products', deletedRows: 'asfd' },
        'Validation failed, list of Deleted Rows must be valid JSON. Given \'"asfd"\'. Bindings {{}} are recommended.'
      ]
    ])('handles precondition %o', (config, message) => {
      it('has expected error', async () => {
        jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
          if (query === DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY) {
            return DUMMY_POSTGRES_DEFAULT_SCHEMA_QUERY_RESULT;
          } else {
            throw new TypeError('Invalid syntax');
          }
        });

        await expect(async () => {
          await plugin.executePooled(
            {
              ...props,
              actionConfiguration: {
                ...DUMMY_ACTION_CONFIGURATION,
                operation: SqlOperations.UPDATE_ROWS,
                ...config
              }
            },
            clientWrapper
          );
        }).rejects.toThrow(message);
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    describe.each([[{ table: 'products', deletedRows: [] }, null]])('handles success %o', (config, message) => {
      it('passes', async () => {
        jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              ...config
            }
          },
          clientWrapper
        );
        expect(props.mutableOutput.log).toHaveLength(0);
        expect(props.mutableOutput.error).not.toBeDefined();
        expect(props.mutableOutput.output).toBeNull();
        expect(clientWrapper.client.query).toBeCalledTimes(0);
      });
    });

    it('fails if the metadata fetch fails', async () => {
      jest.spyOn(Client.prototype, 'query').mockImplementation(() => {
        throw new Error('Example failure for a user with restricted permissions');
      });

      await expect(async () => {
        await plugin.executePooled(
          {
            ...props,
            actionConfiguration: {
              ...DUMMY_ACTION_CONFIGURATION,
              operation: SqlOperations.UPDATE_ROWS,
              table: 'products',
              deletedRows: [
                {
                  id: 'a1',
                  price: 123.45
                }
              ]
            }
          },
          clientWrapper
        );
      }).rejects.toThrow('Example failure for a user with restricted permissions');
      expect(clientWrapper.client.query).toBeCalledTimes(1);
      expect(props.mutableOutput.log).toHaveLength(1);
    });
  });
});
