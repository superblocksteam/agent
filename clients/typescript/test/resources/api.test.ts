import { mapParams } from '../../src/resources';

describe('api', () => {
  it('map params', async () => {
    const actual = mapParams([{ configuration: { some: 'config' }, name: 'someName', integration: 'someIntegration' }]);
    expect(actual).toEqual([{ configuration: { some: 'config' }, stepName: 'someName', integrationType: 'someIntegration' }]);
  });
  it('should throw an error if the input is not an array', async () => {
    expect(() => mapParams('not an array')).toThrow('expected params to be an array');
    expect(() => mapParams({})).toThrow('expected params to be an array');
    expect(() => mapParams(null)).toThrow('expected params to be an array');
  });
});
