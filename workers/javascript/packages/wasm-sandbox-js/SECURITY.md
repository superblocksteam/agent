# Security Model

This document describes the security architecture of `@superblocks/wasm-sandbox-js` and the threat model it addresses.

## Threat Model

### What We Protect Against

This package is designed to safely execute **untrusted JavaScript code** provided by users. The primary threats we mitigate:

1. **Sandbox Escape** - Malicious code attempting to access the Node.js runtime
2. **Host Memory Access** - Attempts to read or corrupt host process memory
3. **Prototype Pollution** - Attacks that modify shared object prototypes
4. **Memory Exhaustion** - Bounded by WASM linear memory limits
5. **Infinite Loops** - Mitigated by execution time limits
6. **Unauthorized Host Access** - Accessing host functions not explicitly exposed

### What We Do NOT Protect Against

- **CPU exhaustion** - A determined attacker can still consume CPU cycles (mitigated by time limits, but not prevented)
- **Information leakage via timing** - Side-channel attacks are not addressed
- **Bugs in QuickJS** - We inherit any vulnerabilities in the underlying interpreter
- **Bugs in quickjs-emscripten** - We inherit any vulnerabilities in the WASM bindings

## Architecture

### Why WASM Instead of Node.js VM?

Previous sandboxing solutions like [VM2](https://github.com/patriksimek/vm2) used Node.js's built-in `vm` module. This approach has fundamental security limitations:

1. **Shared Prototype Chain** - Objects created in the sandbox share prototypes with the host, enabling prototype pollution attacks
2. **Context Leakage** - Numerous sandbox escapes have been discovered over the years ([CVE-2023-37466](https://nvd.nist.gov/vuln/detail/CVE-2023-37466), [CVE-2023-29199](https://nvd.nist.gov/vuln/detail/CVE-2023-29199), etc.)
3. **Same Process Memory** - The sandbox runs in the same V8 isolate as the host

Our approach uses **QuickJS compiled to WebAssembly**. WebAssembly was designed from the ground up with security as a primary goal - its isolation guarantees are fundamental architectural properties, not bolted-on features:

1. **Memory Isolation by Design** - WASM executes in a separate linear memory space with strict bounds checking enforced by the runtime. The sandbox cannot read or write host memory - this is guaranteed by the WASM specification and validated at load time.
2. **No Ambient Authority** - WASM modules have no implicit access to any system resources. There is no `require`, `process`, `fs`, or any other capability unless explicitly provided.
3. **Bounded Memory** - WASM linear memory has a strict maximum size. The sandbox cannot allocate memory beyond this limit, preventing unbounded memory exhaustion.
4. **Complete Interpreter Isolation** - QuickJS is a separate JavaScript engine with its own heap, stack, and runtime - not a V8 context that shares memory with the host.
5. **Separate Prototype Chains** - Objects in QuickJS have their own prototypes, completely isolated from Node.js, eliminating prototype pollution as an attack vector.

### Isolation Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│                         Node.js Host (Trusted)                  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Host Functions                       │  │
│  │           (explicitly exposed via hostFunction())         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ▲                                  │
│                              │                                  │
│                    Controlled Interface                         │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │            Host-Side Marshalling (marshal.ts)             │  │
│  │                                                           │  │
│  │  • marshalToVm() / marshalFromVm()                        │  │
│  │  • Host function wrappers (HostFunctionWrapper)           │  │
│  │  • Host-side cycle detection (WeakSet<object>)            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ▲                                  │
│                              │ QuickJS Handle API (FFI)         │
│                              ▼                                  │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║                 WASM Sandbox (Isolation Boundary)         ║  │
│  ║                                                           ║  │
│  ║  ┌─────────────────────────────────────────────────────┐  ║  │
│  ║  │             VM-Side Marshalling                     │  ║  │
│  ║  │                                                     │  ║  │
│  ║  │  • Array.isArray / Object.keys helpers              │  ║  │
│  ║  │  • VM-side cycle detection (WeakSet)                │  ║  │
│  ║  │  • Buffer.isBuffer / Buffer.from                    │  ║  │
│  ║  └─────────────────────────────────────────────────────┘  ║  │
│  ║                           ▲                               ║  │
│  ║                           │                               ║  │
│  ║                           ▼                               ║  │
│  ║  ┌─────────────────────────────────────────────────────┐  ║  │
│  ║  │                 QuickJS Engine                      │  ║  │
│  ║  │                                                     │  ║  │
│  ║  │  • Separate heap & linear memory                    │  ║  │
│  ║  │  • Separate prototypes                              │  ║  │
│  ║  │  • No Node.js APIs                                  │  ║  │
│  ║  │  • No access to host memory                         │  ║  │
│  ║  └─────────────────────────────────────────────────────┘  ║  │
│  ║                                                           ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Security Mechanisms

### 1. Host Function Explicit Opt-In

Functions cannot be exposed to the sandbox accidentally. The `hostFunction()` wrapper is **required**:

```typescript
const sandbox = await createSandbox();

// ❌ This throws an error
sandbox.setGlobals({ fn: () => dangerousOperation() });

// ✅ Explicit opt-in required
sandbox.setGlobals({ fn: hostFunction(() => safeOperation()) });
```

This prevents accidental exposure of dangerous operations when building complex `globals` objects.

### 2. Value Marshalling

All values crossing the sandbox boundary are **marshalled** (serialized and deserialized):

- **Primitives** - Passed by value
- **Objects/Arrays** - Deep-copied, no shared references
- **Functions** - Wrapped with `hostFunction()`, called via controlled interface
- **Buffers** - Copied as byte arrays (when `enableBuffer: true`)

This means:
- The sandbox cannot hold references to host objects
- Mutations in the sandbox don't affect host objects
- Prototype chains are not shared

**Sparse array hardening:** When extracting arrays from the VM, we preserve the VM array's `length` but only materialize indices returned by `Object.keys`. This avoids host-side CPU/memory exhaustion from very sparse arrays with huge `length` (e.g. `a = []; a[1e9] = 1`). Non-index keys are intentionally ignored during array extraction.

### 3. No Implicit Globals

The sandbox starts with a minimal global environment:
- Basic JavaScript built-ins (`Object`, `Array`, `Promise`, etc.)
- No `require`, `import`, `process`, `global`, `Buffer` (unless enabled), etc.
- Libraries like `lodash` and `moment` are lazily loaded only if requested

### 4. Execution Limits

Time limits prevent infinite loops:

```typescript
const sandbox = await createSandbox();
try {
  await sandbox.evaluate('while(true){}', { timeLimitMs: 1000 });
  // Throws after 1 second
} finally {
  sandbox.dispose();
}
```

## Security Considerations for Host Functions

When exposing host functions via `hostFunction()`, consider:

### 1. Principle of Least Privilege

Only expose the minimum functionality needed:

```typescript
// ❌ Too permissive
globals: { db: hostFunction(databaseClient) }

// ✅ Expose specific operations
globals: { 
  getUserById: hostFunction(async (id: string) => {
    // Validate ID, return only safe fields
    return await db.users.findOne({ id }, { fields: ['name', 'email'] });
  })
}
```

### 2. Input Validation

Validate all arguments from the sandbox:

```typescript
const readFile = hostFunction(async (path: string) => {
  // ❌ Vulnerable to path traversal
  return await fs.readFile(path);
  
  // ✅ Validate and sanitize
  if (!isAllowedPath(path)) {
    throw new Error('Access denied');
  }
  return await fs.readFile(sanitizePath(path));
});
```

### 3. Rate Limiting

Host functions that access external resources should implement rate limiting:

```typescript
const fetchData = hostFunction(async (url: string) => {
  await rateLimiter.consume(userId);
  return await fetch(url);
});
```

### 4. Error Information Leakage

Be careful about what error information is exposed:

```typescript
const query = hostFunction(async (sql: string) => {
  try {
    return await db.query(sql);
  } catch (err) {
    // ❌ Leaks internal details
    throw err;
    
    // ✅ Generic error
    throw new Error('Query failed');
  }
});
```

## Known Limitations

### CPU Limits

The `timeMs` limit uses QuickJS's interrupt callback, which is checked periodically but not after every instruction. Very tight timeouts (< 10ms) may not be precise.

### Async Operations

When a host function returns a Promise (or timers are enabled), the sandbox awaits it and the overall evaluation remains bounded by the `timeMs` limit. If the deadline is exceeded while waiting on host operations, evaluation fails with a timeout and pending host callbacks are cancelled/ignored.

### Hard Timeouts (Recommended)

`timeMs` is a **best-effort** limit enforced inside the sandbox. It does not (and cannot) reliably preempt arbitrary host-side work (e.g., a host function doing CPU-heavy computation, blocking I/O, or native calls). For defense in depth, run sandbox evaluation in a **dedicated worker thread** (or separate process) and have a supervisor enforce a **hard wall-clock timeout** by terminating the worker if the deadline passes, then recreating it.

## Reporting Security Issues

If you discover a security vulnerability in this package, please report it to the security team following the organization's responsible disclosure policy.

## Dependencies

This package's security depends on:

| Dependency | Purpose | Security Impact |
|------------|---------|-----------------|
| `quickjs-emscripten` | WASM bindings for QuickJS | Critical - provides core isolation |
| QuickJS | JavaScript interpreter | Critical - runs untrusted code |
| Emscripten | WASM compilation toolchain | Critical - generates WASM binary |

Keep these dependencies updated to receive security patches.

