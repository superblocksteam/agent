import A1 from '@flighter/a1-notation';
import {
  BasePlugin,
  Column,
  DatasourceMetadataDto,
  ExecutionOutput,
  GoogleSheetsActionConfiguration,
  GoogleSheetsActionType,
  GoogleSheetsAuthType,
  GoogleSheetsDatasourceConfiguration,
  GoogleSheetsDestinationType,
  GoogleSheetsFormatType,
  IntegrationError,
  PluginExecutionProps,
  Table,
  TableType
} from '@superblocks/shared';
import { drive_v3, google, sheets_v4 } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'googleapis-common';
import { isEmpty } from 'lodash';
import { validateRowsSchema } from './RowSchema';

type CellValueType = boolean | string | number | sheets_v4.Schema$ErrorValue;
export type GoogleClients = [OAuth2Client | GoogleAuth, drive_v3.Drive, sheets_v4.Sheets];

const MAX_A1_RANGE = 'ZZZ10000000'; // static limit based on https://support.google.com/drive/answer/37603
const MAX_COLUMN = 'ZZZ'; // static limit based on https://support.google.com/drive/answer/37603

const COMMON_QUERY = "mimeType='application/vnd.google-apps.spreadsheet'";

// only used by metadata with pagination support
const LIST_FILES_COMMON_FIELDS = {
  fields: 'nextPageToken, files(id,name)',
  corpora: 'allDrives',
  includeItemsFromAllDrives: true,
  supportsAllDrives: true,
  pageSize: 20
};

const TEST_FIELDS = {
  q: "mimeType='application/vnd.google-apps.spreadsheet'",
  fields: 'nextPageToken, files(id,name)',
  pageSize: 1
};

class SheetColumn {
  name: string;
  type: string;
  sourceColumnIndex: number;
}

export default class GoogleSheetsPlugin extends BasePlugin {
  async metadata(
    datasourceConfiguration: GoogleSheetsDatasourceConfiguration,
    actionConfiguration?: GoogleSheetsActionConfiguration
  ): Promise<DatasourceMetadataDto> {
    try {
      const [, driveClient, sheetsClient] = this.getGoogleClients(datasourceConfiguration);
      const tables: Table[] = [];

      // Stage1, find sheets given a spreadsheetId
      // This will show up as the first spreadsheet in dropdown
      if (actionConfiguration?.spreadsheetId) {
        const spreadsheet = await sheetsClient.spreadsheets.get({
          includeGridData: false,
          spreadsheetId: actionConfiguration?.spreadsheetId
        });
        const columns: Column[] = [];
        for (const sheet of spreadsheet.data.sheets ?? []) {
          columns.push({ name: sheet.properties?.title ?? '', type: 'column' });
        }
        tables.push({
          id: actionConfiguration?.spreadsheetId,
          type: TableType.TABLE,
          name: spreadsheet.data.properties?.title ?? '',
          columns: columns
        });
      }
      // Stage2, list spreadsheets with pagination
      // pageToken for the first call will be undefined
      const pageToken = actionConfiguration?.pageToken;
      const keyword = actionConfiguration?.keyword;
      const listQuery = COMMON_QUERY.concat(keyword ? ` and name contains '${keyword}'` : '');
      const result = await driveClient.files.list({
        ...LIST_FILES_COMMON_FIELDS,
        q: listQuery,
        pageToken: pageToken ?? undefined
      });
      const nextPageToken = result.data.nextPageToken;
      for (const file of result.data.files ?? []) {
        if (actionConfiguration && file.id === actionConfiguration.spreadsheetId) {
          continue;
        } else {
          tables.push({
            id: file.id ?? undefined,
            type: TableType.TABLE,
            name: file.name ?? '',
            columns: []
          });
        }
      }
      return Promise.resolve({ dbSchema: { tables: tables }, gSheetsNextPageToken: nextPageToken });
    } catch (err) {
      throw new IntegrationError(`Failed to get metadata: ${err}`);
    }
  }

