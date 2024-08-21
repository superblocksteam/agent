export const camelCaseToDisplay = (camelCaseString: string): string => {
  return (camelCaseString.charAt(0).toUpperCase() + camelCaseString.slice(1)).replace(/([A-Z])/g, ' $1').trim();
};

export const jsonPrettyPrint = (obj: unknown): string => {
  return JSON.stringify(obj, null, 2);
};

export const EmailRegexString =
  '(([^<>()[\\].,;:\\s@\\"]+(\\.[^<>()[\\]\\.,;:\\s@\\"]+)*)|(\\".+\\"))@(([^<>()[\\]\\.,;:\\s@\\"]+\\.)+[^<>()[\\]\\.,;:\\s@\\"]{2,})';

const EmailRegexComplete = new RegExp(`^${EmailRegexString}$`);
export const validateEmail = (email: string): boolean => {
  return EmailRegexComplete.test(email);
};

export const getNextEntityName = (prefix: string, existingNames: string[], separator = '_') => {
  const cleanName = (name: string) => {
    return (
      name
        // eslint-disable-next-line no-useless-escape
        .replace(/[\[\]\(\)\s]/g, separator)
        .replace(/^a-zA-Z0-9+/g, '')
        .replace(new RegExp(`${separator}+`, 'g'), separator)
    );
  };

  const formattedPrefix = cleanName(prefix);
  const cleanedNames = existingNames.map((name) => cleanName(name.trim()));
  const regex = new RegExp(`^${formattedPrefix}(\\d+)$`);
  const usedIndices: number[] = cleanedNames.map((name) => {
    if (name && regex.test(name)) {
      const matches = name.match(regex);
      const ind = matches && Array.isArray(matches) ? parseInt(matches[1], 10) : 0;
      return Number.isNaN(ind) ? 0 : ind;
    }
    return 0;
  }) as number[];

  const lastIndex = Math.max(...usedIndices, ...[0]);

  return `${formattedPrefix}${lastIndex + 1}`;
};
