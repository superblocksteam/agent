import { Value } from '@bufbuild/protobuf';
import {
  BasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  KafkaActionConfiguration,
  KafkaDatasourceConfiguration,
  PluginExecutionProps,
  StreamOptions
} from '@superblocks/shared';
import { KafkaV1 as Plugin } from '@superblocksteam/types/src/plugins';
import {
  Admin,
  CompressionTypes,
  Consumer,
  ConsumerSubscribeTopics,
  EachMessagePayload,
  Kafka,
  KafkaConfig,
  Partitioners,
  Producer,
  ProducerConfig,
  RecordMetadata,
  SASLOptions,
  Sender,
  TopicMessages,
  logLevel
} from 'kafkajs';

export default class KafkaPlugin extends BasePlugin {
  pluginName = 'Kafka';

  public static readonly ACTION_CONSUME = 'consume';
  public static readonly ACTION_PRODUCE = 'produce';

  // This is a NON SECRET id that identifies Superblocks to Confluent for partnership purposes.
  // It is okay to send it for non-Confluent clients (if the customer doesn't override it in the action configuration).
  //
  // cwc|<partner_id>|<optional_customer_id>|<optional_context>
  private readonly CONFLUENT_PARTNER_CLIENT_ID = 'cwc|0014U00003DfEbLQAV|superblocks|plugin';

  public async metadata(config: KafkaDatasourceConfiguration, _?: KafkaActionConfiguration): Promise<DatasourceMetadataDto> {
    const admin: Admin = (await client(this.pluginName, this.CONFLUENT_PARTNER_CLIENT_ID, config?.cluster, 1)).admin();
    try {
      await admin.connect();

      const topics = await admin.listTopics();
      // const [topics, brokers] = await Promise.all([admin.listTopics(), admin.describeCluster()]);

      return {
        kafka: new Plugin.Metadata({
          topics: topics.map((name) => new Plugin.Topic({ name }))
          // TODO: Add this back in a way that it doesn't show in the UI b/c it's noisy
          // brokers: brokers.brokers.map(({ host, port, nodeId }) => new Plugin.Broker({ address: `${host}:${port}`, nodeId }))
        })
      };
    } finally {
      await admin.disconnect();
    }
  }

  public dynamicProperties(): Array<string> {
    return []; // ignore this for now as we now resolve in the orchestrator.
  }

