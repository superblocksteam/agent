import { Property, RestApiBodyDataType } from '../types';
import {
  appendParam,
  appendParams,
  extractParamsWithPrefix,
  getApplicationIdFromUrl,
  getScheduledJobIdFromUrl,
  getWorkflowIdFromUrl,
  isApplicationEditUrl,
  isApplicationUrl,
  isScheduledJobUrl,
  isWorkflowUrl,
  makeCurlString,
  paramHasKeyValue
} from './url';

describe('make curl string', () => {
  const reqMethod = 'POST';
  const reqUrl = 'https://foo.bar.baz/api/v1/path';
  const reqHeaders: Property[] = [
    {
      key: 'header1',
      value: 'value1'
    },
    {
      key: 'header2',
      value: 'value2'
    }
  ];
  const reqParams: Property[] = [
    {
      key: 'param1',
      value: 'value1'
    },
    {
      key: 'param2',
      value: 'value2'
    }
  ];
  const reqBody = '{"just": "some-data", "and": {"some": "nested-data"}}';
  const reqFormData: Property[] = [
    {
      key: 'form1',
      value: 'value1'
    },
    {
      key: 'form2',
      value: 'value2'
    }
  ];
  const reqFileName = 'file1.txt';
  const reqFileFormKey = 'file';

  test('renders with form data', () => {
    const reqBodyType = RestApiBodyDataType.FORM;
    const expectedCurlCommand = `curl --location --request POST 'https://foo.bar.baz/api/v1/path?param1=value1&param2=value2' \\
\t--header 'header1: value1' \\
\t--header 'header2: value2' \\
\t--form 'form1="value1"' \\
\t--form 'form2="value2"'`;
    expect(
      makeCurlString({
        reqMethod: reqMethod,
        reqUrl: reqUrl,
        reqHeaders: reqHeaders,
        reqParams: reqParams,
        reqBody: reqBody,
        reqFormData: reqFormData,
        reqBodyType: reqBodyType,
        reqFileName: reqFileName,
        reqFileFormKey: reqFileFormKey
      })
    ).toBe(expectedCurlCommand);
  });

  test('renders with json data', () => {
    const reqBodyType = RestApiBodyDataType.JSON;
    const expectedCurlCommand = `curl --location --request POST 'https://foo.bar.baz/api/v1/path?param1=value1&param2=value2' \\
\t--header 'header1: value1' \\
\t--header 'header2: value2' \\
\t--data-raw '{
    "just": "some-data",
    "and": {
        "some": "nested-data"
    }
}'`;
    expect(
      makeCurlString({
        reqMethod: reqMethod,
        reqUrl: reqUrl,
        reqHeaders: reqHeaders,
        reqParams: reqParams,
        reqBody: reqBody,
        reqFormData: reqFormData,
        reqBodyType: reqBodyType,
        reqFileName: reqFileName,
        reqFileFormKey: reqFileFormKey
      })
    ).toBe(expectedCurlCommand);
  });

  test('renders with file form', () => {
    const reqBodyType = RestApiBodyDataType.FILE_FORM;
    const expectedCurlCommand = `curl --location --request POST 'https://foo.bar.baz/api/v1/path' \\
\t--form 'file="@file1.txt"'`;
    expect(
      makeCurlString({
        reqMethod: reqMethod,
        reqUrl: reqUrl,
        reqHeaders: [],
        reqParams: [],
        reqBody: reqBody,
        reqFormData: reqFormData,
        reqBodyType: reqBodyType,
        reqFileName: reqFileName,
        reqFileFormKey: reqFileFormKey
      })
    ).toBe(expectedCurlCommand);
  });

  test('renders with file form', () => {
    const reqBodyType = RestApiBodyDataType.RAW;
    const reqBody = 'test-raw-body-text';
    const expectedCurlCommand = `curl --location --request POST 'https://foo.bar.baz/api/v1/path' \\
\t--data-raw 'test-raw-body-text'`;
    expect(
      makeCurlString({
        reqMethod: reqMethod,
        reqUrl: reqUrl,
        reqHeaders: [],
        reqParams: [],
        reqBody: reqBody,
        reqFormData: reqFormData,
        reqBodyType: reqBodyType,
        reqFileName: reqFileName,
        reqFileFormKey: reqFileFormKey
      })
    ).toBe(expectedCurlCommand);
  });
});

