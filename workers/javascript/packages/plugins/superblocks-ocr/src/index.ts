import path from 'path';
import { Readable } from 'stream';
import {
  ActionConfiguration,
  ApiPlugin,
  DatasourceConfiguration,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionContext,
  ExecutionOutput,
  FileMetadataPrivate,
  getFileStream,
  IntegrationError,
  isReadableFile,
  isReadableFileConstructor,
  PluginExecutionProps,
  RawRequest,
  RequestFiles,
  SUPERBLOCKS_OCR_ACTION,
  SuperblocksOcrActionConfiguration,
  SuperblocksOcrDatasourceConfiguration
} from '@superblocks/shared';
import axios, { AxiosRequestConfig, Method } from 'axios';

type MethodOrUndefined = Method | undefined;
type MicrosoftComputerVisionLine = {
  boundingBox: [number, number, number, number, number, number, number, number];
  text: string;
  appearance: {
    style: {
      name: string;
      confidence: number;
    };
  };
  words: {
    boundingBox: [number, number, number, number, number, number, number, number];
    text: string;
    confidence: number;
  }[];
};
type MicrosoftComputerVisionReadResult = {
  page: number;
  angle: number;
  width: number;
  height: number;
  unit: string;
  lines: MicrosoftComputerVisionLine[];
};

export default class SuperblocksOcrPlugin extends ApiPlugin {
  pluginName = 'OCR';

