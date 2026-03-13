import type JavascriptWasmPlugin from './index';
import type { ExecutionContext, RequestFile } from '@superblocks/shared';

/**
 * Test helper: execute with the same input shape as the old executeInWorker.
 * Maps to plugin.execute() with actionConfiguration.body and quotas.duration.
 */
export async function executeWithWorkerInput(
  plugin: JavascriptWasmPlugin,
  input: {
    context: ExecutionContext;
    code: string;
    files?: RequestFile[];
    executionTimeout: number;
  }
) {
  return plugin.execute({
    context: input.context,
    actionConfiguration: { body: input.code },
    datasourceConfiguration: {},
    files: input.files,
    quotas: { duration: input.executionTimeout }
  } as unknown as Parameters<JavascriptWasmPlugin['execute']>[0]);
}
