// In-memory store for eviction events recorded by the DELETE /api/v1/agents/… routes.
// Imported by routes/evictions.js (introspection) and routes/fetch.js (recording).
//
// NOTE: this store is process-global and always-on in the `base` mock collection, so it
// accumulates across every suite in a run. Any test that asserts on it MUST first
// `POST /__test__/evictions/reset` to clear stale entries (the Phase 2 collection
// resets before each eviction case). Without the reset, entries from earlier DELETEs would
// produce false positives.
const evictions = [];

function recordEviction(req) {
  evictions.push({
    ts: Date.now(),
    route: req.originalUrl.split('?')[0],
    method: req.method,
    authType: req.body?.authType,
    tokenType: req.body?.tokenType,
  });
}

module.exports = { evictions, recordEviction };
