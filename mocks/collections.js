module.exports = [
  {
    id: 'base',
    routes: [
      'fetch:id',
      'fetch-per-branch:id-and-branch',
      'fetch-job:default',
      'fetch-integrations:default',
      'fetch-integration-configurations:id',
      'fetch-integration:id',
      'fetch-user-token:default',
      'cache-user-token:default',
      'delete-user-tokens:default',
      'patch-apis:default',
      'agent_registration:success',
      'agent_deregistration:success',
      'audit_logs:success',
    ],
  },
];
