import { describe, it } from '@jest/globals';
import { ExecutionContext } from '@superblocks/shared';
import { contextHandler, WriteOp } from '../../../../plugin-property/handlers';
import { PluginProps } from '../../../../plugin-property/plugin-props';
import { BindingType } from '../../../../types';

describe('Test Context Handlers', () => {
  it('Test Read', () => {
    type ReadTest = {
      pluginProps: Pick<PluginProps, 'executionId' | 'bindingKeys' | 'actionConfiguration'>;
      expectedStoreKeysToRead: string[];
      storeValues: object[]; // Mock the store return on keys {@link expectedStoreKeysToRead}
      expectedContext: object;
    };
    const readTests: ReadTest[] = [
      // Only read referenced bindings
      {
        pluginProps: {
          executionId: 'bitcoin-transfer',
          bindingKeys: [
            { key: 'Table1', type: BindingType.Global },
            { key: 'Global', type: BindingType.Global },
            { key: 'Step1', type: BindingType.Output }
          ],
          actionConfiguration: {
            body: 'console.log(Table1.tableData);',
            spreadsheetId: '',
            sheetTitle: ''
          }
        },
        expectedStoreKeysToRead: [`bitcoin-transfer.context.global.Table1`],
        storeValues: [{ action: 'transfer 10000 bitcoins' }],
        expectedContext: {
          globals: { Table1: { action: 'transfer 10000 bitcoins' } },
          outputs: {},
          preparedStatementContext: []
        }
      },
      // Only read output bindings
      {
        pluginProps: {
          executionId: 'litecoin-transfer',
          bindingKeys: [
            { key: 'Table1', type: BindingType.Global },
            { key: 'user', type: BindingType.Global },
            { key: 'Step1', type: BindingType.Output }
          ],
          actionConfiguration: {
            body: 'console.log(Step1.output);'
          }
        },
        expectedStoreKeysToRead: [`litecoin-transfer.context.output.Step1`],
        storeValues: [{ action: 'transfer 10000 litecoins', warning: 'scam' }],
        expectedContext: {
          globals: {},
          outputs: { Step1: { action: 'transfer 10000 litecoins', warning: 'scam' } },
          preparedStatementContext: []
        }
      },
      // Only read global bindings
      {
        pluginProps: {
          executionId: 'bitcoin-cash-transfer',
          bindingKeys: [
            { key: 'Table1', type: BindingType.Global },
            { key: 'Global', type: BindingType.Global },
            { key: 'Step1', type: BindingType.Output }
          ],
          actionConfiguration: {
            body: 'console.log(Global.user);'
          }
        },
        expectedStoreKeysToRead: [`bitcoin-cash-transfer.context.global.Global`],
        storeValues: [{ action: 'transfer 10000 bitcoin cash', warning: { title: 'stop', reason: 'no reason' } }],
        expectedContext: {
          globals: { Global: { action: 'transfer 10000 bitcoin cash', warning: { title: 'stop', reason: 'no reason' } } },
          outputs: {},
          preparedStatementContext: []
        }
      },
      // Read all bindings
      {
        pluginProps: {
          executionId: 'eos-transfer',
          bindingKeys: [
            { key: 'Table1', type: BindingType.Global },
            { key: 'Table2', type: BindingType.Global },
            { key: 'Table3', type: BindingType.Global },
            { key: 'Global', type: BindingType.Global },
            { key: 'Step1', type: BindingType.Output }
          ],
          actionConfiguration: {
            body: 'console.log(Global.user, Table1.output, Table2.output, Global.user, Step1.output);',
            something: { something: 'Table3.output' }
          }
        },
        expectedStoreKeysToRead: [
          `eos-transfer.context.global.Table1`,
          `eos-transfer.context.global.Table2`,
          'eos-transfer.context.global.Table3',
          'eos-transfer.context.global.Global',
          'eos-transfer.context.output.Step1'
        ],
        storeValues: [{ a: '1' }, { b: '2' }, { c: '3' }, { d: '4' }, { e: '5' }],
        expectedContext: {
          globals: { Global: { d: '4' }, Table1: { a: '1' }, Table2: { b: '2' }, Table3: { c: '3' } },
          outputs: { Step1: { e: '5' } },
          preparedStatementContext: []
        }
      },
      // No bindings should be read
      {
        pluginProps: {
          executionId: 'eos-transfer',
          bindingKeys: [
            { key: 'Table1', type: BindingType.Global },
            { key: 'Global', type: BindingType.Global },
            { key: 'Step1', type: BindingType.Output }
          ],
          actionConfiguration: {
            body: 'console.log("Margin call");'
          }
        },
        expectedStoreKeysToRead: [],
        storeValues: [],
        expectedContext: {
          globals: {},
          outputs: {},
          preparedStatementContext: []
        }
      }
    ];

    const run = (test: ReadTest) => {
      const { keys: keys, build: build } = contextHandler.prepareRead(test.pluginProps);
      expect(keys).toEqual(test.expectedStoreKeysToRead);
      const context = build(test.storeValues);
      expect(context).toEqual(test.expectedContext);
    };

    for (const test of readTests) {
      run(test);
    }
  });
  it('Test Write', () => {
    type WriteTest = {
      executionId: string;
      context: object;
      expectWriteOp: WriteOp;
    };
    const tests: WriteTest[] = [
      // Full write
      {
        executionId: 'cars',
        context: {
          globals: {
            Global: {
              jetta: { price: 15000 },
              golf: { price: 18000 }
            }
          },
          outputs: {
            440: { price: 55000 },
            e350: { price: 64000 },
            a6: { price: 61000 }
          },
          LP570: { price: 300000 },
          Bentayga: { price: 200000 }
        },
        expectWriteOp: [
          {
            key: 'cars.context.global.Global',
            value: { jetta: { price: 15000 }, golf: { price: 18000 } }
          },
          { key: 'cars.context.output.440', value: { price: 55000 } },
          { key: 'cars.context.output.e350', value: { price: 64000 } },
          { key: 'cars.context.output.a6', value: { price: 61000 } },
          { key: 'cars.context.global.LP570', value: { price: 300000 } },
          { key: 'cars.context.global.Bentayga', value: { price: 200000 } }
        ]
      },
      // Partial write
      {
        executionId: 'tractors',
        context: {
          outputs: {
            camry: { price: 0 }
          }
        },
        expectWriteOp: [{ key: 'tractors.context.output.camry', value: { price: 0 } }]
      }
    ];
    for (const test of tests) {
      const ops = contextHandler.prepareWrite(test.executionId, test.context as ExecutionContext, 'v1');
      expect(ops).toEqual(test.expectWriteOp);
    }
  });
});
