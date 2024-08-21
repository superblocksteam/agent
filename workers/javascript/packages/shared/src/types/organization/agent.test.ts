import { compareSemVer } from './agent';

describe.only('compareSemver', () => {
  it('should throw error is one of the versions is a number', () => {
    // @ts-ignore
    expect(() => compareSemVer('1.2.3', 1)).toThrowError('Invalid semver 1.');
    // @ts-ignore
    expect(() => compareSemVer(2, '1.2.3')).toThrowError('Invalid semver 2.');
  });

  it('should throw error if one of the versions is not a valid semver', () => {
    expect(() => compareSemVer('1.2.3', '1.2')).toThrowError('Invalid semver 1.2.');
    expect(() => compareSemVer('2.3', '1.2.3')).toThrowError('Invalid semver 2.3.');
  });

  it('should return 0 if the versions are equal', () => {
    expect(compareSemVer('1.2.3', '1.2.3')).toEqual(0);
  });

  it('should return a negative number if version1 is earlier than version2', () => {
    expect(compareSemVer('1.2.3', '1.2.4')).toBeLessThan(0);
    expect(compareSemVer('1.2.3', '1.3.0')).toBeLessThan(0);
    expect(compareSemVer('1.2.3', '2.0.0')).toBeLessThan(0);
  });

  it('should return a positive number if version1 is later than version2', () => {
    expect(compareSemVer('1.2.4', '1.2.3')).toBeGreaterThan(0);
    expect(compareSemVer('1.3.0', '1.2.3')).toBeGreaterThan(0);
    expect(compareSemVer('2.0.0', '1.2.3')).toBeGreaterThan(0);
  });

  it('should support comparison of versions prefixed with v', () => {
    expect(compareSemVer('1.2.3', 'v1.2.3')).toEqual(0);
    expect(compareSemVer('1.1.0', 'v1.2.0')).toEqual(-1);
    expect(compareSemVer('v1.1.0', '1.0.0')).toEqual(1);
    expect(compareSemVer('v1.1.0', 'v1.0.0')).toEqual(1);
  });

  it('should return 0 if the versions are equal', () => {
    expect(compareSemVer('1.2.3', '1.2.3')).toEqual(0);
  });

  it('should correctly process version suffixes', () => {
    expect(compareSemVer('1.4.1-rc.1', '1.4.1-rc.1')).toEqual(0);
    expect(compareSemVer('1.4.2-rc.1', '1.4.1')).toEqual(1);
    expect(compareSemVer('1.4.1-rc.1', '1.4.1')).toEqual(-1);
    expect(compareSemVer('1.4.1-rc.1', '1.4.2')).toEqual(-1);
  });
});
