import { Readable } from 'stream';
import { Storage } from '@google-cloud/storage';
import {
  ActionResponseType,
  BasePlugin,
  DatasourceMetadataDto,
  DEFAULT_GCS_PRESIGNED_URL_EXPIRATION_SECONDS,
  ErrorCode,
  ExecutionOutput,
  extractResponseData,
  GCS_ACTION_DISPLAY_NAMES,
  GCSActionConfiguration,
  GCSActionType,
  GCSDatasourceConfiguration,
  getFileStream,
  IntegrationError,
  isReadableFile,
  isReadableFileConstructor,
  PluginExecutionProps,
  RawRequest,
  RequestFile
} from '@superblocks/shared';

type GetSignedUrlConfigAction = 'read' | 'write' | 'delete' | 'resumable';

type UploadRequest = {
  resource: string;
  path: string;
  content: Content;
  contentType?: string;
};

type Content = string | Buffer | Readable;

// This is used for plugin.test, which we call bucket list with following random string, so we get empty list back
const DUMMY_PREFIX = 'kve3gna*gux!wda2RBZ';

export default class GCSPlugin extends BasePlugin {
  pluginName = 'Google Cloud Storage';

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    files
  }: PluginExecutionProps<GCSDatasourceConfiguration, GCSActionConfiguration>): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    const action = actionConfiguration.action;
    const resource = actionConfiguration.resource;
    const path = actionConfiguration.path;

    try {
      const client = await this.createClient(datasourceConfiguration);

      switch (action) {
        case GCSActionType.LIST_OBJECTS: {
          if (!resource) {
            throw new IntegrationError(`Resource required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          const [data] = await client.bucket(resource).getFiles({ prefix: actionConfiguration.prefix });
          ret.output = data;
          break;
        }
        case GCSActionType.LIST_BUCKETS: {
          const [data] = await client.getBuckets({ prefix: actionConfiguration.prefix });
          ret.output = data;
          break;
        }
        case GCSActionType.GET_OBJECT: {
          if (!resource) {
            throw new IntegrationError(`Resource required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (!path) {
            throw new IntegrationError(`Path required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          const [data] = await client.bucket(resource).file(path).download();
          // determine type of the object by metadata.contentType
          const [metadata] = await client.bucket(resource).file(path).getMetadata();

          ret.output = extractResponseData(data, metadata.contentType, actionConfiguration.responseType || ActionResponseType.AUTO);
          break;
        }
        case GCSActionType.DELETE_OBJECT: {
          if (!resource) {
            throw new IntegrationError(`Resource required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (!path) {
            throw new IntegrationError(`Path required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          try {
            await client.bucket(resource).file(path).delete();
          } catch (deleteFileError) {
            throw new IntegrationError(
              `Delete file failed, ${resource}/${path}, error: ${deleteFileError.message}`,
              ErrorCode.INTEGRATION_LOGIC,
              { pluginName: this.pluginName }
            );
          }
          break;
        }
        case GCSActionType.UPLOAD_OBJECT: {
          if (!resource) {
            throw new IntegrationError(`Resource required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (!path) {
            throw new IntegrationError(`Path required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (actionConfiguration.body === undefined) {
            throw new IntegrationError(`Body required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }

          try {
            await client.bucket(resource).file(path).save(actionConfiguration.body);
          } catch (saveFileError) {
            throw new IntegrationError(
              `Save file failed, ${resource}/${path}, error: ${saveFileError.message}`,
              ErrorCode.INTEGRATION_LOGIC,
              { pluginName: this.pluginName }
            );
          }

          ret.output = {
            presignedURL: await this.generateSignedUrl(client, resource, path)
          };
          break;
        }
        case GCSActionType.GENERATE_PRESIGNED_URL: {
          if (!resource) {
            throw new IntegrationError(`Resource required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (!path) {
            throw new IntegrationError(`Path required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }

          // test file exists
          try {
            await client.bucket(resource).file(path).getMetadata();
          } catch (e) {
            throw new IntegrationError(`File existence check failed: ${e.message}`, ErrorCode.INTEGRATION_LOGIC, {
              pluginName: this.pluginName
            });
          }

          ret.output = {
            presignedURL: await this.generateSignedUrl(
              client,
              resource,
              path,
              // UI has a valid default, but this will fail if user pass an invalid number
              Number(actionConfiguration.custom?.presignedExpiration?.value)
            )
          };
          break;
        }
        case GCSActionType.UPLOAD_MULTIPLE_OBJECTS: {
          if (!resource) {
            throw new IntegrationError(`Resource required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (!actionConfiguration.fileObjects) {
            throw new IntegrationError(`FileObjects required for action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }

          let filesWithContents = actionConfiguration.fileObjects;
          if (actionConfiguration.fileObjects && typeof actionConfiguration.fileObjects === 'string') {
            try {
              filesWithContents = JSON.parse(actionConfiguration.fileObjects);
            } catch (e) {
              throw new IntegrationError(
                `Can't parse the file objects. They must be an array of JSON objects.`,
                ErrorCode.INTEGRATION_SYNTAX,
                { pluginName: this.pluginName }
              );
            }
          }
          if (!Array.isArray(filesWithContents)) {
            throw new IntegrationError('File objects must be an array of JSON objects.', ErrorCode.INTEGRATION_SYNTAX, {
              pluginName: this.pluginName
            });
          }

          const contents = await Promise.all(
            filesWithContents.map(async (file: unknown) => {
              if (!isReadableFile(file)) {
                if (isReadableFileConstructor(file)) {
                  return file.contents;
                }

                throw new IntegrationError(
                  `Cannot read files. Files can either be Superblocks files or { name: string; contents: string }.`,
                  ErrorCode.INTEGRATION_SYNTAX,
                  { pluginName: this.pluginName }
                );
              }

              const match = (files as Array<RequestFile>).find((f) => f.originalname.startsWith(`${file.$superblocksId}`));
              if (!match) {
                throw new IntegrationError(`Could not locate file ${file.name}`, ErrorCode.INTEGRATION_SYNTAX, {
                  pluginName: this.pluginName
                });
              }

              try {
                return await getFileStream(context, match.path);
              } catch (err) {
                if (err && err?.response?.status === 404) {
                  throw new IntegrationError(
                    `Could not retrieve file ${file.name} from controller: ${err.message}`,
                    ErrorCode.INTEGRATION_LOGIC,
                    { pluginName: this.pluginName }
                  );
                }
                throw new IntegrationError(
                  `Could not retrieve file ${file.name} from controller: ${err.message}`,
                  ErrorCode.INTEGRATION_NETWORK,
                  { pluginName: this.pluginName }
                );
              }
            })
          );

          await this.uploadMultiple(
            client,
            filesWithContents.map((file, i) => ({
              resource: resource ?? '',
              path: file.name as string,
              content: contents[i] as Content,
              contentType: file.type
            }))
          );

          ret.output = await Promise.all(
            filesWithContents.map(async (file, i) => ({
              presignedURL: await this.generateSignedUrl(client, resource, file.name as string)
            }))
          );
          break;
        }
        default:
          throw new IntegrationError(`Unknown action ${action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
      }
      return ret;
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(`Execute failed: ${err}`, ErrorCode.INTEGRATION_NETWORK, { pluginName: this.pluginName });
    }
  }

  getRequest(actionConfiguration: GCSActionConfiguration): RawRequest {
    const configuration = actionConfiguration;
    const s3Action = configuration.action;
    let gcsReqString = `Action: ${GCS_ACTION_DISPLAY_NAMES[s3Action ?? '']}`;
    if (s3Action === GCSActionType.LIST_BUCKETS) {
      gcsReqString += `\nBucket Name Prefix: ${configuration.prefix}`;
    } else if (s3Action === GCSActionType.LIST_OBJECTS) {
      gcsReqString += `\nBucket: ${configuration.resource}\nFile Prefix: ${configuration.prefix}`;
    } else if (s3Action === GCSActionType.GET_OBJECT) {
      gcsReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)}`;
    } else if (s3Action === GCSActionType.DELETE_OBJECT) {
      gcsReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)}`;
    } else if (s3Action === GCSActionType.UPLOAD_OBJECT) {
      gcsReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)}`;
    } else if (s3Action === GCSActionType.UPLOAD_MULTIPLE_OBJECTS) {
      let files = configuration.fileObjects;
      if (configuration.fileObjects && typeof configuration.fileObjects === 'string') {
        try {
          files = JSON.parse(configuration.fileObjects);
        } catch (e) {
          throw new IntegrationError(`Can't parse the file objects. They must be an array of JSON objects.`, ErrorCode.INTEGRATION_SYNTAX, {
            pluginName: this.pluginName
          });
        }
      }
      if (!Array.isArray(files)) {
        throw new IntegrationError('File objects must be an array of JSON objects.', ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }
      const names = files.map((file) => file.name);
      gcsReqString += `\nBucket: ${configuration.resource}\nFile Objects: ${JSON.stringify(names)}`;
    } else if (s3Action === GCSActionType.GENERATE_PRESIGNED_URL) {
      gcsReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)})}\nExpiration: ${
        configuration.custom?.presignedExpiration?.value
      }`;
    }
    return gcsReqString;
  }

  dynamicProperties(): string[] {
    return ['action', 'resource', 'prefix', 'path', 'body', 'fileObjects'];
  }

  private async uploadMultiple(client: Storage, requests: UploadRequest[]) {
    for (const r of requests) {
      const tasks: Promise<void>[] = [];
      if (r.content instanceof Readable) {
        const fromStream = r.content as Readable;
        const targetFile = client.bucket(r.resource).file(r.path);
        const targetStream = targetFile.createWriteStream();
        fromStream.pipe(targetStream);

        tasks.push(
          new Promise((resolve, reject) => {
            targetStream.on('finish', resolve);
            fromStream.on('error', reject);
          })
        );
      } else {
        tasks.push(client.bucket(r.resource).file(r.path).save(r.content));
      }
      await Promise.all(tasks);
    }
  }

  // generate URL with temporary read access to the file
  private async generateSignedUrl(client: Storage, bucketName: string, fileName: string, expirationInSecs?: number): Promise<string> {
    // by default this will be a v2 signed URL for the file
    const options = {
      action: 'read' as GetSignedUrlConfigAction,
      // api takes millis
      expires: Date.now() + (expirationInSecs ?? DEFAULT_GCS_PRESIGNED_URL_EXPIRATION_SECONDS) * 1000
    };

    const [url] = await client.bucket(bucketName).file(fileName).getSignedUrl(options);
    return url;
  }

  private async createClient(datasourceConfiguration: GCSDatasourceConfiguration): Promise<Storage> {
    const googleServiceAccount = JSON.parse(datasourceConfiguration.authentication?.custom?.googleServiceAccount?.value ?? '');

    return new Storage({
      credentials: googleServiceAccount
    });
  }

  async metadata(datasourceConfiguration: GCSDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    try {
      const client = await this.createClient(datasourceConfiguration);
      const [data] = await client.getBuckets();

      return {
        buckets: data.map((bucket) => ({
          name: bucket.name
        }))
      };
    } catch (e) {
      this.logger.debug(`Failed to fetch buckets: ${e}`);
      return {};
    }
  }

  async test(datasourceConfiguration: GCSDatasourceConfiguration): Promise<void> {
    try {
      const client = await this.createClient(datasourceConfiguration);
      // above client creation won't throw when credentials are incorrect, so we need to make a call to test
      await client.getBuckets({ prefix: DUMMY_PREFIX });
    } catch (err) {
      // chances are that this isn't a network issue, but rather an auth issue
      throw new IntegrationError(`Test failed. ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName: this.pluginName });
    }
  }
}
