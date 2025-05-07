import {
  DUMMY_EXECUTE_COMMON_PARAMETERS,
  ExecutionOutput,
  GoogleSheetsActionType,
  GoogleSheetsAuthType,
  GoogleSheetsDestinationType,
  GoogleSheetsFormatType,
  IntegrationError
} from '@superblocks/shared';
import { drive_v3, sheets_v4 } from 'googleapis';
import { GoogleAuth, OAuth2Client } from 'googleapis-common';
import GoogleSheetsPlugin, { GoogleClients } from '.';

const stocksBondsPositions = [
  ['Subname', 'ACI', 'ALLY', 'ALV', 'BND', 'AGG', 'LQD'],
  ['Butterfly', '57', '763', '32', '320', '1357', '5305'],
  ['Lion', '23', '426', '501', '439', '5162', '1052'],
  ['Phoenix', '56', '845', '405', '615', '8614', '5006']
];

const stocksBondsPositionsWithExtraHeader = [['Name', 'stocks', 'stocks', 'stocks', 'bonds', 'bonds', 'bonds'], ...stocksBondsPositions];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const googleapis = require('googleapis');
const originalOAuth2 = googleapis.google.auth.OAuth2;
const originalSheetsMock = googleapis.google.sheets;
const originalDriveMock = googleapis.google.drive;

function mockGoogleApis({
  setCredentialsMock,
  revokeCredentialsMock,
  getSpreadsheetMock,
  getMock,
  clearMock,
  appendMock,
  updateMock,
  listFilesMock
}: {
  setCredentialsMock?: jest.Mock;
  revokeCredentialsMock?: jest.Mock;
  getSpreadsheetMock?: jest.Mock;
  getMock?: jest.Mock;
  clearMock?: jest.Mock;
  appendMock?: jest.Mock;
  updateMock?: jest.Mock;
  listFilesMock?: jest.Mock;
}) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const googleapis = require('googleapis');
  const oAuth2Mock = jest.fn().mockImplementation(() => ({
    setCredentials: setCredentialsMock,
    revokeCredentials: revokeCredentialsMock
  }));
  googleapis.google.auth.OAuth2 = oAuth2Mock;
  const googleAuthMock = jest.fn().mockImplementation(() => ({}));
  googleapis.google.auth.GoogleAuth = googleAuthMock;
  const sheetsMock = jest.fn().mockImplementation(() => ({
    spreadsheets: {
      values: { clear: clearMock, update: updateMock, get: getMock, append: appendMock },
      get: getSpreadsheetMock
    }
  }));
  googleapis.google.sheets = sheetsMock;
  const driveMock = jest.fn().mockImplementation(() => ({
    files: { list: listFilesMock }
  }));
  googleapis.google.drive = driveMock;
}

function restoreOriginalGoogleApis() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const googleapis = require('googleapis');
  googleapis.google.auth.OAuth2 = originalOAuth2;
  googleapis.google.sheets = originalSheetsMock;
  googleapis.google.drive = originalDriveMock;
}

function getPlugin(): GoogleSheetsPlugin {
  const plugin: GoogleSheetsPlugin = new GoogleSheetsPlugin();
  // @ts-ignore
  plugin.logger = { debug: (): void => undefined, info: (): void => undefined };
  return plugin;
}

