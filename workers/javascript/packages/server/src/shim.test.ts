import { describe, expect, it, jest } from '@jest/globals';
import { Shim } from './shim';

describe('Shim.convertDatasourceConfig', () => {
  it('returns undefined for undefined datasource config in salesforce shim', () => {
    const shim = Object.create(Shim.prototype) as any;
    shim.name = 'salesforce';
    shim._logger = { warn: jest.fn() };

    expect(shim.convertDatasourceConfig(undefined)).toBeUndefined();
    expect(shim._logger.warn).not.toHaveBeenCalled();
  });
});
