module.exports = [
  {
    id: 'base',
    routes: [
      'fetch:id',
      'fetch-per-branch:id-and-branch',
      'fetch-application-code:default',
      'fetch-application-code-by-branch:default',
      'fetch-by-path-with-commit-id:default',
      'fetch-by-path-with-branch-name:default',
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