  public async stream(
    props: PluginExecutionProps<KafkaDatasourceConfiguration>,
    send: (_message: unknown) => Promise<void>,
    options?: StreamOptions
  ): Promise<void> {
    const plugin: Plugin.Plugin = Plugin.Plugin.fromJsonString(
      JSON.stringify({ ...props.actionConfiguration, ...props.datasourceConfiguration }),
      { ignoreUnknownFields: true }
    );

    const { cluster, operation, consume } = plugin;

    validateKafkaOperation(this.pluginName, operation);

    if (!consume || operation !== Plugin.Operation.CONSUME) {
      const error = `The produce action is not a supported trigger for the Stream block. Please select a valid action.`;
      this.logger?.error(error);
      throw new IntegrationError(error, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    }

    if (!options || !options.until) {
      this.logger?.error('The KafkaPlugin.stream method requires options.until to be set.');
      throw new IntegrationError(`options.until not set.`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }

    const { topic, clientId, groupId, from, readUncommitted, seek } = consume as Plugin.Plugin_Consume;

    const id = generateID();
    const kafka: Kafka = await client(this.pluginName, clientId || this.CONFLUENT_PARTNER_CLIENT_ID, cluster as Plugin.Cluster);

    let consumer: Consumer;
    let topics: Array<string> = []; // This is just for logging field purposes.
    {
      consumer = kafka.consumer({
        groupId: groupId || id,
        readUncommitted
      });

      await consumer.connect();

      const config: ConsumerSubscribeTopics = {
        topics: [topic],
        fromBeginning: from === Plugin.Plugin_Consume_From.BEGINNING
      };
      topics = config.topics as Array<string>;

      await consumer.subscribe(config);
    }

    await consumer.run({
      autoCommit: true,
      eachMessage: async (msg) => await send(fromKafkaJS(msg))
    });

    if (from === Plugin.Plugin_Consume_From.SEEK && seek) {
      // NOTE(frank): We need to support multiple seeks in the future so just making it an array now.
      [{ topic: seek.topic, partition: seek.partition, offset: seek.offset }].forEach(({ topic, partition, offset }) => {
        void consumer.seek({ topic, partition, offset: offset.toString() });
      });
    }

    await options.until();
    this.logger?.info({ topics }, 'we have been told to stop consuming');

    await consumer.disconnect();
  }

  public async execute(props: PluginExecutionProps<KafkaDatasourceConfiguration, KafkaActionConfiguration>): Promise<ExecutionOutput> {
    // NOTE(frank): We need to change the constructor so that we take
    // in a Partial<ExecutionOutput>.
    const output: ExecutionOutput = new ExecutionOutput();
    {
      output.startTimeUtc = new Date();
    }

    const { cluster, operation, produce }: Plugin.Plugin = Plugin.Plugin.fromJsonString(
      JSON.stringify({ ...props.actionConfiguration, ...props.datasourceConfiguration }),
      { ignoreUnknownFields: true }
    );

    validateKafkaOperation(this.pluginName, operation);

    if (!produce || operation !== Plugin.Operation.PRODUCE) {
      const error = `The consume action is not supported outside of a Stream block trigger. Please add a Stream block and place this block in the Trigger section`;
      this.logger?.error(error);
      throw new IntegrationError(error, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    }

    const config = produce as Plugin.Plugin_Produce;
    const { acks, timeout, clientId, messages, compression, transaction, transactionId, idempotent } = config;
    const kafka: Kafka = await client(this.pluginName, clientId || this.CONFLUENT_PARTNER_CLIENT_ID, cluster as Plugin.Cluster);
    const producer: Producer = kafka.producer(
      producerConfig({
        ...config,
        ...{
          // We shouldn't pass undeterminitic values to unit testable functions.
          transactionId: transactionId || generateID()
        }
      })
    );

    await producer.connect();

    // NOTE(frank): I don't want a bunch of if transaction then/else/etc. so i'm
    // going to use a type that works for both cases.
    let sender: Sender & {
      commit(): Promise<void>;
      abort(): Promise<void>;
    };
    {
      if (transaction) {
        sender = await producer.transaction();
      } else {
        sender = {
          ...producer,
          ...{
            commit: async (): Promise<void> => {
              /* noop */
            },
            abort: async (): Promise<void> => {
              /* noop */
            }
          }
        };
      }
    }

    let metadata: RecordMetadata[];
    {
      try {
        metadata = await sender.sendBatch({
          acks: transaction || idempotent ? -1 : transformAcks(acks), // When using a transactions or the idempotent producer, acks MUST be -1 (all).
          timeout,
          compression: transformCompression(compression),
          topicMessages: toKafkaJS(this.pluginName, messages)
        });
        await sender.commit();
      } catch (err) {
        await sender.abort();
        throw err;
      } finally {
        // NOTE(frank): Even if we throw, we need to disconnect the producer.
        await producer.disconnect();
      }
    }

    output.output = metadata;
    return output;
  }

  public async test(config: KafkaDatasourceConfiguration): Promise<void> {
    const admin: Admin = (await client(this.pluginName, this.CONFLUENT_PARTNER_CLIENT_ID, config?.cluster, 1)).admin();
    try {
      await admin.connect();
    } finally {
      await admin.disconnect();
    }
  }
}

export function producerConfig({
  idempotent,
  transaction,
  transactionId,
  autoCreateTopic: allowAutoTopicCreation
}: Partial<Plugin.Plugin_Produce>): ProducerConfig {
  const base: ProducerConfig = {
    idempotent,
    allowAutoTopicCreation,
    createPartitioner: Partitioners.DefaultPartitioner
  };

  if (transaction) {
    return {
      ...base,
      ...{
        transactionalId: transactionId,
        maxInFlightRequests: 1,
        idempotent: true
      }
    };
  }

  return base;
}

/**
 * Creates a Kafka client.
 *
 * @param id
 * @param cluster
 * @param retries - The number of times to retry a request. 5 is the kafkajs default.
 * @returns
 */
export async function client(pluginName: string, id: string, cluster?: Plugin.Cluster, retries = 5): Promise<Kafka> {
  if (!cluster) {
    throw new IntegrationError(`Cluster information must be provided.`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName });
  }

  const config: KafkaConfig = {
    clientId: id,
    brokers: cluster.brokers.split(',').map((broker) => broker.trim()),
    sasl: sasl(pluginName, cluster?.sasl),
    ssl: cluster.ssl,
    retry: { retries },
    logLevel: logLevel.WARN
    // TODO(frank): logCreator
  };

  // NOTE(frank): This doesn't seem to ever throw.
  return new Kafka(config);
}

export function sasl(pluginName: string, config?: Plugin.SASL): SASLOptions | undefined {
  if (!config || !config.mechanism) {
    return undefined;
  }

  switch (config.mechanism) {
    case Plugin.SASL_Mechanism.PLAIN:
      return {
        mechanism: 'plain',
        username: config.username || '',
        password: config.password || ''
      };
    case Plugin.SASL_Mechanism.SCRAM_SHA256:
      return {
        mechanism: 'scram-sha-256',
        username: config.username || '',
        password: config.password || ''
      };
    case Plugin.SASL_Mechanism.SCRAM_SHA512:
      return {
        mechanism: 'scram-sha-512',
        username: config.username || '',
        password: config.password || ''
      };
    case Plugin.SASL_Mechanism.AWS:
      return {
        mechanism: 'aws',
        authorizationIdentity: config.authorizationIdentity || '',
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretKey || '',
        sessionToken: config.sessionToken
      };
    default:
      throw new IntegrationError(`Unsupported SASL mechanism: ${config.mechanism}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName
      });
  }
}

/**
 * Transforms the Superblocks representation of a Kafka message into the
 * representation that KafkaJS expects.
 *
 * @param messages
 * @returns
 */
export function toKafkaJS(pluginName: string, raw?: string): TopicMessages[] | undefined {
  if (!raw) {
    return undefined;
  }

  const groupByTopic = (messages: Plugin.Messages): Record<string, Array<Plugin.Message>> =>
    messages?.messages.reduce((acc, msg) => {
      (acc[msg.topic] = acc[msg.topic] || []).push(msg);
      return acc;
    }, {});

  let parsedMessages;
  try {
    parsedMessages = Plugin.Messages.fromJsonString(`{"messages": ${raw}}`);
  } catch (err) {
    throw new IntegrationError(
      `Unable to parse messages, the messages array is malformed. Be sure each message has a topic and value property.`,
      ErrorCode.INTEGRATION_SYNTAX,
      { pluginName }
    );
  }

  return Object.entries(groupByTopic(parsedMessages)).map(
    ([topic, messages]): TopicMessages => ({
      topic,
      messages: messages.map(({ partition, key, value, timestamp, headers }) => ({
        key: key?.toJsonString(),
        value: value?.toJsonString() || null,
        partition,
        timestamp,
        headers: Object.keys(headers).length === 0 ? undefined : headers
      }))
    })
  );
}

/**
 * Transforms the KafkaJS representation of a Kafka message into the
 * representation that Superblocks expects.
 *
 * NOTE(frank): We give performance preference to messages that are JSON encoded.
 *
 * @param param0
 * @returns The protobuf representation of our Kafka message.
 */
export function fromKafkaJS({ topic, partition, message }: EachMessagePayload): Plugin.Message {
  const { key, value, offset, size: length, attributes, timestamp } = message;

  const toValue = (data: Buffer | string | (string | Buffer)[] | null | undefined): Value | undefined => {
    if (!data) {
      return undefined;
    }

    try {
      return Value.fromJsonString(data.toString() || '');
    } catch (err) {
      return Value.fromJsonString(JSON.stringify(data.toString()));
    }
  };

  let headers: { [key: string]: string } | undefined;
  {
    Object.entries(message.headers || {}).map(([key, value]): void => {
      if (!headers) {
        headers = {};
      }

      try {
        headers[key] = value?.toString() || '';
      } catch (_) {
        // do nothing
      }
    });
  }

  return new Plugin.Message({
    topic,
    partition,
    offset: Number(offset),
    key: toValue(key),
    value: toValue(value),
    timestamp,
    length,
    attributes,
    headers
  });
}

/**
 * Generates a random ID that can be used as a client ID or group ID.
 *
 * @returns The ID.
 */
export function generateID(): string {
  return `superblocks-${Math.random() * (9999 - 1000) + 1000}`; // e.g. superblocks-1234;
}

/**
 * Transforms the Superblocks representation of a compression type into the
 * representation that KafkaJS expects.
 *
 * @param c
 * @returns
 */
export function transformCompression(c?: Plugin.Compression): CompressionTypes | undefined {
  switch (c) {
    case Plugin.Compression.GZIP:
      return CompressionTypes.GZIP;
    case Plugin.Compression.LZ4:
      return CompressionTypes.LZ4;
    case Plugin.Compression.SNAPPY:
      return CompressionTypes.Snappy;
    case Plugin.Compression.ZSTD:
      return CompressionTypes.ZSTD;
    default:
      return undefined;
  }
}

/**
 * Transforms the Superblocks representation of a message format into the
 * representation that KafkaJS expects.
 *
 * @param acks
 * @returns
 */
export function transformAcks(acks: Plugin.Acks): number | undefined {
  switch (acks) {
    case Plugin.Acks.ALL:
      return -1;
    case Plugin.Acks.LEADER:
      return 1;
    case Plugin.Acks.NONE:
      return 0;
    default:
      return undefined;
  }
}

/**
 * Ensures the Kafka operation is valid.
 *
 * @param pluginName
 * @param operation
 * @returns
 */
export function validateKafkaOperation(pluginName: string, operation: Plugin.Operation): void {
  if (operation === Plugin.Operation.UNSPECIFIED) {
    throw new IntegrationError(`Action must be specified.`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName });
  }
}
