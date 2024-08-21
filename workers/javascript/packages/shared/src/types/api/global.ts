/* eslint @typescript-eslint/no-explicit-any: 0 */

/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

/**
 * Global variables which can be reference during runtime.
 */

import { merge } from 'lodash';

export class Global {
  private payloads: Record<string, any> = {};

  add(key: string, value: any): any {
    const obj = { [key]: value };
    merge(this.payloads, obj);
    return this;
  }

  get(key: string): any {
    return this.payloads[key];
  }

  keys(): string[] {
    return Object.keys(this.payloads);
  }

  static from(global: Global) {
    const created = new Global();
    created.payloads = global.payloads;
    return created;
  }
}

export enum GlobalConstantKey {
  Global = 'Global',
  Groups = 'groups',
  User = 'user'
}
