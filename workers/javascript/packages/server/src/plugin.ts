import { ExcludableList, PluginDefinition } from './types';

export function filter<T>(request: ExcludableList<T>, possible: T[]): T[] {
  return possible.filter((item: T): boolean => {
    if (!request?.items?.length) {
      return true;
    }

    const includes = request.items.includes(item);
    return request.exclude ? !includes : includes;
  });
}

export function unmarshalExcludableList(request: string, list?: string[]): ExcludableList<string> {
  if (request.length < 1) {
    return {};
  }

  const pr: ExcludableList<string> = {
    exclude: request.startsWith('!'),
    items: []
  };

  if (pr.exclude && request.length < 2) {
    return {};
  }

  if (pr.exclude) {
    pr.items = request.split('!')[1].split(',');
  } else {
    pr.items = request.split(',');
  }

  return pr;
}

export const SUPERBLOCKS_PLUGIN_PACKAGE_PREFIX = 'sb-';

export function load(deps: Record<string, unknown>): PluginDefinition[] {
  // 1. Filter out all deps that aren't plugins or aren't formatted correctly.
  // 2. Create PluginDefinition array from plugins.
  return Object.keys(deps)
    .map((dep) => {
      const parts = dep.split('-');
      if (dep.startsWith(SUPERBLOCKS_PLUGIN_PACKAGE_PREFIX) && parts.length >= 2) {
        return { name: parts.slice(1).join('-') };
      }
    })
    .filter((pd) => pd !== null && pd !== undefined);
}

export function sort(i: PluginDefinition, j: PluginDefinition): number {
  if (i.name < j.name) {
    return -1;
  }
  return 1;
}
