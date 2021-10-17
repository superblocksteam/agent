# On-Premise Agent (OPA)

This document contains configuration and deployment details for running the Superblocks agent independently.

## Configuration

The agent application can be configured via the use of several environment variables.

| Name                                            | Description                                                                      | Required | Default                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------- | -------- | ----------------------------- |
| SUPERBLOCKS_AGENT_ID                            | UUID used by Superblocks Cloud to identify the agent                             | Yes      | n/a                           |
| SUPERBLOCKS_AGENT_PORT                          | HTTP port that the agent listens on                                              | No       | 8020                          |
| SUPERBLOCKS_AGENT_ENV_VARS_JSON                 | Environment variables (JSON format) to be passed into code execution. For example: `{ 'MY_ENV_VAR': "some value", 'MY_OTHER_ENV_VAR': "another value" }`. Access the vars using `Env.MY_ENV_VAR` in code | No       |       |
| SUPERBLOCKS_AGENT_EXECUTION_JS_TIMEOUT_MS       | Timeout (in ms) for a given Javascript API Step execution                        | No       | 30000                         |
| SUPERBLOCKS_AGENT_EXECUTION_PYTHON_TIMEOUT_MS   | Timeout (in ms) for a given Python API Step execution                            | No       | 30000                         |
| SUPERBLOCKS_AGENT_LOG_LEVEL                     | Log level; one of 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent' | No       | info                          |
| SUPERBLOCKS_AGENT_LOG_DISABLE_PRETTY            | Flag to toggle pretty printing of logs                                           | No       | true                          |
| SUPERBLOCKS_AGENT_LOG_DISABLE_EXPRESS           | Flag to toggle printing of Express request/response logs                         | No       | true                          |
| SUPERBLOCKS_AGENT_DATADOG_DISABLE_TRACER        | Flag to disable/enable Datadog tracing                                           | No       | true                          |
| SUPERBLOCKS_AGENT_DATADOG_DISABLE_LOG_INJECTION | Flag to disable/enable the injection of Datadog trace ID in log records          | No       | true                          |
| SUPERBLOCKS_AGENT_DATADOG_CONNECT_TAGS          | Array (comma-separated) of tags to be added to Datadog histograms                | No       | app:superblocks               |
| SUPERBLOCKS_AGENT_SERVER_URL                    | Superblocks Cloud host that the agent will make fetch calls to                   | No       | https://app.superblockshq.com |
| SUPERBLOCKS_AGENT_JSON_PARSE_LIMIT              | Express request body limit (in mb)                                               | No       | 50mb                          |

## Deployment

To pull the docker image, run the following command:

```sh
docker pull ghcr.io/superblocksteam/agent:<tag>
```