describe('check param key value', () => {
  test('returns true if has key and value', () => {
    const property: Property = {
      key: 'test-key',
      value: 'test-value'
    };
    expect(paramHasKeyValue(property)).toBe(true);
  });

  test('returns false if has a key but no value', () => {
    const property: Property = {
      key: 'abc',
      value: undefined
    };
    expect(paramHasKeyValue(property)).toBe(false);
  });

  test('handles empty string value', () => {
    const property: Property = {
      key: 'test-key',
      value: ''
    };
    expect(paramHasKeyValue(property)).toBe(false);
  });

  test('handles undefined value', () => {
    const property: Property = {
      key: 'test-key',
      value: undefined
    };
    expect(paramHasKeyValue(property)).toBe(false);
  });

  test('handles undefined', () => {
    expect(paramHasKeyValue(undefined)).toBe(false);
  });
});

describe('url matchers', () => {
  test('can match application urls', () => {
    const validUrl = 'https://example.com/api/v1/applications/foo';
    expect(isApplicationUrl(validUrl)).toBe(true);
    const invalidUrl = 'https://example.com/api/v1/some-path';
    expect(isApplicationUrl(invalidUrl)).toBe(false);
  });

  test('can match application edit urls', () => {
    const validUrl = 'https://example.com/api/v1/applications/foo/bar/baz/edit';
    expect(isApplicationEditUrl(validUrl)).toBe(true);
    const invalidUrl = 'https://example.com/api/v1/applications/foo/bar/baz/view';
    expect(isApplicationEditUrl(invalidUrl)).toBe(false);
  });

  test('can match workflow urls', () => {
    const validUrl = 'https://example.com/api/v1/workflows/foo/bar/baz';
    expect(isWorkflowUrl(validUrl)).toBe(true);
    const invalidUrl = 'https://example.com/api/v1/applications/foo/bar/baz/view';
    expect(isWorkflowUrl(invalidUrl)).toBe(false);
  });

  test('can match scheduled jobs urls', () => {
    const validUrl = 'https://example.com/api/v1/scheduled_jobs/foo/bar/baz';
    expect(isScheduledJobUrl(validUrl)).toBe(true);
    const invalidUrl = 'https://example.com/api/v1/applications/foo/bar/baz/view';
    expect(isScheduledJobUrl(invalidUrl)).toBe(false);
  });

  test('can fetch application id from url', () => {
    const url = 'https://example.com/api/v1/applications/test-application-id/';
    expect(getApplicationIdFromUrl(url)).toBe('test-application-id');
  });

  test('can fetch workflow id from url', () => {
    const url = 'https://example.com/api/v1/workflows/test-workflow-id/';
    expect(getWorkflowIdFromUrl(url)).toBe('test-workflow-id');
  });

  test('can fetch scheduled job id from url', () => {
    const url = 'https://example.com/api/v1/scheduled_jobs/test-scheduled-jobs-id/';
    expect(getScheduledJobIdFromUrl(url)).toBe('test-scheduled-jobs-id');
  });
});

describe('append param', () => {
  test('can append to url without existing params', () => {
    const url = 'https://example.com/path';
    const expected = 'https://example.com/path?key=value';
    expect(appendParam(url, 'key', 'value')).toBe(expected);
  });

  test('can append to url with existing params', () => {
    const url = 'https://example.com/path?key1=value1';
    const expected = 'https://example.com/path?key1=value1&key2=value2';
    expect(appendParam(url, 'key2', 'value2')).toBe(expected);
  });

  test('can append multiple to url without existing params', () => {
    const url = 'https://example.com/path';
    const expected = 'https://example.com/path?key1=value1&key2=value2';
    expect(appendParams(url, { key1: 'value1', key2: 'value2' })).toBe(expected);
  });

  test('can append multiple to url with existing params', () => {
    const url = 'https://example.com/path?key1=value1';
    const expected = 'https://example.com/path?key1=value1&key2=value2&key3=value3';
    expect(appendParams(url, { key2: 'value2', key3: 'value3' })).toBe(expected);
  });
});

describe('extract params', () => {
  test('can extract prefix with params', () => {
    const params = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4',
      ignored1: 'value5',
      ignored2: 'value6'
    };
    const expected = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4'
    };
    expect(extractParamsWithPrefix(params, 'key')).toEqual(expected);
  });
});
