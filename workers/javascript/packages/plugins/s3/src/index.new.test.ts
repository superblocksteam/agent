import { S3Client } from '@aws-sdk/client-s3';
// NOTE: (joey) we import like this so we can mock some stuff in the test that we otherwise couldn't
import * as s3Client from '@aws-sdk/client-s3';

import {
  ExecutionOutput,
  S3ActionConfiguration,
  S3ActionType,
  S3DatasourceConfiguration,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  AWSAuthType
} from '@superblocks/shared';
import S3Plugin from '.';
import { delimiter } from 'path';

let plugin: S3Plugin;

jest.mock('@aws-sdk/client-s3');

beforeEach(() => {
  plugin = new S3Plugin();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

function propsFromConfigs({
  actionConfiguration,
  datasourceConfiguration
}: {
  actionConfiguration: S3ActionConfiguration;
  datasourceConfiguration: S3DatasourceConfiguration;
}): any {
  return {
    context: DUMMY_EXECUTION_CONTEXT,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput: new ExecutionOutput(),
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  };
}

describe('execute', () => {
  describe('list files', () => {
    it.each([
      {
        description: 'happy path no prefix or delimiter',
        datasourceConfiguration: { awsAuthType: AWSAuthType.ACCESS_KEY },
        actionConfiguration: { action: S3ActionType.LIST_OBJECTS, resource: 'foo' },
        mockSendResponse: { Contents: { foo: 'bar' } },
        expectedListRequest: { Bucket: 'foo' }
      },
      {
        description: 'happy path with prefix and no delimiter',
        datasourceConfiguration: { awsAuthType: AWSAuthType.ACCESS_KEY },
        actionConfiguration: { action: S3ActionType.LIST_OBJECTS, resource: 'foo', listFilesConfig: { delimiter: 'd' } },
        mockSendResponse: { Contents: { foo: 'bar' } },
        expectedListRequest: { Bucket: 'foo', Delimiter: 'd' }
      },
      {
        description: 'happy path with delimiter and no prefix',
        datasourceConfiguration: { awsAuthType: AWSAuthType.ACCESS_KEY },
        actionConfiguration: { action: S3ActionType.LIST_OBJECTS, resource: 'foo', listFilesConfig: { prefix: 'p' } },
        mockSendResponse: { Contents: { foo: 'bar' } },
        expectedListRequest: { Bucket: 'foo', Prefix: 'p' }
      }
    ])('$description', async ({ datasourceConfiguration, actionConfiguration, mockSendResponse, expectedListRequest }) => {
      const props = propsFromConfigs({
        datasourceConfiguration: datasourceConfiguration as S3DatasourceConfiguration,
        actionConfiguration: actionConfiguration as S3ActionConfiguration
      });

      const sendMock = jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => {
        return mockSendResponse;
      });
      const listMock = jest.spyOn(s3Client, 'ListObjectsV2Command');

      await plugin.execute(props);

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(expect.any(s3Client.ListObjectsV2Command));
      expect(listMock).toHaveBeenCalledTimes(1);
      expect(listMock).toHaveBeenCalledWith(expectedListRequest);
    });
  });
});
