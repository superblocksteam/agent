import { describe, it } from '@jest/globals';
import { FullPluginPropsBuilder } from '../../../../plugin-property/builder/builders';
import { PluginPropsWriter } from '../../../../plugin-property/delegates/writer';
import { MockKVStore } from '../../../../store/mock';
import { BindingType } from '../../../../types';

describe('Test plugin property writer', () => {
  it('Test Write', async () => {
    const writer = new PluginPropsWriter();
    const store = new MockKVStore();
    const props = {
      actionConfiguration: {
        body: 'console.log(Global.user, Table1.output, Step1.output, Step2.output);',
        something: { something: 'Step3.output' }
      },
      agentCredentials: {},
      bindingKeys: [
        { key: 'Global', type: BindingType.Global },
        { key: 'Table1', type: BindingType.Global },
        { key: 'Step1', type: BindingType.Output },
        { key: 'Step2', type: BindingType.Output },
        { key: 'Step3', type: BindingType.Output }
      ],
      context: {
        globals: { Global: { e: 5 }, Table1: { a: 1 } },
        outputs: { Step1: { b: 2 }, Step2: { c: 3 }, Step3: { d: 4 } },
        preparedStatementContext: []
      },
      datasourceConfiguration: {},
      environment: 'production',
      executionId: 'margin-call',
      files: {},
      recursionContext: { executedWorkflowsPath: [], isEvaluatingDatasource: false },
      redactedContext: undefined,
      redactedDatasourceConfiguration: {},
      relayDelegate: {
        relay: {},
        incomingHeaders: undefined,
        incomingQuery: undefined,
        incomingBody: { relays: {} }
      },
      forwardedCookies: undefined
    };
    const builder = new FullPluginPropsBuilder(props);
    writer.load(builder);
    await writer.writeStore(store);
    const { data: values } = await store.read([
      'margin-call.context.global.Global',
      'margin-call.context.global.Table1',
      'margin-call.context.output.Step1',
      'margin-call.context.output.Step2',
      'margin-call.context.output.Step3'
    ]);
    expect(values).toEqual([{ e: 5 }, { a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }]);
  });
});
