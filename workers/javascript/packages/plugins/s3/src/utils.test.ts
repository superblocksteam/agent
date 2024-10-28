import { AWSAuthType, S3ActionType } from '@superblocks/shared';
import { buildListObjectsV2Command, getS3ClientConfig, validateS3Action } from './utils';

describe('getS3ClientConfig', () => {
  it.each([
    {
      description: 'without endpoint',
      datasourceConfiguration: { awsAuthType: AWSAuthType.ACCESS_KEY },
      expectedS3ClientConfig: {}
    },
    {
      description: 'with endpoint',
      datasourceConfiguration: { awsAuthType: AWSAuthType.ACCESS_KEY, endpoint: 'foo' },
      expectedS3ClientConfig: { endpoint: 'foo', forcePathStyle: true }
    }
  ])('$description', async ({ datasourceConfiguration, expectedS3ClientConfig }) => {
    const actualS3ClientConfig = getS3ClientConfig(datasourceConfiguration);
    expect(expectedS3ClientConfig).toEqual(actualS3ClientConfig);
  });
});

describe('buildListObjectsV2Command', () => {
  it.each([
    {
      description: 'only bucket',
      actionConfiguration: { resource: 'b' },
      expectedResponse: { Bucket: 'b' }
    },
    {
      description: 'with prefix, without delimiter',
      actionConfiguration: { resource: 'b', listFilesConfig: { prefix: 'foo' } },
      expectedResponse: { Bucket: 'b', Prefix: 'foo' }
    },
    {
      description: 'with delimiter, without prefix',
      actionConfiguration: { resource: 'b', listFilesConfig: { delimiter: 'foo' } },
      expectedResponse: { Bucket: 'b', Delimiter: 'foo' }
    },
    {
      description: 'with delimiter, with prefix',
      actionConfiguration: { resource: 'b', listFilesConfig: { delimiter: 'foo', prefix: 'bar' } },
      expectedResponse: { Bucket: 'b', Delimiter: 'foo', Prefix: 'bar' }
    }
  ])('$description', async ({ actionConfiguration, expectedResponse }) => {
    const actualResponse = buildListObjectsV2Command(actionConfiguration);
    expect(expectedResponse).toEqual(actualResponse);
  });
});

describe('validateS3Action', () => {
  const allActionsTestCases = Object.values(S3ActionType).map((action) => ({
    description: `valid action: ${action}`,
    action,
    shouldError: false
  }));

  it.each([
    ...allActionsTestCases,
    {
      description: 'invalid action',
      action: 'foo',
      shouldError: true
    }
  ])('$description', ({ action, shouldError }) => {
    if (shouldError) {
      expect(() => validateS3Action(action)).toThrow(`Invalid S3 action type: ${action}`);
    } else {
      expect(() => validateS3Action(action)).not.toThrow();
    }
  });
});
