import { ErrorCode, RelayDelegate, SmtpActionConfiguration, SmtpDatasourceConfiguration } from '@superblocks/shared';
import { Plugin_SmtpConnection } from '@superblocksteam/types/src/plugins/smtp/v1/plugin_pb';
import { EmailOutput, buildPropsWithActionConfiguration } from './test.util';
import SmtpPlugin from '.';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { mock } = require('nodemailer');

const SMTP_HOST = '127.0.0.1';
const SMTP_PORT = 58703;
const SMTP_USER = 'root';
const SMTP_PASSWORD = 'password';

const plugin: SmtpPlugin = new SmtpPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const datasourceConfiguration = {
  connection: Plugin_SmtpConnection.fromJson({
    host: SMTP_HOST,
    port: SMTP_PORT,
    username: SMTP_USER,
    password: SMTP_PASSWORD,
    secure: false
  }),
  name: 'SMTP Test'
} as SmtpDatasourceConfiguration;
const actionConfiguration = {
  from: 'e2e@superblocks.com',
  to: 'e2e-dest@superblocks.com',
  cc: 'e2e-cc@superblocks.com',
  bcc: 'e2e-bcc@superblocks.com',
  subject: 'Test Subject',
  body: 'Test body'
} as SmtpActionConfiguration;
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

const props = buildPropsWithActionConfiguration(actionConfiguration, datasourceConfiguration);

