const { MessageChannel } = require('worker_threads');

class VariableServer {
  #serverPort;
  #clientPort;

  constructor(kvStore) {
    const { port1, port2 } = new MessageChannel();
    this.#serverPort = port1;
    this.#clientPort = port2;
    port1.onmessage = (event) => {
      const message = event.data;
      (async () => {
        if (message.type === 'readStore') {
          const resp = await kvStore.read(message.keys);
          port1.postMessage({ id: message.id, body: resp });
        } else if (message.type === 'writeStore') {
          await kvStore.write(message.key, message.value);
          port1.postMessage({ id: message.id });
        } else if (message.type === 'writeStoreMany') {
          await kvStore.writeMany(message.payload);
          port1.postMessage({ id: message.id });
        }
      })();
    };
  }

  clientPort() {
    return this.#clientPort;
  }

  close() {
    this.#serverPort.close();
  }
}

module.exports = VariableServer;
