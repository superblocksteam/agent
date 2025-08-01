const { MOCK_OAUTH_SERVER_URL } = require('./utils');

const integrationTestApis = [
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000001',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
        tags: {
          inject: 'true',
        },
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000001',
        },
      },
      signature: {
        data: '83+CwN4q5e923DC7H/kvjn7l19cXb8iLLSetNb7+zz0wZNQcMMXNcPhHVbJQZsmZS8tADbjW1ja1Yg5A/kcdBg==',
      },
      blocks: [
        {
          name: 'VARS_BLOCK',
          variables: {
            items: [
              {
                key: 'VAR_ONE',
                value: '{{ (() => TestInput.nestedKey)() }}',
                type: 'TYPE_ADVANCED',
              },
              {
                key: 'VAR_SELECT',
                value: "{{ 'SELECT' }}",
                type: 'TYPE_ADVANCED',
              },
            ],
          },
        },
        {
          name: 'BLOCK_STEP_WELCOME',
          step: {
            javascript: {
              body: "console.log('Hello!'); return { hello: 'world' }",
            },
          },
        },
        {
          name: 'BLOCK_STEP_PYTHON',
          step: {
            python: {
              body: "print('Python!!')",
            },
          },
        },
        {
          name: 'BLOCK_STEP_POSTGRES',
          step: {
            integration: 'postgres',
            postgres: {
              body: '{{ await VAR_SELECT.get() }} now();',
            },
          },
        },
        {
          name: 'BLOCK_PARALLEL',
          parallel: {
            wait: 'WAIT_ALL',
            static: {
              paths: {
                PATH_ONE: {
                  blocks: [
                    {
                      name: 'BLOCK_PARALLEL_PATH_ONE_STEP',
                      step: {
                        javascript: {
                          body: "console.log('Hello!'); return BLOCK_STEP_POSTGRES.output",
                        },
                      },
                    },
                  ],
                },
                PATH_TWO: {
                  blocks: [
                    {
                      name: 'VARS_BLOCK_TWO',
                      variables: {
                        items: [
                          {
                            key: 'VAR_ONE',
                            value: '{{ BLOCK_STEP_WELCOME.output.hello }}',
                            type: 'TYPE_ADVANCED',
                          },
                        ],
                      },
                    },
                    {
                      name: 'BLOCK_PARALLEL_PATH_TWO_LOOP',
                      loop: {
                        type: 'TYPE_FOR',
                        range: '{{ (await VAR_ONE.get()).length }}',
                        blocks: [
                          {
                            name: 'BLOCK_PARALLEL_PATH_TWO_LOOP_STEP',
                            step: {
                              javascript: {
                                body: "console.log('greco'); return 42;",
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          name: 'BLOCK_CONDITIONAL',
          conditional: {
            if: {
              condition: "{{ await VAR_ONE.get() == 'VAR_ONE_VALUE' }}",
              blocks: [
                {
                  name: 'BLOCK_CONDITIONAL_IF_STEP',
                  step: {
                    javascript: {
                      body: "console.log('I am inside of an IF statement!');",
                    },
                  },
                },
              ],
            },
            else: {
              blocks: [
                {
                  name: 'BLOCK_CONDITIONAL_ELSE_STEP',
                  step: {
                    javascript: {
                      body: "console.log('I am inside of an ELSE statement!');",
                    },
                  },
                },
              ],
            },
          },
        },
        {
          name: 'BLOCK_PARALLEL_ASYNC',
          parallel: {
            wait: 'WAIT_NONE',
            static: {
              paths: {
                PATH_ONE: {
                  blocks: [
                    {
                      name: 'BLOCK_TRYCATCH',
                      tryCatch: {
                        try: {
                          blocks: [
                            {
                              name: 'BLOCK_TRYCATCH_TRY_STEP',
                              step: {
                                javascript: {
                                  body: "throw new Error('RUN THE CATCH BLOCK!!!!')",
                                },
                              },
                            },
                          ],
                        },
                        catch: {
                          blocks: [
                            {
                              name: 'BLOCK_TRYCATCH_CATCH_STEP',
                              step: {
                                javascript: {
                                  body: "console.log('I have caught the error!')",
                                },
                              },
                            },
                          ],
                        },
                        finally: {
                          blocks: [
                            {
                              name: 'BLOCK_TRYCATCH_FINALLY_STEP',
                              step: {
                                javascript: {
                                  body: 'return new Promise((resolve) => setTimeout(resolve, 1000))',
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          name: 'BLOCK_FUNCTION_WAIT',
          wait: {
            condition: "{{ 'BLOCK_PARALLEL_ASYNC' }}",
          },
        },
        {
          name: 'BLOCK_STEP_GOODBYE',
          step: {
            javascript: {
              body: "console.log('Goodbye!'); return { hello: TestInput.nestedKey }",
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      postgres: {
        endpoint: {
          host: 'postgres',
          port: 5432,
        },
        connection: {
          useSsl: false,
          useSelfSignedSsl: false,
        },
        authentication: {
          username: '{{ "post" }}{{ "gres"}}',
          password: 'password',
          custom: {
            databaseName: {
              value: 'postgres',
            },
          },
        },
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000002',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
      },
      signature: {
        data: 'V+Yf28gJAOhpf8dCpgKgfLgK8jdYwMZ16UhbOZuf7H0Dr7Gf8U5WjPfnoN78MwGe1ArVqD6oEm61QyErcBstAg==',
      },
      blocks: [
        {
          name: 'COND',
          conditional: {
            if: {
              condition: '{{ true }}',
              blocks: [
                {
                  name: 'STEP',
                  step: {
                    javascript: {
                      body: "console.log('HI')",
                    },
                  },
                },
              ],
            },
          },
        },
        {
          name: 'js',
          step: {
            javascript: {
              body: 'return 5;',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000003',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
      },
      signature: {
        data: 'vKrR4MRAaYw9QBlO2EEcRi2RUJFKBPvsXxWoT55dY2Jw9Dv3P2SnPrHIxtLNpOVQt2entRt1Xh/BxLMPYigmCw==',
      },
      blocks: [
        {
          name: 'COND',
          conditional: {
            if: {
              condition: '{{ true }}',
              blocks: [
                {
                  name: 'RETURN',
                  return: {
                    data: '{{ true }}',
                  },
                },
                {
                  name: 'STEP',
                  step: {
                    javascript: {
                      body: "console.log('HI');",
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000004',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
      },
      signature: {
        data: 'CTTezueYefhXsh/aXweS9iHSVp/fmCgEJTOHPXFNE8KE5Iwan6fr0mQAjmLYoxdFT763rybeNNKIuEB3WpmDCA==',
      },
      blocks: [
        {
          name: 'THROW',
          throw: {
            error: "{{ 'throwing' }}",
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000004',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
        branch: 'feature-branch-1',
      },
      signature: {
        data: 'EpwN0RBaLBUvOgc4RaXKXo8s9Gln/Lulty+c5FI63pTSasplg8crZS+xkCnc/eDk/bJZPd/zJnLQBfp58R6vBw==',
      },
      blocks: [
        {
          name: 'THROW',
          throw: {
            error: "{{ 'throwing from feature branch 1' }}",
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000006',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
      },
      signature: {
        data: 'W1cxHRQpuYPJdvwmayEqZQRZXTdjsraKH1gnUQ9elv6/ciDcaGlZLVvzsK4nnVpCdhDBMiVRRtVkTQlpY5b2Bw==',
      },
      blocks: [
        {
          name: 'PRE_STEP',
          step: {
            javascript: {
              body: "return 'Frank Basil Greco Jr';",
            },
          },
        },
        {
          name: 'WORKFLOW',
          step: {
            workflow: {
              workflow: '00000000-0000-0000-0000-000000000007',
              queryParams: {
                queryParamOne: {
                  value: '["i should not be evaluated to an array"]',
                },
                queryParamTwo: {
                  value: 'My name is -> {{ PRE_STEP.output }}!',
                },
              },
              custom: {
                bodyParamTwo: {
                  value: 'overridden',
                },
                bodyParamThree: {
                  value: '["bodyParamThreeValue"]',
                },
              },
            },
          },
        },
        {
          name: 'ECHO',
          step: {
            javascript: {
              body: 'return WORKFLOW.output',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000007',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestWorkflow',
      },
      signature: {
        data: 'PrAicgfaPD89V7Rwm3Lyl/2D4q+62ZbhlCNb9pIPF54MEpZ4qHL2CDydAOV625uhSVPyS0JWTQfcrZ66hXlHBQ==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {
              queryParamOne: {
                values: ['queryParamOneDefaultValue'],
              },
              queryParamTwo: {
                values: ['queryParamTwoDefaultValue'],
              },
              queryParamThreeComputed: {
                values: ['{{ 2 + 1 }}'],
              },
            },
            body: {
              bodyParamOne: '{"bodyParamOneDefaultValueKey":"bodyParamOneDefaultValueValue"}',
              bodyParamTwo: '["bodyParamTwoDefaultValue"]',
            },
          },
        },
      },
      blocks: [
        {
          name: 'ECHO',
          step: {
            javascript: {
              body: 'if (body.bodyParamTwo === "fail") { throw new Error("failed"); } return { params, body };',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-1000-000000000006',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
      },
      signature: {
        data: 'TP5RlNSUB9py7pf1qvNXkDcUMxje7gUfNHxDFMMRnjPdsSk+kYix2lx67fKNd9gTXdxhUu6/vU5/DpSmiLLbDA==',
      },
      blocks: [
        {
          name: 'PRE_STEP',
          step: {
            javascript: {
              body: "return [\n\t  {\n    \"creator_events\": 90,\n    \"day\": \"2023-08-03T00:00:00.000000Z\",\n    \"entity_id\": \"8310a43c-9836-4c78-9e17-e5d8fe4463e4\",\n\t\t\"entity_name\": \"Sspiegel's Awesome App\\\" sandbox=&#22;allow-same-origin\\\"\",\n    \"entity_type\": \"application\",\n    \"org_id\": \"d7a9ccbc-6a47-4829-b13d-41ac4cfd6280\",\n    \"region\": \"us\",\n    \"user_email\": \"sspiegel@moveworks.ai\",\n    \"user_id\": \"5092592d-f6c2-4606-a5a0-1b02a32eec07\",\n    \"viewer_events\": 0\n  }\n]",
            },
          },
        },
        {
          name: 'PRE_STEP_2',
          step: {
            javascript: {
              body: 'return PRE_STEP.output',
            },
          },
        },
        {
          name: 'WORKFLOW',
          step: {
            workflow: {
              workflow: '00000000-0000-0000-1000-000000000007',
              queryParams: {
              },
              custom: {
                bodyParamOne: {
                  value: '{{PRE_STEP.output}}',
                },
              },
            },
          },
        },
        {
          name: 'ECHO',
          step: {
            javascript: {
              body: 'return WORKFLOW.output',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-1000-000000000007',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestWorkflow',
      },
      signature: {
        data: 'AYcIPJ3ApuXfDoGg/7rRIc9CKBtCxMVZwuGIskQGx6+//lwjQCc9papPkx9W8ilWtmhyEA93I6KHUcbGGpxWAw==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {},
            body: {
              bodyParamOne: '{"bodyParamOneDefaultValueKey":"bodyParamOneDefaultValueValue"}',
            },
          },
        },
      },
      blocks: [
        {
          name: 'ECHO',
          step: {
            javascript: {
              body: 'return { params, body }',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000008',
        name: 'TryCatch',
        description: 'basic test for the try/catch block',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'q+2F6FB2tSR03acE2oAhFYTHYdpCpOqMbVvnAmKfLAovhz6+t/WB1wie/6UDpX5PX42EB+Eqx9EDsWC6Hp73Ag==',
      },
      blocks: [
        {
          name: 'TryCatch',
          tryCatch: {
            variables: {
              error: 'err',
            },
            try: {
              blocks: [
                {
                  name: 'THROW',
                  step: {
                    javascript: {
                      body: "const obj = {str: 'hello world'};throw new Error('This should fail');return obj;",
                    },
                  },
                },
              ],
            },
            catch: {
              blocks: [
                {
                  name: 'Conditional',
                  conditional: {
                    if: {
                      condition: '{{ err.value === "Error on line 1:\\\\nError: This should fail" }}',
                      blocks: [
                        {
                          name: 'HANDLE_CATCH',
                          step: {
                            javascript: {
                              body: "console.log('If this is logged, it means we caught and identified the error.'); return 'frank';",
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    // NOTE(frank): I'm purposefully omitting the `metadata` and `integrations` fields just to ensure that case is handled.
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000009',
        name: 'WrongScope',
        description: 'fail when trying to access a step output from the wrong scope',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: '6+R8m8kMKc0AlZICL5KnoZ7/5IB1JDtLnD+h2nse8Y96K7rE761tTjcsg5WnCaE1RPTCdNARjlvEw9moUE+6Cw==',
      },
      blocks: [
        {
          name: 'STEP_0',
          step: {
            javascript: {
              body: 'return 5;',
            },
          },
        },
        {
          name: 'Conditional',
          conditional: {
            if: {
              condition: '{{ true }}',
              blocks: [
                {
                  name: 'STEP_1',
                  step: {
                    javascript: {
                      body: 'return 5;',
                    },
                  },
                },
                {
                  name: 'STEP_2',
                  step: {
                    javascript: {
                      body: 'return STEP_1.output;',
                    },
                  },
                },
              ],
            },
          },
        },
        {
          name: 'STEP_3',
          step: {
            javascript: {
              body: 'return STEP_1.output;',
            },
          },
        },
      ],
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'TryCatch',
        description: 'try that throws without catch',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'ng7tNTAIUj0oQ40UZK44kznfKlFTPOuVpyjIJRy5F+lX85biATlsOuYxtkUrQ0EOyCfAKwP6Zog9VPUTNRAACw==',
      },
      blocks: [
        {
          name: 'BLOCK_TRYCATCH',
          tryCatch: {
            variables: {
              error: 'err',
            },
            try: {
              blocks: [
                {
                  name: 'THROW',
                  step: {
                    javascript: {
                      body: "throw new Error('THIS IS AN ERROR')",
                    },
                  },
                },
              ],
            },
            catch: {
              blocks: [], // Additionally, both blocks and catch can be ommitted.
            },
          },
        },
        {
          name: 'POST_CATCH',
          step: {
            javascript: {
              // eslint-disable-next-line no-template-curly-in-string
              body: 'return `successfully handled error with output: ${BLOCK_TRYCATCH.output}`',
            },
          },
        },
      ],
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000011',
        name: 'metadata test',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'hDM5ZFcdxF4tqLgcSYMy/gvhhVbSyNkY73IFXrEKaf5o8llVBeAWJeahv5kh15YYWLVkRiQ8WdB4wdbpmY/BAA==',
      },
      blocks: [
        {
          name: 'produce',
          step: {
            integration: 'kafka-integration-id',
            kafka: {
              operation: 'OPERATION_PRODUCE',
              produce: {
                auto_create_topic: true,
                messages: '[{"topic": "does_not_matter", "value": "value"}]',
              },
            },
          },
        },
      ],
    },
    integrations: {
      'kafka-integration-id': {
        cluster: {
          brokers: 'kafka:9092',
        },
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000012',
        name: 'metadata test (invalid config)',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'hDM5ZFcdxF4tqLgcSYMy/gvhhVbSyNkY73IFXrEKaf5o8llVBeAWJeahv5kh15YYWLVkRiQ8WdB4wdbpmY/BAA==',
      },
      blocks: [
        {
          name: 'produce',
          step: {
            integration: 'kafka-integration-id',
            kafka: {
              operation: 'OPERATION_PRODUCE',
              produce: {
                auto_create_topic: true,
                messages: '[{"topic": "does_not_matter", "value": "value"}]',
              },
            },
          },
        },
      ],
    },
    integrations: {
      'kafka-integration-id': {
        cluster: {
          brokers: 'mars:9092',
        },
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000013',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'MyTestApi',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000001',
        },
      },
      signature: {
        data: 'Z3j6ooKV8cxW547KlTfrfas0OM1CUPmL7PXSr7T4FqLk0cg3+cwOpHILJNl26zdoNHGK3TiqVaojdnl+I3e/AA==',
      },
      blocks: [
        {
          name: 'BLOCK_PARALLEL',
          parallel: {
            wait: 'WAIT_ALL',
            static: {
              paths: {
                PATH_ONE: {
                  blocks: [
                    {
                      name: 'VARS_BLOCK',
                      variables: {
                        items: [],
                      },
                    },
                    {
                      name: 'BLOCK_STEP_POSTGRES',
                      step: {
                        integration: 'postgres',
                        postgres: {
                          body: 'SELECT 1;',
                        },
                      },
                    },
                  ],
                },
                PATH_TWO: {
                  blocks: [
                    {
                      name: 'VARS_BLOCK2',
                      variables: {
                        items: [],
                      },
                    },
                    {
                      name: 'BLOCK_STEP_POSTGRES2',
                      step: {
                        integration: 'postgres',
                        postgres: {
                          body: 'SELECT 1;',
                        },
                      },
                    },
                  ],
                },
                PATH_THREE: {
                  blocks: [
                    {
                      name: 'VARS_BLOCK3',
                      variables: {
                        items: [],
                      },
                    },
                    {
                      name: 'BLOCK_STEP_POSTGRES3',
                      step: {
                        integration: 'postgres',
                        postgres: {
                          body: 'SELECT 1;',
                        },
                      },
                    },
                  ],
                },
                PATH_FOUR: {
                  blocks: [
                    {
                      name: 'VARS_BLOCK4',
                      variables: {
                        items: [],
                      },
                    },
                    {
                      name: 'BLOCK_STEP_POSTGRES4',
                      step: {
                        integration: 'postgres',
                        postgres: {
                          body: 'SELECT 1;',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      postgres: {
        endpoint: {
          host: 'postgres',
          port: 5432,
        },
        connection: {
          useSsl: false,
          useSelfSignedSsl: false,
        },
        authentication: {
          username: '{{ "post" }}{{ "gres"}}',
          password: 'password',
          custom: {
            databaseName: {
              value: 'postgres',
            },
          },
        },
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000014',
        name: 'check auth test',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'HeasLd9VpaTyl1nQuu3i00gi6XJg0FHZx2N8EHEnlWWiSENLsLXeYm9WOUYldf1GhEmbMSPpdR8ID7jSikV6Bw==',
      },
      blocks: [
        {
          name: 'rest',
          step: {
            integration: 'rest-api-integration-id',
            restapiintegration: {
            },
          },
        },
        {
          name: 'rest2',
          step: {
            integration: 'rest-api-integration-id-2',
            restapiintegration: {
            },
          },
        },
      ],
    },
    integrations: {
      'rest-api-integration-id': {
        authType: 'oauth-pword',
        authConfig: {
          clientId: 'clientid',
          clientSecret: 'clientsecret',
          audience: 'aud',
          tokenUrl: `${MOCK_OAUTH_SERVER_URL}/default/token`,
          useFixedPasswordCreds: true,
          username: 'username',
          password: 'password',
        },
      },
      'rest-api-integration-id-2': {
        authType: 'oauth-code',
        authConfig: {
          clientId: 'clientid',
          clientSecret: 'clientsecret',
          audience: 'aud',
          tokenUrl: `${MOCK_OAUTH_SERVER_URL}/default/token`,
          username: 'username',
          password: 'password',
        },
      },
      'rest-api-integration-id-firebase': {
        authType: 'Firebase',
        authConfig: {
          apiKey: '{apiKey: "AIzaSyBkhoJWYlFTy5_23djqCqcOlWK2jdT3xEM", projectId: "kareem-auth-test-1"}',
        },
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000015',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'ThisWorkflowJustEchos',
      },
      signature: {
        data: 'X7K2au4fNMLIiojZiaoK4807+AihSg8+leFfVraVaPUvsZdA3k/BsEl89rqzhEY8jfYy0GT9GBfiihVBQFN9Bw==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {
              queryParamOne: {
                value: 'someTestValueForTheQueryParams',
              },
              queryParamTwo: {
                value: 'someTestValueForTheQueryParams',
              },
              queryParamThree: {
                value: 'someTestValueForTheQueryParams',
              },
            },
            body: {
              bodyParamOne: {
                value: 'someTestValueForTheBodyParam',
              },
              bodyParamTwo: {
                value: 'weShouldAllowOtherBodyParams',
              },
              bodyParamThree: {
                value: 'okayWeAreDone',
              },
            },
          },
        },
      },
      blocks: [
        {
          name: 'ECHO',
          step: {
            javascript: {
              body: 'return { body, params }',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000016',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'WorkflowThatCatchesAnErrorAndReturns',
      },
      trigger: {
        workflow: {},
      },
      signature: {
        data: 'JF7TPU5lRN4dhOJyn0vn169wmxuNnRn23+GGJidb/f06ctPQ7vLubeb+kY5IoYheX8YaEoAZg6Thak9XtSHKDg==',
      },
      blocks: [
        {
          name: 'TryCatch1',
          tryCatch: {
            variables: {
              error: 'error',
            },
            try: {
              blocks: [
                {
                  name: 'Throw1',
                  throw: {
                    error: '{{ "error error error" }}',
                  },
                },
              ],
            },
            catch: {
              blocks: [
                {
                  name: 'Return1',
                  return: {
                    // eslint-disable-next-line no-template-curly-in-string
                    data: '{{ `and the error is: ${error.value}` }}',
                  },
                },
              ],
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000017',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'workflowErrorEncoding',
      },
      signature: {
        data: 'mHX+lblLCI1xxH97xv/1TLeXefNSQFDmmbOpuckgbMrG/15RyleMRtHPdGvR2njTZpx9dT/XwpxBisF4JswDAg==',
      },
      trigger: {
        workflow: {},
      },
      blocks: [
        {
          name: 'ECHO',
          step: {
            javascript: {
              body: 'throw new Error(`""`)',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000018',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'hello',
      },
      signature: {
        data: 'YfMTDpMBjJy2ssPxXDhcPTRVVJ2PXR5Yk9NPlANZmH1cVV4MRRjy+Gzwe2yWL51SNbji8+I3Zvy7nuX+SIBGAA==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {},
            body: {},
          },
        },
      },
      blocks: [
        {
          name: 'ECHO',
          step: {
            javascript: {
              body: 'return params.bodyParamOne',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000019',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'wompwomp',
      },
      signature: {
        data: '0zvBUtvfdyJ4XB5l7iIZM3G761HiMcDaQW4ZksH2O9jBih6z6sMXcF1Xa+O60vvcDw4oyt+onHzdX+3pwTJyCg==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {},
            body: {},
          },
        },
      },
      blocks: [
        {
          name: 'true',
          step: {
            javascript: {
              body: 'return true',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000020',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'wompwomp',
      },
      signature: {
        data: 'FINk7ijBy8pXaWqG7X9PyFxomoXROCU063J41/MTN3Qnddx+TsT/Sxlop4rVaQGli7FdlPEgKAfTCOdiwQIgAA==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {},
            body: {},
          },
        },
      },
      blocks: [
        {
          name: 'true',
          step: {
            javascript: {
              body: 'return {"foobar": "baz"}',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000021',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'wompwomp',
      },
      signature: {
        data: 'wt5uXIZlbp2Hjl7aVi+z5wQfOtWBmDzOj4wrMrYFZEKaascNYNrK/KnQyuoFu+uezTqn9ghWI1m2czkcOkzQDA==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {},
            body: {},
          },
        },
      },
      blocks: [
        {
          name: 'true',
          step: {
            javascript: {
              body: 'return 0.128931421',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000022',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'wompwomp',
      },
      signature: {
        data: 'fzUWCbDh5PmoAcr6FAmgb5rcwa3O3CUoyb2V6gvZUC1pC7MlYDuD7898nsb898/XWGWzRPCkXci8+iLgo/3OCQ==',
      },
      trigger: {
        workflow: {
          parameters: {
            query: {},
            body: {},
          },
        },
      },
      blocks: [
        {
          name: 'true',
          step: {
            javascript: {
              body: 'return',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000023',
        name: 'MyTestApi',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'R6wZvqBDs1kr9TcFL0/IX3yc5Ni03qyYLir+b06+jwt46PNWVfrXr65pinjRYOzOQFygoKmM19DBKV/tCazKBA==',
      },
      trigger: {
        workflow: {
          options: {
            profiles: {},
          },
          parameters: {
            query: {},
            body: {},
          },
        },
      },
      blocks: [
        {
          name: 'Stream1',
          stream: {
            trigger: {
              name: 'Step1',
              step: {
                integration: '9934c5a1-0812-495f-81be-6e31fe994b2d',
                openai: {
                  action: 'Generate ChatGPT Response',
                  generateChatGptResponsePrompt: 'tell me a joke!',
                  transcribeAudioToTextTranslateToEnglish: false,
                  generateChatGPTResponseAiModel: 'gpt-3.5-turbo',
                  generateChatGptResponseMaxTokens: '256',
                  aiModel: 'text-davinci-003',
                },
              },
            },
            process: {
              blocks: [],
            },
            variables: {
              item: 'event',
            },
            options: {
              disableAutoSend: false,
            },
          },
        },
      ],
    },
    integrations: {
      '9934c5a1-0812-495f-81be-6e31fe994b2d': {
        bearerToken: '{{ params.token }}',
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000024',
        organization: '00000000-0000-0000-0000-000000000002',
        name: '1second-workflow',
      },
      signature: {
        data: 'Wz4BxDx98hjR3rE6Y1JVsiMHQeA7T8+q0JCG9HbnI3yfOMP2WvjKQCQi68uhJ0nV0J4ti4PLniRL6xWdHAGYBg==',
      },
      trigger: {
        workflow: {},
      },
      blocks: [
        {
          name: 'true',
          step: {
            javascript: {
              body: 'return new Promise((resolve) => setTimeout(resolve, 1000))',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000025',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'Secrets',
      },
      signature: {
        data: '+OHtvuWQSb4fLXGwXAeQK9+HaaIjnwKA+8yoOUeD1SJPE8FI8KwiZPi/e1K8+iPCWdjeZK8gLHbBlLimolM9AA==',
      },
      trigger: {
        workflow: {},
      },
      blocks: [
        {
          name: 'true',
          step: {
            javascript: {
              body: 'return sb_secrets.foo.bar;',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {},
    stores: {
      secrets: [
        {
          metadata: {
            name: 'foo',
            organization: '00000000-0000-0000-0000-000000000001',
          },
          provider: {
            mock: {
              data: {
                bar: 'this is a secret',
              },
            },
          },
          configuration_id: 'c1',
        },
      ],
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000026',
        name: 'metadata dynamic workflow test',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'TV4fdJT37ExNHYgAROLDRiJtre86IUSgBYvUzqk7LXkEi8h6IBMI8jv3+PzIud/DRcE1bNzp4ELRCWbNvgl6DA==',
      },
      blocks: [
        {
          name: 'rest',
          step: {
            integration: 'rest-api-integration-id',
            restapiintegration: {
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      'rest-api-integration-id': {
        dynamicWorkflowConfiguration: {
          enabled: true,
          workflowId: '00000000-0000-0000-0000-000000000007',
        },
        authType: 'None',
        authConfig: {
          clientId: "{{ !(MyTestWorkflow.response.body.queryParamOne === 'queryParamOneDefaultValue') }}",
        },
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000027',
        name: 'async',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: '/uTUTVDy/penp2xl1TI6vv7i+uIgd0WAyGruCfmV02PZdBzzUFuZWC0agEiXbSwgdisYT0l6Cs9hGVxxHvHxBA==',
      },
      blocks: [
        {
          name: 'step',
          step: {
            javascript: {
              body: 'await new Promise((r) => setTimeout(r, 2000))',
            },
          },
        },
        {
          name: 'insert',
          step: {
            integration: 'postgres',
            postgres: {
              body: "CREATE TABLE greco (who VARCHAR(255)); INSERT INTO greco (who) VALUES ('frank'), ('joey');",
            },
          },
        },
      ],
    },
    integrations: {
      postgres: {
        endpoint: {
          host: 'postgres',
          port: 5432,
        },
        connection: {
          useSsl: false,
          useSelfSignedSsl: false,
        },
        authentication: {
          username: 'postgres',
          password: 'password',
          custom: {
            databaseName: {
              value: 'postgres',
            },
          },
        },
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000028',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'WorkflowProfilePropagation',
      },
      signature: {
        data: 'feDencLstj9DTHF1ZmgY6Tssur18gO/ax3RBGhoDTBh6q/arZRceXwlRdy7V6ImahJJlTl9/nSe4nTkXjOoaAQ==',
      },
      blocks: [
        {
          name: 'ECHO',
          step: {
            javascript: {
              // eslint-disable-next-line no-template-curly-in-string
              body: 'let expectedProfile = "staging"; if (params.profile !== expectedProfile) { throw new Error(`failed, expected "${expectedProfile}" but got "${params.profile}"`); } return { params, body };',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000029',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'TestApi1',
        path: '/pages/Page 2/apis/TestApi1/api.json',
        commitId: '8c3f54b6a4f9c16a24bfa8397499ed577f7931ac',
      },
      signature: {
        data: 'pgqNTDxjk5l+EeAWD2Vh793330J9lJtOsqRTrmNryJD1juLDdgBYIrPjjJMXja5nzKIza9GJFHDoshrPgbHoBA==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            javascript: {
              body: "return 'hello path based api world!!! (from a commit)';",
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000030',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'TestApi1',
        path: '/pages/Page 2/apis/TestApi1/api.json',
        branch: 'jdoe/test-branch',
      },
      signature: {
        data: 'n6//XLSyG4zD//wXXtu2l/DZjb49u0mS43YwZwc0iVL/7pKZnz3cehon0I9HCgMVFKmw9zImUq/gnLqQCtWQBg==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            javascript: {
              body: "return 'hello path based api world!!! (from a branch)';",
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000031',
        name: 'generic workflow',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'COj5QcisvF9fT258amCjPIGkZgZI1/+wWhg3XG1qXh7x5C8IgqU/vfbheHc8WlVUW8oLGThiASCPsTcl5+vDAw==',
      },
      trigger: {
        workflow: {},
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            integration: 'javascript',
            javascript: {
              body: "return 'foobarbaz from a workflow';",
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      javascript: {
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000032',
        name: 'generic app api',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'z2tTjckCyLTv/4DRsDch6UCJPpFkfFVGkJF5EscmbwgwLjcQMgPBn6AjV9rVCiPclYfje/NYRvl+HCS3kN43CA==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            integration: 'javascript',
            javascript: {
              body: "return 'foobarbaz from an app api';",
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      javascript: {
      },
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000033',
        name: 'generic scheduled job',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: '451UIQcgvvf4aTx16eF0snTCk0jMcBHnhadL3ll+82jf32/2lGJAnWwqsN2VNC/S/iSr0TngHW0e3xv5kZJ2Dg==',
      },
      trigger: {
        job: { frequency: 1, day_of_month: 1 },
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            integration: 'javascript',
            javascript: {
              body: "return 'foobarbaz from a scheduled job';",
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      javascript: {
      },
    },
  },
  // public app api
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000034',
        name: 'public app api',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'Bx1pMTu//k0wwKld2b/twcLg5qFvKTgVrBwOoPrj7d5JoBm8jbJYvpSZTo5alwHDoPn5YsD1zREEyT3C5bghAQ==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            integration: 'javascript',
            javascript: {
              body: "return 'foobarbaz from a public app api';",
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      javascript: {
      },
    },
  },
  // Global
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000035',
        name: 'app api that returns Global',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'JSCml/IxbLg1EkbODeOVInWI17KAVK+B3il9EhSKD8E6nrwAKsZpmAjVL81YX9Rqwiq+xrrrfGNZbPXzCG9PBQ==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            integration: 'javascript',
            javascript: {
              body: 'return Global;',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      javascript: {},
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000036',
        name: 'public app api that returns Global',
        organization: '00000000-0000-0000-0000-000000000001',
      },
      signature: {
        data: 'JSCml/IxbLg1EkbODeOVInWI17KAVK+B3il9EhSKD8E6nrwAKsZpmAjVL81YX9Rqwiq+xrrrfGNZbPXzCG9PBQ==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'Step1',
          step: {
            integration: 'javascript',
            javascript: {
              body: 'return Global;',
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
    integrations: {
      javascript: {},
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000037',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'TestApi2',
        path: '/pages/Page 2/apis/TestApi2/api.yaml',
        commitId: 'b4ab11cd51d1435b7d4d19de1c3084c30dae5b5e',
      },
      signature: {
        data: 'JxlkAGF+IQEND5oqfl/lZU9sfzAF8kNpReaGanNdnCRnFu795LfsKc+YnAEmqyGzi3stQppO+V/zlSr/xaHfAw==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'VARS_BLOCK',
          variables: {
            items: [
              {
                key: 'VAR_ONE',
                value: '`var_${2 - 1}`',
                type: 'TYPE_ADVANCED',
              },
            ],
          },
        },
        {
          name: 'Step1',
          step: {
            javascript: {
              body: 'return `VAR_ONE: ${await VAR_ONE.get()}`;',
            },
          },
        },
        {
          name: 'BLOCK_CONDITIONAL',
          conditional: {
            if: {
              condition: "await VAR_ONE.get() == 'var_1'",
              blocks: [
                {
                  name: 'BLOCK_CONDITIONAL_IF_STEP',
                  step: {
                    javascript: {
                      body: "return 'hello path based api world!!! (from a commit)';",
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    metadata: {
      profile: 'production',
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000038',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'TestApi3',
        path: '/pages/Page 2/apis/TestApi3/api.yaml',
        commitId: '0136102ea4d6a7ad2d112063e88955843ca9efe2',
      },
      signature: {
        data: 'NqhHqcQhQXu+SwA8IvGjaAUkBRlhFnOuKdImb4rWszAdYmOnxU78uObaVOsuxsFFqCNM4FWVKlNoklHK1NcXBw==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'VARS_BLOCK',
          variables: {
            items: [
              {
                key: 'MAX_AGE',
                value: '(() => 2 * 10 + 9)()',
                type: 'TYPE_ADVANCED',
              },
            ],
          },
        },
        {
          name: 'GetUsers',
          step: {
            integration: 'postgres',
            postgres: {
              body: '`\nSELECT\n\tname,\n\tage\nFROM mytable\nWHERE age < ${await MAX_AGE.get()}\nLIMIT 1\n`',
              usePreparedSql: false,
              operation: 'run_sql',
            },
          },
        },
      ],
    },
    integrations: {
      postgres: {
        endpoint: {
          host: 'postgres',
          port: 5432,
        },
        connection: {
          useSsl: false,
          useSelfSignedSsl: false,
        },
        authentication: {
          username: '`post${"gres"}`',
          password: 'password',
          custom: {
            databaseName: {
              value: 'postgres',
            },
          },
        },
        bindingFields: [
          'authentication.username',
          'custom.databaseName.value',
        ],
      },
    },
    metadata: {
      profile: 'production',
    },
  },
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000039',
        organization: '00000000-0000-0000-0000-000000000001',
        name: 'TestApi4',
        path: '/pages/Page 2/apis/TestApi4/api.yaml',
        commitId: 'a5071fd465bd98175b14ed01f9069dc7ab79b0ec',
      },
      signature: {
        data: 'Dy7a/ZK5Mx1/gwVPYAmEi5V5FBZj4vGADCOtzCadqajuIX607V6wp3lTGHlKKR8rSaIl4GzeFHCdTNbyBol0Bg==',
      },
      trigger: {
        application: {
          id: '00000000-0000-0000-0000-000000000002',
        },
      },
      blocks: [
        {
          name: 'VARS_BLOCK',
          variables: {
            items: [
              {
                key: 'MAX_AGE',
                value: '(() => 2 * 10 + 9)()',
                type: 'TYPE_ADVANCED',
              },
            ],
          },
        },
        {
          name: 'PostmanEchoGet',
          step: {
            restapi: {
              body: '',
              path: 'https://postman-echo.com/get',
              params: [
                {
                  key: 'max_age',
                  value: '`${await MAX_AGE.get()}`',
                  valueOptions: [],
                },
              ],
              headers: [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                  valueOptions: [],
                },
                {
                  key: '',
                  value: '',
                  valueOptions: [],
                },
              ],
              bodyType: 'jsonBody',
              jsonBody: '',
              httpMethod: 'GET',
              responseType: 'auto',
            },
          },
        },
        {
          name: 'GetUsers',
          step: {
            integration: 'postgres',
            postgres: {
              body: '`\nSELECT\n\tname,\n\tage\nFROM mytable\nWHERE age < ${await MAX_AGE.get()}\nLIMIT 1\n`',
              usePreparedSql: true,
              operation: 'run_sql',
            },
          },
        },
      ],
    },
    integrations: {
      postgres: {
        endpoint: {
          host: 'postgres',
          port: 5432,
        },
        connection: {
          useSsl: false,
          useSelfSignedSsl: false,
        },
        authentication: {
          username: 'postgres',
          password: 'password',
          custom: {
            databaseName: {
              value: 'postgres',
            },
          },
        },
      },
    },
    metadata: {
      profile: 'production',
    },
  },
];

module.exports = integrationTestApis;
