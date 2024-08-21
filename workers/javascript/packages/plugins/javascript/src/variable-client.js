class VariableClient {
  #port;
  #nextId = 0;
  #pendingResolvers = {};
  #writableBuffer = [];

  constructor(port) {
    this.#port = port;
    port.onmessage = (event) => {
      const message = event.data;
      if (!message) {
        return;
      }
      const resolver = this.#pendingResolvers[message.id];
      resolver(message);
    };
  }

  // For advanced variable
  async read(keys) {
    const id = this.#nextId++;
    this.#port.postMessage({ id: id, type: 'readStore', keys: keys });
    const promise = this.allocatePromise(id);
    const responseMessage = await promise;
    return responseMessage.body;
  }

  // For advanced variable
  async write(key, value) {
    if (value === undefined) {
      return;
    }

    const id = this.#nextId++;
    let sanitizedValue;
    try {
      sanitizedValue = JSON.parse(JSON.stringify(value));
    } catch (e) {
      throw new Error(`Attempt to write a variable which is not json serializable.`);
    }

    this.#port.postMessage({ id: id, type: 'writeStore', key: key, value: sanitizedValue });
    await this.allocatePromise(id);
  }

  // For simple variable
  writeBuffer(key, value) {
    let sanitizedValue;
    if (value === undefined) {
      return;
    }

    try {
      sanitizedValue = JSON.parse(JSON.stringify(value));
    } catch (e) {
      throw new Error(`Attempt to write a variable which is not json serializable.`);
    }

    this.#writableBuffer.push({ key: key, value: sanitizedValue });
  }

  // For simple variable
  async flush() {
    const id = this.#nextId++;
    this.#port.postMessage({ id: id, type: 'writeStoreMany', payload: this.#writableBuffer });
    await this.allocatePromise(id);
  }

  async allocatePromise(id) {
    return new Promise((resolve) => (this.#pendingResolvers[id] = resolve));
  }

  close() {
    this.#port.close();
  }
}

module.exports = VariableClient;
