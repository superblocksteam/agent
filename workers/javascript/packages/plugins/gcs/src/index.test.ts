import { DUMMY_EXECUTE_COMMON_PARAMETERS, DEFAULT_GCS_PRESIGNED_URL_EXPIRATION_SECONDS, ExecutionOutput, GCSActionType } from '@superblocks/shared';

import GCSPlugin from '.';

const SIGNED_URL = 'https://storage.googleapis.com/my-bucket/my-file.txt?signed';

const getSignedUrlMock: jest.Mock = jest.fn().mockResolvedValue([SIGNED_URL]);
const getMetadataMock: jest.Mock = jest.fn().mockResolvedValue([{ contentType: 'text/plain' }]);
const fileMock: jest.Mock = jest.fn().mockReturnValue({
  getMetadata: getMetadataMock,
  getSignedUrl: getSignedUrlMock
});
const bucketMock: jest.Mock = jest.fn().mockReturnValue({ file: fileMock });

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: bucketMock
  }))
}));

const GCS_TEST_CONFIG = {
  authentication: {
    custom: {
      googleServiceAccount: {
        key: 'googleServiceAccount',
        value: JSON.stringify({ type: 'service_account', project_id: 'test-project' })
      }
    }
  }
};

describe('gcs generate presigned url', () => {
  const plugin: GCSPlugin = new GCSPlugin();

  beforeEach(() => {
    jest.clearAllMocks();
    getSignedUrlMock.mockResolvedValue([SIGNED_URL]);
    getMetadataMock.mockResolvedValue([{ contentType: 'text/plain' }]);
  });

  test('generates a presigned URL using the configured expiration when provided', async () => {
    const before = Date.now();
    const result = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.GENERATE_PRESIGNED_URL,
        resource: 'my-bucket',
        path: 'my-file.txt',
        // @ts-ignore -- custom is not in the shared GCSActionConfiguration type yet
        custom: {
          presignedExpiration: { value: '3600' }
        }
      }
    });

    expect(result.output).toEqual({ presignedURL: SIGNED_URL });
    const options = getSignedUrlMock.mock.calls[0][0];
    expect(options.expires).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(options.expires).toBeLessThanOrEqual(Date.now() + 3600 * 1000 + 1000);
  });

  test('defaults to DEFAULT_GCS_PRESIGNED_URL_EXPIRATION_SECONDS when presignedExpiration is not provided', async () => {
    const before = Date.now();
    const result = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: GCS_TEST_CONFIG,
      actionConfiguration: {
        action: GCSActionType.GENERATE_PRESIGNED_URL,
        resource: 'my-bucket',
        path: 'my-file.txt'
      }
    });

    expect(result.output).toEqual({ presignedURL: SIGNED_URL });
    const options = getSignedUrlMock.mock.calls[0][0];
    expect(Number.isFinite(options.expires)).toBe(true);
    expect(options.expires).toBeGreaterThanOrEqual(before + DEFAULT_GCS_PRESIGNED_URL_EXPIRATION_SECONDS * 1000);
    expect(options.expires).toBeLessThanOrEqual(Date.now() + DEFAULT_GCS_PRESIGNED_URL_EXPIRATION_SECONDS * 1000 + 1000);
  });

  test('throws a clear error when presignedExpiration is not a valid number', async () => {
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: GCS_TEST_CONFIG,
        actionConfiguration: {
          action: GCSActionType.GENERATE_PRESIGNED_URL,
          resource: 'my-bucket',
          path: 'my-file.txt',
          // @ts-ignore -- custom is not in the shared GCSActionConfiguration type yet
          custom: {
            presignedExpiration: { value: 'not-a-number' }
          }
        }
      })
    ).rejects.toThrow('Invalid presigned URL expiration value: not-a-number');
  });

  test('throws a clear error when presignedExpiration is Infinity', async () => {
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: GCS_TEST_CONFIG,
        actionConfiguration: {
          action: GCSActionType.GENERATE_PRESIGNED_URL,
          resource: 'my-bucket',
          path: 'my-file.txt',
          // @ts-ignore -- custom is not in the shared GCSActionConfiguration type yet
          custom: {
            presignedExpiration: { value: 'Infinity' }
          }
        }
      })
    ).rejects.toThrow('Invalid presigned URL expiration value: Infinity');
  });

  test('throws a clear error when presignedExpiration is zero', async () => {
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: GCS_TEST_CONFIG,
        actionConfiguration: {
          action: GCSActionType.GENERATE_PRESIGNED_URL,
          resource: 'my-bucket',
          path: 'my-file.txt',
          // @ts-ignore -- custom is not in the shared GCSActionConfiguration type yet
          custom: {
            presignedExpiration: { value: '0' }
          }
        }
      })
    ).rejects.toThrow('Invalid presigned URL expiration value: 0');
  });
});