describe('SMTP Mock Tests', () => {
  test('test connection', async () => {
    await plugin.test(datasourceConfiguration);
    const sentEmails = mock.getSentMail();
    expect(sentEmails.length).toBe(0);
  });

  test('send an email without attachments', async () => {
    const sentEmailsBeforeCount = mock.getSentMail().length;
    props.actionConfiguration = {
      from: 'e2e@superblocks.com',
      to: 'e2e-dest@superblocks.com',
      cc: 'e2e-cc@superblocks.com',
      bcc: 'e2e-bcc@superblocks.com',
      subject: 'Test Subject',
      body: 'Test body no attachments'
    };
    await plugin.execute(props);
    const sentEmailsAfter = mock.getSentMail();
    expect(sentEmailsAfter.length).toBe(sentEmailsBeforeCount + 1);
    expect(sentEmailsAfter[sentEmailsBeforeCount].from).toBe(props.actionConfiguration.from);
    expect(sentEmailsAfter[sentEmailsBeforeCount].to[0]).toBe(props.actionConfiguration.to);
    expect(sentEmailsAfter[sentEmailsBeforeCount].replyTo).toBe(undefined);
    expect(sentEmailsAfter[sentEmailsBeforeCount].cc[0]).toBe(props.actionConfiguration.cc);
    expect(sentEmailsAfter[sentEmailsBeforeCount].bcc[0]).toBe(props.actionConfiguration.bcc);
    expect(sentEmailsAfter[sentEmailsBeforeCount].subject).toBe(props.actionConfiguration.subject);
    expect(sentEmailsAfter[sentEmailsBeforeCount].html).toBe(props.actionConfiguration.body);
    expect(Object.entries(sentEmailsAfter[0].headers).length).toBe(0);
  });

  test('send an invalid email without attachments', async () => {
    props.actionConfiguration = {
      from: 'e2e@superblocks.com',
      to: '',
      cc: '',
      bcc: '',
      subject: 'Test Subject',
      body: 'Test body no attachments'
    };

    await plugin
      .execute(props)
      .then((_) => {
        expect('this').toBe('should fail');
      })
      .catch((err) => {
        expect(err.message).toMatch('To not specified');
        expect(err.code).toBe(ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
      });
  });

  test('send an email with an attachment', async () => {
    const sentEmailsBeforeCount = mock.getSentMail().length;
    const attachments = [{ name: 'test.txt', contents: 'Hello World!', type: 'text/plain' }];
    props.actionConfiguration = {
      from: 'e2e@superblocks.com',
      to: 'e2e-dest@superblocks.com',
      cc: 'e2e-cc@superblocks.com',
      bcc: 'e2e-bcc@superblocks.com',
      subject: 'Test Subject',
      body: 'Test body',
      attachments: JSON.stringify(attachments)
    };
    const emailResp = await plugin.execute(props);
    const emailOutput = emailResp.output as EmailOutput;
    expect(emailOutput.to[0]).toBe(props.actionConfiguration.to);
    expect(emailOutput.replyTo).toBe(undefined);
    expect(emailOutput.cc[0]).toBe(props.actionConfiguration.cc);
    expect(emailOutput.bcc[0]).toBe(props.actionConfiguration.bcc);
    expect(emailOutput.subject).toBe(props.actionConfiguration.subject);
    expect(emailOutput.html).toBe(props.actionConfiguration.body);
    expect(emailOutput.attachments.length).toBe(1);
    expect(emailOutput.attachments[0].filename).toBe(attachments[0].name);
    expect(emailOutput.attachments[0].type).toBe(attachments[0].type);
    expect(emailOutput.attachments[0].content).toBe('SGVsbG8gV29ybGQh');
    expect(emailOutput.attachments[0].encoding).toBe('base64');

    // verify the mock sent emails match accordingly
    const sentEmailsAfter = mock.getSentMail();
    expect(sentEmailsAfter.length).toBe(sentEmailsBeforeCount + 1);
    expect(sentEmailsAfter[sentEmailsBeforeCount].to[0]).toBe(props.actionConfiguration.to);
    expect(sentEmailsAfter[sentEmailsBeforeCount].replyTo).toBe(undefined);
    expect(sentEmailsAfter[sentEmailsBeforeCount].cc[0]).toBe(props.actionConfiguration.cc);
    expect(sentEmailsAfter[sentEmailsBeforeCount].bcc[0]).toBe(props.actionConfiguration.bcc);
    expect(sentEmailsAfter[sentEmailsBeforeCount].subject).toBe(props.actionConfiguration.subject);
    expect(sentEmailsAfter[sentEmailsBeforeCount].html).toBe(props.actionConfiguration.body);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments.length).toBe(1);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].filename).toBe(attachments[0].name);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].type).toBe(attachments[0].type);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].content).toBe('SGVsbG8gV29ybGQh');
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].encoding).toBe('base64');
  });

  test('send an email with an invalid attachment format', async () => {
    const attachments = [{ name: 'test.txt', contentsBad: 'Hello World!', type: 'text/plain' }];
    props.actionConfiguration = {
      from: 'e2e@superblocks.com',
      to: 'e2e-dest@superblocks.com',
      cc: 'e2e-cc@superblocks.com',
      bcc: 'e2e-bcc@superblocks.com',
      subject: 'Test Subject',
      body: 'Test body',
      attachments: JSON.stringify(attachments)
    };

    await plugin
      .execute(props)
      .then((_) => {
        expect('this').toBe('should fail');
      })
      .catch((err) => {
        expect(err.message).toMatch(
          'Cannot read attachments. Attachments can either be Superblocks files or { name: string; contents: string; type: string }.'
        );
        expect(err.code).toBe(ErrorCode.INTEGRATION_SYNTAX);
      });
  });

  test('send an email with replyTo', async () => {
    const sentEmailsBeforeCount = mock.getSentMail().length;
    const attachments = [{ name: 'test.txt', contents: 'Hello World!', type: 'text/plain' }];
    props.actionConfiguration = {
      from: 'e2e@superblocks.com',
      to: 'e2e-dest@superblocks.com',
      replyTo: 'mock-replyto-dest@superblocks.com',
      cc: 'e2e-cc@superblocks.com',
      bcc: 'e2e-bcc@superblocks.com',
      subject: 'Test Subject',
      body: 'Test body',
      attachments: JSON.stringify(attachments)
    };

    const emailResp = await plugin.execute(props);
    const emailOutput = emailResp.output as EmailOutput;
    expect(emailOutput.to[0]).toBe(props.actionConfiguration.to);
    expect(emailOutput.replyTo).toBe(props.actionConfiguration.replyTo);
    expect(emailOutput.cc[0]).toBe(props.actionConfiguration.cc);
    expect(emailOutput.bcc[0]).toBe(props.actionConfiguration.bcc);
    expect(emailOutput.subject).toBe(props.actionConfiguration.subject);
    expect(emailOutput.html).toBe(props.actionConfiguration.body);
    expect(emailOutput.attachments.length).toBe(1);
    expect(emailOutput.attachments[0].filename).toBe(attachments[0].name);
    expect(emailOutput.attachments[0].type).toBe(attachments[0].type);
    expect(emailOutput.attachments[0].content).toBe('SGVsbG8gV29ybGQh');
    expect(emailOutput.attachments[0].encoding).toBe('base64');

    // verify the mock sent emails match accordingly
    const sentEmailsAfter = mock.getSentMail();
    expect(sentEmailsAfter.length).toBe(sentEmailsBeforeCount + 1);
    expect(sentEmailsAfter[sentEmailsBeforeCount].to[0]).toBe(props.actionConfiguration.to);
    expect(sentEmailsAfter[sentEmailsBeforeCount].replyTo).toBe(props.actionConfiguration.replyTo);
    expect(sentEmailsAfter[sentEmailsBeforeCount].cc[0]).toBe(props.actionConfiguration.cc);
    expect(sentEmailsAfter[sentEmailsBeforeCount].bcc[0]).toBe(props.actionConfiguration.bcc);
    expect(sentEmailsAfter[sentEmailsBeforeCount].subject).toBe(props.actionConfiguration.subject);
    expect(sentEmailsAfter[sentEmailsBeforeCount].html).toBe(props.actionConfiguration.body);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments.length).toBe(1);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].filename).toBe(attachments[0].name);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].type).toBe(attachments[0].type);
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].content).toBe('SGVsbG8gV29ybGQh');
    expect(sentEmailsAfter[sentEmailsBeforeCount].attachments[0].encoding).toBe('base64');
  });
});
