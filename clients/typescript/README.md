# Superblocks Agent SDK

## Prerequisites

1. Make sure you can connect to the agent

## Installation

First, ensure you have installed the Superblocks client library:

```bash
npm install @superblocksteam/agent-sdk
```

## Initialization

To get started, you need to initialize the `Superblocks` client with the appropriate endpoint and token.

```javascript
import { Client, Api } from "@superblocksteam/agent";

const client = new Client({
    endpoint: "agent.staging.superblocks.com:8443",
    token: "your-token-here"
});
```

## Running APIs in Different Modes

You can run APIs in various modes such as `profile`, `viewMode`, and `branch`.

### Example: Profile and View Mode

```javascript
const api = new Api("your-api-id", { profile: "staging" });

const result = await api.run(
    {
        inputs: { "Text1": { "text": 123456 } }
    },
    client
);

console.log(result.getBlockResult("Step3"));
console.log(result.getResult());
```

### Example: Specify a Branch

```javascript
const api = new Api("your-api-id", {
    profile: "staging",
    viewMode: "deployed",
    branch: "main"
});

const result = await api.run(
    {
        inputs: { "Text1": { "text": 123456 } }
    },
    client
);

console.log(result.getResult());
```

## Using Mocks

Mocks allow you to simulate API responses for testing purposes.

### Example: Step Mocks

```javascript
import { on, Api, Client } from "@superblocksteam/agent";

// Mock any step that having a step name "Step 2" and integration type "postgres", and pass the predicat
export const PgMock1 = on({integrationType: "postgres", stepName: "Step2"}, (inputs)=> {
    console.log("pg inputs", inputs);
    return true
}).return(() => {
    return [{"time": "2026-01-01", "tsla": 0, "ffie": 1000}]
})

// Mock any step that having a step name "Step 2" and integration type "postgres", and pass the predicate. In this case,
// the mock will never be used because the predicate returns false.
export const PgMock2 = on({integrationType: "postgres", stepName: "Step2"}, (inputs)=> {
    console.log("pg inputs", inputs);
    return false
}).return(() => {
    return [{"time": "2026-01-01", "tsla": 0, "ffie": 1000}]
})

// Using a step mock
const api = new Api("your-api-id", { profile: "staging" });

const result1 = await api.run({ mocks: [PgMock1] }, client);
console.log(result1.getOutput().getResult().toJavaScript()); // Output: [{"time": "2026-01-01", "tsla": 0, "ffie": 1000}]

// Using a different step mock
const result2 = await api.run({ mocks: [PgMock2] }, client);
console.log(result2.getOutput().getResult().toJavaScript());
```

## Handling Concurrency

You can run multiple API requests concurrently to improve performance.

### Example: Running Multiple APIs Concurrently

```javascript
const ps1 = [];
for (let i = 0; i < 50; i++) {
    const api = new Api("your-api-id", { viewMode: "edit" });
    ps1.push(api.run({}, client));
}

const ps2 = [];
for (let i = 0; i < 50; i++) {
    const api = new Api("your-api-id", { profile: "staging" });
    ps2.push(api.run({}, client));
}

const results1 = await Promise.all(ps1);
results1.forEach(result => {
    console.log(result.getResult());
});

const results2 = await Promise.all(ps2);
results2.forEach(result => {
    console.log(result.getResult());
});
```

## Default Client Behavior

The `Superblocks` client defaults to using `viewMode: "edit"` and `profile: "staging"`.

### Example: Default View Mode and Profile

```javascript
const client = new Client({
    endpoint: "agent.staging.superblocks.com:8443",
    token: "your-token-here"
});

const api = new Api("your-api-id");

const result = await api.run(
    {
        inputs: { "Text1": { "text": 123456 } }
    },
    client
);

console.log(result.getBlockResult("Step3").args.environment);
console.log(result.getResult());
```

### Example: Custom Default View Mode on Client Level

```javascript
const client = new Client({
    endpoint: "agent.staging.superblocks.com:8443",
    token: "your-token-here",
    viewMode: "deployed"
});

const api = new Api("your-api-id");

const result = await api.run(
    {
        inputs: { "Text1": { "text": 123456 } }
    },
    client
);
```

## Error Handling

Handle errors gracefully by catching exceptions and checking for errors in the response.

### Example: Error Handling

```javascript
const api = new Api("your-api-id", { viewMode: "edit" });

try {
    const result = await api.run({}, client);
    console.log(result.getResult());
} catch (error) {
    console.error("API call failed:", error);
}
```

Get all step errors during the API run:

```javascript
const result = await api.run({}, client);
console.log("errors =", result.getErrors());
expect(() => result.getResult()).toThrow("Api has an error");
```