**Note**: The docker image tag (`<tag>`) should be replaced with the desired version; a list of the versions can be found [here](https://github.com/superblocksteam/agent/pkgs/container/agent/versions). The agent ID (`<agent-id>`) will be replaced with a unique ID for each organization for which the agent is being deployed. The agent port is configurable; `<agent-port>` should be replaced with either the custom port or 8020 (if the default is being used).

### docker

To deploy the Superblocks agent using docker, run the following command:

```sh
docker run --name superblocks-agent --env SUPERBLOCKS_AGENT_ID=<agent-id> --publish <agent-port>:8020 --rm ghcr.io/superblocksteam/agent:<tag>
```

### docker-compose

The Superblocks agent can also be deployed using docker-compose.

To do so, first create a `docker-compose.yml` file and save the following content in it.

```yaml
version: '3.7'

services:
  agent:
    container_name: superblocks-agent
    image: ghcr.io/superblocksteam/agent:<tag>
    environment:
      - SUPERBLOCKS_AGENT_ID=<agent-id>
    ports:
      - '<agent-port>:<agent-port>'
```

Then, run the following command:

```sh
docker-compose -f ./docker-compose.yml -p superblocks up -d
```

### kubernetes

The Superblocks agent can also be deployed on any Kubernetes cluster. A reference helm chart can be found [here](./helm).

## Requests

### Incoming

The following table lists all the incoming calls to the Superblocks on-premise agent.

| Path                                                                                      | Type   | Source              | Target | Description                                                                             |
| ----------------------------------------------------------------------------------------- | ------ | ------------------- | ------ | --------------------------------------------------------------------------------------- |
| [`/agent/v1/apis/execute`](#agentv1apisexecute)                                           | `POST` | Browser             | Agent  | Route called to execute a Superblocks API                                               |
| [`/agent/v1/datasources/:datasourceId/metadata`](#agentv1datasourcesdatasourceidmetadata) | `GET`  | Browser             | Agent  | Route called to fetch the metadata for a datasource (for eg., postgres or snowflake db) |
| [`/agent/v1/datasources/test`](#agentv1datasourcestest)                                   | `POST` | Browser             | Agent  | Route called to test connectivity to a datasource (for eg., postgres or snowflake db)   |
| [`/agent/v1/workflows/:workflowId`](#agentv1workflowsworkflowid)                          | `POST` | Browser/HTTP client | Agent  | Route called to trigger a Superblocks workflow                                          |
| [`/health`](#health)                                                                      | `GET`  | Browser/HTTP client | Agent  | Route for platform use (for eg, Kubernetes liveness/readiness probes)                   |

#### `/agent/v1/apis/execute`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/ApiExecutionRequest",
  "definitions": {
    "ApiExecutionRequest": {
      "type": "object",
      "properties": {
        "apiId": {
          "type": "string"
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionParam"
          }
        },
        "viewMode": {
          "type": "boolean"
        },
        "settings": {
          "$ref": "#/definitions/ApiExecutionSettings"
        }
      },
      "required": ["apiId", "params", "viewMode"],
      "additionalProperties": false
    },
    "ExecutionParam": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "ApiExecutionSettings": {
      "type": "object",
      "properties": {
        "timeout": {
          "type": "number"
        },
        "memoryLimitMB": {
          "type": "number"
        }
      },
      "required": ["timeout", "memoryLimitMB"],
      "additionalProperties": false
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/ApiExecutionResponse",
  "definitions": {
    "ApiExecutionResponse": {
      "type": "object",
      "properties": {
        "apiId": {
          "type": "string"
        },
        "context": {
          "$ref": "#/definitions/ExecutionContext"
        }
      },
      "required": ["apiId", "context"],
      "additionalProperties": false
    },
    "ExecutionContext": {
      "type": "object",
      "properties": {
        "globals": {
          "type": "object",
          "additionalProperties": {}
        },
        "outputs": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/ExecutionOutput"
          }
        }
      },
      "required": ["globals", "outputs"],
      "additionalProperties": false
    },
    "ExecutionOutput": {
      "type": "object",
      "properties": {
        "error": {
          "type": "string"
        },
        "executionTime": {
          "type": "number"
        },
        "log": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "output": {}
      },
      "required": ["executionTime", "log", "output"],
      "additionalProperties": false
    }
  }
}
```

</details>

#### `/agent/v1/datasources/:datasourceId/metadata`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/DatasourceMetadata",
  "definitions": {
    "DatasourceMetadata": {
      "type": "object",
      "properties": {
        "dbSchema": {
          "$ref": "#/definitions/DatabaseSchemaMetadata"
        }
      },
      "additionalProperties": false
    },
    "DatabaseSchemaMetadata": {
      "type": "object",
      "properties": {
        "tables": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Table"
          }
        }
      },
      "required": ["tables"],
      "additionalProperties": false
    },
    "Table": {
      "type": "object",
      "properties": {
        "type": {
          "$ref": "#/definitions/TableType"
        },
        "name": {
          "type": "string"
        },
        "columns": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Column"
          }
        },
        "keys": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Key"
          }
        },
        "templates": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Template"
          }
        }
      },
      "required": ["type", "name", "columns", "keys", "templates"],
      "additionalProperties": false
    },
    "TableType": {
      "type": "string",
      "enum": ["TABLE", "VIEW", "ALIAS", "COLLECTION"]
    },
    "Column": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string"
        }
      },
      "required": ["name", "type"],
      "additionalProperties": false
    },
    "Key": {
      "anyOf": [
        {
          "$ref": "#/definitions/PrimaryKey"
        },
        {
          "$ref": "#/definitions/ForeignKey"
        }
      ]
    },
    "PrimaryKey": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "const": "primary key"
        }
      },
      "required": ["name", "type"],
      "additionalProperties": false
    },
    "ForeignKey": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "const": "foreign key"
        }
      },
      "required": ["name", "type"],
      "additionalProperties": false
    },
    "Template": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "body": {
          "type": "string"
        }
      },
      "required": ["title", "body"],
      "additionalProperties": false
    }
  }
}
```

</details>

#### `/agent/v1/datasources/test`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/DatasourceTestRequest",
  "definitions": {
    "DatasourceTestRequest": {
      "type": "object",
      "properties": {
        "datasourceConfig": {
          "$ref": "#/definitions/DatasourceConfiguration"
        },
        "plugin": {
          "$ref": "#/definitions/Plugin"
        }
      },
      "required": ["datasourceConfig", "plugin"],
      "additionalProperties": false
    },
    "DatasourceConfiguration": {
      "type": "object",
      "properties": {
        "connection": {
          "$ref": "#/definitions/Connection"
        },
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "authentication": {
          "$ref": "#/definitions/Authentication"
        },
        "sshProxy": {
          "$ref": "#/definitions/SSHConnection"
        },
        "sshProxyEnabled": {
          "type": "boolean"
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "headers": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        }
      },
      "additionalProperties": false
    },
    "Connection": {
      "type": "object",
      "properties": {
        "mode": {
          "$ref": "#/definitions/ConnectionMode"
        },
        "type": {
          "$ref": "#/definitions/ConnectionType"
        },
        "ssl": {
          "$ref": "#/definitions/SSLConfig"
        },
        "useSsl": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "ConnectionMode": {
      "type": "number",
      "enum": [0, 1]
    },
    "ConnectionType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSLConfig": {
      "type": "object",
      "properties": {
        "authType": {
          "$ref": "#/definitions/SSLAuthType"
        },
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "certificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "caCertificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "usePemCertificate": {
          "type": "boolean"
        },
        "pemCertificate": {
          "$ref": "#/definitions/PEMCertificate"
        }
      },
      "additionalProperties": false
    },
    "SSLAuthType": {
      "type": "string",
      "enum": [
        "ALLOW",
        "PREFER",
        "REQUIRE",
        "DISABLED",
        "CA_CERTIFICATE",
        "SELF_SIGNED_CERTIFICATE"
      ]
    },
    "PEMCertificate": {
      "type": "object",
      "properties": {
        "file": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["file", "password"],
      "additionalProperties": false
    },
    "Endpoint": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        }
      },
      "required": ["host", "port"],
      "additionalProperties": false
    },
    "Authentication": {
      "type": "object",
      "properties": {
        "customParams": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "authenticationType": {
          "type": "string"
        },
        "databaseName": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "username": {
          "type": "string"
        },
        "schema": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "Property": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "editable": {
          "type": "boolean"
        },
        "internal": {
          "type": "boolean"
        },
        "description": {
          "type": "string"
        },
        "mandatory": {
          "type": "boolean"
        },
        "type": {
          "type": "string"
        },
        "defaultValue": {
          "type": "string"
        },
        "minRange": {
          "type": "string"
        },
        "maxRange": {
          "type": "string"
        },
        "valueOptions": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "SSHConnection": {
      "type": "object",
      "properties": {
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "username": {
          "type": "string"
        },
        "authType": {
          "$ref": "#/definitions/SSHConnectionAuthType"
        },
        "privateKey": {
          "$ref": "#/definitions/SSHPrivateKey"
        }
      },
      "required": ["endpoint", "username", "authType", "privateKey"],
      "additionalProperties": false
    },
    "SSHConnectionAuthType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSHPrivateKey": {
      "type": "object",
      "properties": {
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["keyFile", "password"],
      "additionalProperties": false
    },
    "Plugin": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/PluginType"
        },
        "moduleName": {
          "type": "string"
        },
        "modulePath": {
          "type": "string"
        },
        "template": {
          "$ref": "#/definitions/PluginTemplate"
        },
        "iconLocation": {
          "type": "string"
        },
        "responseType": {
          "$ref": "#/definitions/PluginResponseType"
        },
        "allowCreate": {
          "type": "boolean"
        },
        "version": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "type",
        "moduleName",
        "modulePath",
        "template",
        "iconLocation",
        "responseType",
        "allowCreate",
        "version"
      ],
      "additionalProperties": false
    },
    "PluginType": {
      "type": "string",
      "enum": ["DB", "API", "JS"]
    },
    "PluginTemplate": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "datasourceForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "actionForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "demoData": {},
        "version": {
          "type": "string"
        }
      },
      "required": ["id", "datasourceForm", "actionForm"],
      "additionalProperties": false
    },
    "FormTemplate": {
      "type": "object",
      "properties": {
        "sections": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormSection"
          }
        }
      },
      "required": ["sections"],
      "additionalProperties": false
    },
    "FormSection": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormItem"
          }
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "layout": {
          "$ref": "#/definitions/FormSectionLayout"
        }
      },
      "required": ["name", "items"],
      "additionalProperties": false
    },
    "FormItem": {
      "anyOf": [
        {
          "$ref": "#/definitions/DefaultFormItem"
        },
        {
          "$ref": "#/definitions/InputFormItem"
        },
        {
          "$ref": "#/definitions/CodeEditorFormItem"
        },
        {
          "$ref": "#/definitions/DropdownFormItem"
        }
      ]
    },
    "DefaultFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "enum": [
            "INPUT_AREA",
            "DYNAMIC_INPUT_TEXT",
            "FIELD_LIST",
            "DYNAMIC_FIELD_LIST",
            "CHECKBOX",
            "SWITCH"
          ]
        },
        "placeholder": {
          "type": "string"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "FormItemDisplay": {
      "type": "object",
      "properties": {
        "show": {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "additionalProperties": false
    },
    "InputFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "INPUT_TEXT"
        },
        "placeholder": {
          "type": "string"
        },
        "dataType": {
          "$ref": "#/definitions/InputDataType"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "InputDataType": {
      "type": "string",
      "enum": ["NUMBER", "PASSWORD"]
    },
    "CodeEditorFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "CODE_EDITOR"
        },
        "placeholder": {
          "type": "string"
        },
        "language": {
          "$ref": "#/definitions/EditorLanguage"
        }
      },
      "required": ["componentType", "label", "language", "name"],
      "additionalProperties": false
    },
    "EditorLanguage": {
      "type": "string",
      "enum": ["TEXT", "SQL", "JSON", "JAVASCRIPT", "PYTHON"]
    },
    "DropdownFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "DROPDOWN"
        },
        "options": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/DropdownOption"
          }
        }
      },
      "required": ["componentType", "label", "name", "options"],
      "additionalProperties": false
    },
    "DropdownOption": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "displayName": {
          "type": "string"
        }
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "FormSectionLayout": {
      "type": "string",
      "const": "TABS"
    },
    "PluginResponseType": {
      "type": "string",
      "enum": ["TABLE", "JSON"]
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/DatasourceTestResult",
  "definitions": {
    "DatasourceTestResult": {
      "type": "object",
      "properties": {
        "message": {
          "type": "string"
        },
        "success": {
          "type": "boolean"
        }
      },
      "required": ["message", "success"],
      "additionalProperties": false
    }
  }
}
```

</details>

#### `/agent/v1/workflows/:workflowId`

<details>
<summary>Request body</summary>

_User defined_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/ApiExecutionResponse",
  "definitions": {
    "ApiExecutionResponse": {
      "type": "object",
      "properties": {
        "apiId": {
          "type": "string"
        },
        "context": {
          "$ref": "#/definitions/ExecutionContext"
        }
      },
      "required": ["apiId", "context"],
      "additionalProperties": false
    },
    "ExecutionContext": {
      "type": "object",
      "properties": {
        "globals": {
          "type": "object",
          "additionalProperties": {}
        },
        "outputs": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/ExecutionOutput"
          }
        }
      },
      "required": ["globals", "outputs"],
      "additionalProperties": false
    },
    "ExecutionOutput": {
      "type": "object",
      "properties": {
        "error": {
          "type": "string"
        },
        "executionTime": {
          "type": "number"
        },
        "log": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "output": {}
      },
      "required": ["executionTime", "log", "output"],
      "additionalProperties": false
    }
  }
}
```

