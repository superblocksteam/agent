import { sanitizeAgentKey } from './file';

describe('sanitizeAgentKey', () => {
  it('mulitple slashes', async () => {
    expect(sanitizeAgentKey('are/you/serious')).toBe('are__you__serious');
  });
  it('slash at beginning', async () => {
    expect(sanitizeAgentKey('/are/you/serious')).toBe('__are__you__serious');
  });
  it('slash at end', async () => {
    expect(sanitizeAgentKey('are/you/serious/')).toBe('are__you__serious__');
  });
  it('mulitple +', async () => {
    expect(sanitizeAgentKey('are+you+serious')).toBe('are--you--serious');
  });
  it('+ at beginning', async () => {
    expect(sanitizeAgentKey('+are+you+serious')).toBe('--are--you--serious');
  });
  it('slash at +', async () => {
    expect(sanitizeAgentKey('are+you+serious+')).toBe('are--you--serious--');
  });
  it('assorted', async () => {
    expect(sanitizeAgentKey('/are+you/serious+')).toBe('__are--you__serious--');
  });
});