  async execute({
    datasourceConfiguration,
    actionConfiguration
  }: PluginExecutionProps<GoogleSheetsDatasourceConfiguration, GoogleSheetsActionConfiguration>): Promise<ExecutionOutput> {
    try {
      const googleSheetsAction = actionConfiguration.action;
      const ret = new ExecutionOutput();
      validateCommon(actionConfiguration);
      const [, , sheetsClient] = this.getGoogleClients(datasourceConfiguration);
      this.logger.debug(`google sheets, action=${googleSheetsAction}, config=${JSON.stringify(datasourceConfiguration)}`);
      switch (googleSheetsAction) {
        case GoogleSheetsActionType.READ_SPREADSHEET:
          ret.output = await this.readFromSpreadsheet(
            sheetsClient,
            actionConfiguration.spreadsheetId as string,
            actionConfiguration.sheetTitle as string,
            actionConfiguration.extractFirstRowHeader,
            actionConfiguration.format
          );
          return ret;
        case GoogleSheetsActionType.READ_SPREADSHEET_RANGE:
          validateReadRange(actionConfiguration);
          ret.output = await this.readFromSpreadsheet(
            sheetsClient,
            actionConfiguration.spreadsheetId as string,
            actionConfiguration.sheetTitle as string,
            actionConfiguration.extractFirstRowHeader,
            actionConfiguration.format,
            actionConfiguration.range
          );
          return ret;
        case GoogleSheetsActionType.APPEND_SPREADSHEET:
          // eslint-disable-next-line no-case-declarations
          const jsonDataAppend = validateRowsToAppend(actionConfiguration.data);
          ret.output = await this.writeToSpreadsheet(
            sheetsClient,
            actionConfiguration.spreadsheetId as string,
            actionConfiguration.sheetTitle as string,
            jsonDataAppend,
            GoogleSheetsDestinationType.APPEND,
            1,
            false,
            0
          );
          return ret;
        case GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS:
          // eslint-disable-next-line no-case-declarations
          const jsonDataCreate = validateCreateRows(actionConfiguration);
          ret.output = await this.writeToSpreadsheet(
            sheetsClient,
            actionConfiguration.spreadsheetId as string,
            actionConfiguration.sheetTitle as string,
            jsonDataCreate,
            actionConfiguration.writeToDestinationType as GoogleSheetsDestinationType,
            parseInt(actionConfiguration.rowNumber ?? '2'),
            actionConfiguration.includeHeaderRow ?? false,
            parseInt(actionConfiguration.headerRowNumber ?? '1')
          );
          return ret;
        case GoogleSheetsActionType.CLEAR_SPREADSHEET:
          validateClear(actionConfiguration);
          ret.output = await this.clearSheet(
            sheetsClient,
            actionConfiguration.spreadsheetId as string,
            actionConfiguration.sheetTitle as string,
            actionConfiguration.preserveHeaderRow ?? false,
            parseInt(actionConfiguration.headerRowNumber ?? '1')
          );
          return ret;
      }
      throw new IntegrationError(`${googleSheetsAction} is not supported action`);
    } catch (err) {
      throw new IntegrationError(`Request failed. ${err.message}`);
    }
  }

