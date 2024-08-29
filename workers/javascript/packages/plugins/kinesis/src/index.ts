import { KinesisClient, ListStreamsCommand, PutRecordsCommand, GetShardIteratorCommand, GetRecordsCommand } from '@aws-sdk/client-kinesis';

import {
  BasePlugin,
  PluginExecutionProps,
  StreamOptions,
  DatasourceMetadataDto,
  KinesisActionConfiguration,
  KinesisDatasourceConfiguration,
  ExecutionOutput,
  IntegrationError
} from '@superblocks/shared';
import { KinesisPluginV1 as Plugin } from '@superblocksteam/types';

import {
  actionConfigurationToRecords,
  acGetToGetShardIteratorCommand,
  getKinesisClientConfigFromDatasourceConfig,
  getStreamIdentifierConfig
} from './utils';

export default class KinesisPlugin extends BasePlugin {
  pluginName = 'Kinesis';

  protected getClient(datasourceConfig: KinesisDatasourceConfiguration): KinesisClient {
    return new KinesisClient(getKinesisClientConfigFromDatasourceConfig(datasourceConfig));
  }

  public async metadata(config: KinesisDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const client = this.getClient(config);
    const { StreamSummaries } = await client.send(new ListStreamsCommand());
    const streams = StreamSummaries.map((stream) => stream.StreamName);
    return { kinesis: new Plugin.Metadata({ streams }) };
  }

  public dynamicProperties(): Array<string> {
    return []; // ignore this for now as we now resolve in the orchestrator.
  }

  public async stream(
    props: PluginExecutionProps<KinesisDatasourceConfiguration, KinesisActionConfiguration>,
    send: (_message: unknown) => Promise<void>,
    options?: StreamOptions
  ): Promise<void> {
    if (props.actionConfiguration.operation.case != 'get') {
      throw new IntegrationError('expected get');
    }
    if (!options || !options.until) {
      this.logger?.error('The KinesisPlugin.stream method requires options.until to be set.');
      throw new IntegrationError(`options.until not set.`);
    }

    const get = props.actionConfiguration.operation.value as Plugin.Plugin_Get;

    if (!get.pollingCooldownMs || get.pollingCooldownMs <= 0) {
      throw new IntegrationError('pollingCooldownMs must be present and greater than 0');
    }

    const client = this.getClient(props.datasourceConfiguration);
    const getInitialShardIteratorResponse = await client.send(new GetShardIteratorCommand(acGetToGetShardIteratorCommand(get)));

    let shardIterator = getInitialShardIteratorResponse.ShardIterator;
    if (!shardIterator) {
      throw new IntegrationError('could not get initial shard iterator');
    }
    // https://docs.aws.amazon.com/streams/latest/dev/developing-consumers-with-sdk.html
    // NOTE: (joey) limit given by user will be reset every time. we should specify this will be the limit for each iteration of the loop

    let stop = false;

    async function preempter() {
      if (!options.until) return;

      try {
        await options.until();
      } catch (err) {
        this.logger.info('stopping due to request by options.until', err);
      } finally {
        stop = true;
      }
    }

    void preempter();

    while (shardIterator && !stop) {
      const getRecordsCommand = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: get.limit
      });

      const getRecordsResponse = await client.send(getRecordsCommand);
      const records = getRecordsResponse.Records;
      this.logger.debug(`got ${records.length} records`);

      for (const record of records ?? []) {
        const data = Buffer.from(record.Data).toString('utf-8');
        await send(data);
      }

      shardIterator = getRecordsResponse.NextShardIterator;
      this.logger.debug(`shard iterator set to ${shardIterator}`);

      await new Promise((resolve) => setTimeout(resolve, get.pollingCooldownMs));
    }
  }

  // reminder: https://github.com/superblocksteam/orchestrator/blob/d64ce22fc2e2345a1f38623714118bfbd2bd804b/workers/javascript/packages/shared/src/plugins/base/BasePlugin.ts#L177
  public async execute({
    datasourceConfiguration,
    actionConfiguration
  }: PluginExecutionProps<KinesisDatasourceConfiguration>): Promise<ExecutionOutput> {
    // initial check that this is a produce
    if ((actionConfiguration as KinesisActionConfiguration).operation.case != 'put') {
      throw new IntegrationError(
        'The consume action is not supported outside of a Stream block trigger. Please add a Stream block and place this block in the Trigger section'
      );
    }
    const put = (actionConfiguration as KinesisActionConfiguration).operation.value as Plugin.Plugin_Put;

    const output: ExecutionOutput = new ExecutionOutput();
    {
      output.startTimeUtc = new Date();
    }
    // produce
    const client = this.getClient(datasourceConfiguration as KinesisDatasourceConfiguration);
    const records = actionConfigurationToRecords(actionConfiguration as KinesisActionConfiguration);
    const streamIdentifierConfig = getStreamIdentifierConfig(put.streamIdentifier);
    const command = new PutRecordsCommand({
      Records: records,
      ...streamIdentifierConfig
    });
    try {
      const response = await client.send(command);
      output.output = response;
    } catch (err) {
      throw new IntegrationError(`could not send messages: ${err}`);
    }

    return output;
  }

  public async test(config: KinesisDatasourceConfiguration): Promise<void> {
    const client = this.getClient(config);
    // NOTE: (joey) this seems to be the most lightweight way to test a connection
    const command = new ListStreamsCommand({});
    try {
      await client.send(command);
    } catch (err) {
      throw new IntegrationError(`could not connect: ${err}`);
    }
  }
}
