import {
  ActionResponseType,
  ApiPlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  makeCurlString,
  PluginExecutionProps,
  RawRequest,
  RestApiFields,
  RestApiIntegrationActionConfiguration,
  RestApiIntegrationDatasourceConfiguration,
  StreamOptions,
  SUPERBLOCKS_OPENAPI_TENANT_KEYWORD,
  updateFetchRequestBody,
  updateRequestBody
} from '@superblocks/shared';
import { AxiosRequestConfig, Method } from 'axios';
import { isEmpty } from 'lodash';

export default class RestApiIntegrationPlugin extends ApiPlugin {
  pluginName = 'REST API Integration';

  public async stream(
    {
      actionConfiguration,
      datasourceConfiguration
    }: PluginExecutionProps<RestApiIntegrationDatasourceConfiguration, RestApiIntegrationActionConfiguration>,
    send: (_message: unknown) => Promise<void>,
    options?: StreamOptions
  ): Promise<void> {
    return await this.streamRequest(
      actionConfiguration?.responseType ?? ActionResponseType.AUTO,
      this.constructFetchRequest(actionConfiguration, datasourceConfiguration),
      send,
      options
    );
  }

  public async execute({
    context,
    datasourceConfiguration,
    actionConfiguration
  }: PluginExecutionProps<RestApiIntegrationDatasourceConfiguration, RestApiIntegrationActionConfiguration>): Promise<ExecutionOutput> {
    return await this.executeRequest(
      this.constructAxiosRequest(actionConfiguration, datasourceConfiguration),
      actionConfiguration.responseType,
      actionConfiguration.verboseHttpOutput ?? false,
      actionConfiguration.doNotFailOnRequestError !== undefined ? !actionConfiguration.doNotFailOnRequestError : true
    );
  }

  getRequest(
    actionConfiguration: RestApiIntegrationActionConfiguration,
    datasourceConfiguration: RestApiIntegrationDatasourceConfiguration
  ): RawRequest {
    if (!actionConfiguration.httpMethod) {
      throw new IntegrationError(`HTTP method not specified`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    const httpMethod = actionConfiguration.httpMethod;
    const url = `${this._getURLFromBaseAndTenant(datasourceConfiguration.urlBase ?? '', datasourceConfiguration.openApiTenantName)}${
      actionConfiguration.urlPath ?? ''
    }`;
    const headers = (datasourceConfiguration.headers ?? []).concat(actionConfiguration.headers ?? []);
    const params = (datasourceConfiguration.params ?? []).concat(actionConfiguration.params ?? []);
    const bodyType = actionConfiguration.bodyType;
    const body = actionConfiguration.body;
    const formData = actionConfiguration.formData;
    const fileName = actionConfiguration.fileName;
    const fileFormKey = actionConfiguration.fileFormKey;

    return makeCurlString({
      reqMethod: httpMethod,
      reqUrl: url,
      reqHeaders: headers,
      reqParams: params,
      reqBody: body,
      reqFormData: formData,
      reqBodyType: bodyType,
      reqFileName: fileName,
      reqFileFormKey: fileFormKey
    });
  }

  dynamicProperties(): string[] {
    return [
      RestApiFields.URL_BASE,
      RestApiFields.URL_PATH,
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

  async metadata(datasourceConfiguration: RestApiIntegrationDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return {};
  }

  public test(datasourceConfiguration: RestApiIntegrationDatasourceConfiguration): Promise<void>;
  public test(
    datasourceConfiguration: RestApiIntegrationDatasourceConfiguration,
    actionConfiguration: RestApiIntegrationActionConfiguration
  ): Promise<void>;
  async test(
    datasourceConfiguration: RestApiIntegrationDatasourceConfiguration,
    actionConfiguration?: RestApiIntegrationActionConfiguration
  ): Promise<void> {
    if (!actionConfiguration) {
      // only one parameter is passed, consider test as passed for backward compatibility
      return;
    }
    // axios will throw an error if the request fails
    await this.execute({
      context: {},
      datasourceConfiguration,
      actionConfiguration: { ...actionConfiguration, verboseHttpOutput: false, doNotFailOnRequestError: false }
    } as PluginExecutionProps<RestApiIntegrationDatasourceConfiguration, RestApiIntegrationActionConfiguration>);
  }

  private _getURLFromBaseAndTenant(urlBase: string, openApiTenantName?: string): string {
    if (!isEmpty(openApiTenantName?.trim()) && urlBase.includes(SUPERBLOCKS_OPENAPI_TENANT_KEYWORD)) {
      return urlBase.replace(SUPERBLOCKS_OPENAPI_TENANT_KEYWORD, openApiTenantName?.trim() as string) as string;
    }

    return urlBase;
  }

  private constructAxiosRequest(
    actionConfiguration: RestApiIntegrationActionConfiguration,
    datasourceConfiguration: RestApiIntegrationDatasourceConfiguration
  ): AxiosRequestConfig {
    const { headers: aHeaders, params: aParams, httpMethod, urlPath } = actionConfiguration;
    const { headers: dHeaders, params: dParams, urlBase, openApiTenantName } = datasourceConfiguration;

    if (!httpMethod) {
      throw new IntegrationError('No HTTP method specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    const url = super.parseUrl(
      `${this._getURLFromBaseAndTenant(urlBase ?? '', openApiTenantName)}${urlPath ?? ''}`,
      (dParams ?? []).concat(aParams ?? [])
    );

    const headers = super.transformHeaders((dHeaders ?? []).concat(aHeaders ?? []));

    // TODO: Refactor and reuse the generateRequestConfig function from ApiPlugin
    const options: AxiosRequestConfig = {
      url: url.toString(),
      // request arraybuffer and let extractResponseData figure out the correct data type for the response body
      responseType: 'arraybuffer',
      method: httpMethod.toString() as Method,
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

  private constructFetchRequest(
    actionConfiguration: RestApiIntegrationActionConfiguration,
    datasourceConfiguration: RestApiIntegrationDatasourceConfiguration
  ): Request {
    const { headers: aHeaders, params: aParams, httpMethod } = actionConfiguration;
    const { headers: dHeaders, params: dParams, urlBase, openApiTenantName } = datasourceConfiguration;

    const _headers: Headers = new Headers();
    const _url = super.parseUrl(
      `${this._getURLFromBaseAndTenant(urlBase ?? '', openApiTenantName)}${actionConfiguration.urlPath ?? ''}`,
      (dParams ?? []).concat(aParams ?? [])
    );

    for (const [k, v] of Object.entries(super.transformHeaders((dHeaders ?? []).concat(aHeaders ?? [])))) {
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
