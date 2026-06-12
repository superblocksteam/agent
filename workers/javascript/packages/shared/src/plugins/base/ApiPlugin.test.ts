import { Code } from '@superblocksteam/types';
import { IntegrationError } from '../../errors';
import { ActionResponseType, DatasourceMetadataDto, ExecutionContext, ExecutionOutput } from '../../types';
import { doesResponseImplementServerSideEvents, ApiPlugin } from './ApiPlugin';
import { PluginExecutionProps, PluginProps } from './BasePlugin';

describe('doesResponseImplementServerSideEvents', () => {
  it.each([
    ['text/event-stream', true],
    ['text/event-stream; charset=utf-8', true],
    ['text/event-stream;charset=utf-8', true],
    ['text/event-stream; charset=utf-8', true],
    ['text/event-stream; charset=utf-8; foo=bar', true],
    ['text/event-stream; charset=utf-8; foo=bar', true],
    ['text/event-stream; charset=utf-8; foo=bar', true],
    ['foo , text/event-stream; charset=utf-8; foo=bar', true],
    ['text/event-frank; charset=utf-8; foo=bar', false],
    ['charset=utf-8; foo=bar', false],
    ['', false]
  ])('works as expected', (contentType, expected) => {
    expect(doesResponseImplementServerSideEvents(contentType)).toBe(expected);
  });
});

