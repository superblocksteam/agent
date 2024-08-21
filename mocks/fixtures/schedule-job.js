module.exports = [
  {
    api: {
      blocks: [
        {
          name: 'Javascript1',
          step: {
            javascript: {
              body: '/*\n * You can use Javascript Functions to:\n *   1. Transform the output of previous Steps by referencing their output (ex. Step1.output)\n *   2. Write business logic referencing UI components (ex. Table1.selectedRow.id)\n *   3. Make http calls via axios\n *\n * Moment.js (moment), lodash.js (_), axios, aws-sdk, base64url, jsonwebtoken, and xmlbuilder2 libraries are currently supported.\n */\n\nconst obj = {str: "hello world"};\nconsole.log(obj.str);\nreturn obj;\n',
            },
          },
        },
      ],
      trigger: {
        job: {
          interval: 1,
          frequency: 1,
          dayOfMonth: 10,
        },
      },
      metadata: {
        name: 'API7',
        organization: '10bdf0c1-9e8c-432f-a013-e470b3324af9',
        id: 'b6e453e5-d699-4613-978e-c3d18f2e980a',
        timestamps: {
          created: '2023-04-10T22:27:07.171Z',
          updated: '2023-04-10T22:27:23.183Z',
          deactivated: null,
        },
      },
    },
    integrations: {},
    metadata: {
      requester: '',
    },
  },
];
