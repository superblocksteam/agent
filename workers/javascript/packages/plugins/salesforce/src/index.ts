import { constants } from 'http2';
import { AsyncParser } from '@json2csv/node';
import {
  BasePlugin,
  Column,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionContext,
  ExecutionOutput,
  ForbiddenError,
  IntegrationError,
  PluginExecutionProps,
  RawRequest,
  SalesforceActionConfiguration,
  SalesforceDatasourceConfiguration,
  Table,
  TableType,
  UnauthorizedError
} from '@superblocks/shared';
import { SalesforcePluginV1 } from '@superblocksteam/types';

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const API_VERSION = 'v58.0';

const JOB_STATE_OPEN = 'Open';
const JOB_STATE_ABORTED = 'Aborted';
const JOB_STATE_FAILED = 'Failed';
const JOB_STATE_UPLOAD_COMPLETED = 'UploadComplete';
const JOB_STATE_COMPLETED = 'JobComplete';

// polling 20 * 5 = 100 seconds
// TODO make this configurable
const BULK_POLL_MAX_RETRY = 50;
const BULK_POLL_INITIAL_INTERVAL_MS = 100;
const BULK_POLL_RETRY_EXPONENTIAL_MULTIPLIER = 2;
const BULK_POLL_MAX_WAIT_TIME_MS = 5000;

type BulkJobResult = {
  jobId: string;
  state: string;
  numberRecordsProcessed: number;
  numberRecordsFailed: number;
  errorMessage: string;
};

interface SalesforceObject {
  name: string;
  queryable: boolean;
  deprecatedAndHidden: boolean;
  associateEntityType: string | null;
}

class SalesforceBulkJob {
  private pluginName = 'Salesforce Bulk Job';

  private jobId: string;
  private state: string;
  private session: SalesforceSession;

  constructor(session: SalesforceSession) {
    this.session = session;
  }

  public async startJob(bulk: SalesforcePluginV1.Plugin_Bulk): Promise<BulkJobResult> {
    try {
      const resp = await this.session.createBatchJob(bulk);
      const jobId = resp.data?.id;
      const state = resp.data?.state;
      if (jobId === undefined || state != JOB_STATE_OPEN) {
        throw _handleError(this.pluginName, `Invalid resp, jobId=${jobId}, state=${state}`, { errorCode: state });
      }
      this.jobId = jobId;
      this.state = state;
    } catch (e) {
      throw _handleError(
        this.pluginName,
        `Failed to start the bulk job${e.response?.data ? ', error=' + JSON.stringify(e.response?.data) : ''}`,
        {
          error: e,
          errorCode: e.response?.status,
          errorStack: e.stack
        }
      );
    }

    let jobState: string;
    let errorMessage: string;
    let numberRecordsProcessed: number;
    let numberRecordsFailed: number;
    try {
      await this.session.uploadBatchJobData(this.jobId, bulk.resourceBody);
      await this.session.updateJobState(this.jobId, JOB_STATE_UPLOAD_COMPLETED);

      let jobInfoResp = await this.session.getJobInfo(this.jobId);
      jobState = jobInfoResp.data?.state;
      errorMessage = jobInfoResp.data?.errorMessage;
      numberRecordsFailed = jobInfoResp.data?.numberRecordsFailed;
      numberRecordsProcessed = jobInfoResp.data?.numberRecordsProcessed;

      let retry = 1;
      let sleepMs = BULK_POLL_INITIAL_INTERVAL_MS;
      while (jobState !== JOB_STATE_ABORTED && jobState !== JOB_STATE_COMPLETED && jobState !== JOB_STATE_FAILED) {
        if (retry > BULK_POLL_MAX_RETRY) {
          if (jobState === JOB_STATE_UPLOAD_COMPLETED) {
            await this.session.updateJobState(this.jobId, JOB_STATE_ABORTED);
          }
          throw new IntegrationError(
            `Job status is not complete after retry ${retry} times, id=${this.jobId}`,
            ErrorCode.INTEGRATION_LOGIC,
            { pluginName: this.pluginName }
          );
        }

        await new Promise((f) => setTimeout(f, sleepMs));
        sleepMs = Math.min(sleepMs * BULK_POLL_RETRY_EXPONENTIAL_MULTIPLIER, BULK_POLL_MAX_WAIT_TIME_MS);

        jobInfoResp = await this.session.getJobInfo(this.jobId);
        jobState = jobInfoResp.data?.state;
        errorMessage = jobInfoResp.data?.errorMessage;
        numberRecordsFailed = jobInfoResp.data?.numberRecordsFailed;
        numberRecordsProcessed = jobInfoResp.data?.numberRecordsProcessed;
        retry += 1;
      }

      // reached end state
      return {
        errorMessage: errorMessage,
        numberRecordsFailed: numberRecordsFailed,
        numberRecordsProcessed: numberRecordsProcessed,
        jobId: this.jobId,
        state: jobState
      };
    } catch (e) {
      await this.session.updateJobState(this.jobId, JOB_STATE_ABORTED);
      throw _handleError(
        this.pluginName,
        `Job aborted due to error ${this.jobId}${e.response?.data ? ', error=' + JSON.stringify(e.response?.data) : ''}`,
        {
          error: e,
          errorCode: e.response?.status,
          errorStack: e.stack
        }
      );
    }
  }
}

