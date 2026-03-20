import { doesResponseImplementServerSideEvents, ApiPlugin } from './ApiPlugin';
import { ActionResponseType, DatasourceMetadataDto, ExecutionOutput } from '../../types';
import { PluginExecutionProps } from './BasePlugin';

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
      const streamPromise = plugin
        .streamRequest(ActionResponseType.RAW, new Request('http://test.local'), send)
        .then(() => {
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
      await expect(
        plugin.streamRequest(ActionResponseType.RAW, new Request('http://test.local'), send)
      ).rejects.toThrow('Redis publish failed');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