  async clearSheet(
    sheetsClient: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetTitle: string,
    preserveHeaderRow: boolean,
    headerRowNumber: number
  ): Promise<sheets_v4.Schema$ClearValuesResponse> {
    const rangeToClear = preserveHeaderRow ? `${sheetTitle}!A${headerRowNumber + 1}:${MAX_A1_RANGE}` : `${sheetTitle}!A1:${MAX_A1_RANGE}`;
    const clearResult = await sheetsClient.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: rangeToClear
    });
    if (clearResult.status != 200) {
      throw new IntegrationError(`Failed to clear Google Sheet, unexpected status: ${clearResult.status}`);
    }
    return clearResult.data;
  }

  /**
   *
   * Write or append an array of rows to a given spreadsheet
   *
   * @param {GoogleSheetsDatasourceConfiguration} datasourceConfiguration datasource configuration
   * @param {string} spreadsheetId spreadsheet id
   * @param {string} sheetTitle sheet title
   * @param {unknown[]} jsonData JSON data that should be written to a spreadsheet
   * @param {GoogleSheetsDestinationType} destinationType where data should be written(append/write)
   * @param {number} rowNumber row number where data should be written if destinationType = ROW_NUMBER
   * @param {boolean} includeHeaderRow whether header should be written to a spreadsheet
   * @param {number | undefined} headerRowNumber row number that should be used for a header
   */
  async writeToSpreadsheet(
    sheetsClient: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetTitle: string,
    jsonData: unknown[],
    destinationType: GoogleSheetsDestinationType,
    rowNumber: number,
    includeHeaderRow: boolean,
    headerRowNumber: number
  ): Promise<sheets_v4.Schema$UpdateValuesResponse> {
    let result;
    switch (destinationType) {
      case GoogleSheetsDestinationType.APPEND: {
        result = await this.doAppend(spreadsheetId, sheetTitle, jsonData, sheetsClient, headerRowNumber, includeHeaderRow ?? false);
        break;
      }
      case GoogleSheetsDestinationType.ROW_NUMBER: {
        result = await this.doWrite(spreadsheetId, sheetTitle, jsonData, sheetsClient, headerRowNumber, rowNumber, includeHeaderRow);
        break;
      }
    }
    return result;
  }
  async doWrite(
    spreadsheetId: string,
    sheetTitle: string,
    jsonData: unknown[],
    sheetsClient: sheets_v4.Sheets,
    headerRowNumber: number,
    rowNumber: number,
    includeHeaderRow: boolean
  ): Promise<sheets_v4.Schema$UpdateValuesResponse | undefined> {
    const columnNames = this.extractDataColumns(jsonData);
    if (includeHeaderRow) {
      await this.writeTableHeader(sheetsClient, columnNames, spreadsheetId, sheetTitle, headerRowNumber);
    }
    const rowsData = this.dataToCells(jsonData, columnNames);
    // clear existing rows that will be used for the new rows
    const clearResult = await sheetsClient.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: `${sheetTitle}!A${rowNumber}:${MAX_COLUMN}${rowNumber + rowsData.length - 1}`
    });
    if (clearResult.status != 200) {
      throw new IntegrationError(`Failed to clear data to Google Sheet, unexpected status: ${clearResult.status}`);
    }
    const destinationRange = `${sheetTitle}!A${rowNumber}:${MAX_COLUMN}${rowNumber + rowsData.length - 1}`;
    const requestBody: sheets_v4.Schema$ValueRange = {
      range: destinationRange,
      majorDimension: 'ROWS',
      values: rowsData
    };
    const writeResult = await sheetsClient.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: destinationRange,
      requestBody: requestBody,
      valueInputOption: 'RAW'
    });
    if (writeResult.status != 200) {
      throw new IntegrationError(`Failed to write data to Google Sheet, unexpected status: ${writeResult.status}`);
    }
    return writeResult.data;
  }
  async doAppend(
    spreadsheetId: string,
    sheetTitle: string,
    jsonData: unknown[],
    sheetsClient: sheets_v4.Sheets,
    headerRowNumber: number,
    includeHeaderRow: boolean
  ): Promise<sheets_v4.Schema$UpdateValuesResponse | undefined> {
    const rowsNumber = Math.max(await this.extractSheetRows(spreadsheetId, sheetTitle, sheetsClient), headerRowNumber);
    let allColumns: SheetColumn[];
    if (includeHeaderRow) {
      allColumns = await this.extractAllColumns(spreadsheetId, sheetTitle, sheetsClient, headerRowNumber, jsonData);
      await this.writeTableHeader(sheetsClient, allColumns, spreadsheetId, sheetTitle, headerRowNumber);
    } else {
      allColumns = this.extractDataColumns(jsonData);
    }
    const destinationRange = `${sheetTitle}!A${rowsNumber + 1}:${MAX_COLUMN}${rowsNumber + 1}`;
    const rowsData = this.dataToCells(jsonData, allColumns);
    const requestBody: sheets_v4.Schema$ValueRange = {
      range: destinationRange,
      majorDimension: 'ROWS',
      values: rowsData
    };
    const appendResult = await sheetsClient.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: destinationRange,
      requestBody: requestBody,
      valueInputOption: 'RAW'
    });
    if (appendResult.status != 200) {
      throw new IntegrationError(`Failed to append data to Google Sheet, unexpected status: ${appendResult.status}`);
    }
    return appendResult.data.updates;
  }

  async extractSheetRows(spreadsheetId: string, sheetTitle: string, sheetsClient: sheets_v4.Sheets): Promise<number> {
    const result = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetTitle}!A${1}:${MAX_A1_RANGE}`
    });
    return result.data?.values?.length ?? 0;
  }
  async writeTableHeader(
    sheetsClient: sheets_v4.Sheets,
    headerColumns: SheetColumn[],
    spreadsheetId: string,
    sheetTitle: string,
    headerRowNumber: number
  ): Promise<void> {
    const rangeToClear = `${sheetTitle}!A${headerRowNumber}:${MAX_COLUMN}${headerRowNumber}`;
    const clearResult = await sheetsClient.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: rangeToClear
    });
    if (clearResult.status != 200) {
      throw new IntegrationError(`Failed to clear Google Sheet, unexpected status: ${clearResult.status}`);
    }
    const headerValues = [headerColumns.map((c) => c.name)];
    const headerRange = `${sheetTitle}!A${headerRowNumber}:${MAX_COLUMN}${headerRowNumber}`;
    const requestBody: sheets_v4.Schema$ValueRange = {
      range: headerRange,
      majorDimension: 'ROWS',
      values: headerValues
    };
    const writeResult = await sheetsClient.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: headerRange,
      requestBody: requestBody,
      valueInputOption: 'RAW'
    });
    if (writeResult.status != 200) {
      throw new IntegrationError(`Failed to write table header to Google Sheet, unexpected status: ${writeResult.status}`);
    }
  }

  /**
   * This method extracts columns from array of rows
   * @param {any[]} data array of rows
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractDataColumns(data: any[]): SheetColumn[] {
    if (isEmpty(data)) {
      return [];
    }
    const columnsSet = new Set();
    const columns: SheetColumn[] = [];
    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        columnsSet.add(key);
      });
    });
    columnsSet.forEach((columnName) => {
      columns.push({
        name: columnName as string,
        type: 'sheet',
        sourceColumnIndex: columns.length
      });
    });
    return columns;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataToCells(data: any[], columns: SheetColumn[]): unknown[][] {
    const cells: unknown[][] = [];
    data.forEach((row) => {
      const rowValues: unknown[] = [];
      Object.keys(row).forEach((key) => {
        if (columns.length > 0) {
          const matchingColumn = columns.find((column) => column.name?.toLowerCase() === key?.toLowerCase());
          if (!matchingColumn) {
            throw new IntegrationError(
              `Unexpected key: "${key}". Expected keys are: ${columns
                .filter((c) => c.name)
                .flatMap((c) => `"${c.name}"`)
                .join(', ')}`
            );
          }
          rowValues[matchingColumn.sourceColumnIndex] = row[key];
        } else {
          rowValues.push(row[key]);
        }
      });
      cells.push(rowValues);
    });
    return cells;
  }

  dynamicProperties(): string[] {
    return ['range', 'data', 'rowNumber', 'headerRowNumber'];
  }

  async test(datasourceConfiguration: GoogleSheetsDatasourceConfiguration): Promise<void> {
    try {
      const [, driveClient] = this.getGoogleClients(datasourceConfiguration);
      const result = await driveClient.files.list(TEST_FIELDS);
      if (result.status != 200) {
        throw new IntegrationError(`Failed to test Google Sheet, unexpected status: ${result.status}`);
      }
    } catch (err) {
      throw new IntegrationError(`Client configuration failed. ${err.message}`);
    }
  }

  async preDelete(datasourceConfiguration: GoogleSheetsDatasourceConfiguration): Promise<void> {
    try {
      if (datasourceConfiguration.authType === GoogleSheetsAuthType.SERVICE_ACCOUNT || !datasourceConfiguration?.authConfig?.authToken) {
        // if there is no auth token - nothing to revoke
        return;
      }
      const [authClient, ,] = this.getGoogleClients(datasourceConfiguration);
      const revokationResult = await (authClient as OAuth2Client).revokeCredentials();
      if (revokationResult.status != 200) {
        throw new IntegrationError(
          `Failed to revoke token, unexpected HTTP status: ${revokationResult.status}, response: ${revokationResult.data}`
        );
      }
    } catch (err) {
      const httpCode: string = err.status ?? err.code;
      switch (httpCode) {
        case '400': {
          console.log(`Failed to revoke a token: ${err.message}`);
          break;
        }
        default: {
          throw err;
        }
      }
    }
  }

  async readFromSpreadsheet(
    sheetsClient: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetTitle: string,
    extractFirstRowHeader?: boolean,
    format = GoogleSheetsFormatType.FORMATTED_VALUE,
    range?: string
  ): Promise<CellValueType[]> {
    const params: sheets_v4.Params$Resource$Spreadsheets$Values$Get = {
      spreadsheetId: spreadsheetId
    };
    let columnNamesOffset = 0;
    const columnNames = extractFirstRowHeader ? await this.extractSheetColumns(spreadsheetId ?? '', sheetTitle ?? '', sheetsClient, 1) : [];
    if (range && extractFirstRowHeader) {
      const a1Range = new A1(range);
      // return empty set if user had specified A1:XXX and row 1 is used as Table header
      if (a1Range.getHeight() === 1 && a1Range.getRow() === 1) {
        return this.sheetDataToRecordSet([], format, columnNames, columnNamesOffset);
      }
      // skip 1st row if it's used as a header
      const adjustedRange = a1Range.getRow() === 1 ? a1Range.removeY(-1) : a1Range;
      params.range = `${sheetTitle}!${adjustedRange}`;
      columnNamesOffset = a1Range.getCol() - 1;
    } else if (range) {
      params.range = `${sheetTitle}!${range}`;
    } else if (extractFirstRowHeader) {
      params.range = `${sheetTitle}!A2:${MAX_A1_RANGE}`;
    } else {
      params.range = `${sheetTitle}!A1:${MAX_A1_RANGE}`;
    }
    const result = await sheetsClient.spreadsheets.values.get(params);
    return this.sheetDataToRecordSet(result.data.values ?? [], format, columnNames, columnNamesOffset);
  }

  sheetDataToRecordSet(
    sheetData: unknown[][],
    format: GoogleSheetsFormatType,
    sheetColumns: SheetColumn[],
    columnNamesOffset: number
  ): Record<string, CellValueType>[] {
    const recordsSet: Record<string, CellValueType>[] = [];
    for (let rowIndex = 0; rowIndex < sheetData.length; rowIndex++) {
      const currentRow: Record<string, CellValueType> = {};
      for (let cellIndex = 0; cellIndex < sheetData[rowIndex].length; cellIndex++) {
        let columnName: string;
        if (sheetColumns[cellIndex + columnNamesOffset]) {
          columnName = sheetColumns[cellIndex + columnNamesOffset].name;
        } else {
          columnName = this.toExcelColumnName(cellIndex + columnNamesOffset);
        }
        const cellData = sheetData[rowIndex][cellIndex];
        if (typeof cellData !== 'undefined') {
          currentRow[columnName] = cellData as CellValueType;
        }
      }
      recordsSet.push(currentRow);
    }
    return recordsSet;
  }

  extractExtendedValue(extendedValue: sheets_v4.Schema$ExtendedValue): CellValueType | undefined {
    if (!extendedValue) return;
    return (
      extendedValue.stringValue ??
      extendedValue.numberValue ??
      extendedValue.boolValue ??
      extendedValue.errorValue ??
      extendedValue.formulaValue ??
      undefined
    );
  }

  getGoogleClients(datasourceConfiguration: GoogleSheetsDatasourceConfiguration): GoogleClients {
    let authClient;
    if (datasourceConfiguration.authType === GoogleSheetsAuthType.OAUTH2_CODE && !datasourceConfiguration.authConfig?.authToken) {
      throw new IntegrationError(`Authentication has failed. Please ensure you're connected to your Google account.`);
    } else if (datasourceConfiguration.authType === GoogleSheetsAuthType.SERVICE_ACCOUNT) {
      // TODO(taha) [defer] - Both here and in the bigquery plugin, add validation for the service account
      // credentials object, and log a more descriptive error message
      try {
        const credentials = JSON.parse(datasourceConfiguration.authConfig?.googleServiceAccount?.value ?? '');
        authClient = new google.auth.GoogleAuth({
          credentials,
          scopes: datasourceConfiguration.authConfig?.scope
        });
      } catch (err) {
        throw new IntegrationError(`Failed to parse the service account object. Error:\n${err}`);
      }
    } else {
      authClient = new google.auth.OAuth2({});
      authClient.setCredentials({
        access_token: datasourceConfiguration.authConfig?.authToken
      });
    }
    this.logger.debug(
      `google sheets client, authToken=${datasourceConfiguration.authConfig?.authToken}, authType=${datasourceConfiguration.authType}`
    );
    const driveClient = google.drive({ version: 'v3', auth: authClient });
    const sheetsClient = google.sheets({ version: 'v4', auth: authClient });
    return [authClient, driveClient, sheetsClient];
  }

  async extractSheetColumns(
    spreadsheetId: string,
    sheetTitle: string,
    sheetsClient: sheets_v4.Sheets,
    headerRowNumber: number | undefined
  ): Promise<SheetColumn[]> {
    const columns: SheetColumn[] = [];
    const result = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetTitle}!A${headerRowNumber ?? 1}:${MAX_A1_RANGE}`
    });
    const values = result.data?.values;
    if (headerRowNumber && (!values || values.length == 0)) {
      throw new IntegrationError(`The specifed row number(${headerRowNumber ?? 1}) doesn't have a header.`);
    } else if (values) {
      values[0].forEach((cellData) => {
        columns.push({
          name: cellData,
          type: 'sheet',
          sourceColumnIndex: columns.length
        });
      });
    }
    return columns;
  }

  /**
   * Extracts columns from a header row in spredsheet and data that user is writing
   * @param spreadsheetId spreadsheet id to read a header from
   * @param sheetTitle sheet title to read a header from
   * @param sheetsClient sheets client to use for reading a header row
   * @param headerRowNumber row number to use as a header
   * @param jsonData data that user is writing to the spreadsheet
   * @returns a superset of columns, read from header + columns from user data
   */
  async extractAllColumns(
    spreadsheetId: string,
    sheetTitle: string,
    sheetsClient: sheets_v4.Sheets,
    headerRowNumber: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsonData: any[]
  ): Promise<SheetColumn[]> {
    const columns: SheetColumn[] = [];
    const result = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetTitle}!A${headerRowNumber}:${MAX_COLUMN}${headerRowNumber}`
    });
    const values = result.data?.values;
    if (values && values.length == 1) {
      values[0].forEach((cellData) => {
        columns.push({
          name: cellData,
          type: 'sheet',
          sourceColumnIndex: columns.length
        });
      });
    }
    let missingColumnsIndex = columns.length;
    jsonData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const result = columns.find((column) => column.name === key);
        if (!result) {
          columns.push({ name: key, type: 'sheet', sourceColumnIndex: missingColumnsIndex++ });
        }
      });
    });
    return columns;
  }

  toExcelColumnName(columnIndex: number): string {
    //TODO: convert column index to Excel column name(e.g. 3->C)
    return `column${columnIndex}`;
  }
}

function validateCommon(actionConfiguration: GoogleSheetsActionConfiguration) {
  if (!actionConfiguration.spreadsheetId) {
    throw new IntegrationError(`Spreadsheet is required`);
  }
  if (!actionConfiguration.sheetTitle) {
    throw new IntegrationError(`Sheet name is required`);
  }
}

function validateReadRange(actionConfiguration: GoogleSheetsActionConfiguration) {
  if (actionConfiguration.range) {
    try {
      const a1Range = new A1(actionConfiguration.range);
      if (!A1.isValid(actionConfiguration.range) || actionConfiguration.range != a1Range.toString()) {
        throw new IntegrationError(`The provided range ${actionConfiguration.range} is invalid`);
      }
    } catch (err) {
      throw new IntegrationError(`The provided range ${actionConfiguration.range} is invalid: ${err}`);
    }
  }
}

function validateRowsToAppend(data?: string): unknown[] {
  if (!data) {
    throw new IntegrationError(`Rows to append are required`);
  }
  let jsonData;
  try {
    jsonData = JSON.parse(data);
  } catch (err) {
    throw new IntegrationError(`Failed to parse rows to append as JSON: ${err.message}`);
  }
  try {
    validateRowsSchema(jsonData);
  } catch (err) {
    throw new IntegrationError(`Validation failed for rows to append: ${err.message}`);
  }
  return jsonData;
}

function validateCreateRows(actionConfiguration: GoogleSheetsActionConfiguration): unknown[] {
  if (actionConfiguration.writeToDestinationType === GoogleSheetsDestinationType.ROW_NUMBER) {
    if (!actionConfiguration.rowNumber) {
      throw new IntegrationError(`Row number is required`);
    }
    if (actionConfiguration.headerRowNumber && actionConfiguration.headerRowNumber >= actionConfiguration.rowNumber) {
      throw new IntegrationError(`Data must be inserted after the table header row number (${actionConfiguration.headerRowNumber})`);
    }
    if (parseInt(actionConfiguration.rowNumber) <= 0) {
      throw new IntegrationError(`Row number has to be a positive number`);
    }
  }
  if (actionConfiguration.preserveHeaderRow && !actionConfiguration.headerRowNumber) {
    throw new IntegrationError(`Header row number is required because you are including a header row`);
  }
  if (
    actionConfiguration.preserveHeaderRow &&
    actionConfiguration.headerRowNumber &&
    !isNaN(parseInt(actionConfiguration.headerRowNumber)) &&
    parseInt(actionConfiguration.headerRowNumber) <= 0
  ) {
    throw new IntegrationError(`Header row number has to be a positive number`);
  }
  if (!actionConfiguration.writeToDestinationType) {
    throw new IntegrationError(`Write location is required`);
  }
  return validateRowsToAppend(actionConfiguration.data);
}
function validateClear(actionConfiguration: GoogleSheetsActionConfiguration) {
  if (actionConfiguration.preserveHeaderRow && !actionConfiguration.headerRowNumber) {
    throw new IntegrationError(`Header row number is required because you are including a header row`);
  }
}
