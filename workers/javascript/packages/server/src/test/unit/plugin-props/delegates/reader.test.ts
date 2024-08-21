import { describe, it } from '@jest/globals';
import { RelayDelegate } from '@superblocks/shared';
import { PluginPropsReader } from '../../../../plugin-property/delegates/reader';
import { MockKVStore } from '../../../../store/mock';
import { BindingType } from '../../../../types';

describe('Test plugin property reader', () => {
  it('Test Read', async () => {
    let reader = new PluginPropsReader();
    const store = new MockKVStore();
    reader.loadFromStream({
      props: {
        executionId: 'margin-call',
        bindingKeys: [
          { key: 'Global', type: BindingType.Global },
          { key: 'Table1', type: BindingType.Global },
          { key: 'Step1', type: BindingType.Output },
          { key: 'Step2', type: BindingType.Output },
          { key: 'Step3', type: BindingType.Output }
        ],
        environment: 'production',
        agentCredentials: {},
        redactedDatasourceConfiguration: {},
        actionConfiguration: {
          body: 'console.log(Global.user, Table1.output, Step1.output, Step2.output);',
          something: { something: 'Step3.output' }
        },
        datasourceConfiguration: {},
        files: {},
        recursionContext: {
          executedWorkflowsPath: [],
          isEvaluatingDatasource: false
        },
        $fileServerUrl: 'www.example.com',
        $flagWorker: true,
        relayDelegate: new RelayDelegate({
          body: {
            relays: {}
          }
        })
      }
    });
    await store.writeMany([
      {
        key: `margin-call.context.global.Table1`,
        value: { a: 1 }
      },
      {
        key: `margin-call.context.output.Step1`,
        value: { b: 2 }
      },
      {
        key: 'margin-call.context.output.Step2',
        value: { c: 3 }
      },
      {
        key: 'margin-call.context.output.Step3',
        value: { d: 4 }
      },
      {
        key: 'margin-call.context.global.Global',
        value: { e: 5 }
      }
    ]);
    reader = await reader.loadFromStore(store);
    expect(reader.stats()[1]).toBe(5);
    const props = reader.build();
    expect(props).toEqual({
      actionConfiguration: {
        body: 'console.log(Global.user, Table1.output, Step1.output, Step2.output);',
        something: { something: 'Step3.output' }
      },
      agentCredentials: {},
      bindingKeys: [
        { key: 'Global', type: 'global' },
        { key: 'Table1', type: 'global' },
        { key: 'Step1', type: 'output' },
        { key: 'Step2', type: 'output' },
        { key: 'Step3', type: 'output' }
      ],
      context: {
        globals: { Global: { e: 5 }, $fileServerUrl: 'www.example.com', $flagWorker: true, Table1: { a: 1 } },
        outputs: { Step1: { b: 2 }, Step2: { c: 3 }, Step3: { d: 4 } },
        preparedStatementContext: []
      },
      datasourceConfiguration: {},
      environment: 'production',
      executionId: 'margin-call',
      files: {},
      recursionContext: { executedWorkflowsPath: [], isEvaluatingDatasource: false },
      redactedContext: {
        globals: { Global: { e: 5 }, $fileServerUrl: 'www.example.com', $flagWorker: true, Table1: { a: 1 } },
        outputs: { Step1: { b: 2 }, Step2: { c: 3 }, Step3: { d: 4 } },
        preparedStatementContext: []
      },
      $fileServerUrl: 'www.example.com',
      $flagWorker: true,
      redactedDatasourceConfiguration: {},
      relayDelegate: {
        relay: {},
        incomingHeaders: undefined,
        incomingQuery: undefined,
        incomingBody: { relays: {} }
      },
      forwardedCookies: undefined
    });
  });
});
