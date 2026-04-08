import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PluginsRouter } from './pluginsRouter';

const createMockLogger = () => ({
  child: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
});

const createMockKvStore = () => ({
  read: jest.fn(async () => ({ pinned: { read: 0 }, data: [] }))
});

describe('PluginsRouter', () => {
  let logger: ReturnType<typeof createMockLogger>;
  let kvStore: ReturnType<typeof createMockKvStore>;
  let router: any;

  beforeEach(() => {
    logger = createMockLogger();
    logger.child.mockReturnValue(logger);
    kvStore = createMockKvStore();
    router = new PluginsRouter(logger as never, {} as never);
  });

  it('copies actionConfiguration.preparedStatementContext to execution contexts', async () => {
    const plugin = {
      logger,
      attachLogger: jest.fn(function (this: { logger: unknown }, nextLogger: unknown) {
        this.logger = nextLogger;
      }),
      setupAndExecute: jest.fn(async () => ({}))
    };
    router.registerPlugin('postgres', plugin as never);

    await router.handleExecuteEvent(
      'postgres',
      {
        props: {
          actionConfiguration: {
            body: 'SELECT count(*) FROM release_notes WHERE id = $1',
            preparedStatementContext: [2]
          },
          bindingKeys: [],
          datasourceConfiguration: {},
          executionId: 'exec-1',
          files: [],
          redactedDatasourceConfiguration: {},
          stepName: 'Step1',
          version: 'v2',
          $fileServerUrl: 'http://files',
          $flagWorker: true
        }
      },
      kvStore as never
    );

    expect(plugin.setupAndExecute).toHaveBeenCalledTimes(1);
    const pluginProps = (plugin.setupAndExecute.mock.calls as unknown as any[][])[0][0];
    expect(pluginProps.actionConfiguration.preparedStatementContext).toEqual([2]);
    expect(pluginProps.context.preparedStatementContext).toEqual([2]);
    expect(pluginProps.redactedContext.preparedStatementContext).toEqual([2]);
  });
});
