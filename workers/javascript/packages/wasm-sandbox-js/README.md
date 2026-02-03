# @superblocks/wasm-sandbox-js

A secure JavaScript sandbox for evaluating untrusted code using WebAssembly.

## Overview

This package provides a sandboxed JavaScript execution environment built on [QuickJS](https://bellard.org/quickjs/) compiled to WebAssembly via [quickjs-emscripten](https://github.com/justjake/quickjs-emscripten). It's designed to safely execute user-provided JavaScript expressions without giving them access to the Node.js runtime, filesystem, network, or other sensitive resources.

## Why WASM?

Traditional JavaScript sandboxing approaches (like VM2) rely on Node.js's `vm` module, which has a history of sandbox escape vulnerabilities. Our approach runs JavaScript in a completely separate interpreter (QuickJS) compiled to WebAssembly.

**WebAssembly was designed with security as a primary goal.** Its isolation guarantees are fundamental to the specification and enforced by the runtime, not bolted-on afterthoughts:

- **Memory isolation by design** - WASM runs in a separate linear memory space with strict bounds checking. The sandbox cannot read or write host memory.
- **No ambient authority** - WASM modules have no implicit access to the filesystem, network, or system APIs. All capabilities must be explicitly granted.
- **Bounded resource consumption** - WASM linear memory has a strict maximum size, preventing unbounded memory allocation.
- **Separate JavaScript runtime** - QuickJS is a completely independent interpreter with its own heap and prototype chains, eliminating prototype pollution attacks.
- **Controlled host interaction** - Only functions explicitly exposed via `hostFunction()` can be called from the sandbox.

## Quick Start

```typescript
import { createSandbox, hostFunction } from '@superblocks/wasm-sandbox-js';

// Create a sandbox and evaluate expressions
const sandbox = await createSandbox();
try {
  const result = await sandbox.evaluate('1 + 2');
  console.log(result); // 3

  const upper = await sandbox.evaluate('"hello".toUpperCase()');
  console.log(upper); // 'HELLO'
} finally {
  sandbox.dispose();
}

// Inject globals
const sandbox = await createSandbox();
try {
  sandbox.setGlobals({ user: { name: 'Alice', role: 'admin' } });
  const result = await sandbox.evaluate('user.name');
  console.log(result); // 'Alice'
} finally {
  sandbox.dispose();
}

// Expose host functions (must use hostFunction wrapper)
const sandbox = await createSandbox();
try {
  sandbox.setGlobals({
    fetchData: hostFunction(async (endpoint: string) => {
      // This runs in the host, not the sandbox
      return await myApi.fetch(endpoint);
    })
  });
  const result = await sandbox.evaluate('fetchData("users")');
} finally {
  sandbox.dispose();
}
```

## API Reference

### `createSandbox(options?)`

Creates a sandbox for evaluating JavaScript expressions.

**Parameters:**
- `options?: SandboxOptions` - Configuration options
  - `limits?: { stackBytes?: number; memoryBytes?: number }` - Resource limits
  - `enableBuffer?: boolean` - Enable Buffer API polyfill
  - `enableTimers?: boolean` - Enable timer APIs (setTimeout)
  - `globalLibraries?: ('lodash' | 'moment')[]` - Libraries to preload

**Returns:** `Promise<Sandbox>`

```typescript
import { createSandbox, hostFunction } from '@superblocks/wasm-sandbox-js';

// Create a pre-initialized sandbox
const sandbox = await createSandbox({
  enableBuffer: true,
  limits: { memoryBytes: 16 * 1024 * 1024 }
});

try {
  // Set up console logging
  sandbox.setConsole({
    log: (...args) => console.log('[sandbox]', ...args),
    warn: (...args) => console.warn('[sandbox]', ...args),
    error: (...args) => console.error('[sandbox]', ...args),
  });

  // Inject globals
  sandbox.setGlobals({
    user: { name: 'Alice' },
    fetchData: hostFunction(async (url) => fetch(url).then(r => r.json()))
  });

  // Evaluate expressions
  const result = await sandbox.evaluate('user.name', { timeLimitMs: 5000 });
  console.log(result); // 'Alice'
} finally {
  // Always dispose when done
  sandbox.dispose();
}
```

### Sandbox Interface

#### `sandbox.setConsole(logger)`

Set the console logger for this sandbox. Can be called multiple times to change the logger between evaluations.

```typescript
sandbox.setConsole({
  log: (...args) => myLogger.info(...args),
  warn: (...args) => myLogger.warn(...args),
  error: (...args) => myLogger.error(...args),
});
```

#### `sandbox.setGlobals(globals)`

Inject global variables into the VM. Can be called multiple times; new keys are added, existing keys are overwritten.

```typescript
sandbox.setGlobals({ user: { name: 'Alice' } });
sandbox.setGlobals({ config: { debug: true } }); // Both user and config are available
```

#### `sandbox.evaluate(expression, options?)`

Evaluate a single expression and return its result.

**Parameters:**
- `expression: string` - JavaScript expression to evaluate
- `options?: SandboxEvaluateOptions`
  - `timeLimitMs?: number` - Execution time limit in milliseconds (default: 10 seconds)
  - `wrapperPrefixLines?: number` - Lines added before user code (for error position adjustment)
  - `wrapperSuffixLines?: number` - Lines added after user code (for error position adjustment)

**Returns:** `Promise<unknown>` - The expression result

#### `sandbox.dispose()`

Dispose of all resources. Must be called when done with the sandbox.

The sandbox also implements `Disposable`, so you can use the `using` statement (Node.js 18.18.0+, TypeScript 5.2+) for automatic cleanup:

```typescript
{
  using sandbox = await createSandbox();
  sandbox.setGlobals({ x: 42 });
  const result = await sandbox.evaluate('x + 1');
  // sandbox.dispose() called automatically at end of scope
}
```

#### `sandbox.isAlive`

Whether the sandbox is still usable (not disposed).

### `hostFunction(fn)`

Marks a function as safe to expose to the sandbox. **Required** for any function passed via `globals`.

```typescript
import { hostFunction } from '@superblocks/wasm-sandbox-js';

// Sync function
const add = hostFunction((a: number, b: number) => a + b);

// Async function
const fetchUser = hostFunction(async (id: string) => {
  return await db.users.find(id);
});

sandbox.setGlobals({ add, fetchUser });

await sandbox.evaluate('add(1, 2)');
await sandbox.evaluate('fetchUser("123")');
```

**Important:** When the sandbox calls a host function:
- `this` is bound to `undefined` (use arrow functions or `.bind()` if you need context)
- Arguments are extracted from the VM and passed to the host function
- Return values (including Promises) are marshalled back to the VM
- Thrown errors are propagated to the VM as exceptions

### `toVmValue` (Symbol)

Customize how class instances are marshalled to the VM.

```typescript
import { toVmValue, hostFunction } from '@superblocks/wasm-sandbox-js';

class Counter {
  private value = 0;
  
  increment() { this.value++; }
  getValue() { return this.value; }
  
  [toVmValue]() {
    return {
      increment: hostFunction(this.increment.bind(this)),
      getValue: hostFunction(this.getValue.bind(this))
    };
  }
}
```

## Supported Libraries

The sandbox can lazily load these libraries:

- **lodash** - Available as `_`
- **moment** - Available as `moment`

```typescript
const sandbox = await createSandbox({ globalLibraries: ['lodash'] });
try {
  const result = await sandbox.evaluate('_.sum([1, 2, 3])');
  console.log(result); // 6
} finally {
  sandbox.dispose();
}
```

## Buffer Support

Enable `enableBuffer: true` to support Buffer operations:

```typescript
const sandbox = await createSandbox({ enableBuffer: true });
try {
  const result = await sandbox.evaluate('Buffer.from("hello")');
  // Buffers are automatically marshalled between the host and VM
} finally {
  sandbox.dispose();
}
```

## Error Handling

Errors thrown in the sandbox are propagated to the host:

```typescript
const sandbox = await createSandbox();
try {
  await sandbox.evaluate('throw new Error("oops")');
} catch (err) {
  console.log(err.message); // 'oops'
} finally {
  sandbox.dispose();
}
```

Errors in host functions are also propagated to the VM:

```typescript
const sandbox = await createSandbox();
try {
  const fails = hostFunction(() => {
    throw new Error('host error');
  });
  sandbox.setGlobals({ fails });

  // The VM can catch this
  const result = await sandbox.evaluate(`
    try { fails(); } catch (e) { e.message }
  `);
  console.log(result); // 'host error'
} finally {
  sandbox.dispose();
}
```

## Execution Limits

Set time limits to prevent infinite loops:

```typescript
const sandbox = await createSandbox();
try {
  await sandbox.evaluate('while(true) {}', { timeLimitMs: 1000 });
  // Throws after 1 second
} finally {
  sandbox.dispose();
}
```

### Hard timeouts (recommended for production)

`timeLimitMs` is a **soft, best-effort** limit enforced inside the sandbox. For the most reliable protection against hangs (including host-side work that cannot be preempted), run evaluation in a **dedicated Worker thread** and have the parent terminate it if the deadline passes.

Recommended pattern:
- Set `timeLimitMs` (fast failure in the common case)
- Also enforce a **hard wall-clock timeout** in the parent and call `worker.terminate()` on expiry
- Recreate the worker after termination (do not reuse a timed-out worker)

## Security

See [SECURITY.md](./SECURITY.md) for details on the security model and threat mitigation.
