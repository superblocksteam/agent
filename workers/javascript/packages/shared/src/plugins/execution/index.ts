export * from './mustache';
export * from './pool';
export * from './pool-integration-executor-client';
export * from './pool-integration-executor-server';
export * from './pool-variable-client';
export * from './pool-variable-server';
export * from './truncate-json';
export * from './types';
export * from './utils';
export * from './variable';
export * from './variable-client';
export * from './vm';
// NOTE: worker-file-utils is intentionally NOT re-exported here because it
// imports deasync (native addon) at the top level. Re-exporting it would
// force every @superblocks/shared consumer to load the native addon, which
// breaks the javascript-wasm plugin's variable tests (deasync interferes
// with the QuickJS WASM event loop). Import directly from
// '@superblocks/shared/dist/src/plugins/execution/worker-file-utils' in
// bootstraps that need prepareGlobalsWithFileMethods.
