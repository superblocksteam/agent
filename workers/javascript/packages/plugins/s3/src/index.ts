import { Readable } from 'stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  ActionResponseType,
  BasePlugin,
  DatasourceMetadataDto,
  DEFAULT_S3_PRESIGNED_URL_EXPIRATION_SECONDS,
  ErrorCode,
  ExecutionOutput,
  extractResponseData,
  getAwsClientConfig,
  getFileStream,
  IntegrationError,
  isReadableFile,
  isReadableFileConstructor,
  PluginExecutionProps,
  RawRequest,
  RequestFile,
  S3_ACTION_DISPLAY_NAMES,
  S3ActionConfiguration,
  S3ActionType,
  S3DatasourceConfiguration
} from '@superblocks/shared';

export default class S3Plugin extends BasePlugin {
  pluginName = 'S3';

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    files
  }: PluginExecutionProps<S3DatasourceConfiguration, S3ActionConfiguration>): Promise<ExecutionOutput> {
    try {
      const s3Client = await this.getS3Client(datasourceConfiguration);
      const s3Action = actionConfiguration.action;
      const configuration = actionConfiguration;
      const ret = new ExecutionOutput();
      // TODO: Clean this up with a switch statement.
      if (s3Action === S3ActionType.LIST_OBJECTS) {
        if (!configuration.resource) {
          throw new IntegrationError('Resource required for list objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        const data = await this.listObjects(s3Client, new ListObjectsV2Command({ Bucket: configuration.resource }));
        ret.output = data.Contents;
      } else if (s3Action === S3ActionType.LIST_BUCKETS) {
        const data = await this.listBuckets(s3Client);
        ret.output = data.Buckets;
      } else if (s3Action === S3ActionType.GET_OBJECT) {
        if (!configuration.resource) {
          throw new IntegrationError('Resource required for get objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!configuration.path) {
          throw new IntegrationError('Path required for get objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        const data = await this.getObject(
          s3Client,
          new GetObjectCommand({
            Bucket: configuration.resource,
            Key: configuration.path
          })
        );
        // determine type of the object by contentType
        const mimeTypeString = data.ContentType;

        const dataBuffer = await this.streamToBuffer(data.Body as Readable);
        ret.output = extractResponseData(dataBuffer, mimeTypeString, actionConfiguration.responseType ?? ActionResponseType.TEXT);
      } else if (s3Action === S3ActionType.DELETE_OBJECT) {
        if (!configuration.resource) {
          throw new IntegrationError('Resource required for delete objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!configuration.path) {
          throw new IntegrationError('Path required for delete objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        await this.deleteObject(
          s3Client,
          new DeleteObjectCommand({
            Bucket: configuration.resource,
            Key: configuration.path
          })
        );
      } else if (s3Action === S3ActionType.UPLOAD_OBJECT) {
        if (!configuration.resource) {
          throw new IntegrationError('Resource required for upload objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!configuration.path) {
          throw new IntegrationError('Path required for upload objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        const putObjectParams: PutObjectCommandInput = {
          Bucket: configuration.resource,
          Key: configuration.path,
          Body: configuration.body
        };
        if (files && files.length == 1) {
          putObjectParams.ContentType = files[0].mimetype;
        }
        const putObjectRequest = new PutObjectCommand(putObjectParams);
        const data = await this.upload(s3Client, putObjectRequest);
        data.presignedURL = await this.generateSignedURL(s3Client, configuration.resource, configuration.path);
        ret.output = data;
      } else if (s3Action === S3ActionType.UPLOAD_MULTIPLE_OBJECTS) {
        if (!configuration.resource) {
          throw new IntegrationError('Resource required for uploading multiple objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        if (!configuration.fileObjects) {
          throw new IntegrationError('File objects required for uploading multiple objects', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
        let filesWithContents = configuration.fileObjects;
        if (configuration.fileObjects && typeof configuration.fileObjects === 'string') {
          try {
            filesWithContents = JSON.parse(configuration.fileObjects);
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
                'Cannot read files. Files can either be Superblocks files or { name: string; contents: string }.',
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
              // S3 supports streams as input, this is preferred to reading into memory for large files
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

        const data = await this.uploadMultiple(
          s3Client,
          filesWithContents.map(
            (file, i) =>
              new PutObjectCommand({
                Bucket: configuration.resource ?? '',
                Key: file.name,
                Body: contents[i],
                ContentType: file.type
              })
          )
        );
        ret.output = await Promise.all(
          data.map(async (entry: { Key: string }) => ({
            ...entry,
            presignedURL: await this.generateSignedURL(s3Client, configuration.resource ?? '', entry.Key)
          }))
        );
      } else if (s3Action === S3ActionType.GENERATE_PRESIGNED_URL) {
        ret.output = await this.generateSignedURL(
          s3Client,
          configuration.resource ?? '',
          configuration.path ?? '',
          Number(configuration.custom?.presignedExpiration?.value)
        );
      }
      return ret;
    } catch (err) {
      throw this._handleError(err, 'execution failed');
    }
  }

  getRequest(actionConfiguration: S3ActionConfiguration): RawRequest {
    const configuration = actionConfiguration;
    const s3Action = configuration.action;
    let s3ReqString = `Action: ${S3_ACTION_DISPLAY_NAMES[s3Action ?? '']}`;
    if (s3Action === S3ActionType.LIST_OBJECTS) {
      s3ReqString += `\nBucket: ${configuration.resource}`;
    } else if (s3Action === S3ActionType.GET_OBJECT) {
      s3ReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)}`;
    } else if (s3Action === S3ActionType.DELETE_OBJECT) {
      s3ReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)}`;
    } else if (s3Action === S3ActionType.UPLOAD_OBJECT) {
      s3ReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)}\nBody: ${configuration.body}`;
    } else if (s3Action === S3ActionType.UPLOAD_MULTIPLE_OBJECTS) {
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
      s3ReqString += `\nBucket: ${configuration.resource}\nFile Objects: ${JSON.stringify(names)}`;
    } else if (s3Action === S3ActionType.GENERATE_PRESIGNED_URL) {
      s3ReqString += `\nBucket: ${configuration.resource}\nKey: ${JSON.stringify(configuration.path)})}\nExpiration: ${
        configuration.custom?.presignedExpiration?.value
      }`;
    }
    return s3ReqString;
  }

  dynamicProperties(): string[] {
    return ['action', 'resource', 'path', 'body', 'fileObjects'];
  }

  async metadata(datasourceConfiguration: S3DatasourceConfiguration): Promise<DatasourceMetadataDto> {
    try {
      const s3Client = await this.getS3Client(datasourceConfiguration);
      const data = await this.listBuckets(s3Client);
      return {
        buckets: data.Buckets.map((bucket) => ({
          name: bucket.Name
        }))
      };
    } catch (e) {
      this.logger.debug(`Failed to fetch buckets; expected that the credentials may be limited: ${e}`);
      return {};
    }
  }

  private async getS3Client(datasourceConfig: S3DatasourceConfiguration): Promise<S3Client> {
    return new S3Client(await getAwsClientConfig(datasourceConfig));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async listObjects(s3Client: S3Client, request: ListObjectsV2Command): Promise<any> {
    return s3Client.send(request);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async listBuckets(s3Client: S3Client): Promise<any> {
    return s3Client.send(new ListBucketsCommand({}));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getObject(s3Client: S3Client, request: GetObjectCommand): Promise<any> {
    return s3Client.send(request);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async deleteObject(s3Client: S3Client, request: DeleteObjectCommand): Promise<any> {
    return s3Client.send(request);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async upload(s3Client: S3Client, request: PutObjectCommand): Promise<any> {
    return s3Client.send(request);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async uploadMultiple(s3Client: S3Client, requests: PutObjectCommand[]): Promise<any> {
    return Promise.all(
      requests.map((r) => {
        const parallelUploads3 = new Upload({
          client: s3Client,
          params: {
            Bucket: r.input.Bucket,
            Key: r.input.Key,
            Body: r.input.Body
          }
        });
        parallelUploads3.on('httpUploadProgress', (progress) => {
          this.logger.debug(`Upload progress for key '${r.input.Key}': ${JSON.stringify(progress)}`);
        });
        return parallelUploads3.done();
      })
    );
  }

  private async generateSignedURL(s3Client: S3Client, bucket: string, key: string, expiration?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiration ?? DEFAULT_S3_PRESIGNED_URL_EXPIRATION_SECONDS
    });
    return signedUrl;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];

      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async test(datasourceConfiguration: S3DatasourceConfiguration): Promise<void> {
    try {
      const stsClient = new STSClient(await getAwsClientConfig(datasourceConfiguration));
      // This call will work with any valid AWS credentials, regardless of permissions
      // Ref: https://docs.aws.amazon.com/cli/latest/reference/sts/get-caller-identity.html
      await stsClient.send(new GetCallerIdentityCommand({}));
    } catch (err) {
      // this is likely an auth issue
      throw new IntegrationError(`Client configuration failed. ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
  }

  private _handleError(error: Error, initialMessage: string): IntegrationError {
    if (error instanceof IntegrationError) {
      return new IntegrationError(
        `${initialMessage}: ${error.message}`,
        (error as IntegrationError).code,
        (error as IntegrationError).internalCode
      );
    }

    const message = `${initialMessage}: ${error.message}`;

    // there are too many errors to enumerate here, so we might have to do it incrementally
    // map the first set of errors that we can find, and add cases for any INTERNAL errors we encounter later
    // taken from https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html#ErrorCodeList
    const errorNameMap: Record<string, ErrorCode> = {
      AccessDenied: ErrorCode.INTEGRATION_AUTHORIZATION,
      BucketNotEmpty: ErrorCode.INTEGRATION_LOGIC,
      EntityTooLarge: ErrorCode.INTEGRATION_LOGIC,
      EntityTooSmall: ErrorCode.INTEGRATION_LOGIC,
      ExpiredToken: ErrorCode.INTEGRATION_AUTHORIZATION,
      InvalidAccessKeyId: ErrorCode.INTEGRATION_AUTHORIZATION,
      InvalidBucketName: ErrorCode.INTEGRATION_SYNTAX,
      InvalidRequest: ErrorCode.INTEGRATION_INTERNAL,
      InvalidSecurity: ErrorCode.INTEGRATION_AUTHORIZATION,
      InvalidToken: ErrorCode.INTEGRATION_AUTHORIZATION,
      NoSuchBucket: ErrorCode.INTEGRATION_SYNTAX,
      NoSuchKey: ErrorCode.INTEGRATION_SYNTAX,
      SlowDown: ErrorCode.INTEGRATION_RATE_LIMIT,
      TokenRefreshRequired: ErrorCode.INTEGRATION_AUTHORIZATION
    };

    for (const key of Object.keys(errorNameMap)) {
      if ((error as { Code?: string }).Code?.includes(key)) {
        return new IntegrationError(message, errorNameMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as { Code?: string }).Code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
