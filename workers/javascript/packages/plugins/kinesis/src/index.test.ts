import { KinesisClient, ListStreamsCommand, PutRecordsCommand } from '@aws-sdk/client-kinesis';
// NOTE: (joey) we import like this so we can mock some stuff in the test that we otherwise couldn't
import * as awsClient from '@aws-sdk/client-kinesis';

import { KinesisPluginV1 as Plugin } from '@superblocksteam/types';
import {
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  KinesisDatasourceConfiguration,
  KinesisActionConfiguration
} from '@superblocks/shared';

import KinesisPlugin from '.';
const plugin: KinesisPlugin = new KinesisPlugin();
const datasourceConfiguration = {
  connection: {
    awsConfig: {
      auth: { accessKeyId: 'akid', secretKey: 'sk' },
      region: 'r'
    }
  }
} as KinesisDatasourceConfiguration;

function propsWithActionConfig(actionConfiguration: KinesisActionConfiguration): any {
  return {
    DUMMY_EXECUTION_CONTEXT,
    datasourceConfiguration,
    actionConfiguration,
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  };
}

jest.mock('@aws-sdk/client-kinesis');

afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('test connection', () => {
  test('success', async () => {
    const sendMock = jest.spyOn(KinesisClient.prototype, 'send');
    const listMock = jest.spyOn(awsClient, 'ListStreamsCommand');

    await plugin.test({
      connection: {
        awsConfig: {
          auth: { accessKeyId: 'akid', secretKey: 'sk' },
          region: 'r'
        }
      }
    } as KinesisDatasourceConfiguration);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(expect.any(ListStreamsCommand));
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({});
  });

  test('throws', async () => {
    const sendMock = jest.spyOn(KinesisClient.prototype, 'send').mockImplementation(() => {
      throw new Error('foo');
    });
    const listMock = jest.spyOn(awsClient, 'ListStreamsCommand');

    await expect(
      plugin.test({
        connection: {
          awsConfig: {
            auth: { accessKeyId: 'akid', secretKey: 'sk' },
            region: 'r'
          }
        }
      } as KinesisDatasourceConfiguration)
    ).rejects.toThrow('could not connect: Error: foo');

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(expect.any(ListStreamsCommand));
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({});
  });
});

describe('execute', () => {
  test('happy path', async () => {
    const sendMock = jest.spyOn(KinesisClient.prototype, 'send');
    const putMock = jest.spyOn(awsClient, 'PutRecordsCommand');

    await plugin.execute(
      propsWithActionConfig(
        new Plugin.Plugin({
          operation: {
            case: 'put',
            value: { partitionKey: 'pk', data: `[{"foo": "bar"}]`, streamIdentifier: { value: 'arn', case: 'streamArn' } }
          }
        })
      )
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(expect.any(PutRecordsCommand));
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock).toHaveBeenCalledWith({
      StreamARN: 'arn',
      Records: [
        {
          Data: new Uint8Array([123, 34, 102, 111, 111, 34, 58, 34, 98, 97, 114, 34, 125]),
          PartitionKey: 'pk'
        }
      ]
    });
  });

  test('stream arn and stream name not given', async () => {
    const sendMock = jest.spyOn(KinesisClient.prototype, 'send');

    await expect(
      plugin.execute(
        propsWithActionConfig(
          new Plugin.Plugin({
            operation: {
              case: 'put',
              value: { partitionKey: 'pk', data: `[{"foo": "bar"}]` }
            }
          })
        )
      )
    ).rejects.toThrow('stream identifier must be given');

    expect(sendMock).toHaveBeenCalledTimes(0);
  });

  test('send throws', async () => {
    const sendMock = jest.spyOn(KinesisClient.prototype, 'send').mockImplementation(() => {
      throw new Error('foo');
    });
    const putMock = jest.spyOn(awsClient, 'PutRecordsCommand');

    await expect(
      plugin.execute(
        propsWithActionConfig(
          new Plugin.Plugin({
            operation: {
              case: 'put',
              value: { partitionKey: 'pk', data: `[{"foo": "bar"}]`, streamIdentifier: { value: 'arn', case: 'streamArn' } }
            }
          })
        )
      )
    ).rejects.toThrow('could not send messages: Error: foo');

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(expect.any(PutRecordsCommand));
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock).toHaveBeenCalledWith({
      StreamARN: 'arn',
      Records: [
        {
          Data: new Uint8Array([123, 34, 102, 111, 111, 34, 58, 34, 98, 97, 114, 34, 125]),
          PartitionKey: 'pk'
        }
      ]
    });
  });

  test('non-put throws', async () => {
    const sendMock = jest.spyOn(KinesisClient.prototype, 'send');

    await expect(
      plugin.execute(
        propsWithActionConfig(
          new Plugin.Plugin({
            operation: {
              case: 'get',
              value: {}
            }
          })
        )
      )
    ).rejects.toThrow(
      'The consume action is not supported outside of a Stream block trigger. Please add a Stream block and place this block in the Trigger section'
    );

    expect(sendMock).toHaveBeenCalledTimes(0);
  });
});

describe('metadata', () => {
  test('success', async () => {
    const sendMock = jest.spyOn(KinesisClient.prototype, 'send').mockImplementationOnce(async () => {
      return {
        $metadata: {
          httpStatusCode: 200,
          requestId: 'rid1',
          extendedRequestId: 'erid1',
          attempts: 1,
          totalRetryDelay: 0
        },
        HasMoreStreams: false,
        StreamNames: ['sn1', 'sn2'],
        StreamSummaries: [
          {
            StreamARN: 'arn:aws:kinesis:us-west-2:12345:stream/sn1',
            StreamCreationTimestamp: '2024-08-26T18:48:27.000Z',
            StreamModeDetails: {
              StreamMode: 'ON_DEMAND'
            },
            StreamName: 'sn1',
            StreamStatus: 'ACTIVE'
          },
          {
            StreamARN: 'arn:aws:kinesis:us-west-2:67890:stream/sn2',
            StreamCreationTimestamp: '2024-08-13T13:46:38.000Z',
            StreamModeDetails: {
              StreamMode: 'ON_DEMAND'
            },
            StreamName: 'sn2',
            StreamStatus: 'ACTIVE'
          }
        ]
      };
    });
    const listStreamsMock = jest.spyOn(awsClient, 'ListStreamsCommand');

    const response = await plugin.metadata({
      connection: {
        awsConfig: {
          auth: { accessKeyId: 'akid', secretKey: 'sk' },
          region: 'r'
        }
      }
    } as KinesisDatasourceConfiguration);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(listStreamsMock).toHaveBeenCalledTimes(1);
    expect(listStreamsMock).toHaveBeenCalledWith();
    expect(response).toEqual({
      kinesis: {
        streams: ['sn1', 'sn2']
      }
    });
  });
});