</details>

#### `/health`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/Health",
  "definitions": {
    "Health": {
      "type": "object",
      "properties": {
        "uptime": {
          "type": "number"
        },
        "message": {
          "type": "string"
        },
        "date": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": ["uptime", "message", "date"],
      "additionalProperties": false
    }
  }
}
```

</details>

### Outgoing

The following table lists all the known outgoing calls from the Superblocks on-premise agent to Superblocks Cloud. The Superblocks Cloud host is `https://app.superblockshq.com`.

| Path                                                                                            | Type   | Source | Target            | Description                                                                             |
| ----------------------------------------------------------------------------------------------- | ------ | ------ | ----------------- | --------------------------------------------------------------------------------------- |
| [`/api/v1/agents/:agentId/apis/:apiId`](#apiv1agentsagentidapisapiid)                           | `POST` | Agent  | Superblocks Cloud | Route called to fetch a Superblocks API definition                                      |
| [`/api/v1/agents/:agentId/workflows/:workflowId`](#apiv1agentsagentidworkflowsworkflowid)       | `POST` | Agent  | Superblocks Cloud | Route called to fetch a Superblocks Workflow definition                                 |
| [`/api/v1/agents/:agentId/datasource/:datasourceId`](#apiv1agentsagentiddatasourcedatasourceid) | `POST` | Agent  | Superblocks Cloud | Route called to fetch datasource configuration (for eg., postgres or snowflake db)      |
| [`/api/v1/agents/:agentId/healthcheck`](#apiv1agentsagentidhealthcheck)                         | `POST` | Agent  | Superblocks Cloud | Route called to send observability metrics related to agent health to Superblocks Cloud |

#### `/api/v1/agents/:agentId/apis/:apiId`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/ApiExecutionRequestDto",
  "definitions": {
    "ApiExecutionRequestDto": {
      "type": "object",
      "properties": {
        "apiId": {
          "type": "string"
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionParam"
          }
        },
        "viewMode": {
          "type": "boolean"
        }
      },
      "required": ["apiId", "params", "viewMode"],
      "additionalProperties": false
    },
    "ExecutionParam": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": ["key", "value"],
      "additionalProperties": false
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/ApiDefinition",
  "definitions": {
    "ApiDefinition": {
      "type": "object",
      "properties": {
        "api": {
          "$ref": "#/definitions/Api"
        },
        "datasources": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Datasource"
          }
        },
        "plugins": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Plugin"
          }
        }
      },
      "required": ["api", "datasources", "plugins"],
      "additionalProperties": false
    },
    "Api": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "actions": {
          "$ref": "#/definitions/ApiDetails"
        },
        "triggerType": {
          "$ref": "#/definitions/ApiTriggerType"
        }
      },
      "required": ["id", "applicationId", "actions", "triggerType"],
      "additionalProperties": false
    },
    "ApiDetails": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "triggerActionId": {
          "$ref": "#/definitions/ActionId"
        },
        "actions": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Action"
          }
        },
        "executeOnPageLoad": {
          "type": "boolean"
        },
        "bindings": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "dynamicBindingPathList": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Param"
          }
        },
        "version": {
          "type": "string"
        },
        "deactivated": {
          "type": "string",
          "format": "date-time"
        },
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "updated": {
          "type": "string",
          "format": "date-time"
        },
        "supportedMethod": {
          "type": "string",
          "enum": ["GET", "POST"]
        },
        "workflowParams": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionParam"
          }
        }
      },
      "required": ["name", "triggerActionId", "actions"],
      "additionalProperties": false
    },
    "ActionId": {
      "type": "string"
    },
    "Action": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/definitions/ActionId"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/ActionType"
        },
        "configuration": {
          "$ref": "#/definitions/ActionConfiguration"
        },
        "applicationId": {
          "type": "string"
        },
        "pluginId": {
          "type": "string"
        },
        "datasourceId": {
          "type": "string"
        },
        "settings": {
          "$ref": "#/definitions/ActionSettings"
        },
        "children": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/ActionId"
          }
        }
      },
      "required": [
        "id",
        "name",
        "type",
        "configuration",
        "applicationId",
        "pluginId"
      ],
      "additionalProperties": false
    },
    "ActionType": {
      "type": "number",
      "enum": [0, 1, 2, 3]
    },
    "ActionConfiguration": {
      "type": "object",
      "properties": {
        "httpMethod": {
          "$ref": "#/definitions/HttpMethod"
        },
        "resource": {
          "type": "string"
        },
        "action": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "headers": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "body": {
          "type": "string"
        },
        "timeoutInMillisecond": {
          "type": "number"
        },
        "encodeParams": {
          "type": "boolean"
        },
        "paginationType": {
          "$ref": "#/definitions/PaginationType"
        },
        "next": {
          "type": "string"
        },
        "prev": {
          "type": "string"
        },
        "custom": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Property"
          }
        }
      },
      "additionalProperties": false
    },
    "HttpMethod": {
      "type": "string",
      "enum": [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
        "TRACE"
      ]
    },
    "Property": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "editable": {
          "type": "boolean"
        },
        "internal": {
          "type": "boolean"
        },
        "description": {
          "type": "string"
        },
        "mandatory": {
          "type": "boolean"
        },
        "type": {
          "type": "string"
        },
        "defaultValue": {
          "type": "string"
        },
        "minRange": {
          "type": "string"
        },
        "maxRange": {
          "type": "string"
        },
        "valueOptions": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "PaginationType": {
      "type": "number",
      "enum": [0, 1, 2]
    },
    "ActionSettings": {
      "type": "object",
      "properties": {
        "executeOnLoad": {
          "type": "boolean"
        },
        "cacheResponse": {
          "type": "string"
        },
        "userSetOnLoad": {
          "type": "boolean"
        },
        "confirmBeforeExecute": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "Param": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "ExecutionParam": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "ApiTriggerType": {
      "type": "number",
      "enum": [0, 1]
    },
    "Datasource": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "pluginId": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        },
        "configuration": {
          "$ref": "#/definitions/DatasourceConfiguration"
        },
        "isDefault": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "DatasourceConfiguration": {
      "type": "object",
      "properties": {
        "connection": {
          "$ref": "#/definitions/Connection"
        },
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "authentication": {
          "$ref": "#/definitions/Authentication"
        },
        "sshProxy": {
          "$ref": "#/definitions/SSHConnection"
        },
        "sshProxyEnabled": {
          "type": "boolean"
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "headers": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        }
      },
      "additionalProperties": false
    },
    "Connection": {
      "type": "object",
      "properties": {
        "mode": {
          "$ref": "#/definitions/ConnectionMode"
        },
        "type": {
          "$ref": "#/definitions/ConnectionType"
        },
        "ssl": {
          "$ref": "#/definitions/SSLConfig"
        },
        "useSsl": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "ConnectionMode": {
      "type": "number",
      "enum": [0, 1]
    },
    "ConnectionType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSLConfig": {
      "type": "object",
      "properties": {
        "authType": {
          "$ref": "#/definitions/SSLAuthType"
        },
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "certificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "caCertificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "usePemCertificate": {
          "type": "boolean"
        },
        "pemCertificate": {
          "$ref": "#/definitions/PEMCertificate"
        }
      },
      "additionalProperties": false
    },
    "SSLAuthType": {
      "type": "string",
      "enum": [
        "ALLOW",
        "PREFER",
        "REQUIRE",
        "DISABLED",
        "CA_CERTIFICATE",
        "SELF_SIGNED_CERTIFICATE"
      ]
    },
    "PEMCertificate": {
      "type": "object",
      "properties": {
        "file": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["file", "password"],
      "additionalProperties": false
    },
    "Endpoint": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        }
      },
      "required": ["host", "port"],
      "additionalProperties": false
    },
    "Authentication": {
      "type": "object",
      "properties": {
        "customParams": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "authenticationType": {
          "type": "string"
        },
        "databaseName": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "username": {
          "type": "string"
        },
        "schema": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "SSHConnection": {
      "type": "object",
      "properties": {
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "username": {
          "type": "string"
        },
        "authType": {
          "$ref": "#/definitions/SSHConnectionAuthType"
        },
        "privateKey": {
          "$ref": "#/definitions/SSHPrivateKey"
        }
      },
      "required": ["endpoint", "username", "authType", "privateKey"],
      "additionalProperties": false
    },
    "SSHConnectionAuthType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSHPrivateKey": {
      "type": "object",
      "properties": {
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["keyFile", "password"],
      "additionalProperties": false
    },
    "Plugin": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/PluginType"
        },
        "moduleName": {
          "type": "string"
        },
        "modulePath": {
          "type": "string"
        },
        "template": {
          "$ref": "#/definitions/PluginTemplate"
        },
        "iconLocation": {
          "type": "string"
        },
        "responseType": {
          "$ref": "#/definitions/PluginResponseType"
        },
        "allowCreate": {
          "type": "boolean"
        },
        "version": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "type",
        "moduleName",
        "modulePath",
        "template",
        "iconLocation",
        "responseType",
        "allowCreate",
        "version"
      ],
      "additionalProperties": false
    },
    "PluginType": {
      "type": "string",
      "enum": ["DB", "API", "JS"]
    },
    "PluginTemplate": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "datasourceForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "actionForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "demoData": {},
        "version": {
          "type": "string"
        }
      },
      "required": ["id", "datasourceForm", "actionForm"],
      "additionalProperties": false
    },
    "FormTemplate": {
      "type": "object",
      "properties": {
        "sections": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormSection"
          }
        }
      },
      "required": ["sections"],
      "additionalProperties": false
    },
    "FormSection": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormItem"
          }
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "layout": {
          "$ref": "#/definitions/FormSectionLayout"
        }
      },
      "required": ["name", "items"],
      "additionalProperties": false
    },
    "FormItem": {
      "anyOf": [
        {
          "$ref": "#/definitions/DefaultFormItem"
        },
        {
          "$ref": "#/definitions/InputFormItem"
        },
        {
          "$ref": "#/definitions/CodeEditorFormItem"
        },
        {
          "$ref": "#/definitions/DropdownFormItem"
        }
      ]
    },
    "DefaultFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "enum": [
            "INPUT_AREA",
            "DYNAMIC_INPUT_TEXT",
            "FIELD_LIST",
            "DYNAMIC_FIELD_LIST",
            "CHECKBOX",
            "SWITCH"
          ]
        },
        "placeholder": {
          "type": "string"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "FormItemDisplay": {
      "type": "object",
      "properties": {
        "show": {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "additionalProperties": false
    },
    "InputFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "INPUT_TEXT"
        },
        "placeholder": {
          "type": "string"
        },
        "dataType": {
          "$ref": "#/definitions/InputDataType"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "InputDataType": {
      "type": "string",
      "enum": ["NUMBER", "PASSWORD"]
    },
    "CodeEditorFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "CODE_EDITOR"
        },
        "placeholder": {
          "type": "string"
        },
        "language": {
          "$ref": "#/definitions/EditorLanguage"
        }
      },
      "required": ["componentType", "label", "language", "name"],
      "additionalProperties": false
    },
    "EditorLanguage": {
      "type": "string",
      "enum": ["TEXT", "SQL", "JSON", "JAVASCRIPT", "PYTHON"]
    },
    "DropdownFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "DROPDOWN"
        },
        "options": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/DropdownOption"
          }
        }
      },
      "required": ["componentType", "label", "name", "options"],
      "additionalProperties": false
    },
    "DropdownOption": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "displayName": {
          "type": "string"
        }
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "FormSectionLayout": {
      "type": "string",
      "const": "TABS"
    },
    "PluginResponseType": {
      "type": "string",
      "enum": ["TABLE", "JSON"]
    }
  }
}
```

</details>

#### `/api/v1/agents/:agentId/workflows/:workflowId`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/ApiExecutionRequestDto",
  "definitions": {
    "ApiExecutionRequestDto": {
      "type": "object",
      "properties": {
        "apiId": {
          "type": "string"
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionParam"
          }
        },
        "viewMode": {
          "type": "boolean"
        }
      },
      "required": ["apiId", "params", "viewMode"],
      "additionalProperties": false
    },
    "ExecutionParam": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": ["key", "value"],
      "additionalProperties": false
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/ApiDefinition",
  "definitions": {
    "ApiDefinition": {
      "type": "object",
      "properties": {
        "api": {
          "$ref": "#/definitions/Api"
        },
        "datasources": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Datasource"
          }
        },
        "plugins": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Plugin"
          }
        }
      },
      "required": ["api", "datasources", "plugins"],
      "additionalProperties": false
    },
    "Api": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "applicationId": {
          "type": "string"
        },
        "actions": {
          "$ref": "#/definitions/ApiDetails"
        },
        "triggerType": {
          "$ref": "#/definitions/ApiTriggerType"
        }
      },
      "required": ["id", "applicationId", "actions", "triggerType"],
      "additionalProperties": false
    },
    "ApiDetails": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "triggerActionId": {
          "$ref": "#/definitions/ActionId"
        },
        "actions": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Action"
          }
        },
        "executeOnPageLoad": {
          "type": "boolean"
        },
        "bindings": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "dynamicBindingPathList": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Param"
          }
        },
        "version": {
          "type": "string"
        },
        "deactivated": {
          "type": "string",
          "format": "date-time"
        },
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "updated": {
          "type": "string",
          "format": "date-time"
        },
        "supportedMethod": {
          "type": "string",
          "enum": ["GET", "POST"]
        },
        "workflowParams": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionParam"
          }
        }
      },
      "required": ["name", "triggerActionId", "actions"],
      "additionalProperties": false
    },
    "ActionId": {
      "type": "string"
    },
    "Action": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/definitions/ActionId"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/ActionType"
        },
        "configuration": {
          "$ref": "#/definitions/ActionConfiguration"
        },
        "applicationId": {
          "type": "string"
        },
        "pluginId": {
          "type": "string"
        },
        "datasourceId": {
          "type": "string"
        },
        "settings": {
          "$ref": "#/definitions/ActionSettings"
        },
        "children": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/ActionId"
          }
        }
      },
      "required": [
        "id",
        "name",
        "type",
        "configuration",
        "applicationId",
        "pluginId"
      ],
      "additionalProperties": false
    },
    "ActionType": {
      "type": "number",
      "enum": [0, 1, 2, 3]
    },
    "ActionConfiguration": {
      "type": "object",
      "properties": {
        "httpMethod": {
          "$ref": "#/definitions/HttpMethod"
        },
        "resource": {
          "type": "string"
        },
        "action": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "headers": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "body": {
          "type": "string"
        },
        "timeoutInMillisecond": {
          "type": "number"
        },
        "encodeParams": {
          "type": "boolean"
        },
        "paginationType": {
          "$ref": "#/definitions/PaginationType"
        },
        "next": {
          "type": "string"
        },
        "prev": {
          "type": "string"
        },
        "custom": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Property"
          }
        }
      },
      "additionalProperties": false
    },
    "HttpMethod": {
      "type": "string",
      "enum": [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
        "TRACE"
      ]
    },
    "Property": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "editable": {
          "type": "boolean"
        },
        "internal": {
          "type": "boolean"
        },
        "description": {
          "type": "string"
        },
        "mandatory": {
          "type": "boolean"
        },
        "type": {
          "type": "string"
        },
        "defaultValue": {
          "type": "string"
        },
        "minRange": {
          "type": "string"
        },
        "maxRange": {
          "type": "string"
        },
        "valueOptions": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "PaginationType": {
      "type": "number",
      "enum": [0, 1, 2]
    },
    "ActionSettings": {
      "type": "object",
      "properties": {
        "executeOnLoad": {
          "type": "boolean"
        },
        "cacheResponse": {
          "type": "string"
        },
        "userSetOnLoad": {
          "type": "boolean"
        },
        "confirmBeforeExecute": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "Param": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "ExecutionParam": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "ApiTriggerType": {
      "type": "number",
      "enum": [0, 1]
    },
    "Datasource": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "pluginId": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        },
        "configuration": {
          "$ref": "#/definitions/DatasourceConfiguration"
        },
        "isDefault": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "DatasourceConfiguration": {
      "type": "object",
      "properties": {
        "connection": {
          "$ref": "#/definitions/Connection"
        },
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "authentication": {
          "$ref": "#/definitions/Authentication"
        },
        "sshProxy": {
          "$ref": "#/definitions/SSHConnection"
        },
        "sshProxyEnabled": {
          "type": "boolean"
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "headers": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        }
      },
      "additionalProperties": false
    },
    "Connection": {
      "type": "object",
      "properties": {
        "mode": {
          "$ref": "#/definitions/ConnectionMode"
        },
        "type": {
          "$ref": "#/definitions/ConnectionType"
        },
        "ssl": {
          "$ref": "#/definitions/SSLConfig"
        },
        "useSsl": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "ConnectionMode": {
      "type": "number",
      "enum": [0, 1]
    },
    "ConnectionType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSLConfig": {
      "type": "object",
      "properties": {
        "authType": {
          "$ref": "#/definitions/SSLAuthType"
        },
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "certificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "caCertificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "usePemCertificate": {
          "type": "boolean"
        },
        "pemCertificate": {
          "$ref": "#/definitions/PEMCertificate"
        }
      },
      "additionalProperties": false
    },
    "SSLAuthType": {
      "type": "string",
      "enum": [
        "ALLOW",
        "PREFER",
        "REQUIRE",
        "DISABLED",
        "CA_CERTIFICATE",
        "SELF_SIGNED_CERTIFICATE"
      ]
    },
    "PEMCertificate": {
      "type": "object",
      "properties": {
        "file": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["file", "password"],
      "additionalProperties": false
    },
    "Endpoint": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        }
      },
      "required": ["host", "port"],
      "additionalProperties": false
    },
    "Authentication": {
      "type": "object",
      "properties": {
        "customParams": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "authenticationType": {
          "type": "string"
        },
        "databaseName": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "username": {
          "type": "string"
        },
        "schema": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "SSHConnection": {
      "type": "object",
      "properties": {
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "username": {
          "type": "string"
        },
        "authType": {
          "$ref": "#/definitions/SSHConnectionAuthType"
        },
        "privateKey": {
          "$ref": "#/definitions/SSHPrivateKey"
        }
      },
      "required": ["endpoint", "username", "authType", "privateKey"],
      "additionalProperties": false
    },
    "SSHConnectionAuthType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSHPrivateKey": {
      "type": "object",
      "properties": {
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["keyFile", "password"],
      "additionalProperties": false
    },
    "Plugin": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/PluginType"
        },
        "moduleName": {
          "type": "string"
        },
        "modulePath": {
          "type": "string"
        },
        "template": {
          "$ref": "#/definitions/PluginTemplate"
        },
        "iconLocation": {
          "type": "string"
        },
        "responseType": {
          "$ref": "#/definitions/PluginResponseType"
        },
        "allowCreate": {
          "type": "boolean"
        },
        "version": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "type",
        "moduleName",
        "modulePath",
        "template",
        "iconLocation",
        "responseType",
        "allowCreate",
        "version"
      ],
      "additionalProperties": false
    },
    "PluginType": {
      "type": "string",
      "enum": ["DB", "API", "JS"]
    },
    "PluginTemplate": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "datasourceForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "actionForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "demoData": {},
        "version": {
          "type": "string"
        }
      },
      "required": ["id", "datasourceForm", "actionForm"],
      "additionalProperties": false
    },
    "FormTemplate": {
      "type": "object",
      "properties": {
        "sections": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormSection"
          }
        }
      },
      "required": ["sections"],
      "additionalProperties": false
    },
    "FormSection": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormItem"
          }
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "layout": {
          "$ref": "#/definitions/FormSectionLayout"
        }
      },
      "required": ["name", "items"],
      "additionalProperties": false
    },
    "FormItem": {
      "anyOf": [
        {
          "$ref": "#/definitions/DefaultFormItem"
        },
        {
          "$ref": "#/definitions/InputFormItem"
        },
        {
          "$ref": "#/definitions/CodeEditorFormItem"
        },
        {
          "$ref": "#/definitions/DropdownFormItem"
        }
      ]
    },
    "DefaultFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "enum": [
            "INPUT_AREA",
            "DYNAMIC_INPUT_TEXT",
            "FIELD_LIST",
            "DYNAMIC_FIELD_LIST",
            "CHECKBOX",
            "SWITCH"
          ]
        },
        "placeholder": {
          "type": "string"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "FormItemDisplay": {
      "type": "object",
      "properties": {
        "show": {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "additionalProperties": false
    },
    "InputFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "INPUT_TEXT"
        },
        "placeholder": {
          "type": "string"
        },
        "dataType": {
          "$ref": "#/definitions/InputDataType"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "InputDataType": {
      "type": "string",
      "enum": ["NUMBER", "PASSWORD"]
    },
    "CodeEditorFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "CODE_EDITOR"
        },
        "placeholder": {
          "type": "string"
        },
        "language": {
          "$ref": "#/definitions/EditorLanguage"
        }
      },
      "required": ["componentType", "label", "language", "name"],
      "additionalProperties": false
    },
    "EditorLanguage": {
      "type": "string",
      "enum": ["TEXT", "SQL", "JSON", "JAVASCRIPT", "PYTHON"]
    },
    "DropdownFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "DROPDOWN"
        },
        "options": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/DropdownOption"
          }
        }
      },
      "required": ["componentType", "label", "name", "options"],
      "additionalProperties": false
    },
    "DropdownOption": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "displayName": {
          "type": "string"
        }
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "FormSectionLayout": {
      "type": "string",
      "const": "TABS"
    },
    "PluginResponseType": {
      "type": "string",
      "enum": ["TABLE", "JSON"]
    }
  }
}
```

