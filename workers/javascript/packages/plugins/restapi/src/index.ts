import {
  ActionResponseType,
  ApiPlugin,
  DatasourceMetadataDto,
  ExecutionOutput,
  PluginExecutionProps,
  RawRequest,
  RestApiActionConfiguration,
  RestApiDatasourceConfiguration,
  RestApiFields,
  StreamOptions,
  makeCurlString,
  updateFetchRequestBody,
  updateRequestBody
} from '@superblocks/shared';
import { AxiosRequestConfig, Method } from 'axios';

export default class RestApiPlugin extends ApiPlugin {
  pluginName = 'REST API';

  public async stream(
    { actionConfiguration }: PluginExecutionProps<RestApiDatasourceConfiguration, RestApiActionConfiguration>,
    send: (_message: unknown) => Promise<void>,
    options?: StreamOptions
  ): Promise<void> {
    return await this.streamRequest(
      actionConfiguration?.responseType ?? ActionResponseType.AUTO,
      this.constructFetchRequest(actionConfiguration),
      send,
      options
    );
  }

  public async execute({
    actionConfiguration
  }: PluginExecutionProps<RestApiDatasourceConfiguration, RestApiActionConfiguration>): Promise<ExecutionOutput> {
    return await this.executeRequest(this.constructAxiosRequest(actionConfiguration), actionConfiguration.responseType);
  }

  getRequest(actionConfiguration: RestApiActionConfiguration): RawRequest {
    return makeCurlString({
      reqMethod: actionConfiguration.httpMethod,
      reqUrl: actionConfiguration.path,
      reqHeaders: actionConfiguration.headers,
      reqParams: actionConfiguration.params,
      reqBody: actionConfiguration.body,
      reqFormData: actionConfiguration.formData,
      reqBodyType: actionConfiguration.bodyType,
      reqFileFormKey: actionConfiguration.fileFormKey,
      reqFileName: actionConfiguration.fileName
    });
  }

  dynamicProperties(): string[] {
    return [
      RestApiFields.PATH,
      RestApiFields.PARAMS,
      RestApiFields.HEADERS,
      RestApiFields.BODY_TYPE,
      RestApiFields.BODY,
      RestApiFields.FORM_DATA,
      RestApiFields.FILE_NAME,
      RestApiFields.FILE_FORM_KEY
    ];
  }

  escapeStringProperties(): string[] {
    return [RestApiFields.BODY];
  }

  async metadata(datasourceConfiguration: RestApiDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return {};
  }

  async test(datasourceConfiguration: RestApiDatasourceConfiguration): Promise<void> {
    return;
  }

  private constructAxiosRequest(actionConfiguration: RestApiActionConfiguration): AxiosRequestConfig {
    const headers = super.transformHeaders(actionConfiguration.headers);
    const url = super.parseUrl(actionConfiguration.path, actionConfiguration.params);

    // TODO: Refactor and reuse the generateRequestConfig function from ApiPlugin
    const options: AxiosRequestConfig = {
      url: url.toString(),
      // request arraybuffer and let extractResponseData figure out the correct data type for the response body
      responseType: 'arraybuffer',
      method: actionConfiguration.httpMethod?.toString() as Method,
      headers: headers,
      timeout: this.pluginConfiguration.restApiExecutionTimeoutMs,
      maxBodyLength: this.pluginConfiguration.restApiMaxContentLengthBytes,
      maxContentLength: this.pluginConfiguration.restApiMaxContentLengthBytes
    };

    updateRequestBody({
      actionConfiguration: actionConfiguration,
      headers: headers,
      options: options
    });

    return options;
  }

  private constructFetchRequest(actionConfiguration: RestApiActionConfiguration): Request {
    const { path, params, headers, httpMethod } = actionConfiguration;
    const _headers: Headers = new Headers();
    const _url = super.parseUrl(path, params);

    for (const [k, v] of Object.entries(super.transformHeaders(headers))) {
      _headers.append(k, v as string);
    }

    const request: RequestInit = {
      method: httpMethod?.toString() as Method,
      headers: _headers
    };

    updateFetchRequestBody(actionConfiguration, request);

    return new Request(_url, request);
  }
}