class SalesforceSession {
  private pluginName = 'Salesforce Session';

  private accessToken: string;
  private instanceUrl: string;
  private apiVersion: string;

  constructor(accessToken: string, instanceUrl: string, apiVersion: string) {
    this.accessToken = accessToken;
    this.instanceUrl = instanceUrl;
    this.apiVersion = apiVersion;
  }

  public getInstanceUrl(): string {
    return this.instanceUrl;
  }

  public async describeObject(object: string): Promise<SalesforcePluginV1.Plugin_Metadata_Object_Field[]> {
    const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${object}/describe/`;
    try {
      const resp = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      return resp.data.fields as SalesforcePluginV1.Plugin_Metadata_Object_Field[];
    } catch (e) {
      throw _handleError(
        this.pluginName,
        `Error fetching metadata for object object=${object}${e.response?.data ? ', error=' + JSON.stringify(e.response?.data) : ''}`,
        {
          error: e,
          errorCode: e.response?.status,
          errorStack: e.stack
        }
      );
    }
  }

  /*
  Get objects for instance 
  /services/data/vXX.X/sobjects
  */
  public async getAvailableObjects(): Promise<string[]> {
    const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/`;

    try {
      const resp = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      // Filter sobjects array: queryable: true, deprecatedAndHidden: false, associateEntityType: null
      //
      // associateEntityType are relation objects -- for now we are filtering them out
      // to not have so many objects. We might want to revisit this later if Clark
      // needs to do more complex queries.
      return (
        resp.data.sobjects
          ?.filter(
            (obj: SalesforceObject) => obj.queryable === true && obj.deprecatedAndHidden === false && obj.associateEntityType === null
          )
          ?.map((obj: SalesforceObject) => obj.name) || []
      );
    } catch (e) {
      throw _handleError(
        this.pluginName,
        `Error fetching available objects${e.response?.data ? ', error=' + JSON.stringify(e.response?.data) : ''}`,
        {
          error: e,
          errorCode: e.response?.status,
          errorStack: e.stack
        }
      );
    }
  }

