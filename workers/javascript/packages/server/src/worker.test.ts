import { describe, expect, it, jest } from '@jest/globals';

import { Worker } from './worker';

function stubLogger(): any {
  const logger: any = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
  logger.child = jest.fn(() => logger);
  return logger;
}

describe('Worker._process error handling', () => {
  const message = JSON.stringify({
    inbox: 'inbox-1',
    topic: 'topic-1',
    data: {
      pinned: { name: 'databricks', event: 'execute', bucket: 'B1', carrier: {} },
      data: { props: { executionId: 'exec-1', stepName: 'Step1' } }
    }
  });

  // Runs _process with _executeStep throwing the given error and returns the
  // response that was published to the inbox.
  async function processWithError(err: Error): Promise<any> {
    const worker = Object.create(Worker.prototype) as any;
    worker._logger = stubLogger();
    const xAdd = jest.fn(async () => undefined);
    worker._options = { client: { xAdd } };
    worker._executeStep = jest.fn(async () => {
      throw err;
    });

    await worker._process(message);

    // First xAdd is the ack; second is the published response.
    expect(xAdd).toHaveBeenCalledTimes(2);
    const payload = (xAdd.mock.calls[1] as any[])[2] as { data: Buffer };
    return JSON.parse(payload.data.toString());
  }

  it('propagates the integration error code onto the pinned error', async () => {
    const err = new Error('401 unauthorized') as Error & { code?: number };
    err.name = 'IntegrationError';
    err.code = 3;

    const result = await processWithError(err);

    expect(result.pinned).toEqual({ name: 'IntegrationError', message: '401 unauthorized', code: 3 });
  });

  it('omits the code field when the error has none', async () => {
    const result = await processWithError(new Error('boom'));

    expect(result.pinned).toEqual({ name: 'Error', message: 'boom' });
    expect('code' in result.pinned).toBe(false);
  });

  it('publishes the step response on success', async () => {
    const worker = Object.create(Worker.prototype) as any;
    worker._logger = stubLogger();
    const xAdd = jest.fn(async () => undefined);
    worker._options = { client: { xAdd } };
    worker._executeStep = jest.fn(async () => ({ key: 'output-key' }));

    await worker._process(message);

    expect(xAdd).toHaveBeenCalledTimes(2);
    const payload = (xAdd.mock.calls[1] as any[])[2] as { data: Buffer };
    const result = JSON.parse(payload.data.toString());
    expect(result.pinned).toBeUndefined();
    expect(result.data.data).toEqual({ key: 'output-key' });
  });

  it('throws when the message cannot be decoded', async () => {
    const worker = Object.create(Worker.prototype) as any;
    worker._logger = stubLogger();
    const xAdd = jest.fn(async () => undefined);
    worker._options = { client: { xAdd } };

    await expect(worker._process('not json')).rejects.toThrow();

    expect(worker._logger.error).toHaveBeenCalledWith(expect.anything(), 'decode failed with no inbox');
    expect(xAdd).not.toHaveBeenCalled();
  });

  it('drops the request when the ack fails', async () => {
    const worker = Object.create(Worker.prototype) as any;
    worker._logger = stubLogger();
    const ackErr = new Error('redis unavailable');
    const xAdd = jest.fn(async () => {
      throw ackErr;
    });
    worker._options = { client: { xAdd } };
    worker._executeStep = jest.fn(async () => ({}));

    await expect(worker._process(message)).rejects.toThrow('redis unavailable');

    expect(xAdd).toHaveBeenCalledTimes(1);
    expect(worker._executeStep).not.toHaveBeenCalled();
  });

  it('publishes a static error when the response cannot be encoded', async () => {
    const worker = Object.create(Worker.prototype) as any;
    worker._logger = stubLogger();
    const xAdd = jest.fn(async () => undefined);
    worker._options = { client: { xAdd } };
    // BigInt is not JSON-serializable, forcing the encode fallback.
    worker._executeStep = jest.fn(async () => ({ value: BigInt(1) }));

    await worker._process(message);

    expect(worker._logger.error).toHaveBeenCalledWith(expect.anything(), 'could not encode response');
    expect(xAdd).toHaveBeenCalledTimes(2);
    const payload = (xAdd.mock.calls[1] as any[])[2] as { data: Buffer };
    expect(JSON.parse(payload.data.toString())).toHaveProperty('err');
  });

  it('throws when publishing the response fails', async () => {
    const worker = Object.create(Worker.prototype) as any;
    worker._logger = stubLogger();
    const publishErr = new Error('stream gone');
    const xAdd = jest
      .fn(async () => undefined)
      .mockImplementationOnce(async () => undefined)
      .mockImplementationOnce(async () => {
        throw publishErr;
      });
    worker._options = { client: { xAdd } };
    worker._executeStep = jest.fn(async () => ({}));

    await expect(worker._process(message)).rejects.toThrow('stream gone');

    expect(worker._logger.error).toHaveBeenCalledWith(expect.anything(), '[ERROR] publishing response');
  });
});
