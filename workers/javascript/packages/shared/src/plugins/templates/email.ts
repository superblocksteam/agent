import { FormComponentType, FormItem } from '../../types';

// superblocksmail is set up as a verified domain in Sendgrid under a different account than superblockshq.com.
// The current setup allows us to use any address with that domain.
export const EMAIL_INTEGRATION_SENDER_ADDRESS_DEFAULT = 'app@superblocksmail.com';
export const EMAIL_INTEGRATION_SENDER_NAME_DEFAULT = 'Superblocks';
export const EMAIL_INTEGRATION_TEMPLATE_ID_DEFAULT = 'd-1cf30b5bba6e4dccbd14dc67e7b8f354';

export const EmailPluginVersions = {
  V1: '0.0.1'
};

export enum EmailActionFieldNames {
  FROM = 'emailFrom',
  TO = 'emailTo',
  CC = 'emailCc',
  BCC = 'emailBcc',
  SUBJECT = 'emailSubject',
  BODY = 'emailBody',
  ATTACHMENTS = 'emailAttachments'
}

export const EmailActionFieldsMap: Record<EmailActionFieldNames, FormItem> = {
  [EmailActionFieldNames.FROM]: {
    name: EmailActionFieldNames.FROM,
    label: 'From',
    startVersion: EmailPluginVersions.V1,
    // Using the defaults directly since we will have to refactor this plugin when we allow
    // user specified API key and/or sender through delegation.
    initialValue: `${EMAIL_INTEGRATION_SENDER_NAME_DEFAULT} <${EMAIL_INTEGRATION_SENDER_ADDRESS_DEFAULT}>`,
    componentType: FormComponentType.INPUT_TEXT,
    disabled: true
  },
  [EmailActionFieldNames.TO]: {
    name: EmailActionFieldNames.TO,
    label: 'To',
    startVersion: EmailPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'jane@acme.com, rahul@acme.com',
    rules: [{ required: true, message: 'To is required' }]
  },
  [EmailActionFieldNames.CC]: {
    name: EmailActionFieldNames.CC,
    label: 'Cc',
    startVersion: EmailPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'emilia@acme.com, jose@acme.com'
  },
  [EmailActionFieldNames.BCC]: {
    name: EmailActionFieldNames.BCC,
    label: 'Bcc',
    startVersion: EmailPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'huang@acme.com, sofia@acme.com'
  },
  [EmailActionFieldNames.SUBJECT]: {
    name: EmailActionFieldNames.SUBJECT,
    label: 'Subject',
    startVersion: EmailPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: 'Daily Usage Report',
    rules: [{ required: true, message: 'Subject is required' }]
  },
  [EmailActionFieldNames.BODY]: {
    name: EmailActionFieldNames.BODY,
    label: 'Body',
    startVersion: EmailPluginVersions.V1,
    componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
    placeholder: `Supports both plain text and html. For example:
<h3 style="color:Tomato;">There were a total of {{Step1.output.count}} API calls made today.</h3>`,
    style: {
      minHeight: '100px'
    }
  },
  [EmailActionFieldNames.ATTACHMENTS]: {
    name: EmailActionFieldNames.ATTACHMENTS,
    label: 'File attachments object array',
    startVersion: EmailPluginVersions.V1,
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