describe('ApiPlugin.streamRequest', () => {
  /**
   * Minimal concrete ApiPlugin subclass for testing.
   */
  class TestApiPlugin extends ApiPlugin {
    pluginName = 'TestPlugin';

    dynamicProperties(): string[] {
      return [];
    }

    async execute(_props: PluginExecutionProps): Promise<ExecutionOutput> {
      return new ExecutionOutput();
    }

    async metadata(_datasourceConfiguration: unknown): Promise<DatasourceMetadataDto> {
      return {} as DatasourceMetadataDto;
    }

    async test(): Promise<void> {
      // no-op
    }
  }

  /**
   * Builds a fake SSE response with the given event data strings.
   */
  function makeSseResponse(events: string[]): Response {
    const chunks = events.map((e) => new TextEncoder().encode(`data: ${e}\n\n`));
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'text/event-stream' }
    });
  }

  it('does not resolve until all send() promises have settled', async () => {
    const plugin = new TestApiPlugin();
    const events = ['chunk-1', 'chunk-2', 'chunk-3'];

    // Each send() returns a deferred promise simulating async Redis publish.
    const sendResolvers: Array<() => void> = [];
    const send = jest.fn((_msg: unknown) => {
      return new Promise<void>((resolve) => {
        sendResolvers.push(resolve);
      });
    });

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(makeSseResponse(events));

    try {
      let streamResolved = false;
      const streamPromise = plugin.streamRequest(ActionResponseType.RAW, new Request('http://test.local'), send).then(() => {
        streamResolved = true;
      });

      // Allow the SSE stream to be consumed.
      await new Promise((r) => setTimeout(r, 50));

      // send() was called for each event but promises are still pending.
      expect(send).toHaveBeenCalledTimes(3);
      expect(streamResolved).toBe(false);

      // Resolve all pending send() promises.
      for (const resolve of sendResolvers) {
        resolve();
      }

      await streamPromise;
      expect(streamResolved).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('rejects if any send() rejects', async () => {
    const plugin = new TestApiPlugin();
    const events = ['chunk-1', 'chunk-2'];
    const sendError = new Error('Redis publish failed');

    let callCount = 0;
    const send = jest.fn((_msg: unknown) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve();
      }
      return Promise.reject(sendError);
    });

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue(makeSseResponse(events));

    try {
      await expect(plugin.streamRequest(ActionResponseType.RAW, new Request('http://test.local'), send)).rejects.toThrow(
        'Redis publish failed'
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('BasePlugin.setupAndExecute auth-code propagation', () => {
  class ThrowingApiPlugin extends ApiPlugin {
    pluginName = 'ThrowingPlugin';

    constructor(private readonly toThrow: unknown) {
      super();
    }

    dynamicProperties(): string[] {
      return [];
    }

    getRequest(): undefined {
      return undefined;
    }

    async execute(_props: PluginExecutionProps): Promise<ExecutionOutput> {
      throw this.toThrow;
    }

    async metadata(_datasourceConfiguration: unknown): Promise<DatasourceMetadataDto> {
      return {} as DatasourceMetadataDto;
    }

    async test(): Promise<void> {
      // no-op
    }
  }

  // A plugin that surfaces an auth failure by RETURNING an output (not throwing).
  class ReturningApiPlugin extends ApiPlugin {
    pluginName = 'ReturningPlugin';

    dynamicProperties(): string[] {
      return [];
    }

    getRequest(): undefined {
      return undefined;
    }

    async execute(_props: PluginExecutionProps): Promise<ExecutionOutput> {
      const out = new ExecutionOutput();
      out.logError('Databricks denied the OBO token', true);
      out.integrationErrorCode = Code.INTEGRATION_AUTHORIZATION;
      return out;
    }

    async metadata(_datasourceConfiguration: unknown): Promise<DatasourceMetadataDto> {
      return {} as DatasourceMetadataDto;
    }

    async test(): Promise<void> {
      // no-op
    }
  }

  // Minimal pino-like logger so setupAndExecute's logging does not throw.
  const noopLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(() => noopLogger)
  };

  function makeProps(): PluginProps {
    return {
      context: new ExecutionContext(),
      redactedContext: new ExecutionContext(),
      datasourceConfiguration: {},
      redactedDatasourceConfiguration: {},
      actionConfiguration: {},
      files: undefined,
      agentCredentials: {},
      recursionContext: { executedWorkflowsPath: [], isEvaluatingDatasource: false },
      relayDelegate: undefined
    } as unknown as PluginProps;
  }

  it('captures the integration error code on the execute path', async () => {
    const plugin = new ThrowingApiPlugin(
      new IntegrationError('Databricks denied the OBO token', Code.INTEGRATION_AUTHORIZATION)
    );
    plugin.attachLogger(noopLogger as never);

    const output = await plugin.setupAndExecute(makeProps());

    expect(output.integrationErrorCode).toBe(Code.INTEGRATION_AUTHORIZATION);
    expect(output.error).toBe('Databricks denied the OBO token');
  });

  it('survives the JSON round-trip used to ship the output to the orchestrator', async () => {
    const plugin = new ThrowingApiPlugin(
      new IntegrationError('Databricks denied the OBO token', Code.INTEGRATION_AUTHORIZATION)
    );
    plugin.attachLogger(noopLogger as never);

    const output = await plugin.setupAndExecute(makeProps());
    const roundTripped = ExecutionOutput.fromJSONString(JSON.stringify(output));

    expect(roundTripped.integrationErrorCode).toBe(Code.INTEGRATION_AUTHORIZATION);
  });

  it('leaves integrationErrorCode undefined when the error has no code', async () => {
    const plugin = new ThrowingApiPlugin(new Error('boom'));
    plugin.attachLogger(noopLogger as never);

    const output = await plugin.setupAndExecute(makeProps());

    expect(output.integrationErrorCode).toBeUndefined();
    expect(output.error).toBe('boom');
  });

  it('propagates the integration error code when the plugin RETURNS an output instead of throwing', async () => {
    const plugin = new ReturningApiPlugin();
    plugin.attachLogger(noopLogger as never);

    const output = await plugin.setupAndExecute(makeProps());

    // timedExecute merges a returned output into the wrapper; the code must survive that merge.
    expect(output.integrationErrorCode).toBe(Code.INTEGRATION_AUTHORIZATION);
    expect(output.authError).toBe(true);
    expect(output.error).toBe('Databricks denied the OBO token');
  });
});
