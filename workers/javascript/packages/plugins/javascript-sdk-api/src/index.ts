/**
 * JavaScript SDK API Plugin.
 *
 * Executes TypeScript-based APIs defined with @superblocksteam/sdk-api.
 * Bridges the ESM sdk-api package into the VM2 sandbox by injecting
 * `executeApi` and an integration executor bridge as sandbox globals.
 *
 * When `context.includeDiagnostics` is true, the bridge captures per-call
 * timing, truncated input/output, and error data for each integration call.
 * These records are attached to the ExecutionOutput as `diagnostics`.
 */
import {
  ErrorCode,
  EvaluationPair,
  ExecutionOutput,
  getTreePathToDiskPath,
  IntegrationError,
  IntegrationCallDiagnostic,
  LanguageActionConfiguration,
  LanguagePlugin,
  PluginExecutionProps
} from '@superblocks/shared';
import { buildRequireRoot } from './buildRequireRoot';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { executeCode } = require('@superblocksteam/javascript/bootstrap');

/** Maximum byte length for truncated JSON in diagnostic records. */
const DIAGNOSTICS_MAX_BYTES = 10_240;

/** Maximum number of diagnostic records per execution to prevent unbounded growth. */
const DIAGNOSTICS_MAX_ENTRIES = 100;

/**
 * Truncates a value's JSON representation to the specified byte limit.
 *
 * @param value - The value to serialize and truncate
 * @param maxBytes - Maximum byte length of the resulting string
 * @returns Truncated JSON string, or empty string for null/undefined
 */
function truncateJson(value: unknown, maxBytes: number): string {
  if (value == null) return '';
  try {
    const json = JSON.stringify(value);
    if (Buffer.byteLength(json, 'utf8') <= maxBytes) return json;
    // Encode to a buffer and slice at the byte boundary to avoid
    // cutting in the middle of multi-byte characters.
    const buf = Buffer.from(json, 'utf8');
    return buf.subarray(0, maxBytes - 15).toString('utf8') + '...[truncated]';
  } catch {
    const str = String(value);
    const buf = Buffer.from(str, 'utf8');
    return buf.subarray(0, maxBytes).toString('utf8');
  }
}

/**
 * Dynamically imports the ESM @superblocksteam/sdk-api package.
 * Cached after first load to avoid repeated dynamic imports.
 */
let sdkApiPromise: Promise<{ executeApi: (...args: unknown[]) => Promise<unknown> }> | null = null;

function getSdkApi(): Promise<{ executeApi: (...args: unknown[]) => Promise<unknown> }> {
  if (!sdkApiPromise) {
    sdkApiPromise = import('@superblocksteam/sdk-api') as Promise<{
      executeApi: (...args: unknown[]) => Promise<unknown>;
    }>;
  }
  return sdkApiPromise;
}

export default class JavascriptSdkApiPlugin extends LanguagePlugin {
  pluginName = 'JavaScript SDK API';

  async evaluateBindingPairs(
    _code: string,
    _entitiesToExtract: Set<string>,
    _dataContext: Record<string, unknown>
  ): Promise<EvaluationPair[]> {
    // SDK APIs receive pre-bundled code; no binding resolution needed.
    return [];
  }

  async execute({
    context,
    actionConfiguration,
    files,
    quotas
  }: PluginExecutionProps): Promise<ExecutionOutput> {
    const code = (actionConfiguration as LanguageActionConfiguration).body;

    if (!code) {
      const output = new ExecutionOutput();
      output.logError('No code provided for SDK API execution');
      return output;
    }

    const executionTimeout =
      quotas?.duration || Number(this.pluginConfiguration?.javascriptExecutionTimeoutMs ?? 30_000);

    if (!context.kvStore) {
      const output = new ExecutionOutput();
      output.logError('kvStore not available for SDK API execution');
      return output;
    }

    // Load the ESM sdk-api package and extract executeApi.
    const sdkApi = await getSdkApi();

    const includeDiagnostics = Boolean(context.includeDiagnostics);
    const diagnostics: IntegrationCallDiagnostic[] = [];

    // Build the integration executor bridge.
    // This wraps context.integrationExecutor (a GrpcIntegrationExecutor) as a
    // plain async function that can be passed through the VM2 sandbox boundary.
    // The wrapper script calls this with
    // {integrationId, pluginId, actionConfiguration, metadata}.
    //
    // When diagnostics are enabled, the bridge captures timing, truncated
    // input/output, and metadata for each call. This runs in the host
    // (outside the VM2 sandbox) so timing is accurate.
    const integrationExecutorBridge = context.integrationExecutor
      ? async (params: {
          integrationId: string;
          pluginId: string;
          actionConfiguration?: Record<string, unknown>;
          metadata?: { label?: string; description?: string };
        }) => {
          const startMs = includeDiagnostics ? Date.now() : 0;
          let callOutput: unknown;
          let callError = '';
          try {
            // Strip metadata before sending to the integration transport;
            // it is only used for diagnostics on the host side.
            const { metadata: _metadata, ...executionParams } = params;
            const result = await context.integrationExecutor!.executeIntegration(executionParams);
            if (result.error) {
              throw new IntegrationError(result.error, ErrorCode.INTEGRATION_SYNTAX, {
                pluginName: this.pluginName
              });
            }
            callOutput = result.output;
            return result.output;
          } catch (e) {
            callError = (e as Error).message || String(e);
            throw e;
          } finally {
            if (includeDiagnostics && diagnostics.length < DIAGNOSTICS_MAX_ENTRIES) {
              const endMs = Date.now();
              diagnostics.push({
                integrationId: params.integrationId,
                pluginId: params.pluginId,
                input: truncateJson(params.actionConfiguration, DIAGNOSTICS_MAX_BYTES),
                output: truncateJson(callOutput, DIAGNOSTICS_MAX_BYTES),
                startMs,
                endMs,
                durationMs: endMs - startMs,
                error: callError,
                sequence: diagnostics.length,
                metadata: params.metadata
              });
            }
          }
        }
      : undefined;

    const globals = {
      ...(context.globals ?? {}),
      __sb_execute: sdkApi.executeApi,
      __sb_integrationExecutor: integrationExecutorBridge
    };

    const requireRoot = buildRequireRoot();
    const filePaths = getTreePathToDiskPath(context.globals ?? {}, files ?? []);

    const runPromise = executeCode({
      context: {
        ...context,
        globals,
        outputs: context.outputs ?? {},
        variables: context.variables ?? {}
      },
      code,
      filePaths,
      inheritedEnv: [],
      requireRoot
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new IntegrationError(
              `Timed out after ${executionTimeout}ms`,
              ErrorCode.INTEGRATION_QUERY_TIMEOUT,
              { pluginName: this.pluginName }
            )
          ),
        executionTimeout
      );
    });

    try {
      const execOutput = await Promise.race([runPromise, timeoutPromise]);
      if (includeDiagnostics && diagnostics.length > 0) {
        execOutput.diagnostics = diagnostics;
        console.debug('[sdk-api] attaching diagnostics:', diagnostics.length, 'entries');
        diagnostics.forEach((d, i) => {
          console.debug(`[sdk-api] diagnostic[${i}]: integration=${d.integrationId} has_metadata=${!!d.metadata} metadata=${JSON.stringify(d.metadata)}`);
        });
      }
      return execOutput;
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError((err as Error).message, ErrorCode.UNSPECIFIED, {
        pluginName: this.pluginName,
        stack: (err as Error).stack
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
