import { constants } from 'http2';
import { Readable } from 'stream';
import EventSourceStream from '@server-sent-stream/node';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import FormData from 'form-data';
import { isEmpty } from 'lodash';
import { ErrorCode, ForbiddenError, IntegrationError, InternalServerError, UnauthorizedError } from '../../errors';
import {
  ActionResponseType,
  ApiActionConfiguration,
  ExecutionOutput,
  KVPair,
  Property,
  REST_API_DEFAULT_USER_AGENT,
  RestApiBodyDataType
} from '../../types';
import { bufferFromReadableStream, BufferJSON, extractResponseData, paramHasKeyValue } from '../../utils';
import { BasePlugin, StreamOptions } from './BasePlugin';

function constructFormData({ formData }: ApiActionConfiguration): FormData {
  const data = new FormData();

  for (const property of formData as KVPair[]) {
    if (isEmpty(property.key)) {
      continue;
    }

    const opts: FormData.AppendOptions | undefined = property.file === undefined ? undefined : { filename: property.file.filename };
    data.append(property.key as string, property.value, opts);
  }

  return data;
}

export const updateFetchRequestBody = function (_action: ApiActionConfiguration, _request: RequestInit): void {
  const { bodyType, body, fileName, formData, fileFormKey } = _action;

  switch (bodyType) {
    case RestApiBodyDataType.JSON:
    case RestApiBodyDataType.RAW:
      if (isEmpty(body)) {
        return;
      }

      {
        _request.body = body;
      }

      break;
    case RestApiBodyDataType.FORM:
      if (isEmpty(formData)) {
        return;
      }

      {
        const data: FormData = constructFormData(_action);

        // @ts-ignore
        _request.body = data;

        const _headers: Headers = new Headers(_request.headers);

        for (const [k, v] of Object.entries(data.getHeaders())) {
          _headers.append(k, v as string);
        }

        _request.headers = _headers;
      }

      break;
    case RestApiBodyDataType.FILE_FORM:
      if (isEmpty(fileName) || isEmpty(body) || isEmpty(fileFormKey)) {
        return;
      }

      {
        const data = new FormData();

        data.append(fileFormKey as string, Buffer.from(body as string), {
          filename: fileName
        });

        // @ts-ignore
        _request.body = formData;

        const _headers: Headers = new Headers(_request.headers);

        for (const [k, v] of Object.entries(data.getHeaders())) {
          _headers.append(k, v as string);
        }

        _request.headers = _headers;
      }

      break;
  }
};

export const updateRequestBody = function ({
  actionConfiguration,
  headers,
  options
}: {
  actionConfiguration: ApiActionConfiguration;
  headers: Record<string, unknown>;
  options: AxiosRequestConfig;
}): void {
  switch (actionConfiguration.bodyType) {
    case RestApiBodyDataType.JSON: {
      if (!isEmpty(actionConfiguration.body)) {
        try {
          const parsedBody = JSON.parse(actionConfiguration.body as string);
          options.data = parsedBody;
        } catch (err) {
          throw new IntegrationError(`Invalid JSON provided. ${err.message}`);
        }
      }
      break;
    }
    case RestApiBodyDataType.RAW: {
      if (!isEmpty(actionConfiguration.body)) {
        options.data = actionConfiguration.body;
      }
      break;
    }
    case RestApiBodyDataType.FORM: {
      if (!isEmpty(actionConfiguration.formData)) {
        const formData: FormData = constructFormData(actionConfiguration);

        options.data = formData;
        // We need to attach form headers as it generates the Boundary
        // for multipart/forms content types
        options.headers = {
          ...headers,
          ...formData.getHeaders()
        };
      }
      break;
    }
    case RestApiBodyDataType.FILE_FORM:
      {
        if (!isEmpty(actionConfiguration.fileName) && !isEmpty(actionConfiguration.body) && !isEmpty(actionConfiguration.fileFormKey)) {
          const formData = new FormData();
          formData.append(actionConfiguration.fileFormKey as string, Buffer.from(actionConfiguration.body as string), {
            filename: actionConfiguration.fileName
          });
          options.data = formData;
          // We need to attach form headers as it generates the Boundary
          // for multipart/forms content types
          options.headers = {
            ...headers,
            ...formData.getHeaders()
          };
        }
      }
      break;
  }
};

export abstract class ApiPlugin extends BasePlugin {
  async streamRequest(
    format: ActionResponseType,
    request: Request,
    send: (_message: unknown) => Promise<void>,
    options?: StreamOptions
  ): Promise<void> {
    if (format !== ActionResponseType.RAW) {
      throw new IntegrationError(
        `Only the ${ActionResponseType.RAW} response type is supported when streaming.`,
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
        {
          pluginName: this.pluginName
        }
      );
    }

    const response = await fetch(request);
    const { ok, body, headers } = response;

    if (!ok) {
      throw await beautifiedFetchError(response, format);
    }

    // NOTE(frank): This is what we'd use to determine that it's an SSE when we want to suppor the 'auto' response type.
    if (!doesResponseImplementServerSideEvents(headers.get('content-type'))) {
      throw new IntegrationError(
        `Streamable APIs only support responses implementing server-side events (SSE). Ensure that the content type is text/event-stream.`,
        ErrorCode.INTEGRATION_LOGIC,
        {
          pluginName: this.pluginName
        }
      );
    }

    const decoder = new EventSourceStream();

    // @ts-ignore
    Readable.fromWeb(body).pipe(decoder);

    await new Promise<void>((resolve, reject) => {
      decoder.on('data', ({ data }: MessageEvent) => {
        send(JSON.stringify({ data })).catch(reject);
      });
      decoder.once('end', resolve);
      decoder.once('error', reject);
    });
  }

