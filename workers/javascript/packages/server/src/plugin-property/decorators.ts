import _ from 'lodash';
import { StoreHandler } from './handlers';

export function StreamProperty() {
  return function (object: object, propertyName: string) {
    metaStore.addStreamProperty(propertyName);
  };
}

export function StoreProperty(handler: StoreHandler) {
  return function (object: object, propertyName: string) {
    metaStore.addStoreProperty(propertyName, handler);
  };
}

type PropertyAndHandler = {
  propertyName: string;
  handler: StoreHandler;
};

class MetaStore {
  private streamProperties: string[] = [];
  private storeProperties: PropertyAndHandler[] = [];

  addStoreProperty(propertyName: string, handler: StoreHandler) {
    this.storeProperties.push({ propertyName, handler });
  }

  addStreamProperty(propertyName: string) {
    this.streamProperties.push(propertyName);
  }

  getStreamProperties(): string[] {
    return _.cloneDeep(this.streamProperties);
  }

  getStoreProperties(): PropertyAndHandler[] {
    return _.cloneDeep(this.storeProperties);
  }
}

export const metaStore = new MetaStore();
