import path from 'path';
import { ActionResponseType, DUMMY_EXECUTE_COMMON_PARAMETERS, ErrorCode, ExecutionOutput, GCSActionType } from '@superblocks/shared';
import dotenv from 'dotenv';
import GCSPlugin from '.';

describe.skip('gcs plugin tests', () => {
  const plugin: GCSPlugin = new GCSPlugin();
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  const BUCKET_NAME = 'integration-test-38945783947589';

  const GCS_TEST_CONFIG = {
    authentication: {
      custom: {
        googleServiceAccount: {
          key: 'googleServiceAccount',
          value: JSON.stringify({
            type: 'service_account',
            project_id: 'gcs-integration-test-472417',
            private_key_id: '25ee51babb62594715473a581e27d6b827c48c73',
            private_key: process.env.GCS_SERVICE_ACCOUNT_KEY,
            client_email: 'gcs-integration-service-accoun@gcs-integration-test-472417.iam.gserviceaccount.com',
            client_id: '118238744384787335497',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url:
              'https://www.googleapis.com/robot/v1/metadata/x509/gcs-integration-service-accoun%40gcs-integration-test-472417.iam.gserviceaccount.com',
            universe_domain: 'googleapis.com'
          })
        }
      }
    }
  };

  const GCS_INVALID_TEST_CONFIG = {
    authentication: {
      custom: {
        googleServiceAccount: {
          key: 'googleServiceAccount',
          value: JSON.stringify({
            type: 'service_account',
            project_id: 'superblocks-dev',
            private_key_id: '44a096',
            private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADA THIS IS NOT A VALID KEY',
            client_email: 'ro-test-gcs@superblocks-dev.iam.gserviceaccount.com',
            client_id: '116659580821017175336',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/ro-test-gcs%40superblocks-dev.iam.gserviceaccount.com'
          })
        }
      }
    }
  };

  test('test get object', async () => {
    const data = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.GET_OBJECT,
        resource: BUCKET_NAME,
        path: 'gcs.png',
        responseType: ActionResponseType.TEXT
      }
    });
    expect(JSON.stringify(data)).toContain('PNG');

    const dataPlain = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.GET_OBJECT,
        resource: BUCKET_NAME,
        path: 'tableConvert.com_59mhw7.csv',
        responseType: ActionResponseType.AUTO
      }
    });
    expect(JSON.stringify(dataPlain)).toContain('"\\"1\\",\\"2\\",\\"3\\"');
  });

  test('test list objects', async () => {
    const data = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.LIST_OBJECTS,
        resource: BUCKET_NAME
      }
    });

    expect(JSON.stringify(data)).toContain(BUCKET_NAME);
  });

  test('test list objects with prefix', async () => {
    const data = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.LIST_OBJECTS,
        resource: BUCKET_NAME,
        prefix: 'blahblah' // no objects with this prefix
      }
    });

    expect(JSON.stringify(data)).not.toContain('gcs.png');
  });

  test('test list buckets', async () => {
    const data = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.LIST_BUCKETS
      }
    });

    expect(JSON.stringify(data)).toContain(BUCKET_NAME);
  });

  test('test list buckets with prefix', async () => {
    const data = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.LIST_BUCKETS,
        resource: BUCKET_NAME,
        prefix: 'blahblah' // no objects with this prefix
      }
    });

    expect(JSON.stringify(data)).not.toContain(BUCKET_NAME);
  });

  test('test pre signed url', async () => {
    const data = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.GENERATE_PRESIGNED_URL,
        resource: BUCKET_NAME,
        path: 'gcs.png',
        // @ts-ignore
        custom: {
          presignedExpiration: {
            key: 'presignedExpiration',
            value: '600'
          }
        }
      }
    });

    expect(JSON.stringify(data)).toContain('gcs.png');

    try {
      await plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: GCS_TEST_CONFIG,
        actionConfiguration: {
          action: GCSActionType.GENERATE_PRESIGNED_URL,
          resource: 'ro-test-gcs-this-does-not-exist',
          path: 'gcs.png',
          // @ts-ignore
          custom: {
            presignedExpiration: {
              key: 'presignedExpiration',
              value: '600'
            }
          }
        }
      });
    } catch (e) {
      expect(e.message).toContain('bucket does not exist');
    }

    try {
      await plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: GCS_TEST_CONFIG,
        actionConfiguration: {
          action: GCSActionType.GENERATE_PRESIGNED_URL,
          resource: BUCKET_NAME,
          path: 'gcs.png.does.not.exist',
          // @ts-ignore
          custom: {
            presignedExpiration: {
              key: 'presignedExpiration',
              value: '600'
            }
          }
        }
      });
    } catch (e) {
      expect(e.message).toContain('No such object');
    }
  });

  test('test upload and delete', async () => {
    const data = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.UPLOAD_OBJECT,
        resource: BUCKET_NAME,
        path: 'integration-test-uploaded-will-delete.txt',
        body: '123'
      }
    });
    expect(JSON.stringify(data)).toContain(BUCKET_NAME);

    await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.DELETE_OBJECT,
        resource: BUCKET_NAME,
        path: 'integration-test-uploaded-will-delete.txt'
      }
    });
  });

  test('test plugin test interface', async () => {
    try {
      await plugin.test(GCS_INVALID_TEST_CONFIG);
    } catch (e) {
      expect(e.message).toContain('Test failed');
      expect(e.code).toBe(ErrorCode.INTEGRATION_AUTHORIZATION);
    }
  });
});
