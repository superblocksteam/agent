module.exports = [
  {
    id: 'agent_registration',
    url: '/api/v1/agents/register',
    method: 'POST',
    variants: [
      {
        id: 'success',
        type: 'json',
        options: {
          status: 200,
          body: {
            data: {
              agent: {
                id: 'abcd-1234',
                url: 'http://localhost:8020/agent',
              },
              billingPlan: 'TRIAL',
              organizationId: '1234',
              organizationName: 'foobar',
            },
          },
        },
      },
    ],
  },
  {
    id: 'agent_deregistration',
    url: '/api/v1/agents',
    method: 'DELETE',
    variants: [
      {
        id: 'success',
        type: 'json',
        options: {
          status: 200,
          body: {},
        },
      },
    ],
  },
  {
    id: 'audit_logs',
    url: '/api/v2/agents/audit',
    method: 'POST',
    variants: [
      {
        id: 'success',
        type: 'json',
        options: {
          status: 200,
          body: {},
        },
      },
    ],
  },
];
