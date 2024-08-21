import { KVOps, KVStore, KVStoreTx, WriteOps } from '../../types';
import { isKVStoreTx } from '../../utils';
import { PluginPropsBuilder } from '../builder/builders';
import { metaStore } from '../decorators';
import { WriteOp } from '../handlers';
import { PluginProps } from '../plugin-props';

export class PluginPropsWriter {
  private _loaded = false;
  private _pluginProps: Partial<PluginProps>;
  private _storeBytes = 0;
  private _kvStoreOps?: KVOps & WriteOps;

  constructor(kvStoreOps?: KVOps & WriteOps) {
    this._kvStoreOps = kvStoreOps;
  }

  public load(builder: PluginPropsBuilder): PluginPropsWriter {
    this._pluginProps = builder.build();
    this._loaded = true;
    return this;
  }

  public async writeStream(stream: unknown) {
    if (!this._loaded) {
      throw new Error("Plugin props hasn't been loaded.");
    }

    throw new Error("This method hasn't been implemented");
  }

  public stats(): [number] {
    return [this._storeBytes];
  }

  public async writeStore(store: KVStore | KVStoreTx): Promise<string[]> {
    if (!this._loaded) {
      throw new Error("Plugin props hasn't been loaded.");
    }
    const storeProperties = metaStore.getStoreProperties();
    const executionId = this._pluginProps.executionId;
    let payload: WriteOp = [];

    for (const { propertyName, handler } of storeProperties) {
      const propertyValue = this._pluginProps[propertyName];
      const kvs = handler.prepareWrite(executionId, propertyValue, this._pluginProps.version);
      // TODO: avoid mem copy
      payload = payload.concat(kvs);
    }

    if (isKVStoreTx(store)) {
      payload.forEach(({ key, value }): void => {
        (store as KVStoreTx).write(key, value, this._kvStoreOps);
      });
      return [];
    }

    this._storeBytes = (await (store as KVStore).writeMany(payload, this._kvStoreOps)).pinned?.write || 0;
    return payload.map(({ key }) => key);
  }
}
