import _ from 'lodash';
import { ExecuteRequest, KVStore } from '../../types';
import { metaStore } from '../decorators';
import { PluginProps } from '../plugin-props';

export class PluginPropsReader {
  private _pluginProps: PluginProps = new PluginProps();
  private _streamLoaded = false;
  private _storeLoaded = false;
  private _streamStats = 0;
  private _storeStats = 0;
  private _storeBytes = 0;

  loadFromStream({ props }: ExecuteRequest): PluginPropsReader {
    for (const propertyName of metaStore.getStreamProperties()) {
      this._streamStats++;
      this._pluginProps[propertyName] = props[propertyName];
    }
    this._streamLoaded = true;
    return this;
  }

  async loadFromStore(store: KVStore): Promise<PluginPropsReader> {
    if (!this._streamLoaded) {
      throw new Error("Plugin props hasn't been loaded from stream.");
    }
    const storeProperties = metaStore.getStoreProperties();
    for (const { propertyName, handler } of storeProperties) {
      const { keys, build } = handler.prepareRead(this._pluginProps);
      this._storeStats += keys.length;
      const { pinned: io, data } = await store.read(keys);
      this._storeBytes += io.read || 0;
      // @ts-ignore
      const propertyValue = build(data);
      this._pluginProps[propertyName] = propertyValue;
    }
    this._storeLoaded = true;

    // remove the below logic when we have file variable type
    if (this._pluginProps.variables !== undefined) {
      // @ts-ignore
      const nativeVars = Object.entries(this._pluginProps.variables).filter(([_, v]) =>
        new Set(['TYPE_NATIVE', 'TYPE_FILEPICKER']).has(v.type)
      );

      const keys = nativeVars.map((v) => v[1].key) as string[];
      const vals = (await store.read(keys)).data;

      for (let i = 0; i < nativeVars.length; i++) {
        const varName = nativeVars[i][0];
        const varVal = vals[i];

        // @ts-ignore
        if (Array.isArray(varVal?.files)) {
          // @ts-ignore
          if (varVal.files.length === 0 || varVal.files.some((file) => file && file['$superblocksId'] !== undefined)) {
            this._pluginProps.context.globals[varName] = varVal;
          }
        }
      }
    }
    return this;
  }

  /**
   * Retrieves the number of properties loaded from the stream and store.
   * @returns [number, number]
   */
  stats(): [number, number, number] {
    return [this._streamStats, this._storeStats, this._storeBytes];
  }

  build(): PluginProps {
    if (!this._streamLoaded) {
      throw new Error("Plugin props hasn't been loaded from stream.");
    }
    if (!this._storeLoaded) {
      throw new Error("Plugin props hasn't been loaded from store.");
    }
    // TODO: change the underlying processing logic so we can remove these 2 variables
    this._pluginProps.context.addGlobalVariable('$fileServerUrl', this._pluginProps.$fileServerUrl);
    this._pluginProps.context.addGlobalVariable('$flagWorker', this._pluginProps.$flagWorker);
    // TODO: adapt to the superblocks/shared change after it's released
    this._pluginProps.redactedContext = _.cloneDeep(this._pluginProps.context);
    return this._pluginProps;
  }
}
