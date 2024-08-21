import { BadRequestError } from '../errors';
import { DatasourceEnvironments, ENVIRONMENT_ALL, ENVIRONMENT_PRODUCTION, ENVIRONMENT_STAGING } from '../types';
import { checkEnvironment, getDefaultDatasourceEnvironment, getDefaultEnvironment } from './environment';

describe('default environment', () => {
  test('returns the correct metadata for environment', () => {
    expect(getDefaultEnvironment(true)).toBe(ENVIRONMENT_PRODUCTION);
    expect(getDefaultDatasourceEnvironment(true)).toBe(DatasourceEnvironments.PRODUCTION);
    expect(getDefaultEnvironment(false)).toBe(ENVIRONMENT_STAGING);
    expect(getDefaultDatasourceEnvironment(false)).toBe(DatasourceEnvironments.STAGING);
  });
});

describe('check environment', () => {
  test('errors when environment is missing', () => {
    expect(() => {
      checkEnvironment('');
    }).toThrowError(BadRequestError);
  });

  test('errors when environment is not valid', () => {
    expect(() => {
      checkEnvironment('foo');
    }).toThrowError(BadRequestError);
  });

  test('accepts valid environments', () => {
    expect(checkEnvironment(ENVIRONMENT_PRODUCTION)).toBe(ENVIRONMENT_PRODUCTION);
    expect(checkEnvironment(ENVIRONMENT_STAGING)).toBe(ENVIRONMENT_STAGING);
    expect(checkEnvironment(ENVIRONMENT_ALL)).toBe(ENVIRONMENT_ALL);
  });
});
