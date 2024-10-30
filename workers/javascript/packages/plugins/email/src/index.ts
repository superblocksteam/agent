import { AttachmentData } from '@sendgrid/helpers/classes/attachment';
import { MailDataRequired } from '@sendgrid/helpers/classes/mail';
import sgMail, { MailService } from '@sendgrid/mail';
import {
  BasePlugin,
  DatasourceMetadataDto,
  EMAIL_INTEGRATION_SENDER_ADDRESS_DEFAULT,
  EMAIL_INTEGRATION_SENDER_NAME_DEFAULT,
  EmailActionConfiguration,
  EmailActionFieldNames,
  EmailActionFieldsMap,
  EmailDatasourceConfiguration,
  ErrorCode,
  ExecutionContext,
  ExecutionOutput,
  FormItem,
  getEncodedFile,
  IntegrationError,
  isReadableFile,
  isReadableFileConstructor,
  PluginExecutionProps,
  RawRequest,
  RequestFile,
  RequestFiles
} from '@superblocks/shared';
import { isEmpty } from 'lodash';

export default class EmailPlugin extends BasePlugin {
  pluginName = 'Email';

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    files
  }: PluginExecutionProps<EmailDatasourceConfiguration, EmailActionConfiguration>): Promise<ExecutionOutput> {
    for (const field of Object.values<FormItem>(EmailActionFieldsMap)) {
      if (field.rules?.[0]?.required) {
        if (!actionConfiguration[field.name]) {
          throw new IntegrationError(`${field.label} not specified`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
      }
    }

    const msg = await this.formEmailJson({ context, actionConfiguration, datasourceConfiguration, files });

    try {
      const client = this.createClient(datasourceConfiguration);

      await client.send(msg);
      const ret = new ExecutionOutput();
      ret.output = msg;
      return ret;
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(`Failed to send using SendGrid.\n\nError:\n${err}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
    }
  }

  createClient(datasourceConfiguration: EmailDatasourceConfiguration): MailService {
    const key = datasourceConfiguration.authentication?.custom?.apiKey?.value ?? '';
    // NOTE: (joey) the api key will be empty when an organization is not allowed to use this plugin
    if (isEmpty(key)) {
      const errorMsg =
        "Payment required. Email isn't available for your organization's plan. Upgrade your account or [contact sales](mailto://billing-requests@superblockshq.com) to use this feature.";
      throw new IntegrationError(errorMsg, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, { pluginName: this.pluginName });
    }

    sgMail.setApiKey(key);
    return sgMail;
  }

  dynamicProperties(): string[] {
    return Object.values(EmailActionFieldNames);
  }

  async formEmailJson({
    context,
    actionConfiguration,
    datasourceConfiguration,
    files = undefined
  }: {
    context: ExecutionContext;
    actionConfiguration: EmailActionConfiguration;
    datasourceConfiguration: EmailDatasourceConfiguration;
    files?: RequestFiles;
  }): Promise<MailDataRequired> {
    let attachments: AttachmentData[] = [];
    if (actionConfiguration.emailAttachments) {
      if (typeof actionConfiguration.emailAttachments === 'string') {
        try {
          actionConfiguration.emailAttachments = JSON.parse(actionConfiguration.emailAttachments);
        } catch (e) {
          throw new IntegrationError(
            'Cannot parse the file objects. They must be an array of JSON objects.',
            ErrorCode.INTEGRATION_SYNTAX,
            { pluginName: this.pluginName }
          );
        }
      }

      if (!Array.isArray(actionConfiguration.emailAttachments)) {
        throw new IntegrationError('Attachments must be provided in the form of an array of JSON objects.', ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }

      attachments = await Promise.all(
        actionConfiguration.emailAttachments.map(async (file: unknown) => {
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
                type: file.type
              } as AttachmentData;
            }

            throw new IntegrationError(
              'Cannot read attachments. Attachments can either be Superblocks files or { name: string; contents: string, type: string }.',
              ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
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
              type: file.type
            } as AttachmentData;
          } catch (err) {
            if (err && err?.response?.status === 404) {
              throw new IntegrationError(
                `Could not retrieve file ${file.name} from controller: ${err.message}`,
                ErrorCode.INTEGRATION_LOGIC,
                { pluginName: this.pluginName }
              );
            }
            throw new IntegrationError(
              `Could not retrieve file ${file.name} from controller: ${err.message}`,
              ErrorCode.INTEGRATION_NETWORK,
              { pluginName: this.pluginName }
            );
          }
        })
      );
    }

    return this.emailConstructor({ actionConfiguration, datasourceConfiguration, attachments });
  }

  private emailConstructor({
    actionConfiguration,
    datasourceConfiguration,
    attachments
  }: {
    actionConfiguration: EmailActionConfiguration;
    datasourceConfiguration: EmailDatasourceConfiguration;
    attachments: AttachmentData[];
  }): MailDataRequired {
    return {
      from: {
        email: datasourceConfiguration.authentication?.custom?.senderEmail?.value ?? EMAIL_INTEGRATION_SENDER_ADDRESS_DEFAULT,
        name: datasourceConfiguration.authentication?.custom?.senderName?.value ?? EMAIL_INTEGRATION_SENDER_NAME_DEFAULT
      },
      to: this.parseEmailAddresses(actionConfiguration.emailTo),
      cc: this.parseEmailAddresses(actionConfiguration.emailCc),
      bcc: this.parseEmailAddresses(actionConfiguration.emailBcc),
      subject: actionConfiguration.emailSubject,

      content: [{ type: 'text/html', value: actionConfiguration.emailBody ?? '' }],
      attachments: attachments
    };
  }

  getRequest(actionConfiguration: EmailActionConfiguration, datasourceConfiguration: EmailDatasourceConfiguration): RawRequest {
    // Can't call formEmailJson anymore because it's async and because
    // we probs shouln't be grabbing the attachment data anyways.
    // We'll need to add some attachment metadata back in the future.
    return JSON.stringify(this.emailConstructor({ actionConfiguration, datasourceConfiguration, attachments: [] }), null, 2);
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

  async metadata(datasourceConfiguration: EmailDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return {};
  }

  async test(datasourceConfiguration: EmailDatasourceConfiguration): Promise<void> {
    return;
  }
}
