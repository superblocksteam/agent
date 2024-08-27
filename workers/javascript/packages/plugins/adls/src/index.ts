import { ClientSecretCredential } from '@azure/identity';
import { DataLakeServiceClient } from '@azure/storage-file-datalake';
import {
  AdlsActionConfiguration,
  AdlsDatasourceConfiguration,
  BasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  RawRequest
} from '@superblocks/shared';
import { AdlsPluginV1 } from '@superblocksteam/types';

export default class AdlsPlugin extends BasePlugin {
  pluginName = 'Azure Data Lake Service';

  private async createConnection(datasourceConfiguration: AdlsDatasourceConfiguration): Promise<DataLakeServiceClient> {
    if (!datasourceConfiguration?.connection) {
      throw new IntegrationError(`No connection specified`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    if (datasourceConfiguration?.connection?.auth?.config.case !== 'clientCredentials') {
      throw new IntegrationError(`Unsupported auth type`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
    const dataLakeServiceClient = new DataLakeServiceClient(
      `https://${datasourceConfiguration.connection.accountName}.dfs.core.windows.net`,
      new ClientSecretCredential(
        datasourceConfiguration.connection.tenant,
        datasourceConfiguration.connection.auth.config.value.clientId,
        datasourceConfiguration.connection.auth.config.value.clientSecret
      )
    );

    return dataLakeServiceClient;
  }

  public async execute({
    datasourceConfiguration,
    actionConfiguration
  }: PluginExecutionProps<AdlsDatasourceConfiguration, AdlsActionConfiguration>): Promise<ExecutionOutput> {
    const conn = await this.createConnection(datasourceConfiguration);
    const ret = new ExecutionOutput();

    const action = actionConfiguration.adlsAction;
    if (action === undefined || action.value === undefined) {
      throw new IntegrationError(`No action selected`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }

    const fileSystemName = action.value.fileSystem;
    const fileSystemClient = conn.getFileSystemClient(fileSystemName);

    switch (actionConfiguration.adlsAction?.case) {
      case 'createDirectory': {
        const createDirectory = actionConfiguration.adlsAction?.value;
        if (!createDirectory.path) {
          throw new IntegrationError(`No path specified`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
        }
        const directoryClient = fileSystemClient.getDirectoryClient(createDirectory.path);
        const out = await directoryClient.create();
        ret.output = out;
        break;
      }
      case 'renameDirectory': {
        const renameDirectory = actionConfiguration.adlsAction?.value;
        const directoryClient = fileSystemClient.getDirectoryClient(renameDirectory.path);
        await directoryClient.move(renameDirectory.newPath);
        break;
      }
      case 'deleteDirectory': {
        const deleteDirectory = actionConfiguration.adlsAction?.value;
        const directoryClient = fileSystemClient.getDirectoryClient(deleteDirectory.path);
        await directoryClient.delete(true /* recursive */);
        break;
      }
      case 'listDirectoryContents': {
        const listDirectoryContents = actionConfiguration.adlsAction?.value;
        const iter = fileSystemClient.listPaths({ path: listDirectoryContents.path, recursive: true });
        const res: string[] = [];
        for await (const path of iter) {
          if (path.name) {
            res.push(path.name);
          }
        }
        ret.output = res;
        break;
      }
      case 'deleteFile': {
        const downloadFile = actionConfiguration.adlsAction?.value;
        const fileClient = fileSystemClient.getFileClient(downloadFile.path);

        const deleteResponse = await fileClient.delete();
        ret.output = deleteResponse;
        break;
      }
      case 'uploadFile': {
        const uploadFile = actionConfiguration.adlsAction?.value;
        const content = uploadFile.content;
        if (!content) {
          throw new IntegrationError(`No content to upload`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
        }
        const fileClient = fileSystemClient.getFileClient(uploadFile.path);
        await fileClient.create();
        await fileClient.append(content, 0, content.length);
        await fileClient.flush(content.length);

        break;
      }
      case 'downloadFile': {
        const downloadFile = actionConfiguration.adlsAction?.value;
        const fileClient = fileSystemClient.getFileClient(downloadFile.path);

        const downloadResponse = await fileClient.read();

        const streamToString = async (readableStream) => {
          return new Promise((resolve, reject) => {
            const chunks: string[] = [];
            readableStream.on('data', (data) => {
              chunks.push(data.toString());
            });
            readableStream.on('end', () => {
              resolve(chunks.join(''));
            });
            readableStream.on('error', reject);
          });
        };

        const downloaded = await streamToString(downloadResponse.readableStreamBody);
        ret.output = downloaded;
        break;
      }
      default: {
        const exhaustiveCheck: never = actionConfiguration.adlsAction as never;
        throw new IntegrationError(`Unknown action: ${JSON.stringify(exhaustiveCheck)}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
      }
    }

    return ret;
  }

  public getRequest(actionConfiguration: AdlsActionConfiguration): RawRequest {
    return JSON.stringify({ action: actionConfiguration.adlsAction?.case, ...actionConfiguration.adlsAction?.value }, null, 4);
  }

  public dynamicProperties(): string[] {
    return ['adlsAction.value.fileSystem', 'adlsAction.value.path', 'adlsAction.value.newPath', 'adlsAction.value.content'];
  }

  public async metadata(datasourceConfiguration: AdlsDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const dlClient = await this.createConnection(datasourceConfiguration);
    const iter = dlClient.listFileSystems();
    const fileSystems: string[] = [];
    for await (const fileSystem of iter) {
      fileSystems.push(fileSystem.name);
    }
    const adlsMetadata = AdlsPluginV1.Plugin_Metadata.fromJson({
      fileSystems: fileSystems
    });
    return {
      adls: adlsMetadata
    } as DatasourceMetadataDto;
  }

  public async test(datasourceConfiguration: AdlsDatasourceConfiguration): Promise<void> {
    try {
      const dlClient = await this.createConnection(datasourceConfiguration);
      for await (const fileSystem of dlClient.listFileSystems()) {
        this.logger.debug(`Successfully listed first file system. ${fileSystem.name}`);
        break;
      }
      return;
    } catch (error) {
      throw new IntegrationError(`Test connection failed, ${error}`, ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName: this.pluginName });
    }
  }
}
