import {
  BasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionContext,
  ExecutionOutput,
  FormItem,
  getEncodedFile,
  IntegrationError,
  isReadableFile,
  isReadableFileConstructor,
  MASKED_SECRET,
  PluginExecutionProps,
  RawRequest,
  RequestFile,
  RequestFiles,
  SMTP_INTEGRATION_SENDER_ADDRESS_DEFAULT,
  SMTP_INTEGRATION_SENDER_NAME_DEFAULT,
  SmtpActionConfiguration,
  SmtpActionFieldNames,
  SmtpActionFieldsMap,
  SmtpDatasourceConfiguration
} from '@superblocks/shared';
import { isEmpty } from 'lodash';
import { createTransport, Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export default class SmtpPlugin extends BasePlugin {
  pluginName = 'SMTP';

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    files
  }: PluginExecutionProps<SmtpDatasourceConfiguration, SmtpActionConfiguration>): Promise<ExecutionOutput> {
    for (const field of Object.values<FormItem>(SmtpActionFieldsMap)) {
      if (field.rules?.[0]?.required) {
        if (!actionConfiguration[field.name]) {
          throw new IntegrationError(`${field.label} not specified`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
        }
      }
    }

    const msg = await this.formEmailJson(context, actionConfiguration, files);

    try {
      const client = this.createClient(datasourceConfiguration);

      const sent = await client.sendMail({
        ...msg,
        from: actionConfiguration.from ?? `"${SMTP_INTEGRATION_SENDER_NAME_DEFAULT}" <${SMTP_INTEGRATION_SENDER_ADDRESS_DEFAULT}>`
      });
      const ret = new ExecutionOutput();
      ret.output = msg;
      ret.log.push(sent.messageId);
      return ret;
    } catch (err) {
      throw new IntegrationError(`Failed to send email.\n\nError:\n${err}`, ErrorCode.UNSPECIFIED, {
        pluginName: this.pluginName,
        stack: `${err.name}: ${err.data}\n${err.stack}`
      });
    }
  }

  createClient(datasourceConfiguration: SmtpDatasourceConfiguration): Transporter {
    const auth = { user: datasourceConfiguration.connection?.username, pass: datasourceConfiguration.connection?.password };
    const nodeMailerTransport = createTransport({
      host: datasourceConfiguration.connection?.host,
      port: datasourceConfiguration.connection?.port,
      secure: datasourceConfiguration.connection?.secure ?? true,
      auth
    });

    return nodeMailerTransport;
  }

  dynamicProperties(): string[] {
    return Object.values(SmtpActionFieldNames);
  }

  async formEmailJson(
    context: ExecutionContext,
    actionConfiguration: SmtpActionConfiguration,
    files: RequestFiles = undefined
  ): Promise<Mail.Options> {
    let attachments: Mail.Attachment[] = [];
    if (actionConfiguration.attachments) {
      if (typeof actionConfiguration.attachments === 'string') {
        try {
          actionConfiguration.attachments = JSON.parse(actionConfiguration.attachments);
        } catch (e) {
          throw new IntegrationError(`Can't parse the file objects. They must be an array of JSON objects.`, ErrorCode.INTEGRATION_SYNTAX, {
            pluginName: this.pluginName
          });
        }
      }

      if (!Array.isArray(actionConfiguration.attachments)) {
        throw new IntegrationError('Attachments must be provided in the form of an array of JSON objects.', ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }

      attachments = await Promise.all(
        actionConfiguration.attachments.map(async (file: unknown) => {
          // Check if the object being passed is a Superblocks file
          // object or has properties that allow it to be read as one
          if (!isReadableFile(file)) {
            if (isReadableFileConstructor(file)) {
              // Sendgrid requires the attached file content to be base64 encoded
              // Buffer.from(file.contents) handles two cases
              // 1. when file.contents is of format Buffer.toJSON(), it constructs the buffer from it
              // 2. when file.contents is string, we create utf8 encoded Buffer
              return {
                filename: file.name,
                content: Buffer.from(file.contents).toString('base64'),
                type: file.type,
                encoding: 'base64'
              } as Mail.Attachment;
            }

            throw new IntegrationError(
              'Cannot read attachments. Attachments can either be Superblocks files or { name: string; contents: string; type: string }.',
              ErrorCode.INTEGRATION_SYNTAX,
              { pluginName: this.pluginName }
            );
          }

          const match = (files as Array<RequestFile>).find((f) => f.originalname.startsWith(`${file.$superblocksId}`));
          if (!match) {
            throw new IntegrationError(`Could not locate contents for attachment file ${file.name}`, ErrorCode.INTEGRATION_SYNTAX, {
              pluginName: this.pluginName
            });
          }
          try {
            return {
              filename: file.name,
              content: await getEncodedFile(context, match.path, 'base64'),
              contentType: file.type,
              encoding: 'base64'
            } as Mail.Attachment;
          } catch (err) {
            if (err && err?.response?.status === 404) {
              throw new IntegrationError(
                `${this.pluginName} Could not retrieve file ${file.name} from controller: ${err.message}`,
                ErrorCode.INTEGRATION_LOGIC,
                { pluginName: this.pluginName }
              );
            }
            throw new IntegrationError(
              `${this.pluginName} Could not retrieve file ${file.name} from controller: ${err.message}`,
              ErrorCode.INTEGRATION_NETWORK,
              { pluginName: this.pluginName }
            );
          }
        })
      );
    }

    return {
      // This is hardcoded for all configs today
      to: this.parseEmailAddresses(actionConfiguration.to),
      replyTo: isEmpty(actionConfiguration.replyTo) ? undefined : actionConfiguration.replyTo,
      cc: this.parseEmailAddresses(actionConfiguration.cc),
      bcc: this.parseEmailAddresses(actionConfiguration.bcc),
      subject: actionConfiguration.subject,
      html: actionConfiguration.body ?? '',
      attachments: attachments
    };
  }

  getRequest(
    actionConfiguration: SmtpActionConfiguration,
    datasourceConfiguration: SmtpDatasourceConfiguration,
    files: RequestFiles
  ): RawRequest {
    // Can't call formEmailJson anymore because it's async and because
    // we probs shouln't be grabbing the attachment data anyways.
    // We'll need to add some attachment metadata back in the future.
    return JSON.stringify(
      {
        host: datasourceConfiguration.connection?.host,
        port: datasourceConfiguration.connection?.port,
        username: datasourceConfiguration.connection?.username,
        password: MASKED_SECRET,
        secure: datasourceConfiguration.connection?.secure,
        from: actionConfiguration.from,
        to: this.parseEmailAddresses(actionConfiguration.to),
        cc: this.parseEmailAddresses(actionConfiguration.cc),
        bcc: this.parseEmailAddresses(actionConfiguration.bcc),
        subject: actionConfiguration.subject,
        html: actionConfiguration.body
      },
      null,
      2
    );
  }

  parseEmailAddresses(emailsString: string | undefined): string[] {
    if (!emailsString || isEmpty(emailsString)) {
      return [];
    }
    // Trim any whitespace and remove any empty strings from the split
    return emailsString
      .split(',')
      .map((item) => item.trim())
      .filter((item) => !isEmpty(item));
  }

  async metadata(datasourceConfiguration: SmtpDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return {};
  }

  public async test(datasourceConfiguration: SmtpDatasourceConfiguration): Promise<void> {
    try {
      const transport = this.createClient(datasourceConfiguration);
      await transport.verify();
    } catch (err) {
      if (err.command === 'CONN') {
        throw new IntegrationError(`Test connection failed, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
          pluginName: this.pluginName
        });
      }
      throw new IntegrationError(`Test connection failed, ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
  }
}
