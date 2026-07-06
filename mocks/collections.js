// 'base' is the ONLY mock collection CI loads — per-test collection selection is not wired
// into the make targets — so every route any suite needs must live here. That's why the
// Phase 2 eviction routes (delete-org-user-token, test-evictions-list/reset) are always-on
// rather than gated to the oauth-eviction suite. They're low-risk for unrelated suites:
//   - /__test__/* paths are not exercised by product/integration tests.
//   - delete-org-user-token only matches DELETE /api/v1/agents/userToken, which only the
//     OAuth shared-token eviction flow triggers (it returns 200 instead of the prior 404 —
//     no current suite depends on that 404).
//   - The evictions[] store (store/evictions.js) is process-global and accumulates across
//     suites, so any consumer asserting on it MUST POST /__test__/evictions/reset before
//     each case. The Phase 2 follow-up does this per eviction case.
// Fully gating these behind a separate collection is a Phase 2 follow-up (it owns Phase 2
// activation) — doing it here would diverge from the stacked branch.
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
      'fetch-org-user-token:default',
      'cache-user-token:default',
      'delete-user-tokens:default',
      'delete-org-user-token:default',
      'test-evictions-list:default',
      'test-evictions-reset:default',
      'patch-apis:default',
      'agent_registration:success',
      'agent_deregistration:success',
      'audit_logs:success',
    ],
  },
];
