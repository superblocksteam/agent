import { ActionConfiguration, ExecutionContext, RequestFiles } from '..';

const MAX_SHOWN_VALUE_LEN = 100;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function showBoundValue(val: unknown) {
  const str = JSON.stringify(val);
  return str.length <= MAX_SHOWN_VALUE_LEN ? str : str.substring(0, MAX_SHOWN_VALUE_LEN) + '…';
}

export type ActionConfigurationResolutionContext = {
  context: ExecutionContext;
  actionConfiguration: ActionConfiguration;
  files: RequestFiles;
  property: string;
  escapeStrings: boolean;
  disabled?: boolean;
};
