class VariableClient {
  #storeClient;
  #writableBuffer = [];

  constructor(kvStore) {
    this.#storeClient = kvStore;
  }

  // For advanced variable
  async read(keys) {
    return await this.#storeClient.read(keys);
  }

  // For advanced variable
  async write(key, value) {
    if (value === undefined) {
      return;
    }

    await this.#storeClient.write(key, this._sanitizeValue(value));
  }

  // For simple variable
  writeBuffer(key, value) {
    if (value === undefined) {
      return;
    }

    this.#writableBuffer.push({ key: key, value: this._sanitizeValue(value) });
  }

  // For simple variable
  async flush() {
    await this.#storeClient.writeMany(this.#writableBuffer);
  }

  _sanitizeValue(value) {
    let sanitizedValue;
    try {
      sanitizedValue = JSON.parse(JSON.stringify(value));
    } catch (e) {
      throw new Error(`Attempt to write a variable which is not json serializable.`);
    }

    return sanitizedValue;
  }
}

module.exports = { VariableClient };
