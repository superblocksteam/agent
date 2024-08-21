export const makeDropdownItem = (value: string, displayName?: string, subText?: string) => {
  return {
    key: value,
    value: value,
    displayName: displayName ?? value,
    subText: subText ?? ''
  };
};

export const CONNECTION_METHODS_AND_DISPLAY_NAMES = {
  url: 'Connection string',
  fields: 'Form'
};
