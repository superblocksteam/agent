import {
  AthenaActionConfiguration,
  AthenaDatasourceConfiguration,
  DUMMY_EXECUTION_CONTEXT,
  ErrorCode,
  ExecutionOutput,
  PluginExecutionProps,
  RelayDelegate,
  prepContextForBindings
} from '@superblocks/shared';
import { AthenaPluginV1, SQLExecution } from '@superblocksteam/types';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import path from 'path';
import AthenaPlugin from '.';

// THESE TESTS SHOULD ONLY BE RUN
// 1. DURING LOCAL DEVELOPMENT
// 2. (TODO - joey) during a daily CI deploy
// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const LOCAL_DEV = process.env.ATHENA_LOCAL_DEV; // safeguard to prevent running these tests in CI
const DATABASE_NAME = process.env.DATABASE_NAME;
const TABLE_NAME_CSV = process.env.TABLE_NAME_CSV;
const TABLE_NAME_JSONL = process.env.TABLE_NAME_JSONL;
const BUCKET_NAME = process.env.BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const WORKGROUP_NAME_WITH_S3_OUTPUT_DEFINED = process.env.WORKGROUP_NAME_WITH_S3_OUTPUT_DEFINED;
const WORKGROUP_NAME_WITHOUT_S3_OUTPUT_DEFINED = process.env.WORKGROUP_NAME_WITHOUT_S3_OUTPUT_DEFINED;
const VALID_S3_RESULT_LOCATION = `s3://${BUCKET_NAME}/result/`;

const runTests = LOCAL_DEV ? describe : describe.skip;

// helper test functions

function getLastLog(props: PluginExecutionProps): string {
  return props.mutableOutput.log[props.mutableOutput.log.length - 1];
}

const plugin: AthenaPlugin = new AthenaPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

export const datasourceConfiguration = {
  connection: {
    databaseName: DATABASE_NAME,
    workgroupName: WORKGROUP_NAME_WITH_S3_OUTPUT_DEFINED,
    awsConfig: {
      region: AWS_REGION,
      auth: {
        accessKeyId: ACCESS_KEY_ID,
        secretKey: SECRET_KEY
      }
    }
  },
  name: 'Athena Plugin Tests'
} as AthenaDatasourceConfiguration;

const actionConfiguration = {
  runSql: {
    sqlBody: '',
    useParameterized: true
  } as SQLExecution
} as AthenaActionConfiguration;

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

const context = DUMMY_EXECUTION_CONTEXT;
const props: PluginExecutionProps<AthenaDatasourceConfiguration, AthenaActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

