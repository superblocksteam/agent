import {
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  ExecutionOutput,
  PluginExecutionProps,
  SmtpActionConfiguration,
  SmtpDatasourceConfiguration
} from '@superblocks/shared';

interface SuperblocksAttachment {
  content: string;
  encoding: string;
  filename: string;
  type: string;
}

export interface EmailOutput {
  to: string[];
  replyTo?: string;
  cc: string[];
  bcc: string[];
  subject: string;
  html: string;
  attachments: SuperblocksAttachment[];
}

const context = DUMMY_EXECUTION_CONTEXT;
export const buildPropsWithActionConfiguration = (
  actionConfiguration: SmtpActionConfiguration,
  datasourceConfiguration: SmtpDatasourceConfiguration
): PluginExecutionProps<SmtpDatasourceConfiguration, SmtpActionConfiguration> => {
  return {
    context,
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput: new ExecutionOutput(),
    ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
  } as PluginExecutionProps<SmtpDatasourceConfiguration, SmtpActionConfiguration>;
};