  private readonly REQUEST_TIMEOUT_MS = 60_000;
  // https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/quickstarts-sdk/client-library?tabs=visual-studio&pivots=programming-language-rest-api
  // Microsoft Computer Vision works by uploading an image/pdf via their API and getting a resource ID back that can be used to poll for the results.
  // This field is how often we poll for these results.
  private readonly MICROSOFT_COMPUTER_VISION_RESULTS_POLLING_INTERVAL_MS = 3_000;
  private readonly MAX_POLLING_ATTEMPTS = 30;
  private readonly MICROSOFT_COMPUTER_VISION_UPLOAD_PATH = '/vision/v3.2/read/analyze/';
  private readonly MICROSOFT_COMPUTER_VISION_RESULTS_PATH = '/vision/v3.2/read/analyzeResults/';
  private readonly MICROSOFT_COMPUTER_VISION_SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'pdf', 'tiff'];

  metadata(datasourceConfiguration: DatasourceConfiguration, actionConfiguration?: ActionConfiguration): Promise<DatasourceMetadataDto> {
    return Promise.resolve({});
  }

  async test(datasourceConfiguration: SuperblocksOcrDatasourceConfiguration): Promise<void> {
    return Promise.resolve();
  }

  dynamicProperties(): Array<string> {
    return ['file', 'fileUrl'];
  }

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    files
  }: PluginExecutionProps<SuperblocksOcrDatasourceConfiguration, SuperblocksOcrActionConfiguration>): Promise<ExecutionOutput> {
    this.validateDatasourceInfo(datasourceConfiguration);
    const data = await this.getUploadRequestBody(context, actionConfiguration, files);
    const uploadHeaders = this.getUploadRequestHeaders(actionConfiguration, datasourceConfiguration);

    const uploadAxiosConfig: AxiosRequestConfig = {
      url: this.getUploadEndpoint(datasourceConfiguration),
      method: 'post' as MethodOrUndefined,
      headers: uploadHeaders,
      data: data,
      timeout: this.REQUEST_TIMEOUT_MS
    };
    let uploadResponse;
    try {
      uploadResponse = await axios(uploadAxiosConfig);
    } catch (err) {
      if (err && err?.response?.status === 404) {
        throw new IntegrationError(`Error uploading file: ${err.message}`, ErrorCode.INTEGRATION_LOGIC, { pluginName: this.pluginName });
      } else if (err && (err?.response?.status === 401 || err?.response?.status === 403)) {
        throw new IntegrationError(`Error uploading file: ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
          pluginName: this.pluginName
        });
      } else if (err && err?.response?.status === 429) {
        throw new IntegrationError(`Error uploading file: ${err.message}`, ErrorCode.INTEGRATION_RATE_LIMIT, {
          pluginName: this.pluginName
        });
      }
      throw new IntegrationError(`Error uploading file: ${err.message}`, ErrorCode.INTEGRATION_NETWORK, { pluginName: this.pluginName });
    }

    // get apim-request-id from upload
    const requestId = uploadResponse.headers['apim-request-id'];
    // get results
    const resultHeaders = this.getResultRequestHeaders(datasourceConfiguration);
    const resultAxiosConfig: AxiosRequestConfig = {
      url: this.getResultEndpoint(datasourceConfiguration, requestId),
      method: 'get' as MethodOrUndefined,
      headers: resultHeaders,
      timeout: this.REQUEST_TIMEOUT_MS
    };
    let resultResponse;
    for (let retriesRemaining = this.MAX_POLLING_ATTEMPTS; retriesRemaining > 0; retriesRemaining--) {
      // wait for results
      await this.sleep(this.MICROSOFT_COMPUTER_VISION_RESULTS_POLLING_INTERVAL_MS);
      resultResponse = await axios(resultAxiosConfig);
      if (resultResponse.data.status === 'succeeded') {
        const ocrResponse = new ExecutionOutput();
        ocrResponse.output = resultResponse.data;
        return this.formatOutput(ocrResponse);
      }
    }
    throw new IntegrationError(`Request not completed in time. Please try again.`, ErrorCode.INTEGRATION_QUERY_TIMEOUT, {
      pluginName: this.pluginName
    });
  }

  getUploadEndpoint(datasourceConfiguration: SuperblocksOcrDatasourceConfiguration): string {
    return datasourceConfiguration.microsoftComputerVisionResourceBaseUrl + this.MICROSOFT_COMPUTER_VISION_UPLOAD_PATH;
  }

  getResultEndpoint(datasourceConfiguration: SuperblocksOcrDatasourceConfiguration, requestId: string): string {
    return datasourceConfiguration.microsoftComputerVisionResourceBaseUrl + this.MICROSOFT_COMPUTER_VISION_RESULTS_PATH + requestId;
  }

  formatOutput(response: ExecutionOutput): ExecutionOutput {
    if (response.output !== null && typeof response.output === 'object') {
      const fullText = response.output['analyzeResult']['readResults']
        .flatMap((readResult: MicrosoftComputerVisionReadResult) => readResult.lines.map((line: MicrosoftComputerVisionLine) => line.text))
        .join('\n');
      response.output = fullText;
    }
    return response;
  }

  sleep(milleseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milleseconds));
  }

  validateDatasourceInfo(datasourceConfiguration: SuperblocksOcrDatasourceConfiguration): void {
    // used to validate that our datasource has credentials loaded from ENV vars correctly
    if (!datasourceConfiguration.microsoftComputerVisionApiKey || !datasourceConfiguration.microsoftComputerVisionResourceBaseUrl) {
      throw new IntegrationError('Missing datasource configuration information.', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
  }

  getUploadRequestHeaders(
    actionConfiguration: SuperblocksOcrActionConfiguration,
    datasourceConfiguration: SuperblocksOcrDatasourceConfiguration
  ): AxiosRequestConfig['headers'] {
    let contentType = 'application/json';
    if (actionConfiguration.action === SUPERBLOCKS_OCR_ACTION.FROM_FILE) {
      contentType = 'application/octet-stream';
    }

    const headers = {
      'Content-Type': contentType,
      Accept: '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Ocp-Apim-Subscription-Key': datasourceConfiguration.microsoftComputerVisionApiKey ?? ''
    };
    return headers;
  }

  getResultRequestHeaders(datasourceConfiguration: SuperblocksOcrDatasourceConfiguration): AxiosRequestConfig['headers'] {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': datasourceConfiguration.microsoftComputerVisionApiKey ?? ''
    };
    return headers;
  }

  async getUploadRequestBody(
    context: ExecutionContext,
    actionConfiguration: SuperblocksOcrActionConfiguration,
    files: RequestFiles
  ): Promise<Record<string, unknown> | Readable | string> {
    if (actionConfiguration.action === SUPERBLOCKS_OCR_ACTION.FROM_URL) {
      // check if file type is supported
      let supportedFileType = false;
      this.MICROSOFT_COMPUTER_VISION_SUPPORTED_EXTENSIONS.some((extension) => {
        if (actionConfiguration.fileUrl?.toLowerCase().endsWith(`.${extension}`)) {
          supportedFileType = true;
          return true;
        } else if (actionConfiguration.fileUrl?.toLowerCase().split('?')[0].endsWith(`.${extension}`)) {
          supportedFileType = true;
          return true;
        }
      });
      if (!supportedFileType) {
        throw new IntegrationError(
          `File type is not supported. Supported file types are: ${this.MICROSOFT_COMPUTER_VISION_SUPPORTED_EXTENSIONS.join(', ')}`,
          ErrorCode.INTEGRATION_SYNTAX,
          { pluginName: this.pluginName }
        );
      }

      return { url: actionConfiguration.fileUrl };
    } else {
      // check if file type is supported
      const file = await this.readFile(context, actionConfiguration.file, files);
      const fileName = this.getFileName(actionConfiguration.file);
      const fileExtension = this.getFileExtension(fileName);
      const supportedFileType = this.MICROSOFT_COMPUTER_VISION_SUPPORTED_EXTENSIONS.some(
        (ext) => ext.toLowerCase() === fileExtension.toLowerCase()
      );
      if (!supportedFileType) {
        throw new IntegrationError(
          `File type '${fileExtension}' is not supported. Supported file types are: ${this.MICROSOFT_COMPUTER_VISION_SUPPORTED_EXTENSIONS.join(
            ', '
          )}`,
          ErrorCode.INTEGRATION_SYNTAX,
          { pluginName: this.pluginName }
        );
      }
      return file;
    }
  }

  getDisplayUploadRequestBody(actionConfiguration: SuperblocksOcrActionConfiguration): string {
    let body;
    if (actionConfiguration.action === SUPERBLOCKS_OCR_ACTION.FROM_URL) {
      body = { url: actionConfiguration.fileUrl };
    } else {
      body = { file: '<raw bytes>' };
    }
    return JSON.stringify(body);
  }

  async readFile(context: ExecutionContext, file: unknown, files: RequestFiles): Promise<string | Readable> {
    let fileWithContents = file;
    if (fileWithContents && typeof fileWithContents === 'string') {
      try {
        fileWithContents = JSON.parse(fileWithContents);
      } catch (e) {
        throw new IntegrationError(`Can't parse the file objects. They must be an array of JSON objects.`, ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }
    }
    if (!isReadableFile(fileWithContents)) {
      if (isReadableFileConstructor(fileWithContents)) {
        return fileWithContents.contents;
      }

      throw new IntegrationError(
        `Cannot read files. Files can either be Superblocks files or { name: string; contents: string }. ${JSON.stringify(file)}`,
        ErrorCode.INTEGRATION_SYNTAX
      );
    }
    const match = files.find((f) => f.originalname === (fileWithContents as FileMetadataPrivate).$superblocksId);
    if (!match) {
      throw new IntegrationError(`Could not locate file ${fileWithContents.name}`, ErrorCode.INTEGRATION_LOGIC, {
        pluginName: this.pluginName
      });
    }

    try {
      return await getFileStream(context, match.path);
    } catch (err) {
      if (err && err?.response?.status === 404) {
        throw new IntegrationError(
          `Could not retrieve file ${fileWithContents.name} from controller: ${err.message}`,
          ErrorCode.INTEGRATION_LOGIC,
          { pluginName: this.pluginName }
        );
      }
      throw new IntegrationError(
        `Could not retrieve file ${fileWithContents.name} from controller: ${err.message}`,
        ErrorCode.INTEGRATION_NETWORK,
        { pluginName: this.pluginName }
      );
    }
  }

  getFileName(file: unknown): string {
    if (file && typeof file === 'string') {
      try {
        const obj = JSON.parse(file);
        return obj.name;
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    if (!file) {
      throw new IntegrationError(`File is null.`, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    } else if (typeof file !== 'object') {
      throw new IntegrationError(`File is not an object.`, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    } else if (!file['name']) {
      throw new IntegrationError(`File does not have a name.`, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    }
    return file['name'].replace(/(\r\n|\n|\r)/gm, '');
  }

  getFileExtension(filename: string): string {
    return path.extname(filename).slice(1);
  }

  getRequest(
    actionConfiguration: SuperblocksOcrActionConfiguration,
    datasourceConfiguration: SuperblocksOcrDatasourceConfiguration
  ): RawRequest {
    const mockRequest = {
      action: actionConfiguration.action,
      body: this.getDisplayUploadRequestBody(actionConfiguration)
    };
    return JSON.stringify(mockRequest, null, 4);
  }
}