describe('g-sheets read', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();

  test("reading a spreadsheet, that has duplicate column names, don't extract a header from a spreadsheet", async () => {
    const getValuesMock = jest.fn().mockReturnValue({ data: { values: stocksBondsPositionsWithExtraHeader } });
    const sheetsClient = { spreadsheets: { values: { get: getValuesMock } } };
    const readResult = await plugin.readFromSpreadsheet(
      sheetsClient as unknown as sheets_v4.Sheets,
      'sheetId',
      'sheetTitle',
      false,
      GoogleSheetsFormatType.FORMATTED_VALUE
    );
    expect(readResult).toEqual([
      {
        column0: 'Name',
        column1: 'stocks',
        column2: 'stocks',
        column3: 'stocks',
        column4: 'bonds',
        column5: 'bonds',
        column6: 'bonds'
      },
      {
        column0: 'Subname',
        column1: 'ACI',
        column2: 'ALLY',
        column3: 'ALV',
        column4: 'BND',
        column5: 'AGG',
        column6: 'LQD'
      },
      {
        column0: 'Butterfly',
        column1: '57',
        column2: '763',
        column3: '32',
        column4: '320',
        column5: '1357',
        column6: '5305'
      },
      {
        column0: 'Lion',
        column1: '23',
        column2: '426',
        column3: '501',
        column4: '439',
        column5: '5162',
        column6: '1052'
      },
      {
        column0: 'Phoenix',
        column1: '56',
        column2: '845',
        column3: '405',
        column4: '615',
        column5: '8614',
        column6: '5006'
      }
    ]);
  });
  test('reading a spreadsheet, extract a header from the 1st row: happy path', async () => {
    const mockedValues = stocksBondsPositions;
    const getValuesMock = jest
      .fn()
      .mockReturnValueOnce({ data: { values: mockedValues } })
      .mockReturnValueOnce({ data: { values: mockedValues.slice(1) } });
    const sheetsClient = { spreadsheets: { values: { get: getValuesMock } } };
    const readResult = await plugin.readFromSpreadsheet(
      sheetsClient as unknown as sheets_v4.Sheets,
      'sheetId',
      'sheetTitle',
      true,
      GoogleSheetsFormatType.FORMATTED_VALUE
    );
    expect(readResult).toEqual([
      {
        Subname: 'Butterfly',
        ACI: '57',
        ALLY: '763',
        ALV: '32',
        BND: '320',
        AGG: '1357',
        LQD: '5305'
      },
      {
        Subname: 'Lion',
        ACI: '23',
        ALLY: '426',
        ALV: '501',
        BND: '439',
        AGG: '5162',
        LQD: '1052'
      },
      {
        Subname: 'Phoenix',
        ACI: '56',
        ALLY: '845',
        ALV: '405',
        BND: '615',
        AGG: '8614',
        LQD: '5006'
      }
    ]);
    expect(getValuesMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ10000000'
    });
    expect(getValuesMock.mock.calls[1][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A2:ZZZ10000000'
    });
  });

  test('reading a spreadsheet, extract a header from the 1st row: 1st row is empty', async () => {
    const mockedValues = [];
    const getValuesMock = jest.fn().mockReturnValueOnce({ data: { values: mockedValues } });
    const sheetsClient = { spreadsheets: { values: { get: getValuesMock } } };
    await expect(
      plugin.readFromSpreadsheet(
        sheetsClient as unknown as sheets_v4.Sheets,
        'sheetId',
        'sheetTitle',
        true,
        GoogleSheetsFormatType.FORMATTED_VALUE
      )
    ).rejects.toThrow(new IntegrationError(`The specifed row number(1) doesn't have a header.`));
    expect(getValuesMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ10000000'
    });
  });
});

