import { FormComponentType, FormItem } from '../../types';

// TODO (jason) change these constant values as these are pulled from Sendgrid
// superblocksmail is set up as a verified domain in Sendgrid under a different account than superblockshq.com.
// The current setup allows us to use any address with that domain.
export const SMTP_INTEGRATION_SENDER_ADDRESS_DEFAULT = 'app@acme.com';
export const SMTP_INTEGRATION_SENDER_NAME_DEFAULT = 'Acme App';

export const SmtpPluginVersions = {
  V1: '0.0.1'
};

export enum SmtpActionFieldNames {
  FROM = 'from',
  TO = 'to',
  REPLY_TO = 'replyTo',
  CC = 'cc',
  BCC = 'bcc',
  SUBJECT = 'subject',
  BODY = 'body',
  ATTACHMENTS = 'attachments'
}

export enum SmtpDatasourceFieldNames {
  HOST = 'connection.host',
  PORT = 'connection.port',
  USERNAME = 'connection.username',
  PASSWORD = 'connection.password',
  SECURE = 'connection.secure'
}

export const SmtpActionFieldsMap: Record<SmtpActionFieldNames, FormItem> = {
  [SmtpActionFieldNames.FROM]: {
    name: SmtpActionFieldNames.FROM,
    label: 'From',
    startVersion: SmtpPluginVersions.V1,
    // Using the defaults directly since we will have to refactor this plugin when we allow
    // user specified API key and/or sender through delegation.
    placeholder: `"${SMTP_INTEGRATION_SENDER_NAME_DEFAULT}" <${SMTP_INTEGRATION_SENDER_ADDRESS_DEFAULT}>`,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    rules: [{ required: true, message: 'From is required' }]
  },
  [SmtpActionFieldNames.REPLY_TO]: {
    name: SmtpActionFieldNames.REPLY_TO,
    label: 'Reply To',
    startVersion: SmtpPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'helpdesk@acme.com',
    rules: [{ required: false }]
  },
  [SmtpActionFieldNames.TO]: {
    name: SmtpActionFieldNames.TO,
    label: 'To',
    startVersion: SmtpPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'jane@acme.com, rahul@acme.com',
    rules: [{ required: true, message: 'To is required' }]
  },
  [SmtpActionFieldNames.CC]: {
    name: SmtpActionFieldNames.CC,
    label: 'Cc',
    startVersion: SmtpPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'emilia@acme.com, jose@acme.com'
  },
  [SmtpActionFieldNames.BCC]: {
    name: SmtpActionFieldNames.BCC,
    label: 'Bcc',
    startVersion: SmtpPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'huang@acme.com, sofia@acme.com'
  },
  [SmtpActionFieldNames.SUBJECT]: {
    name: SmtpActionFieldNames.SUBJECT,
    label: 'Subject',
    startVersion: SmtpPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'Daily Usage Report',
    rules: [{ required: true, message: 'Subject is required' }]
  },
  [SmtpActionFieldNames.BODY]: {
    name: SmtpActionFieldNames.BODY,
    label: 'Body',
    startVersion: SmtpPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: `Supports both plain text and html. For example:
<h3 style="color:Tomato;">There were a total of {{Step1.output.count}} API calls made today.</h3>`,
    style: {
      minHeight: '100px'
    },
    rules: [{ required: true, message: 'Body is required' }]
  },
  [SmtpActionFieldNames.ATTACHMENTS]: {
    name: SmtpActionFieldNames.ATTACHMENTS,
    label: 'File Attachments Object Array',
    startVersion: SmtpPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: `Specify email attachments as an array of Superblocks file entities in one of the following ways:

1. Use uploaded files directly:
{{FilePicker1.files}}

2. Specify files programmatically:
{{[ { name: "test.csv", contents: Step1.output, type: "text/csv" },
FilePicker1.files[0] ]}}
    `,
    style: {
      minHeight: '100px'
    }
  }
};
