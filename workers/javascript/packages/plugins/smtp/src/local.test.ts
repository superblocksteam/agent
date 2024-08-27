import { ErrorCode, RelayDelegate, SmtpActionConfiguration, SmtpDatasourceConfiguration } from '@superblocks/shared';
import { SmtpPluginV1 } from '@superblocksteam/types';
import SmtpPlugin from '.';
import { EmailOutput, buildPropsWithActionConfiguration } from './test.util';

jest.unmock('nodemailer');
jest.unmock('nodemailer/lib/mailer');

const SMTP_HOST = '127.0.0.1';
const SMTP_PORT = 58703;
const SMTP_USER = 'root';
const SMTP_PASSWORD = 'password';
const { Plugin_SmtpConnection } = SmtpPluginV1;

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
  name: 'SMTP E2E Test'
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

describe('SMTP E2E Tests', () => {
  test('test connection', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('test bad connection with connection refused', async () => {
    const badDatasourceConfiguration = {
      connection: Plugin_SmtpConnection.fromJson({
        host: SMTP_HOST,
        port: 58705,
        username: SMTP_USER,
        password: SMTP_PASSWORD,
        secure: false
      }),
      name: 'SMTP E2E Invalid Port Test'
    } as SmtpDatasourceConfiguration;

    await plugin
      .test(badDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch('Test connection failed, connect ECONNREFUSED 127.0.0.1:58705');
        expect(err.code).toBe(ErrorCode.INTEGRATION_NETWORK);
      });
  });

  test('test bad connection with SSL mismatch', async () => {
    const badDatasourceConfiguration = {
      connection: Plugin_SmtpConnection.fromJson({
        host: SMTP_HOST,
        port: SMTP_PORT,
        username: SMTP_USER,
        password: SMTP_PASSWORD,
        secure: true
      }),
      name: 'SMTP E2E Invalid Port Test'
    } as SmtpDatasourceConfiguration;

    await plugin
      .test(badDatasourceConfiguration)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch('wrong version number');
        expect(err.code).toBe(ErrorCode.INTEGRATION_NETWORK);
      });
  });

  test('send an email without attachments', async () => {
    props.actionConfiguration = {
      from: 'e2e@superblocks.com',
      to: 'e2e-dest@superblocks.com',
      cc: 'e2e-cc@superblocks.com',
      bcc: 'e2e-bcc@superblocks.com',
      subject: 'Test Subject',
      body: 'Test body'
    };
    const emailResp = await plugin.execute(props);
    const emailOutput = emailResp.output as EmailOutput;
    expect(emailOutput.to[0]).toBe(props.actionConfiguration.to);
    expect(emailOutput.replyTo).toBe(undefined);
    expect(emailOutput.cc[0]).toBe(props.actionConfiguration.cc);
    expect(emailOutput.bcc[0]).toBe(props.actionConfiguration.bcc);
    expect(emailOutput.subject).toBe(props.actionConfiguration.subject);
    expect(emailOutput.html).toBe(props.actionConfiguration.body);
    expect(emailOutput.attachments.length).toBe(0);
  });

  test('send an invalid email without attachments', async () => {
    props.actionConfiguration = {
      from: '',
      to: 'e2e-dest@superblocks.com',
      cc: 'e2e-cc@superblocks.com',
      bcc: 'e2e-bcc@superblocks.com',
      subject: 'Test Subject',
      body: 'Test body'
    };

    await plugin
      .execute(props)
      .then((_) => {
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch('From not specified');
        expect(err.code).toBe(ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
      });
  });

  test('send an email with an attachment', async () => {
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
        expect('should not pass').toEqual(true);
      })
      .catch((err) => {
        expect(err.message).toMatch(
          'Cannot read attachments. Attachments can either be Superblocks files or { name: string; contents: string; type: string }.'
        );
        expect(err.code).toBe(ErrorCode.INTEGRATION_SYNTAX);
      });
  });
});
