import { Mock, Params, Predicate, Return } from '../types';

// Mock based on static filter
export function on(filter: Params): Half;
// Mock based on predicate filter, the input parameters will be given by the server
export function on(when: (params: Params) => boolean): Half;
// Mock based on both static filter and predicate filter
export function on(filter: Params, when: (params: Params) => boolean): Half;
export function on(filter: Params | ((params: Params) => boolean), when?: (params: Params) => boolean): Half {
  if (typeof filter === 'object') {
    if (when && typeof when === 'function') {
      return new Half({ filter, predicate: when });
    } else {
      return new Half({ filter });
    }
  } else {
    return new Half({ predicate: when });
  }
}

class Half {
  private readonly filter: Params | undefined;
  private readonly predicate: Predicate | undefined;

  public constructor({ filter, predicate }: { filter?: Params; predicate?: Predicate }) {
    this.filter = filter;
    this.predicate = predicate;
  }

  // Specify the step result when the conditions are met
  public return(ret: Return): Mock {
    return {
      filter: this.filter,
      predicate: this.predicate,
      ret: ret
    };
  }
}
