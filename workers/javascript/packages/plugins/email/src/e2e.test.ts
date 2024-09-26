import {
  DUMMY_EXECUTION_CONTEXT,
  EmailActionConfiguration,
  EmailDatasourceConfiguration,
  ExecutionOutput,
  PluginExecutionProps,
  RelayDelegate
} from '@superblocks/shared';
import { cloneDeep } from 'lodash';
import EmailPlugin from '.';

// THESE TESTS SHOULD ONLY EVER BE RUN LOCALLY, NOT IN CI

// this is what the UI/plugin template will send. don't change these
const SEND_FROM_EMAIL = 'app@superblocksmail.com';
const SEND_FROM_NAME = 'Superblocks';
// can find this under SUPERBLOCKS_SERVER_EMAIL_INTEGRATION_KEY 1Pass under k8s-secret-{ENV}-server-env
const SENDGRID_API_KEY = '';
// put your email here to test
const SEND_TO_EMAIL = '';

const plugin: EmailPlugin = new EmailPlugin();

export const datasourceConfiguration = {
  authentication: {
    custom: {
      apiKey: { value: SENDGRID_API_KEY },
      senderEmail: SEND_FROM_EMAIL,
      senderName: SEND_FROM_NAME
    }
  },
  name: 'Email Plugin Tests'
} as EmailDatasourceConfiguration;

const actionConfiguration = {
  emailFrom: SEND_FROM_EMAIL,
  emailTo: SEND_TO_EMAIL,
  emailSubject: 'test subject',
  emailBody: 'hi from test'
} as EmailActionConfiguration;

export const DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS = {
  files: [],
  agentCredentials: {},
  recursionContext: {
    executedWorkflowsPath: [],
    isEvaluatingDatasource: false
  },
  environment: 'dev',
  relayDelegate: new RelayDelegate({
    body: {},
    headers: {},
    query: {}
  })
};

const context = DUMMY_EXECUTION_CONTEXT;
const props: PluginExecutionProps<EmailDatasourceConfiguration, EmailActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

xdescribe('queries', () => {
  test('can send email', async () => {
    const newProps = cloneDeep(props);
    await plugin.execute(newProps);
  });
});
