// `@superblocks/worker.js` validates these env vars at import time via its EnvStore.
// Sandbox tests import `secrets()` from that package, so we set non-sensitive placeholders.
process.env.SUPERBLOCKS_AGENT_KEY = process.env.SUPERBLOCKS_AGENT_KEY ?? 'dev-agent-key';
process.env.SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA = process.env.SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA ?? 'dev-private-rsa';
process.env.SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519 = process.env.SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519 ?? 'dev-private-ed25519';