</details>

#### `/api/v1/agents/:agentId/datasource/:datasourceId`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/DatasourcePlugin",
  "definitions": {
    "DatasourcePlugin": {
      "type": "object",
      "properties": {
        "datasource": {
          "$ref": "#/definitions/Datasource"
        },
        "plugin": {
          "$ref": "#/definitions/Plugin"
        }
      },
      "required": ["datasource", "plugin"],
      "additionalProperties": false
    },
    "Datasource": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "pluginId": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        },
        "configuration": {
          "$ref": "#/definitions/DatasourceConfiguration"
        },
        "isDefault": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "DatasourceConfiguration": {
      "type": "object",
      "properties": {
        "connection": {
          "$ref": "#/definitions/Connection"
        },
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "authentication": {
          "$ref": "#/definitions/Authentication"
        },
        "sshProxy": {
          "$ref": "#/definitions/SSHConnection"
        },
        "sshProxyEnabled": {
          "type": "boolean"
        },
        "params": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "headers": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        }
      },
      "additionalProperties": false
    },
    "Connection": {
      "type": "object",
      "properties": {
        "mode": {
          "$ref": "#/definitions/ConnectionMode"
        },
        "type": {
          "$ref": "#/definitions/ConnectionType"
        },
        "ssl": {
          "$ref": "#/definitions/SSLConfig"
        },
        "useSsl": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "ConnectionMode": {
      "type": "number",
      "enum": [0, 1]
    },
    "ConnectionType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSLConfig": {
      "type": "object",
      "properties": {
        "authType": {
          "$ref": "#/definitions/SSLAuthType"
        },
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "certificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "caCertificateFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "usePemCertificate": {
          "type": "boolean"
        },
        "pemCertificate": {
          "$ref": "#/definitions/PEMCertificate"
        }
      },
      "additionalProperties": false
    },
    "SSLAuthType": {
      "type": "string",
      "enum": [
        "ALLOW",
        "PREFER",
        "REQUIRE",
        "DISABLED",
        "CA_CERTIFICATE",
        "SELF_SIGNED_CERTIFICATE"
      ]
    },
    "PEMCertificate": {
      "type": "object",
      "properties": {
        "file": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["file", "password"],
      "additionalProperties": false
    },
    "Endpoint": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        }
      },
      "required": ["host", "port"],
      "additionalProperties": false
    },
    "Authentication": {
      "type": "object",
      "properties": {
        "customParams": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Property"
          }
        },
        "authenticationType": {
          "type": "string"
        },
        "databaseName": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "username": {
          "type": "string"
        },
        "schema": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "Property": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "editable": {
          "type": "boolean"
        },
        "internal": {
          "type": "boolean"
        },
        "description": {
          "type": "string"
        },
        "mandatory": {
          "type": "boolean"
        },
        "type": {
          "type": "string"
        },
        "defaultValue": {
          "type": "string"
        },
        "minRange": {
          "type": "string"
        },
        "maxRange": {
          "type": "string"
        },
        "valueOptions": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": false
    },
    "SSHConnection": {
      "type": "object",
      "properties": {
        "endpoint": {
          "$ref": "#/definitions/Endpoint"
        },
        "username": {
          "type": "string"
        },
        "authType": {
          "$ref": "#/definitions/SSHConnectionAuthType"
        },
        "privateKey": {
          "$ref": "#/definitions/SSHPrivateKey"
        }
      },
      "required": ["endpoint", "username", "authType", "privateKey"],
      "additionalProperties": false
    },
    "SSHConnectionAuthType": {
      "type": "number",
      "enum": [0, 1]
    },
    "SSHPrivateKey": {
      "type": "object",
      "properties": {
        "keyFile": {
          "type": "object",
          "properties": {
            "size": {
              "type": "number"
            },
            "type": {
              "type": "string"
            },
            "lastModified": {
              "type": "number"
            },
            "name": {
              "type": "string"
            }
          },
          "required": ["lastModified", "name", "size", "type"],
          "additionalProperties": false
        },
        "password": {
          "type": "string"
        }
      },
      "required": ["keyFile", "password"],
      "additionalProperties": false
    },
    "Plugin": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/PluginType"
        },
        "moduleName": {
          "type": "string"
        },
        "modulePath": {
          "type": "string"
        },
        "template": {
          "$ref": "#/definitions/PluginTemplate"
        },
        "iconLocation": {
          "type": "string"
        },
        "responseType": {
          "$ref": "#/definitions/PluginResponseType"
        },
        "allowCreate": {
          "type": "boolean"
        },
        "version": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "type",
        "moduleName",
        "modulePath",
        "template",
        "iconLocation",
        "responseType",
        "allowCreate",
        "version"
      ],
      "additionalProperties": false
    },
    "PluginType": {
      "type": "string",
      "enum": ["DB", "API", "JS"]
    },
    "PluginTemplate": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "datasourceForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "actionForm": {
          "$ref": "#/definitions/FormTemplate"
        },
        "demoData": {},
        "version": {
          "type": "string"
        }
      },
      "required": ["id", "datasourceForm", "actionForm"],
      "additionalProperties": false
    },
    "FormTemplate": {
      "type": "object",
      "properties": {
        "sections": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormSection"
          }
        }
      },
      "required": ["sections"],
      "additionalProperties": false
    },
    "FormSection": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormItem"
          }
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "layout": {
          "$ref": "#/definitions/FormSectionLayout"
        }
      },
      "required": ["name", "items"],
      "additionalProperties": false
    },
    "FormItem": {
      "anyOf": [
        {
          "$ref": "#/definitions/DefaultFormItem"
        },
        {
          "$ref": "#/definitions/InputFormItem"
        },
        {
          "$ref": "#/definitions/CodeEditorFormItem"
        },
        {
          "$ref": "#/definitions/DropdownFormItem"
        }
      ]
    },
    "DefaultFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "enum": [
            "INPUT_AREA",
            "DYNAMIC_INPUT_TEXT",
            "FIELD_LIST",
            "DYNAMIC_FIELD_LIST",
            "CHECKBOX",
            "SWITCH"
          ]
        },
        "placeholder": {
          "type": "string"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "FormItemDisplay": {
      "type": "object",
      "properties": {
        "show": {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "additionalProperties": false
    },
    "InputFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "INPUT_TEXT"
        },
        "placeholder": {
          "type": "string"
        },
        "dataType": {
          "$ref": "#/definitions/InputDataType"
        }
      },
      "required": ["componentType", "label", "name"],
      "additionalProperties": false
    },
    "InputDataType": {
      "type": "string",
      "enum": ["NUMBER", "PASSWORD"]
    },
    "CodeEditorFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "CODE_EDITOR"
        },
        "placeholder": {
          "type": "string"
        },
        "language": {
          "$ref": "#/definitions/EditorLanguage"
        }
      },
      "required": ["componentType", "label", "language", "name"],
      "additionalProperties": false
    },
    "EditorLanguage": {
      "type": "string",
      "enum": ["TEXT", "SQL", "JSON", "JAVASCRIPT", "PYTHON"]
    },
    "DropdownFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "initialValue": {
          "type": "string"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "componentType": {
          "type": "string",
          "const": "DROPDOWN"
        },
        "options": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/DropdownOption"
          }
        }
      },
      "required": ["componentType", "label", "name", "options"],
      "additionalProperties": false
    },
    "DropdownOption": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "displayName": {
          "type": "string"
        }
      },
      "required": ["key", "value"],
      "additionalProperties": false
    },
    "FormSectionLayout": {
      "type": "string",
      "const": "TABS"
    },
    "PluginResponseType": {
      "type": "string",
      "enum": ["TABLE", "JSON"]
    }
  }
}
```

</details>

#### `/api/v1/agents/:agentId/healthcheck`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/Metrics",
  "definitions": {
    "Metrics": {
      "type": "object",
      "properties": {
        "cpu": {
          "$ref": "#/definitions/Systeminformation.CurrentLoadData"
        },
        "memory": {
          "$ref": "#/definitions/Systeminformation.MemData"
        },
        "disk": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Systeminformation.FsSizeData"
          }
        },
        "io": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Systeminformation.NetworkStatsData"
          }
        },
        "uptime": {
          "type": "number"
        },
        "reported_at": {
          "type": "string",
          "format": "date-time"
        },
        "deployed_at": {
          "type": "string",
          "format": "date-time"
        },
        "version": {
          "type": "string"
        }
      },
      "required": [
        "cpu",
        "memory",
        "disk",
        "io",
        "uptime",
        "reported_at",
        "deployed_at",
        "version"
      ],
      "additionalProperties": false
    },
    "Systeminformation.CurrentLoadData": {
      "type": "object",
      "properties": {
        "avgLoad": {
          "type": "number"
        },
        "currentLoad": {
          "type": "number"
        },
        "currentLoadUser": {
          "type": "number"
        },
        "currentLoadSystem": {
          "type": "number"
        },
        "currentLoadNice": {
          "type": "number"
        },
        "currentLoadIdle": {
          "type": "number"
        },
        "currentLoadIrq": {
          "type": "number"
        },
        "rawCurrentLoad": {
          "type": "number"
        },
        "rawCurrentLoadUser": {
          "type": "number"
        },
        "rawCurrentLoadSystem": {
          "type": "number"
        },
        "rawCurrentLoadNice": {
          "type": "number"
        },
        "rawCurrentLoadIdle": {
          "type": "number"
        },
        "rawCurrentLoadIrq": {
          "type": "number"
        },
        "cpus": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Systeminformation.CurrentLoadCpuData"
          }
        }
      },
      "required": [
        "avgLoad",
        "currentLoad",
        "currentLoadUser",
        "currentLoadSystem",
        "currentLoadNice",
        "currentLoadIdle",
        "currentLoadIrq",
        "rawCurrentLoad",
        "rawCurrentLoadUser",
        "rawCurrentLoadSystem",
        "rawCurrentLoadNice",
        "rawCurrentLoadIdle",
        "rawCurrentLoadIrq",
        "cpus"
      ],
      "additionalProperties": false
    },
    "Systeminformation.CurrentLoadCpuData": {
      "type": "object",
      "properties": {
        "load": {
          "type": "number"
        },
        "loadUser": {
          "type": "number"
        },
        "loadSystem": {
          "type": "number"
        },
        "loadNice": {
          "type": "number"
        },
        "loadIdle": {
          "type": "number"
        },
        "loadIrq": {
          "type": "number"
        },
        "rawLoad": {
          "type": "number"
        },
        "rawLoadUser": {
          "type": "number"
        },
        "rawLoadSystem": {
          "type": "number"
        },
        "rawLoadNice": {
          "type": "number"
        },
        "rawLoadIdle": {
          "type": "number"
        },
        "rawLoadIrq": {
          "type": "number"
        }
      },
      "required": [
        "load",
        "loadUser",
        "loadSystem",
        "loadNice",
        "loadIdle",
        "loadIrq",
        "rawLoad",
        "rawLoadUser",
        "rawLoadSystem",
        "rawLoadNice",
        "rawLoadIdle",
        "rawLoadIrq"
      ],
      "additionalProperties": false
    },
    "Systeminformation.MemData": {
      "type": "object",
      "properties": {
        "total": {
          "type": "number"
        },
        "free": {
          "type": "number"
        },
        "used": {
          "type": "number"
        },
        "active": {
          "type": "number"
        },
        "available": {
          "type": "number"
        },
        "buffcache": {
          "type": "number"
        },
        "buffers": {
          "type": "number"
        },
        "cached": {
          "type": "number"
        },
        "slab": {
          "type": "number"
        },
        "swaptotal": {
          "type": "number"
        },
        "swapused": {
          "type": "number"
        },
        "swapfree": {
          "type": "number"
        }
      },
      "required": [
        "total",
        "free",
        "used",
        "active",
        "available",
        "buffcache",
        "buffers",
        "cached",
        "slab",
        "swaptotal",
        "swapused",
        "swapfree"
      ],
      "additionalProperties": false
    },
    "Systeminformation.FsSizeData": {
      "type": "object",
      "properties": {
        "fs": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "size": {
          "type": "number"
        },
        "used": {
          "type": "number"
        },
        "available": {
          "type": "number"
        },
        "use": {
          "type": "number"
        },
        "mount": {
          "type": "string"
        }
      },
      "required": ["fs", "type", "size", "used", "available", "use", "mount"],
      "additionalProperties": false
    },
    "Systeminformation.NetworkStatsData": {
      "type": "object",
      "properties": {
        "iface": {
          "type": "string"
        },
        "operstate": {
          "type": "string"
        },
        "rx_bytes": {
          "type": "number"
        },
        "rx_dropped": {
          "type": "number"
        },
        "rx_errors": {
          "type": "number"
        },
        "tx_bytes": {
          "type": "number"
        },
        "tx_dropped": {
          "type": "number"
        },
        "tx_errors": {
          "type": "number"
        },
        "rx_sec": {
          "type": "number"
        },
        "tx_sec": {
          "type": "number"
        },
        "ms": {
          "type": "number"
        }
      },
      "required": [
        "iface",
        "operstate",
        "rx_bytes",
        "rx_dropped",
        "rx_errors",
        "tx_bytes",
        "tx_dropped",
        "tx_errors",
        "rx_sec",
        "tx_sec",
        "ms"
      ],
      "additionalProperties": false
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>