  public async makeRequest(requestConfig: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      axios(requestConfig)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          let errMessage = '';
          if (Array.isArray(error.response?.data)) {
            errMessage += error.response?.data.map((item) => item.message).join(',');
          }
          if (error.response?.status === constants.HTTP_STATUS_FORBIDDEN) {
            reject(new ForbiddenError(errMessage));
            return;
          }
          if (error.response?.status === constants.HTTP_STATUS_UNAUTHORIZED) {
            reject(new UnauthorizedError(errMessage));
            return;
          }
          reject(new Error(errMessage));
        });
    });
  }

  public async update(data: SalesforcePluginV1.Plugin_Crud): Promise<ExecutionOutput> {
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${data.resourceType}/${data.resourceId}`;
      const reqConfig = {
        url,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: data.resourceBody
      } as AxiosRequestConfig;
      const executionOutput = new ExecutionOutput();
      executionOutput.output = (await this.makeRequest(reqConfig)).data;
      return executionOutput;
    } catch (e) {
      throw _handleError(
        this.pluginName,
        `Failed to update resource with id ${data.resourceId}${e.response?.data ? ', error=' + JSON.stringify(e.response?.data) : ''}`,
        {
          error: e,
          errorCode: e.response?.status,
          errorStack: e.stack
        }
      );
    }
  }

  public async create(data: SalesforcePluginV1.Plugin_Crud): Promise<ExecutionOutput> {
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${data.resourceType}`;
      const reqConfig = {
        url,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: data.resourceBody
      } as AxiosRequestConfig;
      const executionOutput = new ExecutionOutput();
      executionOutput.output = (await this.makeRequest(reqConfig)).data;
      return executionOutput;
    } catch (e) {
      throw _handleError(
        this.pluginName,
        `Failed to create resource${e.response?.data ? ', err=' + JSON.stringify(e.response?.data) : ''}`,
        {
          error: e,
          errorCode: e.response?.status,
          errorStack: e.stack
        }
      );
    }
  }

  public async read(data: SalesforcePluginV1.Plugin_Crud): Promise<ExecutionOutput> {
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${data.resourceType}/${data.resourceId}`;
      const reqConfig = {
        url,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      } as AxiosRequestConfig;
      const executionOutput = new ExecutionOutput();
      executionOutput.output = (await this.makeRequest(reqConfig)).data;
      return executionOutput;
    } catch (e) {
      throw _handleError(this.pluginName, `Failed to read resource ${data.resourceId}, error=${e}`, {
        error: e,
        errorCode: e.response?.status,
        errorStack: e.stack
      });
    }
  }

  public async delete(data: SalesforcePluginV1.Plugin_Crud): Promise<ExecutionOutput> {
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${data.resourceType}/${data.resourceId}`;
      const reqConfig = {
        url,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      } as AxiosRequestConfig;
      const executionOutput = new ExecutionOutput();
      executionOutput.output = (await this.makeRequest(reqConfig)).data;
      return executionOutput;
    } catch (e) {
      throw _handleError(this.pluginName, `Failed to delete resource ${data.resourceId}, error=${e}`, {
        error: e,
        errorCode: e.response?.status,
        errorStack: e.stack
      });
    }
  }

  public async uploadBatchJobData(jobId: string, jsonString: string): Promise<ExecutionOutput> {
    let csv;
    try {
      // Extract all unique fields from the JSON array
      const fields: string[] = Array.from(
        JSON.parse(jsonString).reduce((acc, item) => {
          Object.keys(item).forEach((key) => acc.add(key));
          return acc;
        }, new Set<string>())
      );

      const parser = new AsyncParser({ fields });
      csv = await parser.parse(jsonString).promise();
    } catch (e) {
      throw new IntegrationError(`Unable to parse string ${jsonString} as valid JSON: ${e.message}`, ErrorCode.INTEGRATION_SYNTAX, {
        pluginName: this.pluginName,
        stack: e?.stack
      });
    }

    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/jobs/ingest/${jobId}/batches`;
      const reqConfig = {
        url,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'text/csv'
        },
        data: csv
      } as AxiosRequestConfig;
      const executionOutput = new ExecutionOutput();
      executionOutput.output = (await this.makeRequest(reqConfig)).data;
      return executionOutput;
    } catch (e) {
      throw _handleError(this.pluginName, `Failed to upload batch job data id=${jobId}, error=${e}`, {
        error: e,
        errorCode: e.response?.status,
        errorStack: e.stack
      });
    }
  }

  public async createBatchJob(bulk: SalesforcePluginV1.Plugin_Bulk): Promise<AxiosResponse> {
    let operation: string;
    switch (bulk.action) {
      case SalesforcePluginV1.Plugin_Bulk_BulkAction.CREATE:
        operation = 'insert';
        break;
      case SalesforcePluginV1.Plugin_Bulk_BulkAction.UPDATE:
        operation = 'update';
        break;
      case SalesforcePluginV1.Plugin_Bulk_BulkAction.UPSERT:
        operation = 'upsert';
        break;
      case SalesforcePluginV1.Plugin_Bulk_BulkAction.DELETE:
        operation = 'delete';
        break;
      default:
        throw new IntegrationError(`Unknown bulk action ${bulk.action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
    }

    const data = {
      object: bulk.resourceType,
      contentType: 'CSV',
      operation: operation
    };

    if (bulk.action === SalesforcePluginV1.Plugin_Bulk_BulkAction.UPSERT) {
      // fallback to use object Id
      data['externalIdFieldName'] = bulk.externalId ? bulk.externalId : 'Id';
    }
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/jobs/ingest`;
      const reqConfig = {
        url,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: data
      } as AxiosRequestConfig;
      return await this.makeRequest(reqConfig);
    } catch (e) {
      throw _handleError(this.pluginName, `Failed to create job for ${bulk.resourceType}, error=${e}`, {
        error: e,
        errorCode: e.response?.status,
        errorStack: e.stack
      });
    }
  }

  public async updateJobState(jobId: string, state: string): Promise<AxiosResponse> {
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/jobs/ingest/${jobId}`;
      const reqConfig = {
        url,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: { state }
      } as AxiosRequestConfig;
      return await this.makeRequest(reqConfig);
    } catch (e) {
      throw _handleError(this.pluginName, `Failed to update job id=${jobId} state=${state}, error=${e}`, {
        error: e,
        errorCode: e.response?.status,
        errorStack: e.stack
      });
    }
  }

  public async getJobInfo(jobId: string): Promise<AxiosResponse> {
    try {
      const url = `${this.instanceUrl}/services/data/${this.apiVersion}/jobs/ingest/${jobId}`;
      const reqConfig = {
        url,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      } as AxiosRequestConfig;
      return await this.makeRequest(reqConfig);
    } catch (e) {
      throw _handleError(this.pluginName, `Failed to get job info id=${jobId}, error=${e}`, {
        error: e,
        errorCode: e.response?.status,
        errorStack: e.stack
      });
    }
  }

  public async runSOQL(query: string): Promise<ExecutionOutput> {
    const records: unknown[] = [];
    let nextRecordsUrlFull: string | undefined = undefined;
    let done = false;

    const url = `${this.instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;

    try {
      const resp = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      nextRecordsUrlFull = `${this.instanceUrl}${resp.data.nextRecordsUrl}`;
      done = resp.data.done;
      records.push(...resp.data.records);
    } catch (e) {
      throw _handleError(
        this.pluginName,
        `Error running SOQL query=${query}${e.response?.data ? ', error=' + JSON.stringify(e.response?.data) : ''}`,
        {
          error: e,
          errorCode: e.response?.status,
          errorStack: e.stack
        }
      );
    }

    while (!done) {
      try {
        const resp = await axios.get(nextRecordsUrlFull, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        nextRecordsUrlFull = `${this.instanceUrl}${resp.data.nextRecordsUrl}`;
        done = resp.data.done;
        records.push(...resp.data.records);
      } catch (e) {
        throw _handleError(
          this.pluginName,
          `Error running SOQL query=${query}, ${e.response?.data ? 'error=' + JSON.stringify(e.response?.data) : ''}`,
          {
            error: e,
            errorCode: e.response?.status,
            errorStack: e.stack
          }
        );
      }
    }

    const executionOutput = new ExecutionOutput();
    executionOutput.output = records;
    return executionOutput;
  }
}

export default class SalesforcePlugin extends BasePlugin {
  pluginName = 'Salesforce';

  public async execute({
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput,
    context
  }: PluginExecutionProps<SalesforceDatasourceConfiguration, SalesforceActionConfiguration>): Promise<ExecutionOutput> {
    if (actionConfiguration.salesforceAction?.case === 'soql') {
      const soql = actionConfiguration.salesforceAction?.value as SalesforcePluginV1.Plugin_Soql;
      return await this.handleSOQLAction(soql, datasourceConfiguration, context);
    } else if (actionConfiguration.salesforceAction?.case === 'crud') {
      const crud = actionConfiguration.salesforceAction?.value as SalesforcePluginV1.Plugin_Crud;
      return await this.handleCRUDAction(crud, datasourceConfiguration, context);
    } else if (actionConfiguration.salesforceAction?.case === 'bulk') {
      const bulk = actionConfiguration.salesforceAction?.value as SalesforcePluginV1.Plugin_Bulk;
      return await this.handleBulkAction(bulk, datasourceConfiguration, context);
    } else {
      throw new IntegrationError(`Invalid execute action`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }
  }

  private async handleCRUDAction(
    crud: SalesforcePluginV1.Plugin_Crud,
    datasourceConfiguration: SalesforceDatasourceConfiguration,
    context: ExecutionContext
  ): Promise<ExecutionOutput> {
    const session = await this._getSession(datasourceConfiguration, context);
    switch (crud.action) {
      case SalesforcePluginV1.Plugin_Crud_CrudAction.CREATE:
        return await session.create(crud);
      case SalesforcePluginV1.Plugin_Crud_CrudAction.UPDATE:
        return await session.update(crud);
      case SalesforcePluginV1.Plugin_Crud_CrudAction.READ:
        return await session.read(crud);
      case SalesforcePluginV1.Plugin_Crud_CrudAction.DELETE:
        return await session.delete(crud);
      default:
        throw new IntegrationError(`Unknown CRUD action ${crud.action}`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
    }
  }

  public async handleSOQLAction(
    soql: SalesforcePluginV1.Plugin_Soql,
    datasourceConfiguration: SalesforceDatasourceConfiguration,
    context: ExecutionContext
  ): Promise<ExecutionOutput> {
    const session = await this._getSession(datasourceConfiguration, context);

    return await session.runSOQL(soql.sqlBody);
  }

  private async handleBulkAction(
    bulk: SalesforcePluginV1.Plugin_Bulk,
    datasourceConfiguration: SalesforceDatasourceConfiguration,
    context: ExecutionContext
  ): Promise<ExecutionOutput> {
    const session = await this._getSession(datasourceConfiguration, context);
    const job = new SalesforceBulkJob(session);
    const result = await job.startJob(bulk);
    const out = new ExecutionOutput();
    out.output = result;
    return out;
  }

  // return a salesforce session (with a valid access_token)
  private async _getSession(
    datasourceConfiguration: SalesforceDatasourceConfiguration,
    context?: ExecutionContext
  ): Promise<SalesforceSession> {
    // read token from execution context, orchestrator is responsible for set token to context.globals

    if (context !== undefined && context.globals?.token !== undefined) {
      // TODO remove this if we verify token is never passed in context globals
      this.logger.info('Salesforce token found in context globals');
      return new SalesforceSession(
        context?.globals['token'] as string,
        datasourceConfiguration.connection?.instanceUrl as string,
        API_VERSION
      );
    } else if (datasourceConfiguration.authConfig?.authToken !== undefined) {
      this.logger.info('Salesforce token found in datasourceConfiguration');
      return new SalesforceSession(
        datasourceConfiguration.authConfig?.authToken,
        datasourceConfiguration.connection?.instanceUrl as string,
        API_VERSION
      );
    } else {
      throw new IntegrationError(`No access token provided`, ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName: this.pluginName });
    }
  }

  public getRequest(actionConfiguration: SalesforceActionConfiguration): RawRequest {
    if (actionConfiguration.salesforceAction?.case === 'soql') {
      return actionConfiguration.salesforceAction.value.sqlBody;
    }
    return '';
  }

  public dynamicProperties(): string[] {
    return [
      'salesforceAction.value.sqlBody',
      'salesforceAction.value.resourceId',
      'salesforceAction.value.resourceType',
      'salesforceAction.value.resourceBody'
    ];
  }

  public escapeStringProperties(): string[] {
    return ['salesforceAction.value.sqlBody', 'salesforceAction.value.resourceBody'];
  }

  private async fetchFieldsForObject(session: SalesforceSession, objectName: string, objects: Table[]) {
    try {
      const fields: SalesforcePluginV1.Plugin_Metadata_Object_Field[] = await session.describeObject(objectName);
      const table = new Table(objectName, TableType.TABLE);

      table.columns = fields.map((field) => {
        return new Column(field.name, field.type);
      });

      objects.push(table);
    } catch (e) {
      this.logger.info(`failed to fetch metadata for ${objectName}, err=${JSON.stringify(e)}`);
    }
  }

  public async metadata(datasourceConfiguration: SalesforceDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    const response = {} as DatasourceMetadataDto;
    const session = await this._getSession(datasourceConfiguration);

    const tables: Table[] = [];

    const availableObjects = await session.getAvailableObjects();

    await Promise.all(
      availableObjects.map(async (objectName) => {
        await this.fetchFieldsForObject(session, objectName, tables);
      })
    );

    tables.sort((t1, t2) => {
      if (t1.name < t2.name) return -1;
      if (t1.name > t2.name) return 1;
      return 0;
    });
    response.dbSchema = {
      tables: tables
    };
    return response;
  }

  public async test(datasourceConfiguration: SalesforceDatasourceConfiguration): Promise<void> {
    try {
      const session = await this._getSession(datasourceConfiguration);
      await session.runSOQL('select Id from Contact limit 1');
    } catch (e) {
      throw _handleError(this.pluginName, `Failed to connect to Salesforce, ${e.message}`, {
        error: e,
        errorCode: e.response?.status,
        errorStack: e.stack
      });
    }
  }
}

function _handleError(
  pluginName: string,
  initialMessage: string,
  { error, errorCode, errorMessage, errorStack }: { error?: Error; errorCode?: string | number; errorMessage?: string; errorStack?: string }
): IntegrationError {
  if (error instanceof IntegrationError) {
    return new IntegrationError(`${initialMessage}: ${error?.message ?? errorMessage}`, (error as IntegrationError).code, {
      pluginName,
      ...error.internalCode
    });
  }

  const message = `${initialMessage}: ${error?.message ?? errorMessage}`;

  // these are mapped according to this.makeRequest. We will need to add better error handling there
  // standard HTTP error codes mapped to ErrorCode
  const errorCodeMap: Record<number, ErrorCode> = {
    400: ErrorCode.INTEGRATION_SYNTAX,
    401: ErrorCode.INTEGRATION_AUTHORIZATION,
    403: ErrorCode.INTEGRATION_AUTHORIZATION,
    404: ErrorCode.INTEGRATION_LOGIC,
    408: ErrorCode.INTEGRATION_QUERY_TIMEOUT,
    409: ErrorCode.INTEGRATION_SYNTAX,
    413: ErrorCode.INTEGRATION_SYNTAX,
    429: ErrorCode.INTEGRATION_RATE_LIMIT,
    500: ErrorCode.INTEGRATION_INTERNAL,
    502: ErrorCode.INTEGRATION_INTERNAL,
    504: ErrorCode.INTEGRATION_INTERNAL
  };

  for (const key of Object.keys(errorCodeMap)) {
    const resolvedCode = (error as { code?: string | number })?.code ?? errorCode ?? 0;
    const resolvedCodeAsStr = typeof resolvedCode === 'string' ? (resolvedCode as string) : resolvedCode.toString();
    if (resolvedCodeAsStr === key) {
      return new IntegrationError(message, errorCodeMap[key], { pluginName });
    }
  }

  return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
    code: (error as { code?: string })?.code ?? errorCode,
    pluginName,
    stack: error?.stack ?? errorStack
  });
}
