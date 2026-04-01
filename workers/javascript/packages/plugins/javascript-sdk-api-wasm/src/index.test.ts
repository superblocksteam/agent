// Plugin class tests are covered by the sandbox integration tests
// (test-js-plugins-sandbox-unit) which build all packages first.
// This file validates the module structure only.

jest.mock('@superblocks/shared', () => {
  class LanguagePlugin {
    pluginName = '';
    pluginConfiguration: Record<string, unknown> = {};
  }
  return {
    ErrorCode: { UNSPECIFIED: 'UNSPECIFIED' },
    ExecutionOutput: class { logError() {} },
    IntegrationError: class extends Error {},
    LanguageActionConfiguration: class {},
    LanguagePlugin,
    WorkerPool: { configure: jest.fn(), shutdown: jest.fn() },
  };
});

import JavascriptSdkApiWasmPlugin from './index';

describe('JavascriptSdkApiWasmPlugin', () => {
  it('has the correct plugin name', () => {
    const plugin = new JavascriptSdkApiWasmPlugin();
    expect(plugin.pluginName).toBe('JavaScript SDK API WASM');
  });
});