runTests('s3 url is built correctly', () => {
  // all of these tests assume the scenario that an S3 output location is given
  test('no suffix given, given S3 location has trailing slash', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = 'SHOW TABLES');
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    await plugin.execute(newProps);
    expect(newProps.mutableOutput.log[1]).toEqual(`Querying with S3 Output Location: ${VALID_S3_RESULT_LOCATION}`);
    expect(VALID_S3_RESULT_LOCATION.endsWith('/')).toEqual(true); // just in case someone changes it
  });

  test('no suffix given, given S3 location does not have trailing slash', async () => {
    const newProps = cloneDeep(props);
    const modifiedS3Location = VALID_S3_RESULT_LOCATION.slice(0, -1);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = 'SHOW TABLES');
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.s3OutputLocation = modifiedS3Location);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    await plugin.execute(newProps);
    expect(newProps.mutableOutput.log[1]).toEqual(`Querying with S3 Output Location: ${modifiedS3Location}`);
  });

  test('suffix given, given S3 location has trailing slash', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = 'SHOW TABLES');
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocationSuffix = AthenaPluginV1.Connection_DateFolderType.YYYY);
    await plugin.execute(newProps);
    expect(newProps.mutableOutput.log[1]).toEqual(
      `Querying with S3 Output Location: ${VALID_S3_RESULT_LOCATION}${new Date().getUTCFullYear()}/`
    );
    expect(VALID_S3_RESULT_LOCATION.endsWith('/')).toEqual(true); // just in case someone changes it
  });

  test('suffix given, given S3 location does not have trailing slash', async () => {
    const newProps = cloneDeep(props);
    const modifiedS3Location = VALID_S3_RESULT_LOCATION.slice(0, -1);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = 'SHOW TABLES');
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.s3OutputLocation = modifiedS3Location);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocationSuffix = AthenaPluginV1.Connection_DateFolderType.YYYY);
    await plugin.execute(newProps);
    expect(newProps.mutableOutput.log[1]).toEqual(
      `Querying with S3 Output Location: ${modifiedS3Location}/${new Date().getUTCFullYear()}/`
    );
  });

  test('YYYY suffix given', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = 'SHOW TABLES');
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocationSuffix = AthenaPluginV1.Connection_DateFolderType.YYYY);
    await plugin.execute(newProps);
    expect(newProps.mutableOutput.log[1]).toEqual(
      `Querying with S3 Output Location: ${VALID_S3_RESULT_LOCATION}${new Date().getUTCFullYear()}/`
    );
  });

  test('YYYYMM suffix given', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = 'SHOW TABLES');
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocationSuffix = AthenaPluginV1.Connection_DateFolderType.YYYYMM);
    await plugin.execute(newProps);
    const date = new Date();
    const suffix = `${date.getUTCFullYear()}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    expect(newProps.mutableOutput.log[1]).toEqual(`Querying with S3 Output Location: ${VALID_S3_RESULT_LOCATION}${suffix}/`);
  });

  test('YYYYMMDD suffix given', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = 'SHOW TABLES');
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocationSuffix = AthenaPluginV1.Connection_DateFolderType.YYYYMMDD);
    await plugin.execute(newProps);
    const date = new Date();
    const suffix = `${date.getUTCFullYear()}/${(date.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getUTCDate().toString().padStart(2, '0')}`;
    expect(newProps.mutableOutput.log[1]).toEqual(`Querying with S3 Output Location: ${VALID_S3_RESULT_LOCATION}${suffix}/`);
  });
});

runTests('connection', () => {
  test('connection succeeds with basic config', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('connection succeeds when workgroup given without s3 output but separate s3 output defined', async () => {
    const newDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    newDatasourceConfiguration.connection && (newDatasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newDatasourceConfiguration.connection &&
      (newDatasourceConfiguration.connection.workgroupName = WORKGROUP_NAME_WITHOUT_S3_OUTPUT_DEFINED);

    await plugin.test(newDatasourceConfiguration);
  });

  test('connection fails when workgroup given without s3 output and no separate s3 output defined', async () => {
    const badDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    badDatasourceConfiguration.connection ? (badDatasourceConfiguration.connection.s3OutputLocation = undefined) : undefined;
    badDatasourceConfiguration.connection
      ? (badDatasourceConfiguration.connection.workgroupName = WORKGROUP_NAME_WITHOUT_S3_OUTPUT_DEFINED)
      : undefined;

    await plugin
      .test(badDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((error) => {
        expect(error.message).toMatch('Test connection failed, WorkGroup does not have an S3 output location and none was given.');
        expect(error.code).toEqual(ErrorCode.INTEGRATION_AUTHORIZATION);
      });
  });

  // NOTE: (joey) technically these "bad *something*" tests could fail with a legit setup if someone created
  // that thing with the specific pattern "im_a_bad_*thing*". however, if they do that I have no sympathy for them

  test('connection fails with bad database name', async () => {
    const badDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    badDatasourceConfiguration.connection && (badDatasourceConfiguration.connection.databaseName = 'im_an_invalid_database_name');

    let error;

    try {
      await plugin.test(badDatasourceConfiguration);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Test connection failed');
    expect(error.code).toBe(ErrorCode.INTEGRATION_AUTHORIZATION);
  });

  test('connection fails with bad aws region', async () => {
    const badDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    badDatasourceConfiguration.connection?.awsConfig &&
      (badDatasourceConfiguration.connection.awsConfig.region = 'im_an_invalid_aws_region');

    await plugin
      .test(badDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((error) => {
        expect(error.message).toMatch('Test connection failed, Invalid region in client config');
        expect(error.code).toEqual(ErrorCode.INTEGRATION_AUTHORIZATION);
      });
  });

  test('connection fails with bad access key id', async () => {
    const badDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    badDatasourceConfiguration.connection?.awsConfig?.auth &&
      (badDatasourceConfiguration.connection.awsConfig.auth.accessKeyId = 'im_an_invalid_access_key_id');

    await plugin
      .test(badDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((error) => {
        expect(error.message).toMatch('Test connection failed, The security token included in the request is invalid.');
        expect(error.code).toEqual(ErrorCode.INTEGRATION_AUTHORIZATION);
      });
  });

  test('connection fails with bad secret key', async () => {
    const badDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    badDatasourceConfiguration.connection?.awsConfig?.auth &&
      (badDatasourceConfiguration.connection.awsConfig.auth.secretKey = 'im_an_invalid_secret_key');

    await plugin
      .test(badDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((error) => {
        expect(error.message).toMatch(
          'Test connection failed, The request signature we calculated does not match the signature you provided. Check your AWS Secret Access Key and signing method. Consult the service documentation for details.'
        );
        expect(error.code).toEqual(ErrorCode.INTEGRATION_AUTHORIZATION);
      });
  });

  test('connection fails with bad workgroup name', async () => {
    const badDatasourceConfiguration = cloneDeep(datasourceConfiguration);
    badDatasourceConfiguration.connection && (badDatasourceConfiguration.connection.workgroupName = 'im_an_invalid_workgroup_name');

    await plugin
      .test(badDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((error) => {
        expect(error.message).toMatch(
          'Test connection failed, You are not authorized to perform: athena:GetWorkGroup on the resource. After your AWS administrator or you have updated your permissions, please try again.'
        );
        expect(error.code).toEqual(ErrorCode.INTEGRATION_AUTHORIZATION);
      });
  });
});

runTests('metadata', () => {
  test('metadata response is formatted correctly', async () => {
    const resp = await plugin.metadata(datasourceConfiguration);
    expect(resp).toEqual({
      dbSchema: {
        tables: [
          {
            name: 'athena_staging_test_integration_table_csv',
            type: 'TABLE',
            columns: [
              {
                name: 'name',
                type: 'string',
                escapedName: '"name"'
              },
              {
                name: 'age',
                type: 'int',
                escapedName: '"age"'
              }
            ],
            keys: [],
            templates: []
          },
          {
            name: 'athena_staging_test_integration_table_jsonl',
            type: 'TABLE',
            columns: [
              {
                name: 'id',
                type: 'int',
                escapedName: '"id"'
              },
              {
                name: 'name',
                type: 'string',
                escapedName: '"name"'
              },
              {
                name: 'email',
                type: 'string',
                escapedName: '"email"'
              },
              {
                name: 'city',
                type: 'string',
                escapedName: '"city"'
              },
              {
                name: 'state',
                type: 'string',
                escapedName: '"state"'
              }
            ],
            keys: [],
            templates: []
          }
        ]
      }
    });
  });
});

runTests('queries', () => {
  test('query succeeds with workgroup given [CSV DATA]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_CSV} LIMIT 10;`);
    await plugin.execute(newProps);
    expect(getLastLog(newProps)).toEqual('Query retrieved 6 rows');
    expect(newProps.mutableOutput.output).toEqual([
      { name: 'John', age: '25' },
      { name: 'Jane', age: '28' },
      { name: 'Alice', age: '22' },
      { name: 'Bob', age: '30' },
      { name: 'Charlie', age: '27' },
      { name: 'Diana', age: '29' }
    ]);
  });

  test('query succeeds with workgroup given [JSONL DATA]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_JSONL} LIMIT 10;`);
    await plugin.execute(newProps);
    expect(getLastLog(newProps)).toEqual('Query retrieved 3 rows');
    expect(newProps.mutableOutput.output).toEqual([
      {
        id: '1',
        name: 'Alice Smith',
        email: 'alice@example.com',
        city: 'Springfield',
        state: 'IL'
      },
      {
        id: '2',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        city: 'Shelbyville',
        state: 'IL'
      },
      {
        id: '3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        city: 'Metropolis',
        state: 'IL'
      }
    ]);
  });

  test('query succeeds without workgroup given [CSV DATA]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_CSV} LIMIT 10;`);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    await plugin.execute(newProps);
    expect(getLastLog(newProps)).toEqual('Query retrieved 6 rows');
    expect(newProps.mutableOutput.output).toEqual([
      { name: 'John', age: '25' },
      { name: 'Jane', age: '28' },
      { name: 'Alice', age: '22' },
      { name: 'Bob', age: '30' },
      { name: 'Charlie', age: '27' },
      { name: 'Diana', age: '29' }
    ]);
  });

  test('query succeeds without workgroup given [JSONL DATA]', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_JSONL} LIMIT 10;`);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.workgroupName = undefined);
    newProps.datasourceConfiguration.connection &&
      (newProps.datasourceConfiguration.connection.s3OutputLocation = VALID_S3_RESULT_LOCATION);
    newProps.datasourceConfiguration.connection && (newProps.datasourceConfiguration.connection.overrideS3OutputLocation = true);
    await plugin.execute(newProps);
    expect(getLastLog(newProps)).toEqual('Query retrieved 3 rows');
    expect(newProps.mutableOutput.output).toEqual([
      {
        id: '1',
        name: 'Alice Smith',
        email: 'alice@example.com',
        city: 'Springfield',
        state: 'IL'
      },
      {
        id: '2',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        city: 'Shelbyville',
        state: 'IL'
      },
      {
        id: '3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        city: 'Metropolis',
        state: 'IL'
      }
    ]);
  });

  test('query succeeds with 0 rows retrieved', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_CSV} LIMIT 0;`);
    await plugin.execute(newProps);
    expect(getLastLog(newProps)).toEqual('Query retrieved 0 rows');
    expect(newProps.mutableOutput.output).toEqual([]);
  });

  test('query without columns in response succeeds', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.sqlBody = `SHOW TABLES;`);
    await plugin.execute(newProps);
    expect(getLastLog(newProps)).toEqual('Query retrieved 2 rows');
    expect(newProps.mutableOutput.output).toEqual([
      { tab_name: 'athena_staging_test_integration_table_csv' },
      { tab_name: 'athena_staging_test_integration_table_jsonl' }
    ]);
  });

  test('query succeeds with SQL params given', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_CSV} LIMIT ?;`);
    newProps.context.preparedStatementContext = [10];
    await plugin.execute(newProps);
    expect(getLastLog(newProps)).toEqual('Query retrieved 6 rows');
    expect(newProps.mutableOutput.output).toEqual([
      { name: 'John', age: '25' },
      { name: 'Jane', age: '28' },
      { name: 'Alice', age: '22' },
      { name: 'Bob', age: '30' },
      { name: 'Charlie', age: '27' },
      { name: 'Diana', age: '29' }
    ]);
  });

  test('query fails', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = 'SELECT * FROM im_an_invalid_table_name LIMIT 1;');

    let error;

    try {
      await plugin.execute(newProps);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('Query failed:');
    expect(error.code).toBe(ErrorCode.INTEGRATION_NETWORK);
  });
});

runTests('bindings', () => {
  test('bindings resolve correctly when using parameterized sql', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_CSV} LIMIT {{binding1}};`);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.useParameterized = true);

    prepContextForBindings(newProps.context, { binding1: '10' });

    const resp = await plugin.resolveActionConfigurationProperty({
      context: newProps.context,
      actionConfiguration: newProps.actionConfiguration,
      files: null,
      property: 'runSql.sqlBody',
      escapeStrings: false
    });
    expect(resp.resolved).toEqual(
      'SELECT * FROM athena_staging_test_integration_database.athena_staging_test_integration_table_csv LIMIT ?;'
    );
    expect(resp.placeholdersInfo?.['?']?.value).toEqual('"10"');
  });

  test('bindings dont resolve when not using parameterized sql', async () => {
    const newProps = cloneDeep(props);
    newProps.actionConfiguration?.runSql &&
      (newProps.actionConfiguration.runSql.sqlBody = `SELECT * FROM ${DATABASE_NAME}.${TABLE_NAME_CSV} LIMIT {{binding1}};`);
    newProps.actionConfiguration?.runSql && (newProps.actionConfiguration.runSql.useParameterized = false);

    prepContextForBindings(newProps.context, { binding1: '10' });

    const resp = await plugin.resolveActionConfigurationProperty({
      context: newProps.context,
      actionConfiguration: newProps.actionConfiguration,
      files: null,
      property: 'runSql.sqlBody',
      escapeStrings: false
    });
    expect(resp.resolved).toEqual(
      'SELECT * FROM athena_staging_test_integration_database.athena_staging_test_integration_table_csv LIMIT 10;'
    );
    expect(resp.placeholdersInfo).toBeUndefined();
  });
});
