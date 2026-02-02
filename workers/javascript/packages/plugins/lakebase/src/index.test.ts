import {
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_DB_DATASOURCE_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  DUMMY_QUERY_RESULT,
  ExecutionOutput,
  LakebaseActionConfiguration,
  LakebaseDatasourceConfiguration,
  PluginExecutionProps
} from '@superblocks/shared';

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

const DUMMY_EXPECTED_METADATA = {
  name: 'orders',
  type: 'TABLE',
  columns: [
    { name: 'id', type: 'int4', escapedName: '"id"' },
    { name: 'user_id', type: 'int8', escapedName: '"user_id"' }
  ],
  keys: [],
  templates: []
};

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
    })
  };
});

import { Client } from 'pg';
jest.mock('pg');

import { KEYS_QUERY, TABLE_QUERY } from './queries';
import LakebasePlugin from '.';

const plugin: LakebasePlugin = new LakebasePlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const DUMMY_LAKEBASE_QUERY_RESULT = {
  rows: DUMMY_QUERY_RESULT
};
const DUMMY_LAKEBASE_TABLE_RESULT = {
  rows: DUMMY_TABLE_RESULT
};
const DUMMY_LAKEBASE_KEY_RESULT = {
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
const DUMMY_LAKEBASE_EXPECTED_METADATA = {
  ...DUMMY_EXPECTED_METADATA,
  schema: 'public',
  keys: [{ name: 'orders_pkey', type: 'primary key', columns: ['id'] }]
};

const context = DUMMY_EXECUTION_CONTEXT;
const datasourceConfiguration: LakebaseDatasourceConfiguration = {
  name: 'test-lakebase',
  connection: {
    host: 'test-host.databricks.com',
    port: 5432,
    databaseName: 'test_db',
    connectionType: 1, // USERNAME_PASSWORD
    username: 'test-user',
    password: 'test-password'
  }
};
const actionConfiguration = DUMMY_ACTION_CONFIGURATION;
const props: PluginExecutionProps<LakebaseDatasourceConfiguration, LakebaseActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Lakebase Plugin', () => {
  describe('test connection', () => {
    it('should connect with username/password auth', async () => {
      jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
      jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

      await plugin.test(datasourceConfiguration);

      expect(Client.prototype.connect).toBeCalledTimes(1);
    });

    it('should enforce SSL for all connections', async () => {
      jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
      jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

      await plugin.test(datasourceConfiguration);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: expect.objectContaining({
            rejectUnauthorized: true
          })
        })
      );
    });

    it('should include application_name in connection', async () => {
      jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
      jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

      await plugin.test(datasourceConfiguration);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          application_name: 'Superblocks'
        })
      );
    });
  });

  describe('metadata', () => {
    it('should get metadata', async () => {
      jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
      jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
        if (query === KEYS_QUERY) {
          return DUMMY_LAKEBASE_KEY_RESULT;
        } else if (query === TABLE_QUERY) {
          return DUMMY_LAKEBASE_TABLE_RESULT;
        } else {
          return {};
        }
      });

      const res = await plugin.metadata(datasourceConfiguration);

      expect(res.dbSchema?.tables[0]).toEqual(DUMMY_LAKEBASE_EXPECTED_METADATA);
    });
  });

  describe('execute query', () => {
    it('should execute query', async () => {
      const client = new Client({});
      jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
      jest.spyOn(Client.prototype, 'query').mockImplementation((query) => {
        if (query === actionConfiguration.body) {
          return DUMMY_LAKEBASE_QUERY_RESULT;
        } else {
          return {};
        }
      });

      const res = await plugin.executePooled({ ...props, mutableOutput: new ExecutionOutput() }, client);

      expect(res.output).toEqual(DUMMY_LAKEBASE_QUERY_RESULT.rows);
      expect(client.query).toBeCalledTimes(1);
    });

    it('should return empty output for empty query', async () => {
      const client = new Client({});
      const emptyProps = {
        ...props,
        actionConfiguration: { ...actionConfiguration, body: '' },
        mutableOutput: new ExecutionOutput()
      };

      const res = await plugin.executePooled(emptyProps, client);

      expect(res.output).toEqual({});
    });
  });

  describe('OAuth M2M authentication', () => {
    it('should throw error when client credentials are missing', async () => {
      const m2mConfig: LakebaseDatasourceConfiguration = {
        ...datasourceConfiguration,
        connection: {
          ...datasourceConfiguration.connection,
          connectionType: 2, // OAUTH_M2M
          oauthClientId: undefined,
          oauthClientSecret: undefined
        }
      };

      await expect(plugin.test(m2mConfig)).rejects.toThrow('OAuth M2M requires client ID and client secret');
    });

    it('should throw error when workspace URL is missing for M2M', async () => {
      const m2mConfig: LakebaseDatasourceConfiguration = {
        ...datasourceConfiguration,
        connection: {
          ...datasourceConfiguration.connection,
          connectionType: 2, // OAUTH_M2M
          oauthClientId: 'test-client-id',
          oauthClientSecret: 'test-client-secret',
          oauthWorkspaceUrl: undefined
        }
      };

      await expect(plugin.test(m2mConfig)).rejects.toThrow('OAuth M2M requires workspace URL for token endpoint');
    });
  });

  describe('OAuth Token Federation authentication', () => {
    it('should throw error when auth token is missing', async () => {
      const federationConfig: LakebaseDatasourceConfiguration = {
        ...datasourceConfiguration,
        connection: {
          ...datasourceConfiguration.connection,
          connectionType: 3 // OAUTH_FEDERATION
        },
        authConfig: {
          authToken: undefined
        }
      };

      await expect(plugin.test(federationConfig)).rejects.toThrow('OAuth Token Federation token expected but not present');
    });

    it('should throw error when user email is missing from auth context', async () => {
      const federationConfig: LakebaseDatasourceConfiguration = {
        ...datasourceConfiguration,
        connection: {
          ...datasourceConfiguration.connection,
          connectionType: 3 // OAUTH_FEDERATION
        },
        authConfig: {
          authToken: 'test-token',
          userEmail: undefined
        }
      };

      await expect(plugin.test(federationConfig)).rejects.toThrow('Token Federation requires user email from authentication context');
    });

    it('should connect with Token Federation using userEmail from authConfig', async () => {
      jest.spyOn(Client.prototype, 'connect').mockImplementation((): void => undefined);
      jest.spyOn(Client.prototype, 'query').mockImplementation((): void => undefined);

      const federationConfig: LakebaseDatasourceConfiguration = {
        ...datasourceConfiguration,
        connection: {
          ...datasourceConfiguration.connection,
          connectionType: 3 // OAUTH_FEDERATION
        },
        authConfig: {
          authToken: 'test-oauth-token',
          userEmail: 'user@example.com'
        }
      };

      await plugin.test(federationConfig);

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user@example.com',
          password: 'test-oauth-token',
          ssl: expect.objectContaining({
            rejectUnauthorized: true
          }),
          application_name: 'Superblocks'
        })
      );
    });
  });

  describe('Username/Password authentication', () => {
    it('should throw error when username is missing', async () => {
      const upConfig: LakebaseDatasourceConfiguration = {
        ...datasourceConfiguration,
        connection: {
          ...datasourceConfiguration.connection,
          connectionType: 1, // USERNAME_PASSWORD
          username: undefined,
          password: 'test-password'
        }
      };

      await expect(plugin.test(upConfig)).rejects.toThrow('Username and password are required');
    });

    it('should throw error when password is missing', async () => {
      const upConfig: LakebaseDatasourceConfiguration = {
        ...datasourceConfiguration,
        connection: {
          ...datasourceConfiguration.connection,
          connectionType: 1, // USERNAME_PASSWORD
          username: 'test-user',
          password: undefined
        }
      };

      await expect(plugin.test(upConfig)).rejects.toThrow('Username and password are required');
    });
  });
});
