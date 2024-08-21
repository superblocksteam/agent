// eslint-disable-next-line
const { parentPort } = require('node:worker_threads');

class Store {
  #parentPort;
  #nextId = 0;
  #pendingResolvers = {};

  constructor(parentPort) {
    this.#parentPort = parentPort;
    parentPort.on('message', (message) => {
      const resolver = this.#pendingResolvers[message.id];
      resolver(message);
    });
  }

  async read(key) {
    const id = this.#nextId++;
    this.#parentPort.postMessage({ id: id, type: 'readStore', key: key });
    const promise = this.allocatePromise(id);
    const responseMessage = await promise;
    return responseMessage.value;
  }

  async write(key, value) {
    const id = this.#nextId++;
    this.#parentPort.postMessage({ id: id, type: 'writeStore', key: key, value: value });
    await this.allocatePromise(id);
  }

  async allocatePromise(id) {
    return new Promise((resolve) => (this.#pendingResolvers[id] = resolve));
  }
}

(async () => {
  const store = new Store(parentPort);
  await store.read('hello');
  await store.write('world', 250);
  process.exit();
})();

// parentPort.postMessage(workerData.variables.scope1.costco.getValue());
