import { getRoleSessionName } from './aws';

describe('aws assume role session name getter', () => {
  test('should remove not accepted chars', async () => {
    const ts = Date.now().toString();
    const result = getRoleSessionName('&Test Integration#', ts);
    expect(result).toEqual(`superblocks-${ts}-TestIntegration`);
  });

  test('should not remove accepted chars', async () => {
    const ts = Date.now().toString();
    const result = getRoleSessionName('Test-Integration', ts);
    expect(result).toEqual(`superblocks-${ts}-Test-Integration`);
  });

  test('should limit max length', async () => {
    const ts = Date.now().toString();
    const datasourceName = 'session-name-that-has-more-than-64-characters-should-be-truncated-to-64-chars';
    expect(datasourceName.length).toBeGreaterThan(64);
    const result = getRoleSessionName(datasourceName, ts);
    expect(result.length).toEqual(64);
  });
});
