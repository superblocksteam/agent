import { describe, expect, it } from '@jest/globals';

import { parsePluginSelection } from './pluginSelection';

describe('parsePluginSelection', () => {
  it('returns all plugins when selection is empty', () => {
    const selected = parsePluginSelection('', ['javascriptsdkapi', 'javascript', 'restapi']);
    expect(selected).toEqual(['javascriptsdkapi', 'javascript', 'restapi']);
  });

  it('parses comma-separated explicit plugin names', () => {
    const selected = parsePluginSelection('javascriptsdkapi,javascript', ['javascriptsdkapi', 'javascript', 'restapi']);
    expect(selected).toEqual(['javascriptsdkapi', 'javascript']);
  });

  it('ignores unknown plugin names', () => {
    const selected = parsePluginSelection('javascriptsdkapi,unknown_plugin', ['javascriptsdkapi', 'javascript']);
    expect(selected).toEqual(['javascriptsdkapi']);
  });
});