describe('g-sheets read from a range', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();

  test('read from a range: happy path scenario', async () => {
    const setCredentialsMock = jest.fn();
    const getValuesMock = jest.fn();
    getValuesMock.mockReturnValueOnce({
      data: {
        values: stocksBondsPositions
      }
    });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, getMock: getValuesMock });
    const readRangeResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      actionConfiguration: {
        spreadsheetId: 'sheetId',
        sheetTitle: 'sheetTitle',
        action: GoogleSheetsActionType.READ_SPREADSHEET_RANGE
      }
    });
    expect(readRangeResult).toEqual({
      log: [],
      structuredLog: [],
      output: [
        {
          column0: 'Subname',
          column1: 'ACI',
          column2: 'ALLY',
          column3: 'ALV',
          column4: 'BND',
          column5: 'AGG',
          column6: 'LQD'
        },
        {
          column0: 'Butterfly',
          column1: '57',
          column2: '763',
          column3: '32',
          column4: '320',
          column5: '1357',
          column6: '5305'
        },
        {
          column0: 'Lion',
          column1: '23',
          column2: '426',
          column3: '501',
          column4: '439',
          column5: '5162',
          column6: '1052'
        },
        {
          column0: 'Phoenix',
          column1: '56',
          column2: '845',
          column3: '405',
          column4: '615',
          column5: '8614',
          column6: '5006'
        }
      ]
    });
    expect(getValuesMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ10000000'
    });
  });

  test('read from a range: extract 1st row as a header', async () => {
    const setCredentialsMock = jest.fn();
    const getValuesMock = jest.fn();
    getValuesMock
      .mockReturnValueOnce({
        data: {
          values: stocksBondsPositions
        }
      })
      .mockReturnValueOnce({
        data: {
          values: [
            ['Butterfly', '57', '763', '32'],
            ['Lion', '23', '426', '501'],
            ['Phoenix', '56', '845', '405']
          ]
        }
      });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, getMock: getValuesMock });
    const readRangeResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      actionConfiguration: {
        spreadsheetId: 'sheetId',
        sheetTitle: 'sheetTitle',
        action: GoogleSheetsActionType.READ_SPREADSHEET_RANGE,
        range: 'A1:D4',
        extractFirstRowHeader: true
      }
    });
    expect(readRangeResult).toEqual({
      log: [],
      structuredLog: [],
      output: [
        {
          Subname: 'Butterfly',
          ACI: '57',
          ALLY: '763',
          ALV: '32'
        },
        {
          Subname: 'Lion',
          ACI: '23',
          ALLY: '426',
          ALV: '501'
        },
        {
          Subname: 'Phoenix',
          ACI: '56',
          ALLY: '845',
          ALV: '405'
        }
      ]
    });
    expect(getValuesMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ10000000'
    });
    expect(getValuesMock.mock.calls[1][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A2:D4'
    });
  });

  test('read from a range: invalid range', async () => {
    const setCredentialsMock = jest.fn();
    const getValuesMock = jest.fn();
    getValuesMock.mockReturnValueOnce({
      data: {
        values: stocksBondsPositions
      }
    });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, getMock: getValuesMock });
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: {},
        actionConfiguration: {
          spreadsheetId: 'sheetId',
          sheetTitle: 'sheetTitle',
          action: GoogleSheetsActionType.READ_SPREADSHEET_RANGE,
          range: 'XX'
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. The provided range XX is invalid: A1Error: Invalid A1 notation: "XX"`));
  });
});

describe('g-sheets append', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('appending rows to a spreadsheet: happy path scenario', async () => {
    const setCredentialsMock = jest.fn();
    const getValuesMock = jest.fn();
    getValuesMock.mockReturnValueOnce({
      data: {
        values: stocksBondsPositions
      }
    });
    const appendMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, getMock: getValuesMock });
    appendMock.mockReturnValueOnce({
      status: 200,
      data: {
        updates: {
          spreadsheetId: 'sheetId',
          updatedRange: 'sheetTitle!A5:G5',
          updatedRows: 1,
          updatedColumns: 7,
          updatedCells: 7
        }
      }
    });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, getMock: getValuesMock, appendMock: appendMock });
    const appendResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {},
      actionConfiguration: {
        spreadsheetId: 'sheetId',
        sheetTitle: 'sheetTitle',
        action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
        writeToDestinationType: GoogleSheetsDestinationType.APPEND,
        data: JSON.stringify([
          { column0: 'Honeybadger', column1: '489', column2: '341', column3: '79', column4: '43', column5: '30', column6: '89' }
        ])
      }
    });
    expect(appendResult).toEqual({
      log: [],
      structuredLog: [],
      output: {
        spreadsheetId: 'sheetId',
        updatedRange: 'sheetTitle!A5:G5',
        updatedRows: 1,
        updatedColumns: 7,
        updatedCells: 7
      }
    });
    expect(getValuesMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ10000000'
    });
    expect(appendMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: `sheetTitle!A5:ZZZ5`,
      requestBody: {
        range: `sheetTitle!A5:ZZZ5`,
        majorDimension: 'ROWS',
        values: [['Honeybadger', '489', '341', '79', '43', '30', '89']]
      },
      valueInputOption: 'RAW'
    });
  });

  test('appending rows to a spreadsheet: include a header, data with the same schema', async () => {
    const setCredentialsMock = jest.fn();
    const getValuesMock = jest.fn();
    getValuesMock
      .mockReturnValueOnce({
        data: {
          values: stocksBondsPositions
        }
      })
      .mockReturnValueOnce({
        data: {
          values: [['Subname', 'ACI', 'ALLY', 'ALV', 'BND', 'AGG', 'LQD']]
        }
      });
    const appendMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, getMock: getValuesMock });
    appendMock.mockReturnValueOnce({
      status: 200,
      data: {
        updates: {
          spreadsheetId: 'sheetId',
          updatedRange: 'sheetTitle!A5:G5',
          updatedRows: 1,
          updatedColumns: 7,
          updatedCells: 7
        }
      }
    });
    const clearMock = jest.fn();
    clearMock.mockReturnValueOnce({
      status: 200
    });
    const updateMock = jest.fn();
    updateMock.mockReturnValueOnce({
      status: 200
    });
    mockGoogleApis({
      setCredentialsMock: setCredentialsMock,
      clearMock: clearMock,
      updateMock: updateMock,
      getMock: getValuesMock,
      appendMock: appendMock
    });
    const appendResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {},
      actionConfiguration: {
        spreadsheetId: 'sheetId',
        sheetTitle: 'sheetTitle',
        action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
        writeToDestinationType: GoogleSheetsDestinationType.APPEND,
        includeHeaderRow: true,
        data: JSON.stringify([{ Subname: 'Honeybadger', ACI: '489', ALLY: '341', ALV: '79', BND: '43', AGG: '30', LQD: '89' }])
      }
    });
    expect(appendResult).toEqual({
      log: [],
      structuredLog: [],
      output: {
        spreadsheetId: 'sheetId',
        updatedRange: 'sheetTitle!A5:G5',
        updatedRows: 1,
        updatedColumns: 7,
        updatedCells: 7
      }
    });
    expect(getValuesMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ10000000'
    });
    expect(getValuesMock.mock.calls[1][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ1'
    });
    expect(clearMock.mock.calls[0][0]).toEqual({
      range: 'sheetTitle!A1:ZZZ1',
      spreadsheetId: 'sheetId'
    });
    expect(updateMock.mock.calls[0][0]).toEqual({
      range: 'sheetTitle!A1:ZZZ1',
      requestBody: {
        majorDimension: 'ROWS',
        range: 'sheetTitle!A1:ZZZ1',
        values: [['Subname', 'ACI', 'ALLY', 'ALV', 'BND', 'AGG', 'LQD']]
      },
      spreadsheetId: 'sheetId',
      valueInputOption: 'RAW'
    });
    expect(appendMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: `sheetTitle!A5:ZZZ5`,
      requestBody: {
        range: `sheetTitle!A5:ZZZ5`,
        majorDimension: 'ROWS',
        values: [['Honeybadger', '489', '341', '79', '43', '30', '89']]
      },
      valueInputOption: 'RAW'
    });
  });
});

describe('g-sheets create spreadsheet rows', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('writing rows to a spreadsheet: happy path scenario', async () => {
    const setCredentialsMock = jest.fn();
    const clearMock = jest.fn();
    clearMock.mockReturnValueOnce({
      status: 200
    });
    const updateMock = jest.fn();
    updateMock.mockReturnValueOnce({
      status: 200,
      data: {
        spreadsheetId: 'sheetId',
        updatedRange: 'sheetTitle!A2:B2',
        updatedRows: 1,
        updatedColumns: 2,
        updatedCells: 2
      }
    });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, clearMock: clearMock, updateMock: updateMock });
    const writeResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {},
      actionConfiguration: {
        spreadsheetId: 'sheetId',
        sheetTitle: 'sheetTitle',
        action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
        writeToDestinationType: GoogleSheetsDestinationType.ROW_NUMBER,
        rowNumber: '2',
        data: JSON.stringify([{ name: 'AAA', age: 17 }])
      }
    });
    expect(writeResult).toEqual({
      log: [],
      structuredLog: [],
      output: {
        spreadsheetId: 'sheetId',
        updatedRange: 'sheetTitle!A2:B2',
        updatedRows: 1,
        updatedColumns: 2,
        updatedCells: 2
      }
    });
    expect(clearMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A2:ZZZ2'
    });
    expect(updateMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: `sheetTitle!A2:ZZZ2`,
      requestBody: {
        range: `sheetTitle!A2:ZZZ2`,
        majorDimension: 'ROWS',
        values: [['AAA', 17]]
      },
      valueInputOption: 'RAW'
    });
  });
});

describe('g-sheets clear a spreadsheet', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('clear a spreadsheet: happy path scenario', async () => {
    const setCredentialsMock = jest.fn();
    const clearMock = jest.fn();
    clearMock.mockReturnValueOnce({
      status: 200,
      data: {
        spreadsheetId: 'sheetId',
        clearedRange: 'sheetTitle!A1:ZZZ10000000'
      }
    });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, clearMock: clearMock });
    const clearResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {},
      actionConfiguration: {
        spreadsheetId: 'sheetId',
        sheetTitle: 'sheetTitle',
        action: GoogleSheetsActionType.CLEAR_SPREADSHEET
      }
    });
    expect(clearResult).toEqual({
      log: [],
      structuredLog: [],
      output: {
        spreadsheetId: 'sheetId',
        clearedRange: 'sheetTitle!A1:ZZZ10000000'
      }
    });
    expect(clearMock.mock.calls[0][0]).toEqual({
      spreadsheetId: 'sheetId',
      range: 'sheetTitle!A1:ZZZ10000000'
    });
  });
});

describe('g-sheets metadata', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('get a metadata: happy path scenario', async () => {
    const setCredentialsMock = jest.fn();
    const listFilesMock = jest.fn();
    listFilesMock
      .mockReturnValueOnce({
        data: {
          nextPageToken: 'IHaveOneMorePage',
          files: [
            { id: 'id1', name: 'stocks' },
            { id: 'id2', name: 'bonds' }
          ]
        }
      })
      .mockReturnValueOnce({ data: { files: [{ id: 'id3', name: 'etfs' }], nextPageToken: 'IHaveOneMorePage2' } })
      .mockReturnValueOnce({ data: { files: [{ id: 'id4', name: 'blah' }] } });

    mockGoogleApis({ setCredentialsMock: setCredentialsMock, listFilesMock: listFilesMock });
    const metadata = await plugin.metadata({ authConfig: { authToken: 'azaza' } }, {});
    expect(metadata).toEqual({
      dbSchema: {
        tables: [
          {
            id: 'id1',
            name: 'stocks',
            type: 'TABLE',
            columns: []
          },
          {
            id: 'id2',
            name: 'bonds',
            type: 'TABLE',
            columns: []
          }
        ]
      },
      gSheetsNextPageToken: 'IHaveOneMorePage'
    });
    const metadata2 = await plugin.metadata({ authConfig: { authToken: 'azaza' } }, { pageToken: 'IHaveOneMorePage' });

    expect(metadata2).toEqual({
      dbSchema: {
        tables: [
          {
            id: 'id3',
            name: 'etfs',
            type: 'TABLE',
            columns: []
          }
        ]
      },
      gSheetsNextPageToken: 'IHaveOneMorePage2'
    });
    const metadata3 = await plugin.metadata({ authConfig: { authToken: 'azaza' } }, {});
    expect(metadata3).toEqual({
      dbSchema: {
        tables: [
          {
            id: 'id4',
            name: 'blah',
            type: 'TABLE',
            columns: []
          }
        ]
      }
    });

    expect(setCredentialsMock.mock.calls[0][0]).toEqual({ access_token: 'azaza' });
    expect(listFilesMock.mock.calls[0][0]).toEqual({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'nextPageToken, files(id,name)',
      corpora: 'allDrives',
      includeItemsFromAllDrives: true,
      pageSize: 20,
      supportsAllDrives: true
    });
    expect(listFilesMock.mock.calls[1][0]).toEqual({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'nextPageToken, files(id,name)',
      pageToken: 'IHaveOneMorePage',
      corpora: 'allDrives',
      includeItemsFromAllDrives: true,
      pageSize: 20,
      supportsAllDrives: true
    });
  });

  test('fetch sheets for a given spreadsheet: the requested sheet has columns populated, other sheets do not', async () => {
    const setCredentialsMock = jest.fn();
    const listFilesMock = jest.fn();
    listFilesMock
      .mockReturnValueOnce({
        data: {
          nextPageToken: 'IHaveOneMorePage',
          files: [
            { id: 'id1', name: 'stocks' },
            { id: 'id2', name: 'bonds' }
          ]
        }
      })
      .mockReturnValueOnce({ data: { files: [{ id: 'id3', name: 'etfs' }], nextPageToken: 'IHaveOneMorePage2' } })
      .mockReturnValueOnce({ data: { files: [{ id: 'id4', name: 'blah' }] } });

    const getSpreadSheetMock = jest.fn();
    getSpreadSheetMock.mockReturnValueOnce({
      data: {
        sheets: [{ properties: { title: 'sheet1' } }, { properties: { title: 'sheet2' } }],
        properties: { title: 'stocks' }
      }
    });

    mockGoogleApis({
      setCredentialsMock: setCredentialsMock,
      listFilesMock: listFilesMock,
      getSpreadsheetMock: getSpreadSheetMock
    });
    const metadata = await plugin.metadata(
      {
        authConfig: { authToken: 'azaza' }
      },
      { spreadsheetId: 'id1' }
    );

    expect(metadata).toEqual({
      dbSchema: {
        tables: [
          {
            id: 'id1',
            name: 'stocks',
            type: 'TABLE',
            columns: [
              { name: 'sheet1', type: 'column' },
              { name: 'sheet2', type: 'column' }
            ]
          },
          {
            id: 'id2',
            name: 'bonds',
            type: 'TABLE',
            columns: []
          }
        ]
      },
      gSheetsNextPageToken: 'IHaveOneMorePage'
    });
    const metadata2 = await plugin.metadata({ authConfig: { authToken: 'azaza' } }, { pageToken: 'IHaveOneMorePage' });

    expect(metadata2).toEqual({
      dbSchema: {
        tables: [
          {
            id: 'id3',
            name: 'etfs',
            type: 'TABLE',
            columns: []
          }
        ]
      },
      gSheetsNextPageToken: 'IHaveOneMorePage2'
    });
    const metadata3 = await plugin.metadata({ authConfig: { authToken: 'azaza' } }, {});
    expect(metadata3).toEqual({
      dbSchema: {
        tables: [
          {
            id: 'id4',
            name: 'blah',
            type: 'TABLE',
            columns: []
          }
        ]
      }
    });
  });
});

describe('g-sheets test', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('test: happy path scenario', async () => {
    const setCredentialsMock = jest.fn();
    const listFilesMock = jest.fn();
    listFilesMock.mockReturnValueOnce({
      status: 200
    });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, listFilesMock: listFilesMock });
    await plugin.test({ authConfig: { authToken: 'azaza' } });
    expect(setCredentialsMock.mock.calls[0][0]).toEqual({ access_token: 'azaza' });
    expect(listFilesMock.mock.calls[0][0]).toEqual({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      pageSize: 1,
      fields: 'nextPageToken, files(id,name)'
    });
  });
});

describe('g-sheets pre-delete', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('pre-delete: happy path scenario', async () => {
    const setCredentialsMock = jest.fn();
    const revokeCredentialsMock = jest.fn();
    revokeCredentialsMock.mockReturnValueOnce({ status: 200 });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, revokeCredentialsMock: revokeCredentialsMock });
    await plugin.preDelete({ authConfig: { authToken: 'azaza' } });
    expect(setCredentialsMock.mock.calls[0][0]).toEqual({ access_token: 'azaza' });
    expect(revokeCredentialsMock).toBeCalledTimes(1);
  });

  test('pre-delete: service account - should be a no op', async () => {
    const setCredentialsMock = jest.fn();
    const revokeCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock, revokeCredentialsMock });
    await plugin.preDelete({ authType: GoogleSheetsAuthType.SERVICE_ACCOUNT });
    expect(setCredentialsMock).not.toHaveBeenCalled();
    expect(revokeCredentialsMock).not.toHaveBeenCalled();
  });

  test('pre-delete: no access token - should be a no op', async () => {
    const setCredentialsMock = jest.fn();
    const revokeCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock, revokeCredentialsMock });
    await plugin.preDelete({ authType: GoogleSheetsAuthType.oauth2 });
    expect(setCredentialsMock).not.toHaveBeenCalled();
    expect(revokeCredentialsMock).not.toHaveBeenCalled();
  });

  test('pre-delete: revoke credentials returned non 200', async () => {
    const setCredentialsMock = jest.fn();
    const revokeCredentialsMock = jest.fn();
    revokeCredentialsMock.mockReturnValueOnce({ status: 500, data: 'already revoked' });
    mockGoogleApis({ setCredentialsMock: setCredentialsMock, revokeCredentialsMock: revokeCredentialsMock });
    await expect(plugin.preDelete({ authConfig: { authToken: 'azaza' } })).rejects.toThrow(
      new IntegrationError(`Failed to revoke token, unexpected HTTP status: 500, response: already revoked`)
    );
    expect(setCredentialsMock.mock.calls[0][0]).toEqual({ access_token: 'azaza' });
    expect(revokeCredentialsMock).toBeCalledTimes(1);
  });
});

describe('get google clients', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('service account: happy path scenario', async () => {
    mockGoogleApis({});
    const serviceAccount = {
      type: 'service_account',
      project_id: 'superblocks-XXX',
      private_key_id: 'AAA',
      private_key: '-----BEGIN PRIVATE KEY-----line1line2line3-----END PRIVATE KEY-----',
      client_email: 'abc@superblocks.iam.gserviceaccount.com',
      client_id: 'xyz',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/xxx'
    };
    plugin.getGoogleClients({
      authConfig: {
        googleServiceAccount: {
          key: 'googleServiceAccount',
          value: JSON.stringify(serviceAccount)
        },
        scope: 'read write metadata'
      },
      authType: GoogleSheetsAuthType.SERVICE_ACCOUNT
    });
  });

  test('oauth2 access token: happy path scenario, one thread', async () => {
    restoreOriginalGoogleApis();
    const [authClient, driveClient, sheetsClient] = plugin.getGoogleClients({
      authConfig: {
        scope: 'read write metadata',
        authToken: 'xxx'
      },
      authType: GoogleSheetsAuthType.OAUTH2_CODE
    });
    expect((authClient as OAuth2Client).credentials.access_token).toEqual('xxx');
    expect((driveClient.context._options.auth as OAuth2Client).credentials.access_token).toEqual('xxx');
    expect((sheetsClient.context._options.auth as OAuth2Client).credentials.access_token).toEqual('xxx');
  });

  test('oauth2 access token: happy path scenario, multiple thread', async () => {
    restoreOriginalGoogleApis();
    const totalWorkers = 100;
    const allPromises: Promise<[OAuth2Client | GoogleAuth, drive_v3.Drive, sheets_v4.Sheets]>[] = [];
    const expectedTokens = new Set<string>();
    for (let i = 0; i < totalWorkers; i++) {
      const tokenValue = `xxx-${i}`;
      const getGoogleClientPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          const [authClient, driveClient, sheetsClient] = plugin.getGoogleClients({
            authConfig: {
              scope: 'read write metadata',
              authToken: tokenValue
            },
            authType: GoogleSheetsAuthType.OAUTH2_CODE
          });
          resolve([authClient, driveClient, sheetsClient]);
        }, Math.random() * 1000);
      });
      expectedTokens.add(tokenValue);
      allPromises.push(getGoogleClientPromise as Promise<GoogleClients>);
    }
    const clients = await Promise.all(allPromises);
    const authActualTokens = new Set<string>();
    const driveActualTokens = new Set<string>();
    const sheetsActualTokens = new Set<string>();
    clients.forEach((client) => {
      const [authClient, driveClient, sheetsClient] = client;
      authActualTokens.add((authClient as OAuth2Client).credentials.access_token as string);
      driveActualTokens.add((driveClient.context._options.auth as OAuth2Client).credentials.access_token as string);
      sheetsActualTokens.add((sheetsClient.context._options.auth as OAuth2Client).credentials.access_token as string);
    });
    expect(sheetsActualTokens).toEqual(expectedTokens);
  });
});

describe('validations', () => {
  const plugin: GoogleSheetsPlugin = getPlugin();
  test('validate common: no spreadsheet', async () => {
    await expect(
      plugin.execute({ ...DUMMY_EXECUTE_COMMON_PARAMETERS, mutableOutput: new ExecutionOutput(), actionConfiguration: {} })
    ).rejects.toThrow(new IntegrationError(`Request failed. Spreadsheet is required`));
  });

  test('validate common: no sheet title', async () => {
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        actionConfiguration: {
          sheetTitle: 'sheetTitle'
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. Spreadsheet is required`));
  });

  test('validate create rows: write without row number', async () => {
    const setCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock });
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        actionConfiguration: {
          action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
          sheetTitle: 'sheetTitle',
          spreadsheetId: 'sheetId',
          writeToDestinationType: GoogleSheetsDestinationType.ROW_NUMBER
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. Row number is required`));
  });

  test('validate create rows: write row before header', async () => {
    const setCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock });
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        actionConfiguration: {
          action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
          sheetTitle: 'sheetTitle',
          spreadsheetId: 'sheetId',
          writeToDestinationType: GoogleSheetsDestinationType.ROW_NUMBER,
          headerRowNumber: '42',
          rowNumber: '1'
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. Data must be inserted after the table header row number (42)`));
  });

  test('validate create rows: negative row number', async () => {
    const setCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock });
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        actionConfiguration: {
          action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
          sheetTitle: 'sheetTitle',
          spreadsheetId: 'sheetId',
          writeToDestinationType: GoogleSheetsDestinationType.ROW_NUMBER,
          rowNumber: '-2'
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. Row number has to be a positive number`));
  });

  test('validate create rows: included a header without a header row number', async () => {
    const setCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock });
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        actionConfiguration: {
          action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
          sheetTitle: 'sheetTitle',
          spreadsheetId: 'sheetId',
          writeToDestinationType: GoogleSheetsDestinationType.APPEND,
          preserveHeaderRow: true
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. Header row number is required because you are including a header row`));
  });

  test('validate create rows: preserve a negative header number', async () => {
    const setCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock });
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        actionConfiguration: {
          action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
          sheetTitle: 'sheetTitle',
          spreadsheetId: 'sheetId',
          writeToDestinationType: GoogleSheetsDestinationType.APPEND,
          preserveHeaderRow: true,
          headerRowNumber: '-42'
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. Header row number has to be a positive number`));
  });

  test('validate create rows: no write location', async () => {
    const setCredentialsMock = jest.fn();
    mockGoogleApis({ setCredentialsMock: setCredentialsMock });
    await expect(
      plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        actionConfiguration: {
          action: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
          sheetTitle: 'sheetTitle',
          spreadsheetId: 'sheetId'
        }
      })
    ).rejects.toThrow(new IntegrationError(`Request failed. Write location is required`));
  });
});
