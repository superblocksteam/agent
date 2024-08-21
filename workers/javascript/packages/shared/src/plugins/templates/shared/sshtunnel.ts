import {
  AgentType,
  DropdownOption,
  FormComponentType,
  FormItem,
  FormSection,
  InputDataType,
  SharedSSHAuthMethod,
  PluginCommon,
  EditorLanguage
} from '../../../types';

export const sshTunnelSections = ({
  startVersion,
  endVersion,
  fieldNamesToHide = [],
  isProto = false,
  hideForConnectionUrl
}: {
  startVersion: string;
  endVersion?: string;
  fieldNamesToHide?: string[];
  isProto?: boolean;
  hideForConnectionUrl?: boolean;
}): FormItem[] => {
  const formSections: FormSection[] = [];
  const authFields: FormItem[] = [];

  const baseFields: FormItem[] = [
    {
      label: 'Use SSH Tunnel',
      name: 'tunnel.enabled',
      startVersion: startVersion,
      componentType: FormComponentType.CHECKBOX,
      agentType: AgentType.MULTITENANT,
      ldFlag: 'ui.integration.enable-experimental',
      initialValue: false
    },
    {
      label: 'Authentication method',
      name: isProto ? 'tunnel.authenticationMethod' : 'tunnel.authMethod',
      startVersion: startVersion,
      componentType: FormComponentType.DROPDOWN,
      agentType: AgentType.MULTITENANT,
      initialValue: isProto
        ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_USER_PRIVATE_KEY.toString()
        : SharedSSHAuthMethod.USER_PRIVATE_KEY.toString(),
      options: sshAuthOptions(isProto),
      tooltip: {
        markdownText: `Authentication method used by the bastion server to connect to your instance`
      },
      singleLine: true,
      display: {
        show: {
          ['tunnel.enabled']: ['true']
        }
      }
    },
    {
      label: 'Bastion host',
      name: 'tunnel.host',
      startVersion: startVersion,
      componentType: FormComponentType.INPUT_TEXT,
      agentType: AgentType.MULTITENANT,
      placeholder: 'bastion-instance.amazonaws.com',
      rules: [{ required: true, message: 'Bastion host is required' }],
      initialValue: '',
      tooltip: {
        markdownText: 'Bastion destination address to connect to for SSH port forwarding'
      },
      display: {
        show: {
          ['tunnel.enabled']: ['true']
        }
      }
    },
    {
      label: 'Bastion port',
      name: 'tunnel.port',
      startVersion: startVersion,
      componentType: FormComponentType.INPUT_TEXT,
      dataType: InputDataType.NUMBER,
      agentType: AgentType.MULTITENANT,
      initialValue: 22,
      placeholder: '65432',
      rules: [{ required: true, message: 'Bastion port is required' }],
      tooltip: {
        markdownText: 'Bastion destination port to connect to for SSH port forwarding'
      },
      display: {
        show: {
          ['tunnel.enabled']: ['true']
        }
      }
    },
    {
      label: 'Bastion username',
      name: 'tunnel.username',
      startVersion: startVersion,
      componentType: FormComponentType.INPUT_TEXT,
      agentType: AgentType.MULTITENANT,
      placeholder: 'bastion-username',
      initialValue: 'superblocks',
      rules: [{ required: true, message: 'Bastion username is required' }],
      display: {
        show: {
          ['tunnel.enabled']: ['true']
        }
      }
    },
    {
      label: 'Bastion password',
      name: 'tunnel.password',
      startVersion: startVersion,
      componentType: FormComponentType.INPUT_TEXT,
      agentType: AgentType.MULTITENANT,
      dataType: InputDataType.PASSWORD,
      rules: [{ required: true, message: 'Bastion password is required' }],
      display: {
        show: {
          ['tunnel.enabled']: ['true'],
          ['tunnel.authMethod']: [
            isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PASSWORD.toString() : SharedSSHAuthMethod.PASSWORD.toString()
          ]
        }
      }
    },
    {
      label: 'User-defined public key',
      name: 'tunnel.publicKey',
      startVersion: startVersion,
      componentType: FormComponentType.INPUT_TEXT,
      enableCopy: true,
      agentType: AgentType.MULTITENANT,
      rules: [{ required: true, message: 'User-defined public key is required' }],
      tooltip: {
        markdownText: 'Public key of your newly generated public/private key pair'
      },
      display: {
        show: {
          ['tunnel.enabled']: ['true'],
          ['tunnel.authMethod']: [
            isProto
              ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_USER_PRIVATE_KEY.toString()
              : SharedSSHAuthMethod.USER_PRIVATE_KEY.toString()
          ]
        }
      }
    },
    {
      label: 'User-defined private key',
      name: 'tunnel.privateKey',
      startVersion: startVersion,
      componentType: FormComponentType.CODE_EDITOR,
      language: EditorLanguage.TEXT,
      agentType: AgentType.MULTITENANT,
      rules: [{ required: true, message: 'User-defined private key is required' }],
      tooltip: {
        markdownText: 'Private key of your newly generated public/private key pair'
      },
      display: {
        show: {
          ['tunnel.enabled']: ['true'],
          ['tunnel.authMethod']: [
            isProto
              ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_USER_PRIVATE_KEY.toString()
              : SharedSSHAuthMethod.USER_PRIVATE_KEY.toString()
          ]
        }
      }
    },
    {
      label: 'Public key (RSA)',
      name: 'tunnelPublicKeyDisplayRSA',
      startVersion: startVersion,
      componentType: FormComponentType.INPUT_TEXT,
      enableCopy: true,
      agentType: AgentType.MULTITENANT,
      disabled: true,
      forcedStatic: true,
      initialValueFromEnv: 'SUPERBLOCKS_UI_PUB_KEY_RSA',
      tooltip: {
        markdownText: 'Copy contents to your authorized_keys file'
      },
      display: {
        show: {
          ['tunnel.enabled']: ['true'],
          ['tunnel.authMethod']: [
            isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA.toString() : SharedSSHAuthMethod.PUB_KEY_RSA.toString()
          ]
        }
      }
    },
    {
      label: 'Public key (Ed25519)',
      name: 'tunnelPublicKeyDisplayEd25519',
      startVersion: startVersion,
      componentType: FormComponentType.INPUT_TEXT,
      enableCopy: true,
      agentType: AgentType.MULTITENANT,
      disabled: true,
      forcedStatic: true,
      initialValueFromEnv: 'SUPERBLOCKS_UI_PUB_KEY_ED25519',
      tooltip: {
        markdownText: 'Copy contents to your authorized_keys file'
      },
      display: {
        show: {
          ['tunnel.enabled']: ['true'],
          ['tunnel.authMethod']: [
            isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_ED25519.toString() : SharedSSHAuthMethod.PUB_KEY_ED25519.toString()
          ]
        }
      }
    }
  ];

  if (endVersion) {
    for (const field of baseFields) {
      field['endVersion'] = endVersion;
    }
  }
  // ssh option are not supported by connection url/string mode
  if (hideForConnectionUrl) {
    for (const field of baseFields) {
      if (field.display && field.display.show) {
        // add if field.display.show object exists
        field.display.show['connectionType'] = ['fields'];
      } else {
        field.display = {
          show: {
            connectionType: ['fields']
          }
        };
      }
    }
  }

  addField(authFields, baseFields, fieldNamesToHide);

  formSections.push({
    name: 'tunnel',
    borderThreshold: 1,
    items: authFields
  });

  const tunnelButtons: FormItem[] = [];

  formSections.push({
    name: 'tunnelButtons',
    items: [
      {
        gridCss: {
          gridTemplateColumns: 'auto 1fr',
          gridTemplateGap: 8
        },
        rowItems: tunnelButtons
      }
    ]
  });

  return authFields;
};

