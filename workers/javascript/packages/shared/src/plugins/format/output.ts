import { ApiExecutionResponse } from '../../types/api';

export const formatExecutionOutput = (response: ApiExecutionResponse): { error?: string } | unknown => {
  const hasError = Object.values(response.context.outputs).filter((output) => output.error);
  if (hasError.length > 0) {
    return {
      error: hasError[0].error
    };
  }
  const lastChild = Object.values(response.context.outputs).filter((output) => !output.children || output.children?.length === 0);
  if (lastChild.length <= 0) {
    return {};
  }
  return lastChild[0].output;
};
