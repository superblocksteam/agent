import { RelayDelegate } from '../../relay';
import { ExecutionContext, KVStore } from '../../types/api';
import { AgentCredentials } from '../auth';
import { SQLMatchingModeEnum, SQLOperationEnum } from '../templates';

export const DUMMY_EXECUTE_COMMON_PARAMETERS = {
  context: new ExecutionContext(),
  datasourceConfiguration: {},
  files: undefined,
  agentCredentials: new AgentCredentials({}),
  recursionContext: { executedWorkflowsPath: [], isEvaluatingDatasource: false },
  environment: 'prod',
  relayDelegate: new RelayDelegate({
    body: {
      relays: {
        headers: {},
        query: {},
        body: {}
      }
    }
  })
};

export const DUMMY_GOOGLE_SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'superblocks-XXX',
  private_key_id: 'AAA',
  private_key: '-----BEGIN PRIVATE KEY-----line1line2line3-----END PRIVATE KEY-----',
  client_email: 'abc@superblocks.iam.gserviceaccount.com',
  client_id: 'xyz',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/xxx'
};

export const DUMMY_EXECUTION_CONTEXT = {
  globals: {
    params: { environment: 'dev' },
    body: {},
    Env: {}
  },
  outputs: {},
  preparedStatementContext: [] as unknown[],
  addGlobalVariable: (): void => undefined,
  addGlobalsOverride: (): void => undefined,
  addGlobalVariableOverride: (): void => undefined,
  addOutput: (): void => undefined,
  merge: (): void => undefined,
  globalBindingKeys: (): string[] => [],
  outputBindingKeys: (): string[] => []
};

export const DUMMY_DB_DATASOURCE_CONFIGURATION = {
  endpoint: {
    port: 5432,
    host: 'host-url'
  },
  connection: {
    useSsl: true,
    mode: 0
  },
  authentication: {
    custom: {
      databaseName: {
        key: 'databaseName',
        value: 'superblocks_wayfair_demo'
      },
      account: {
        key: 'account',
        value: 'test-account'
      }
    },
    password: 'password',
    username: 'demo_user'
  },
  superblocksMetadata: {
    pluginVersion: '0.0.7'
  },
  name: '[Demo] Unit Test'
};

export const DUMMY_ACTION_CONFIGURATION = {
  body: 'select * from orders limit 1;',
  schema: 'public',
  usePreparedSql: true,
  superblocksMetadata: {
    pluginVersion: '0.0.7'
  }
};

export const DUMMY_BASE_SQL_DATASOURCE_CONFIGURATION = {
  connection: {},
  name: '[Demo] Unit Test'
};

// TODO(jason4012) merge this with DUMMY_BASE_SQL_DATABASE_CONFIGURATION once oracledb types and logic are updated
export const DUMMY_ORACLE_DB_DATASOURCE_CONFIGURATION = {
  connection: {
    hostUrl: '192.168.254.210',
    port: 5432,
    user: 'demo_user',
    password: 'password',
    databaseService: 'superblocks_wayfair_demo'
  },
  name: '[Demo] Unit Test'
};

export const DUMMY_BASE_SQL_ACTION_CONFIGURATION = {
  bulkEdit: {
    schema: 'public',
    matchingMode: SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO,
    table: 'mocktablename'
  },
  runSql: {
    sqlBody: 'select * from orders limit 1;',
    useParameterized: true
  },
  operation: SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS
} as {
  bulkEdit: {
    schema?: string | undefined;
    matchingMode?: number | undefined;
    table?: string | undefined;
    updatedRows?: string | undefined;
  };
  runSql: {
    sqlBody: string;
    useParameterized: boolean;
  };
  operation: number;
};

// TODO(jason4012) merge this with DUMMY_BASE_SQL_ACTION_CONFIGURATION after the types are updated for oracledb
export const DUMMY_ORACLE_DB_ACTION_CONFIGURATION = {
  bulkEdit: {
    schema: 'admin',
    matchingMode: SQLMatchingModeEnum.SQL_MATCHING_MODE_AUTO,
    table: 'mocktablename'
  },
  runSql: {
    sqlBody: 'select * from orders limit 1;',
    useParameterized: true
  },
  operation: SQLOperationEnum.SQL_OPERATION_UPDATE_ROWS
} as {
  bulkEdit: {
    schema?: string | undefined;
    matchingMode?: number | undefined;
    table?: string | undefined;
    updatedRows?: string | undefined;
  };
  runSql: {
    sqlBody: string;
    useParameterized: boolean;
  };
  operation?: number | undefined;
};

export const DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS = {
  files: [],
  agentCredentials: {},
  recursionContext: {
    executedWorkflowsPath: [],
    isEvaluatingDatasource: false
  },
  environment: 'dev',
  relayDelegate: new RelayDelegate({
    body: {},
    headers: {},
    query: {}
  })
};

export const DUMMY_QUERY_RESULT = [
  {
    id: 30000,
    user_id: 'user_id',
    image: 'image_url',
    product: 'Renna Frame Coffee Table',
    date_purchased: '2021-01-22T16:00:00.000Z',
    user_email: 'bad_guy@superblockshq.com',
    price: 249.99
  }
];

// this function intializes the ExecutionContext,
// simulating itself as if the given bindings were sent and would resolve to the given values
export const prepContextForBindings = (context: ExecutionContext, bindingsAndValues: Record<string, string>): void => {
  const contextVariables = {};
  for (const binding of Object.keys(bindingsAndValues)) {
    contextVariables[binding] = { key: binding };
  }
  context.variables = contextVariables;

  context.kvStore = {
    read: async (keys) => {
      const data: string[] = [];
      for (const key of keys) {
        if (bindingsAndValues[key]) {
          data.push(bindingsAndValues[key]);
        }
      }
      return {
        data: data
      };
    },
    write: async (key: string, value: string) => {
      return;
    },
    writeMany: async (kvs: { key: string; value: string }[]) => {
      return;
    }
  } as KVStore;
};
