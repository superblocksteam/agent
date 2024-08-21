// Base 64 encoded strings may contain + and /
// / isn't path safe and + isn't query param safe
export function sanitizeAgentKey(key: string): string {
  return key.replace(/\//g, '__').replace(/\+/g, '--');
}
