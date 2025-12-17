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
import { evaluateExpressions, hostFunction } from '@superblocks/wasm-sandbox-js';

// Evaluate simple expressions
const results = await evaluateExpressions(['1 + 2', '"hello".toUpperCase()']);
console.log(results['1 + 2']); // 3
console.log(results['"hello".toUpperCase()']); // 'HELLO'

// Inject globals
const results = await evaluateExpressions(['user.name'], {
  globals: { user: { name: 'Alice', role: 'admin' } }
});
console.log(results['user.name']); // 'Alice'

// Expose host functions (must use hostFunction wrapper)
const results = await evaluateExpressions(['fetchData("users")'], {
  globals: {
    fetchData: hostFunction(async (endpoint: string) => {
      // This runs in the host, not the sandbox
      return await myApi.fetch(endpoint);
    })
  }
});
```

## API Reference

### `evaluateExpressions(expressions, options?)`

Evaluates an array of JavaScript expressions in a sandboxed environment.

**Parameters:**
- `expressions: string[]` - Array of JavaScript expressions to evaluate
- `options?: EvaluateOptions` - Configuration options

**Returns:** `Promise<Record<string, unknown>>` - Map of expression → result

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

await evaluateExpressions(['add(1, 2)', 'fetchUser("123")'], {
  globals: { add, fetchUser }
});
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

### `prewarmEvaluator()`

Pre-initialize the WASM module for faster first evaluation. Call during application startup.

```typescript
import { prewarmEvaluator } from '@superblocks/wasm-sandbox-js';

// During app initialization
await prewarmEvaluator();
```

## Supported Libraries

The sandbox can lazily load these libraries:

- **lodash** - Available as `_`
- **moment** - Available as `moment`

```typescript
await evaluateExpressions(['_.sum([1, 2, 3])'], {
  libraries: ['lodash']
});
```

## Buffer Support

Enable `enableBuffer: true` to support Buffer operations:

```typescript
const results = await evaluateExpressions([
  'Buffer.from("hello").toString("base64")',
  'Buffer.from([1, 2, 3])'
], { enableBuffer: true });
```

Buffers are automatically marshalled between the host and VM.

## Error Handling

Errors thrown in the sandbox are propagated to the host:

```typescript
try {
  await evaluateExpressions(['throw new Error("oops")']);
} catch (err) {
  console.log(err.message); // 'oops'
}
```

Errors in host functions are also propagated to the VM:

```typescript
const fails = hostFunction(() => {
  throw new Error('host error');
});

// The VM can catch this
await evaluateExpressions([`
  try { fails(); } catch (e) { e.message }
`], { globals: { fails } });
// Returns: 'host error'
```

## Execution Limits

Set time limits to prevent infinite loops:

```typescript
await evaluateExpressions(['while(true) {}'], {
  limits: { timeMs: 1000 } // 1 second timeout
});
// Throws after 1 second
```

### Hard timeouts (recommended for production)

`limits.timeMs` is a **soft, best-effort** limit enforced inside the sandbox. For the most reliable protection against hangs (including host-side work that cannot be preempted), run evaluation in a **dedicated Worker thread** and have the parent terminate it if the deadline passes.

Recommended pattern:
- Set `limits.timeMs` (fast failure in the common case)
- Also enforce a **hard wall-clock timeout** in the parent and call `worker.terminate()` on expiry
- Recreate the worker after termination (do not reuse a timed-out worker)

## Security

See [SECURITY.md](./SECURITY.md) for details on the security model and threat mitigation.
