export const JS_UNDEFINED_ERROR_KEYWORD = 'Cannot read properties of undefined (reading';

export const addErrorSuggestion = (errMessage: string): string => {
  if (errMessage.includes(JS_UNDEFINED_ERROR_KEYWORD)) {
    errMessage +=
      '\nTo allow undefined values use ?. instead of . before the property you are reading or check if the object before . exists.';
  }
  return errMessage;
};