function sshAuthOptions(isProto?: boolean) {
  const options: DropdownOption[] = [
    {
      displayName: 'User-defined private key',
      key: isProto
        ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_USER_PRIVATE_KEY.toString()
        : SharedSSHAuthMethod.USER_PRIVATE_KEY.toString(),
      value: isProto
        ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_USER_PRIVATE_KEY.toString()
        : SharedSSHAuthMethod.USER_PRIVATE_KEY.toString()
    },
    {
      displayName: 'Public key (RSA)',
      key: isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA.toString() : SharedSSHAuthMethod.PUB_KEY_RSA.toString(),
      value: isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA.toString() : SharedSSHAuthMethod.PUB_KEY_RSA.toString()
    },
    {
      displayName: 'Public key (Ed25519)',
      key: isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_ED25519.toString() : SharedSSHAuthMethod.PUB_KEY_ED25519.toString(),
      value: isProto
        ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_ED25519.toString()
        : SharedSSHAuthMethod.PUB_KEY_ED25519.toString()
    },
    {
      displayName: 'Password',
      key: isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PASSWORD.toString() : SharedSSHAuthMethod.PASSWORD.toString(),
      value: isProto ? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PASSWORD.toString() : SharedSSHAuthMethod.PASSWORD.toString()
    }
  ];
  return options;
}

function addField(authFields: FormItem[], fieldsToAdd: FormItem[], fieldNamesToHide: string[]) {
  for (const field of fieldsToAdd) {
    authFields.push({ ...field, hidden: field.hidden || fieldNamesToHide.includes(field.name) });
  }
}