  // NOTE: the responseType argument will be ignored unless requestConfig.responseType is 'arraybuffer'
  executeRequest(requestConfig: AxiosRequestConfig, responseType = ActionResponseType.AUTO): Promise<ExecutionOutput> {
    if (responseType === ActionResponseType.RAW) {
      throw new IntegrationError(
        `The ${ActionResponseType.RAW} response type is only supported when streaming.`,
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
        {
          pluginName: this.pluginName
        }
      );
    }

    return new Promise((resolve, reject) => {
      axios(requestConfig)
        .then((response) => {
          const ret = new ExecutionOutput();
          ret.output = this.extractResponseData(response, responseType);
          resolve(ret);
        })
        .catch((error) => {
          let errMessage = error.message;
          if (error.response?.statusText) {
            errMessage += `: ${error.response?.statusText}`;
          }
          if (error.response?.data) {
            const responseDataRaw = this.extractResponseData(error.response, ActionResponseType.TEXT);
            const responseData = typeof responseDataRaw === 'string' ? responseDataRaw : JSON.stringify(responseDataRaw, null, 2);
            errMessage += '\nBody:\n' + responseData;
          }
          if (error.response?.status === constants.HTTP_STATUS_FORBIDDEN) {
            reject(new ForbiddenError(errMessage));
            return;
          }
          if (error.response?.status === constants.HTTP_STATUS_UNAUTHORIZED) {
            reject(new UnauthorizedError(errMessage));
            return;
          }
          return reject(new Error(errMessage));
        });
    });
  }

  extractResponseData(response: AxiosResponse<unknown, unknown>, responseType: ActionResponseType): unknown | Buffer {
    const dataRaw = response.data;

    // if the response body has already been decoded then return that
    if (!Buffer.isBuffer(dataRaw)) {
      return dataRaw;
    }

    const mimeTypeString = response.headers['content-type'] ?? 'text/plain';
    // rely on the toJSON method of Buffer in node.js
    return extractResponseData(dataRaw, mimeTypeString, responseType);
  }

  generateRequestConfig(actionConfiguration: ApiActionConfiguration): AxiosRequestConfig {
    if (!actionConfiguration.path) {
      throw new InternalServerError('Action confguration path is missing.');
    }

    if (!actionConfiguration.headers) {
      throw new InternalServerError('Action configuration headers are missing.');
    }

    const endpoint = new URL(actionConfiguration.path);
    const requestConfig: AxiosRequestConfig = {
      url: endpoint.toString(),
      method: actionConfiguration.httpMethod as Method,
      headers: this.getHeaders(actionConfiguration.headers)
    };

    return requestConfig;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getHeaders(actionHeaders: Property[]): any {
    try {
      let headers = {};
      const headerList = actionHeaders;
      if (headerList) {
        headers = headerList.reduce<Record<string, unknown>>((o: Record<string, unknown>, p: Property, _i: number, _ps: Property[]) => {
          if (!p || !p?.key) return o;
          o[p.key] = p?.value;
          return o;
        }, {});
        return headers;
      }
    } catch (err) {
      throw new InternalServerError(`Headers failed to transform - ${err.message}`);
    }
  }

  protected parseUrl(_url: string | undefined, _params: Property[] | undefined): URL {
    if (!_url) {
      throw new IntegrationError(`API host url not provided`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    try {
      const url = new URL(_url);

      _params?.filter(paramHasKeyValue).forEach(({ key, value }) => {
        url.searchParams.append(key, value);
      });

      return url;
    } catch (err) {
      throw new IntegrationError(`API host url not provided, ${err.message}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
  }

  protected transformHeaders(_headers: Array<Property> | undefined) {
    if (!_headers) {
      return {};
    }

    let headers = {};

    try {
      headers = _headers.reduce<Record<string, unknown>>((o: Record<string, unknown>, p: Property, _i: number, _ps: Property[]) => {
        if (!p || !p?.key) return o;
        if (!Object.prototype.hasOwnProperty.call(o, p?.key)) {
          o[p.key] = p.value;
        }
        return o;
      }, {});
    } catch (err) {
      throw new IntegrationError(`Headers failed to transform, ${err.message}`, ErrorCode.INTEGRATION_SYNTAX, {
        pluginName: this.pluginName
      });
    }

    // Set User-Agent if it's not set by user.
    // With the latest RestApi template, newly created RestApi action has 'User-Agent' by default,
    // the following lines are still required for existing RestApi actions
    if (
      !Object.keys(headers).some((k) => {
        return 'user-agent' === k.toLowerCase();
      })
    ) {
      headers['User-Agent'] = REST_API_DEFAULT_USER_AGENT;
    }

    return headers;
  }
}

export const doesResponseImplementServerSideEvents = (contentType: string | null): boolean => {
  for (const value of contentType?.split(',') || []) {
    for (const part of value.split(';')) {
      if (part.trim() === 'text/event-stream') {
        return true;
      }
    }
  }

  return false;
};

export const beautifiedFetchError = async (response: Response, format: ActionResponseType): Promise<Error> => {
  const { status, statusText, body } = response;

  // This matches what Axios is returning. We need to match it for compatability reasons.
  let message: string = 'Request failed with status code ' + status;

  message += `: ${statusText}`;

  if (body) {
    const buffer: Buffer = await bufferFromReadableStream(body);
    const data: string | BufferJSON = extractResponseData(buffer, 'text/plain', format);

    try {
      message += '\nBody:\n' + data.toString();
    } catch (_) {
      // do nothing
    }
  }

  if (status === constants.HTTP_STATUS_FORBIDDEN) {
    throw new ForbiddenError(message);
  }

  if (status === constants.HTTP_STATUS_UNAUTHORIZED) {
    throw new UnauthorizedError(message);
  }

  return new Error(message);
};
