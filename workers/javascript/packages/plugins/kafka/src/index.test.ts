import { Value } from '@bufbuild/protobuf';
import { expect, it } from '@jest/globals';
import { ErrorCode } from '@superblocks/shared';
import { KafkaV1, KafkaV1 as Plugin } from '@superblocksteam/types/src/plugins';
import { CompressionTypes, EachMessagePayload, Kafka, Partitioners, logLevel } from 'kafkajs';
import { client, fromKafkaJS, producerConfig, sasl, toKafkaJS, transformAcks, transformCompression, validateKafkaOperation } from './index';

jest.mock('kafkajs');
const KafkaMock = Kafka as unknown as jest.Mock<Kafka>;
const PLUGIN_NAME = 'Kafka';

describe('sasl', () => {
  it.each([
    [undefined, undefined],
    [{}, undefined]
  ])('returns undefined for falsy config or empty object', (config, expected) => {
    expect(sasl(PLUGIN_NAME, config as KafkaV1.SASL)).toEqual(expected);
  });

  it.each([
    [
      {
        mechanism: Plugin.SASL_Mechanism.PLAIN,
        username: 'user',
        password: 'pass'
      },
      {
        mechanism: 'plain',
        username: 'user',
        password: 'pass'
      }
    ],
    [
      {
        mechanism: Plugin.SASL_Mechanism.SCRAM_SHA256,
        username: 'user',
        password: 'pass'
      },
      {
        mechanism: 'scram-sha-256',
        username: 'user',
        password: 'pass'
      }
    ],
    [
      {
        mechanism: Plugin.SASL_Mechanism.SCRAM_SHA512,
        username: 'user',
        password: 'pass'
      },
      {
        mechanism: 'scram-sha-512',
        username: 'user',
        password: 'pass'
      }
    ],
    [
      {
        mechanism: Plugin.SASL_Mechanism.AWS,
        authorizationIdentity: 'user',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'token'
      },
      {
        mechanism: 'aws',
        authorizationIdentity: 'user',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'token'
      }
    ]
  ])('returns correct SASLOptions for given config', (config, expected) => {
    expect(sasl(PLUGIN_NAME, config as KafkaV1.SASL)).toEqual(expected);
  });

  it.each([
    [
      {
        mechanism: -1
      },
      'Unsupported SASL mechanism: -1'
    ]
  ])('throws error for unknown mechanism', (config, errorMessage) => {
    try {
      sasl(PLUGIN_NAME, config as KafkaV1.SASL);
      expect('fail').toBe(false);
    } catch (err) {
      expect(err.message).toMatch(errorMessage);
      expect(err.code).toBe(ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
  });

  it.each([
    [
      {
        mechanism: Plugin.SASL_Mechanism.PLAIN,
        username: 'user',
        password: 'pass',
        authorizationIdentity: 'user',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'token'
      },
      {
        mechanism: 'plain',
        username: 'user',
        password: 'pass'
      }
    ],
    [
      {
        mechanism: Plugin.SASL_Mechanism.SCRAM_SHA256,
        username: 'user',
        password: 'pass',
        authorizationIdentity: 'user',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'token'
      },
      {
        mechanism: 'scram-sha-256',
        username: 'user',
        password: 'pass'
      }
    ],
    [
      {
        mechanism: Plugin.SASL_Mechanism.SCRAM_SHA512,
        username: 'user',
        password: 'pass',
        authorizationIdentity: 'user',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        sessionToken: 'token'
      },
      {
        mechanism: 'scram-sha-512',
        username: 'user',
        password: 'pass'
      }
    ]
  ])('ignores AWS options for non-AWS mechanisms and returns correct SASLOptions', (config, expected) => {
    expect(sasl(PLUGIN_NAME, config as KafkaV1.SASL)).toEqual(expected);
  });
});

describe('toKafkaJS', () => {
  it.each([['[foo]'], ['{}'], ['{"messages": []']])('should throw an IntegrationError when the messages array is malformed: %s', (raw) => {
    try {
      toKafkaJS(PLUGIN_NAME, raw);
      expect('this').toBe('not reached');
    } catch (err) {
      expect(err.message).toMatch('Unable to parse messages, the messages array is malformed.');
      expect(err.code).toBe(ErrorCode.INTEGRATION_SYNTAX);
    }
  });
  it.each([
    [undefined, undefined],
    [
      JSON.stringify([
        new Plugin.Message({
          topic: 'test-topic-1',
          partition: 0,
          timestamp: '1633022462000',
          key: Value.fromJsonString('"key1"'),
          value: Value.fromJsonString('"value1"')
        }),
        new Plugin.Message({
          topic: 'test-topic-1',
          partition: 1,
          timestamp: '1633022462001',
          key: Value.fromJsonString('"key2"'),
          value: Value.fromJsonString('"value2"')
        }),
        new Plugin.Message({
          topic: 'test-topic-2',
          partition: 0,
          timestamp: '1633022462002',
          key: Value.fromJsonString('"key3"'),
          value: Value.fromJsonString('"value3"')
        })
      ]),
      [
        {
          topic: 'test-topic-1',
          messages: [
            {
              key: '"key1"',
              value: '"value1"',
              partition: 0,
              timestamp: '1633022462000'
            },
            {
              key: '"key2"',
              value: '"value2"',
              partition: 1,
              timestamp: '1633022462001'
            }
          ]
        },
        {
          topic: 'test-topic-2',
          messages: [
            {
              key: '"key3"',
              value: '"value3"',
              partition: 0,
              timestamp: '1633022462002'
            }
          ]
        }
      ]
    ],
    ['', undefined], // 1. Empty input string
    [
      JSON.stringify([
        new Plugin.Message({
          topic: 'test-topic-single',
          partition: 0,
          timestamp: '1633022462000',
          key: Value.fromJsonString('"key-single"'),
          value: Value.fromJsonString('"value-single"')
        })
      ]),
      [
        {
          topic: 'test-topic-single',
          messages: [
            {
              key: '"key-single"',
              value: '"value-single"',
              partition: 0,
              timestamp: '1633022462000'
            }
          ]
        }
      ]
    ], // 2. Single message
    [
      JSON.stringify([
        new Plugin.Message({
          topic: 'test-topic-same-partition',
          partition: 0,
          timestamp: '1633022462000',
          key: Value.fromJsonString('"key1"'),
          value: Value.fromJsonString('"value1"')
        }),
        new Plugin.Message({
          topic: 'test-topic-same-partition',
          partition: 0,
          timestamp: '1633022462001',
          key: Value.fromJsonString('"key2"'),
          value: Value.fromJsonString('"value2"')
        })
      ]),
      [
        {
          topic: 'test-topic-same-partition',
          messages: [
            {
              key: '"key1"',
              value: '"value1"',
              partition: 0,
              timestamp: '1633022462000'
            },
            {
              key: '"key2"',
              value: '"value2"',
              partition: 0,
              timestamp: '1633022462001'
            }
          ]
        }
      ]
    ], // 3. Messages with the same topic and partition
    [
      JSON.stringify([
        new Plugin.Message({
          topic: 'test-topic-headers',
          partition: 0,
          timestamp: '1633022462000',
          key: Value.fromJsonString('"key1"'),
          value: Value.fromJsonString('"value1"'),
          headers: { header1: 'value1', header2: 'value2' }
        })
      ]),
      [
        {
          topic: 'test-topic-headers',
          messages: [
            {
              key: '"key1"',
              value: '"value1"',
              partition: 0,
              timestamp: '1633022462000',
              headers: { header1: 'value1', header2: 'value2' }
            }
          ]
        }
      ]
    ] // 4. Messages containing headers
  ])('converts input messages into TopicMessages[] or undefined', (input, expected) => {
    expect(toKafkaJS(PLUGIN_NAME, input)).toEqual(expected);
  });
});

describe('fromKafkaJS', () => {
  it.each([
    [
      {
        topic: 'test-topic',
        partition: 0,
        message: {
          key: 'key1',
          value: 'value1',
          offset: '0',
          size: 10,
          attributes: 0,
          timestamp: '1633022462000',
          headers: {
            'header-key-1': Buffer.from('header-value-1'),
            'header-key-2': Buffer.from('header-value-2')
          }
        }
      },
      new Plugin.Message({
        topic: 'test-topic',
        partition: 0,
        offset: 0,
        key: Value.fromJsonString('"key1"'),
        value: Value.fromJsonString('"value1"'),
        length: 10,
        attributes: 0,
        timestamp: '1633022462000',
        headers: {
          'header-key-1': 'header-value-1',
          'header-key-2': 'header-value-2'
        }
      })
    ],
    [
      {
        topic: 'test-topic-2',
        partition: 1,
        message: {
          key: null,
          value: '{"field1":"test","field2":{"nestedField":"nestedValue"},"field3":[4,5,6]}',
          offset: '1',
          size: 20,
          attributes: 0,
          headers: {}
        }
      },
      new Plugin.Message({
        topic: 'test-topic-2',
        partition: 1,
        offset: 1,
        key: undefined,
        value: Value.fromJson({ field1: 'test', field2: { nestedField: 'nestedValue' }, field3: [4, 5, 6] }),
        length: 20,
        attributes: 0,
        headers: undefined
      })
    ]
  ])('converts EachMessagePayload to Plugin.Message', (input, expected) => {
    expect(fromKafkaJS(input as unknown as EachMessagePayload)).toEqual(expected);
  });
});

describe('transformCompression', () => {
  it.each([
    [Plugin.Compression.GZIP, CompressionTypes.GZIP],
    [Plugin.Compression.LZ4, CompressionTypes.LZ4],
    [Plugin.Compression.SNAPPY, CompressionTypes.Snappy],
    [Plugin.Compression.ZSTD, CompressionTypes.ZSTD],
    [undefined, undefined]
  ])('transforms Plugin.Compression to CompressionTypes', (input, expected) => {
    expect(transformCompression(input)).toEqual(expected);
  });
});

describe('client', () => {
  beforeEach(() => {
    KafkaMock.mockClear();
  });

  it.each([
    [undefined, 'Cluster information must be provided.'],
    [null, 'Cluster information must be provided.']
  ])('should throw an error when cluster is %p', async (cluster, expectedError) => {
    await client(PLUGIN_NAME, 'client-id', cluster as Plugin.Cluster | undefined)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch(expectedError);
        expect(err.code).toBe(ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
      });
  });

  it.each([
    [
      {
        brokers: 'broker1:9092, broker2:9092',
        sasl: {
          mechanism: Plugin.SASL_Mechanism.PLAIN,
          username: 'username',
          password: 'password'
        },
        ssl: true
      },
      {
        clientId: 'client-id',
        brokers: ['broker1:9092', 'broker2:9092'],
        sasl: {
          mechanism: 'plain',
          username: 'username',
          password: 'password'
        },
        retry: {
          retries: 5
        },
        ssl: true,
        logLevel: logLevel.WARN
      }
    ]
    // Add more scenarios here as needed
  ])('should create a Kafka client with correct configuration for %p', async (cluster, expectedConfig) => {
    await client(PLUGIN_NAME, 'client-id', cluster as Plugin.Cluster);

    expect(KafkaMock).toHaveBeenCalledTimes(1);
    expect(KafkaMock).toHaveBeenCalledWith(expectedConfig);
  });
});

describe('producerConfig', () => {
  it.each([
    [
      {
        idempotent: true,
        transaction: false
      },
      {
        idempotent: true,
        allowAutoTopicCreation: undefined,
        createPartitioner: Partitioners.DefaultPartitioner
      }
    ],
    [
      {
        idempotent: false,
        transaction: true,
        transactionId: 'my-transaction-id'
      },
      {
        idempotent: true,
        allowAutoTopicCreation: undefined,
        createPartitioner: Partitioners.DefaultPartitioner,
        transactionalId: 'my-transaction-id',
        maxInFlightRequests: 1
      }
    ],
    [
      {
        idempotent: false,
        transaction: true
      },
      {
        idempotent: true,
        allowAutoTopicCreation: undefined,
        createPartitioner: Partitioners.DefaultPartitioner,
        transactionalId: undefined,
        maxInFlightRequests: 1
      }
    ]
  ])('produces correct config for input %p', (input, expected) => {
    expect(producerConfig(input)).toEqual(expected);
  });
});

describe('transformAcks', () => {
  it.each([
    [Plugin.Acks.ALL, -1],
    [Plugin.Acks.LEADER, 1],
    [Plugin.Acks.NONE, 0],
    ['unexpected-value', undefined]
  ])('should return correct value for input %s', (input, expected) => {
    const result = transformAcks(input as Plugin.Acks);
    expect(result).toBe(expected);
  });
});

describe('validateKafkaOperation', () => {
  it.each([[Plugin.Operation.UNSPECIFIED], [Plugin.Operation.PRODUCE], [Plugin.Operation.CONSUME]])(
    'should throw an IntegrationError when operation is UNSPECIFIED: %s',
    (operation) => {
      if (operation === Plugin.Operation.UNSPECIFIED) {
        try {
          validateKafkaOperation(PLUGIN_NAME, operation);
          expect('this').toBe('not reached');
        } catch (err) {
          expect(err.message).toMatch('Action must be specified.');
          expect(err.code).toBe(ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
        }
      } else {
        expect(() => validateKafkaOperation(PLUGIN_NAME, operation)).not.toThrow();
      }
    }
  );
});
