type PlainObject = { [key: string]: any };

const isPlainObject = (obj: any): obj is PlainObject => {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
};

export const merge = (target: PlainObject, source?: PlainObject): PlainObject => {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    throw new Error('Both arguments should be plain objects');
  }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isPlainObject(sourceValue)) {
        if (!isPlainObject(targetValue)) {
          target[key] = {};
        }
        target[key] = merge(target[key], sourceValue);
      } else {
        target[key] = sourceValue;
      }
    }
  }

  return target;
};
