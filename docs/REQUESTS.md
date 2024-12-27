# Requests

This documents contains a detailed list of all the outbound network requests the Superblocks On-Premise agent makes to the Superblocks Cloud.

## Outgoing

### Required Requests

The following table lists all the required operational outgoing calls from the agent to Superblocks Cloud. The Superblocks Cloud host is `https://api.superblocks.com`, and most calls to Superblocks Cloud are authenticated with the organization-specific agent key, which is loaded into the agent as the `SUPERBLOCKS_AGENT_KEY` environment variable.

Note: This list shows requests made to Superblocks Cloud APIs that are required for proper agent operation.

Network requests made by Superblocks users as part of API steps, for example, requests made to an API using the `requests` library in Python steps or requests made by integrations that access public REST APIs, are also outbound calls made by the agent. These outbound calls are made at the discretion of agent operators.

| Path                                                                            | Type     | Source | Target            | Description                                                                                 | Authentication                        |
| ------------------------------------------------------------------------------- | -------- | ------ | ----------------- | ------------------------------------------------------------------------------------------- |-------------------------------------- |
| [`/api/v1/agents/register`](#apiv1agentsregister)                             | `POST`   | Agent  | Superblocks Cloud | Route called to register an agent with Superblocks Cloud.                                          | Superblocks Agent Key      |
| [`/api/v1/agents`](#apiv1agents)                             | `DELETE`   | Agent  | Superblocks Cloud | Route called to deregister an agent from the Superblocks Cloud (called during agent shutdown).                                          | Superblocks Agent Key      |
| [`/api/v1/agents/healthcheck`](#apiv1agentshealthcheck)                             | `POST`   | Agent  | Superblocks Cloud | Route called to post health check information to Superblocks Cloud, including diagnostic and execution metrics (default: called on a 30s interval).                                          | Superblocks Agent Key      |
| [`/api/v1/agents/datasource/:id`](#apiv1agentsdatasourceid) (DEPRECATED)                 | `POST`   | Agent  | Superblocks Cloud | Route called to get OAuth client information needed to perform OAuth Token exchanges. | Superblocks Agent Key + User JWT      |
| [`/api/v1/integrations`](#apiv1integrations)                             | `GET`   | Agent  | Superblocks Cloud | Route called to fetch integration configurations from the Superblocks Cloud.                                          | Superblocks Agent Key + User JWT      |
| [`/api/v1/agents/user/userToken`](#get)                             | `GET`   | Agent  | Superblocks Cloud | Route called to get the currently logged in user's OAuth2.0 access token from Superblocks Cloud. This is then send as an authorization header or query parameter in integration requests.                                        | Superblocks Agent Key + User JWT      |
| [`/api/v1/agents/user/userToken`](#post)                             | `POST`   | Agent  | Superblocks Cloud | Route called after OAuth token exchanges are completed to cache access tokens generated for the use in Superblocks Cloud. Token caches ensures users do not have to login multiple time for an Integration.                                          | Superblocks Agent Key + User JWT      |
| [`/api/v1/agents/user/userToken`](#delete)                             | `DELETE`   | Agent  | Superblocks Cloud | Route called to delete all of the user's OAuth2.0 access tokens that have been caches for Integrations. Initiated when developers use the `logoutIntegration()` function in frontend JS.                                          | Superblocks Agent Key + User JWT      |
| [`/api/v1/agents/userToken`](#get-1)                             | `GET`   | Agent  | Superblocks Cloud | Route called to get a shared OAuth2.0 access token to use in Integration authentication.                                          | Superblocks Agent Key + User JWT + Org API Token      |
| [`/api/v1/agents/userToken`](#post-1)                             | `POST`   | Agent  | Superblocks Cloud | Route called after a successful OAuth2.0 token exchanges to save shared access token for an Integration.                                          | Superblocks Agent Key + User JWT + Org API Token      |
| [`/api/v1/oauth2/gsheets/refresh`](#apiv1oauth2gsheetsrefresh)                             | `POST`   | Agent  | Superblocks Cloud | Route called to refresh Google Sheet OAuth2.0 access tokens used by the Google Sheets integration.                                          | Superblocks Agent Key + User JWT + Org API Token      |
| [`/api/v2/agents/audit`](https://github.com/superblocksteam/orchestrator/blob/2750269751ec48e93df3c42a46480d1bccb150f8/types/api/agent/v2/service.swagger.json#L22-L55)                             | `POST`   | Agent  | Superblocks Cloud | Route called to create audit log records in Superblocks Cloud for API executions.                                          | Superblocks Agent Key      |
| [`/api/v2/agents/pending-jobs`](#apiv2agentspending-jobs)                       | `POST`   | Agent  | Superblocks Cloud | Route called to fetch deployed Scheduled Jobs that should be run by the agent based on their configured schedule. | Superblocks Agent Key                 |
| [`/api/v3/apis/:apiId`](#apiv3apisapiid)                             | `GET`   | Agent  | Superblocks Cloud | Route called to fetch a API definition from Superblocks Cloud. For deployed APIs, definitions are fetched from the Global Edge Network by default, and round trip to the Superblocks Cloud only if unavailable. | Superblocks Agent Key + User JWT + Org API Token      |
| [`/api/v3/apis/signatures`](#apiv3apissignatures)                             | `PUT`   | Agent  | Superblocks Cloud | When Agent Signing is enabled, this route is called to update the signature of an API when signatures are updated as a result of a re-signing job. | Superblocks Agent Key      |
| [`/api/v2/applications/signatures`](#apiv2applicationssignatures)                             | `PUT`   | Agent  | Superblocks Cloud | When Agent Signing is enabled, this route is called to update the signature on an Application when signatures are updated as a result of a re-signing job.                                          | Superblocks Agent Key      |
| [`/api/v2/keyrotations/claim-resources`](#apiv2keyrotationsclaim-resources)                             | `POST`   | Agent  | Superblocks Cloud | When Agent Signing is enabled, this route is called when a re-signing job is in progress to fetch a batch of resources (APIs and Applications) for the agent to re-sign.                                          | Superblocks Agent Key      |


#### `/api/v1/agents/register`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/AgentRegistrationRequestBody",
  "definitions": {
    "AgentRegistrationRequestBody": {
      "type": "object",
      "additionalProperties": {},
      "properties": {
        "pluginVersions": {
          "$ref": "#/definitions/SupportedPluginVersions"
        },
        "type": {
          "$ref": "#/definitions/AgentType"
        },
        "tags": {
          "$ref": "#/definitions/AgentTags"
        },
        "signingKeyId": {
          "type": "string"
        },
        "verificationKeyIds": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "verificationKeys": {
          "type": "object",
          "additionalProperties": {
            "anyOf": [
              {
                "$ref": "#/definitions/SignatureVerificationKey"
              },
              {
                "type": "string"
              }
            ]
          }
        }
      },
      "required": [
        "pluginVersions"
      ]
    },
    "SupportedPluginVersions": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "$ref": "#/definitions/SemVer"
        }
      }
    },
    "SemVer": {
      "type": "string"
    },
    "AgentType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "AgentTags": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "SignatureVerificationKey": {
      "type": "object",
      "properties": {
        "algorithm": {
          "type": "string"
        },
        "key": {
          "type": "string"
        }
      },
      "required": [
        "algorithm",
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
  "$ref": "#/definitions/AgentRegisterResponse",
  "definitions": {
    "AgentRegisterResponse": {
      "$ref": "#/definitions/AgentRegisterResponseDto"
    },
    "AgentRegisterResponseDto": {
      "type": "object",
      "properties": {
        "agent": {
          "$ref": "#/definitions/Agent"
        },
        "billingPlan": {
          "$ref": "#/definitions/BillingPlan"
        },
        "organizationId": {
          "type": "string"
        },
        "organizationName": {
          "type": "string"
        }
      },
      "required": [
        "agent"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Agent": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "key": {
          "type": "string"
        },
        "environment": {
          "type": "string"
        },
        "status": {
          "$ref": "#/definitions/AgentStatus"
        },
        "version": {
          "type": "string"
        },
        "versionExternal": {
          "type": "string"
        },
        "supportedPluginVersions": {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/SemVer"
            }
          }
        },
        "url": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/AgentType"
        },
        "updated": {
          "type": "string",
          "format": "date-time"
        },
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "tags": {
          "$ref": "#/definitions/AgentTags"
        },
        "verificationKeyIds": {
          "anyOf": [
            {
              "type": "null"
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          ]
        },
        "verificationKeys": {
          "anyOf": [
            {
              "type": "null"
            },
            {
              "type": "object",
              "additionalProperties": {
                "$ref": "#/definitions/SignatureVerificationKey"
              }
            }
          ]
        },
        "signingKeyId": {
          "type": [
            "null",
            "string"
          ]
        }
      },
      "required": [
        "id",
        "key",
        "environment",
        "status",
        "version",
        "versionExternal",
        "supportedPluginVersions",
        "url",
        "type",
        "updated",
        "created",
        "tags"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AgentStatus": {
      "type": "string",
      "enum": [
        "Active",
        "Disconnected",
        "Browser Unreachable",
        "Pending Registration",
        "Stale"
      ]
    },
    "SemVer": {
      "type": "string"
    },
    "AgentType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "AgentTags": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "type": "string"
        }
      }
    },
    "SignatureVerificationKey": {
      "type": "object",
      "properties": {
        "algorithm": {
          "type": "string"
        },
        "key": {
          "type": "string"
        }
      },
      "required": [
        "algorithm",
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BillingPlan": {
      "type": "string",
      "enum": [
        "TRIAL",
        "FREE",
        "STARTER",
        "PRO",
        "ENTERPRISE"
      ]
    }
  }
}
```

</details>

#### `/api/v1/agents`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

_None_

</details>

#### `/api/v1/agents/healthcheck`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/HealthcheckRequestBody",
  "definitions": {
    "HealthcheckRequestBody": {
      "$ref": "#/definitions/PostHealthcheckRequestBody"
    },
    "PostHealthcheckRequestBody": {
      "$ref": "#/definitions/Metrics"
    },
    "Metrics": {
      "type": "object",
      "properties": {
        "cpu": {
          "anyOf": [
            {
              "type": "object",
              "additionalProperties": {}
            },
            {
              "type": "number"
            }
          ]
        },
        "memory": {
          "anyOf": [
            {
              "type": "object",
              "additionalProperties": {}
            },
            {
              "type": "number"
            }
          ]
        },
        "disk": {},
        "io": {},
        "heapSizeLimitBytes": {
          "type": "number"
        },
        "currentHeapSizeBytes": {
          "type": "number"
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
        },
        "version_external": {
          "type": "string"
        },
        "apiSuccessCount": {
          "type": "number"
        },
        "apiFailureCount": {
          "type": "number"
        },
        "apiP90DurationSeconds": {
          "type": "number"
        },
        "workflowSuccessCount": {
          "type": "number"
        },
        "workflowFailureCount": {
          "type": "number"
        },
        "workflowP90DurationSeconds": {
          "type": "number"
        },
        "desiredState": {
          "$ref": "#/definitions/AgentStatus"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AgentStatus": {
      "type": "string",
      "enum": [
        "Active",
        "Disconnected",
        "Browser Unreachable",
        "Pending Registration",
        "Stale"
      ]
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
  "$ref": "#/definitions/HealthcheckResponseBody",
  "definitions": {
    "HealthcheckResponseBody": {
      "$ref": "#/definitions/PostHealthcheckRequestBody"
    },
    "PostHealthcheckRequestBody": {
      "$ref": "#/definitions/Metrics"
    },
    "Metrics": {
      "type": "object",
      "properties": {
        "cpu": {
          "anyOf": [
            {
              "type": "object",
              "additionalProperties": {}
            },
            {
              "type": "number"
            }
          ]
        },
        "memory": {
          "anyOf": [
            {
              "type": "object",
              "additionalProperties": {}
            },
            {
              "type": "number"
            }
          ]
        },
        "disk": {},
        "io": {},
        "heapSizeLimitBytes": {
          "type": "number"
        },
        "currentHeapSizeBytes": {
          "type": "number"
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
        },
        "version_external": {
          "type": "string"
        },
        "apiSuccessCount": {
          "type": "number"
        },
        "apiFailureCount": {
          "type": "number"
        },
        "apiP90DurationSeconds": {
          "type": "number"
        },
        "workflowSuccessCount": {
          "type": "number"
        },
        "workflowFailureCount": {
          "type": "number"
        },
        "workflowP90DurationSeconds": {
          "type": "number"
        },
        "desiredState": {
          "$ref": "#/definitions/AgentStatus"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AgentStatus": {
      "type": "string",
      "enum": [
        "Active",
        "Disconnected",
        "Browser Unreachable",
        "Pending Registration",
        "Stale"
      ]
    }
  }
}
```

</details>

#### `/api/v1/agents/datasource/:id`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/DatasourceIdResponseBody",
  "definitions": {
    "DatasourceIdResponseBody": {
      "$ref": "#/definitions/Integration"
    },
    "Integration": {
      "type": "object",
      "properties": {
        "datasource": {
          "$ref": "#/definitions/DatasourceDto"
        },
        "plugin": {
          "$ref": "#/definitions/Plugin"
        }
      },
      "required": [
        "datasource",
        "plugin"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DatasourceDto": {
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
        "pluginName": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        },
        "configuration": {
          "$ref": "#/definitions/DatasourceConfiguration"
        },
        "configurationProd": {
          "$ref": "#/definitions/DatasourceConfiguration"
        },
        "configurationStaging": {
          "$ref": "#/definitions/DatasourceConfiguration"
        },
        "configurationProfiles": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/DatasourceConfiguration"
          }
        },
        "isDefault": {
          "type": "boolean"
        },
        "invalids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "authContext": {
          "$ref": "#/definitions/AuthContext"
        },
        "creator": {
          "$ref": "#/definitions/CreatorDto"
        },
        "demoIntegrationId": {
          "type": "string"
        },
        "ownerEmail": {
          "type": "string"
        },
        "error": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "name",
        "pluginId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DatasourceConfiguration": {
      "anyOf": [
        {
          "$ref": "#/definitions/AthenaDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/BigqueryDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/CockroachDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/CosmosDbDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/DynamoDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/EmailDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/GCSDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/GraphQLDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/JavascriptDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MariaDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MongoDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MySQLDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/OpenAiDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/PostgresDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/PythonDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RedisDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RedshiftDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RestApiDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RestApiIntegrationDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/S3DatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SnowflakeDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SuperblocksOcrDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/WorkflowDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MsSqlDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RocksetDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/GoogleSheetsDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/KafkaDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SalesforceDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SmtpDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/AdlsDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/OracleDbDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/DatabricksDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/CouchbaseDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SecretStore"
        }
      ]
    },
    "AthenaDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Connection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Connection": {
      "type": "object",
      "properties": {
        "workgroupName": {
          "type": "string"
        },
        "overrideS3OutputLocation": {
          "type": "boolean"
        },
        "s3OutputLocation": {
          "type": "string"
        },
        "s3OutputLocationSuffix": {
          "$ref": "#/definitions/Connection_DateFolderType"
        },
        "databaseName": {
          "type": "string"
        },
        "awsConfig": {
          "$ref": "#/definitions/AWSConfig"
        }
      },
      "required": [
        "overrideS3OutputLocation",
        "databaseName"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Connection_DateFolderType": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3
      ]
    },
    "AWSConfig": {
      "type": "object",
      "properties": {
        "region": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/AWSConfig_Auth"
        },
        "endpoint": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AWSConfig_Auth": {
      "type": "object",
      "properties": {
        "accessKeyId": {
          "type": "string"
        },
        "secretKey": {
          "type": "string"
        },
        "iamRoleArn": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamicWorkflowConfiguration": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "workflowId": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BigqueryDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "googleServiceAccount": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
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
        "system": {
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamicWorkflowConfig": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "workflowId": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SemVer": {
      "type": "string"
    },
    "CockroachDBDatasourceConfiguration": {
      "$ref": "#/definitions/PostgresDatasourceConfiguration"
    },
    "PostgresDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "tunnel": {
          "$ref": "#/definitions/SSHAuthConfiguration"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "SSHAuthConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authMethod": {
          "$ref": "#/definitions/SharedSSHAuthMethod"
        },
        "authenticationMethod": {
          "$ref": "#/definitions/SSHAuthMethod"
        },
        "enabled": {
          "type": "boolean"
        },
        "host": {
          "type": "string"
        },
        "passphrase": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "privateKey": {
          "type": "string"
        },
        "publicKey": {
          "type": "string"
        },
        "username": {
          "type": "string"
        }
      }
    },
    "SharedSSHAuthMethod": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3
      ]
    },
    "SSHAuthMethod": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "CosmosDbDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_CosmosDbConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_CosmosDbConnection": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "databaseId": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/Azure"
        }
      },
      "required": [
        "host",
        "port",
        "databaseId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Azure": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Azure_Key"
                },
                "case": {
                  "type": "string",
                  "const": "key"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Azure_ClientCredentials"
                },
                "case": {
                  "type": "string",
                  "const": "clientCredentials"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Azure_Key": {
      "type": "object",
      "properties": {
        "masterKey": {
          "type": "string"
        }
      },
      "required": [
        "masterKey"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Azure_ClientCredentials": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamoDBDatasourceConfiguration": {
      "$ref": "#/definitions/AWSDatasourceConfiguration"
    },
    "AWSDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "awsAuthType": {
          "$ref": "#/definitions/AWSAuthType"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "region": {
                  "$ref": "#/definitions/Property"
                },
                "accessKeyID": {
                  "$ref": "#/definitions/Property"
                },
                "secretKey": {
                  "$ref": "#/definitions/Property"
                },
                "iamRoleArn": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {}
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "AWSAuthType": {
      "type": "string",
      "enum": [
        "access-key",
        "token-file",
        "ec2-instance-metadata"
      ]
    },
    "EmailDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "apiKey": {
                  "$ref": "#/definitions/Property"
                },
                "senderEmail": {
                  "$ref": "#/definitions/Property"
                },
                "senderName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "sendgridTemplateId": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "GCSDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "googleServiceAccount": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "GraphQLDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
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
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "AuthConfig": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "googleServiceAccount": {
          "$ref": "#/definitions/Property"
        },
        "clientSecret": {
          "type": "string"
        },
        "clientId": {
          "type": "string"
        },
        "authorizationUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "userInfoUrl": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "promptType": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "tokenScope": {
          "$ref": "#/definitions/TokenScope"
        },
        "revokeTokenUrl": {
          "type": "string"
        },
        "authToken": {
          "type": "string"
        },
        "hasToken": {
          "type": "boolean"
        },
        "userEmail": {
          "type": "string"
        },
        "sendOAuthState": {
          "type": "boolean"
        },
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "method": {
          "$ref": "#/definitions/ApiKeyMethod"
        },
        "apiKeys": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "header": {
                "type": "string"
              },
              "token": {
                "type": "string"
              }
            },
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "prefix": {
          "type": "string"
        },
        "token": {
          "type": "string"
        },
        "bearerToken": {
          "type": "string"
        },
        "apiKey": {
          "type": "string"
        },
        "google": {
          "type": "boolean"
        },
        "email": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "$ref": "#/definitions/ClientAuthMethod"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "useFixedPasswordCreds": {
          "type": "boolean"
        },
        "shareBasicAuthCreds": {
          "type": [
            "boolean",
            "string"
          ]
        }
      }
    },
    "TokenScope": {
      "type": "string",
      "enum": [
        "datasource",
        "user"
      ]
    },
    "ApiKeyMethod": {
      "type": "string",
      "enum": [
        "header",
        "query-param"
      ]
    },
    "ClientAuthMethod": {
      "type": "string",
      "enum": [
        "POST",
        "BASIC"
      ]
    },
    "AuthType": {
      "anyOf": [
        {
          "$ref": "#/definitions/IntegrationAuthType"
        },
        {
          "$ref": "#/definitions/GoogleSheetsAuthType"
        },
        {
          "$ref": "#/definitions/NewAuthType"
        }
      ]
    },
    "IntegrationAuthType": {
      "type": "string",
      "enum": [
        "None",
        "basic",
        "oauth-code",
        "oauth-client-cred",
        "oauth-implicit",
        "oauth-pword",
        "Firebase",
        "bearer",
        "api-key",
        "token-prefixed",
        "api-key-form"
      ]
    },
    "GoogleSheetsAuthType": {
      "type": "string",
      "enum": [
        "oauth-code",
        "service-account"
      ]
    },
    "NewAuthType": {
      "type": "string",
      "enum": [
        "passwordGrantFlow",
        "authorizationCodeFlow",
        "clientCredentialsFlow"
      ]
    },
    "JavascriptDatasourceConfiguration": {
      "$ref": "#/definitions/LanguageDatasourceConfiguration"
    },
    "LanguageDatasourceConfiguration": {
      "$ref": "#/definitions/DefaultDatasourceConfiguration"
    },
    "DefaultDatasourceConfiguration": {
      "$ref": "#/definitions/BaseDatasourceConfiguration"
    },
    "BaseDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "MariaDBDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "MongoDBDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "tunnel": {
          "$ref": "#/definitions/SSHAuthConfiguration"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "MySQLDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "tunnel": {
          "$ref": "#/definitions/SSHAuthConfiguration"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "OpenAiDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "bearerToken": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      },
      "required": [
        "bearerToken"
      ]
    },
    "PythonDatasourceConfiguration": {
      "$ref": "#/definitions/LanguageDatasourceConfiguration"
    },
    "RedisDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_Connection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Connection": {
      "type": "object",
      "properties": {
        "connectionType": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Connection_Url"
                },
                "case": {
                  "type": "string",
                  "const": "url"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Connection_Fields"
                },
                "case": {
                  "type": "string",
                  "const": "fields"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "connectionType"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "NOTE: (joey) this does not have to be a separate message right now 1. this follows the \"connection\" pattern 2. this lets us easily add shared connection fields in the future"
    },
    "Plugin_Connection_Url": {
      "type": "object",
      "properties": {
        "urlString": {
          "type": "string"
        }
      },
      "required": [
        "urlString"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Connection_Fields": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "databaseNumber": {
          "type": "number"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "enableSsl": {
          "type": "boolean"
        }
      },
      "required": [
        "host",
        "port",
        "enableSsl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "RedshiftDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                },
                "databaseSchema": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "RestApiDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "urlBase": {
          "type": "string"
        },
        "AuthCodeExplanation": {
          "type": "string"
        },
        "FirebaseAlert": {
          "type": "string"
        },
        "HTTPBasicAlert": {
          "type": "string"
        },
        "oauth-callback-alert": {
          "type": "string"
        },
        "oauth-connect-button": {
          "type": "string"
        },
        "oauth-revoke-shared-tokens-button": {
          "type": "string"
        },
        "OAuth2PasswordAlert": {
          "type": "string"
        },
        "openApiSpecRef": {
          "type": "string"
        },
        "openApiTenantName": {
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
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "RestApiIntegrationDatasourceConfiguration": {
      "$ref": "#/definitions/RestApiDatasourceConfiguration"
    },
    "S3DatasourceConfiguration": {
      "$ref": "#/definitions/AWSDatasourceConfiguration"
    },
    "SnowflakeDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "okta",
            "key-pair"
          ]
        },
        "okta": {
          "type": "object",
          "properties": {
            "authenticatorUrl": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "keyPair": {
          "type": "object",
          "properties": {
            "privateKey": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "required": [
            "privateKey"
          ],
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "authentication": {
          "type": "object",
          "properties": {
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            },
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                },
                "account": {
                  "$ref": "#/definitions/Property"
                },
                "warehouse": {
                  "$ref": "#/definitions/Property"
                },
                "schema": {
                  "$ref": "#/definitions/Property"
                },
                "role": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "SuperblocksOcrDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "microsoftComputerVisionApiKey": {
          "type": "string"
        },
        "microsoftComputerVisionResourceBaseUrl": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "WorkflowDatasourceConfiguration": {
      "$ref": "#/definitions/BaseDatasourceConfiguration"
    },
    "MsSqlDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "RocksetDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "apiKey": {
          "type": "string"
        },
        "baseURL": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      },
      "required": [
        "apiKey"
      ]
    },
    "GoogleSheetsDatasourceConfiguration": {
      "$ref": "#/definitions/RestApiDatasourceConfiguration"
    },
    "KafkaDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "name": {
          "type": "string"
        },
        "cluster": {
          "$ref": "#/definitions/Cluster"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "type": "string"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "Cluster": {
      "type": "object",
      "properties": {
        "brokers": {
          "type": "string",
          "description": "NOTE(frank): Due to limitations in our plugin template system, we can't use an array....."
        },
        "ssl": {
          "type": "boolean"
        },
        "sasl": {
          "$ref": "#/definitions/SASL"
        }
      },
      "required": [
        "brokers",
        "ssl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SASL": {
      "type": "object",
      "properties": {
        "mechanism": {
          "$ref": "#/definitions/SASL_Mechanism"
        },
        "username": {
          "type": "string",
          "description": "non-aws fields"
        },
        "password": {
          "type": "string"
        },
        "accessKeyId": {
          "type": "string",
          "description": "aws fields"
        },
        "secretKey": {
          "type": "string"
        },
        "sessionToken": {
          "type": "string"
        },
        "authorizationIdentity": {
          "type": "string"
        }
      },
      "required": [
        "mechanism"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SASL_Mechanism": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "SalesforceDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "name": {
          "type": "string",
          "description": "Plugin fields"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_SalesforceConnection"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "authConfig": {
          "type": "object",
          "properties": {
            "authToken": {
              "type": "string"
            },
            "useFixedPasswordCreds": {
              "type": "boolean"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "Plugin_SalesforceConnection": {
      "type": "object",
      "properties": {
        "instanceUrl": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/Auth"
        }
      },
      "required": [
        "instanceUrl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "children messages"
    },
    "Auth": {
      "type": "object",
      "properties": {
        "method": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/OAuth_PasswordGrantFlow"
                },
                "case": {
                  "type": "string",
                  "const": "passwordGrantFlow"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/OAuth_AuthorizationCodeFlow"
                },
                "case": {
                  "type": "string",
                  "const": "authorizationCodeFlow"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Basic"
                },
                "case": {
                  "type": "string",
                  "const": "basic"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/OAuth_ClientCredentialsFlow"
                },
                "case": {
                  "type": "string",
                  "const": "clientCredentialsFlow"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Azure_Key",
                  "description": "todo: remove me when cosmos updates"
                },
                "case": {
                  "type": "string",
                  "const": "key"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "method"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "OAuth_PasswordGrantFlow": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret",
        "tokenUrl",
        "username",
        "password",
        "audience",
        "scope"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "OAuth_AuthorizationCodeFlow": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "tokenScope": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret",
        "tokenUrl",
        "authUrl",
        "audience",
        "scope",
        "tokenScope",
        "refreshTokenFromServer",
        "clientAuthMethod"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Basic": {
      "type": "object",
      "properties": {
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        }
      },
      "required": [
        "username",
        "password"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "OAuth_ClientCredentialsFlow": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret",
        "tokenUrl",
        "audience",
        "scope"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SmtpDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_SmtpConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_SmtpConnection": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "secure": {
          "type": "boolean"
        }
      },
      "required": [
        "host",
        "port",
        "username",
        "password"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AdlsDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_AdlsConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_AdlsConnection": {
      "type": "object",
      "properties": {
        "accountName": {
          "type": "string"
        },
        "tenant": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/Azure"
        }
      },
      "required": [
        "accountName",
        "tenant"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "We need to repeat that it's Adls because of the schema checker that's built based off of these types. It errors out when there is a duplicate type name."
    },
    "OracleDbDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_OracleDbConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "required": [
        "name"
      ]
    },
    "Plugin_OracleDbConnection": {
      "type": "object",
      "properties": {
        "hostUrl": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "user": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "databaseService": {
          "type": "string"
        },
        "useTcps": {
          "type": "boolean"
        },
        "connectionType": {
          "type": "string"
        },
        "connectionUrl": {
          "type": "string"
        }
      },
      "required": [
        "hostUrl",
        "port",
        "user",
        "password",
        "databaseService",
        "useTcps",
        "connectionType",
        "connectionUrl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DatabricksDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_DatabricksConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_DatabricksConnection": {
      "type": "object",
      "properties": {
        "defaultCatalog": {
          "type": "string"
        },
        "defaultSchema": {
          "type": "string"
        },
        "hostUrl": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "connectionType": {
          "$ref": "#/definitions/Plugin_ConnectionType"
        },
        "token": {
          "type": "string",
          "description": "PAT"
        },
        "oauthClientId": {
          "type": "string",
          "description": "M2M"
        },
        "oauthClientSecret": {
          "type": "string"
        }
      },
      "required": [
        "hostUrl",
        "path",
        "port"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_ConnectionType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "CouchbaseDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_CouchbaseConnection"
        },
        "tunnel": {
          "$ref": "#/definitions/SSHConfiguration"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_CouchbaseConnection": {
      "type": "object",
      "properties": {
        "user": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "url": {
          "type": "string"
        }
      },
      "required": [
        "user",
        "password",
        "url"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SSHConfiguration": {
      "type": "object",
      "properties": {
        "authenticationMethod": {
          "$ref": "#/definitions/SSHAuthMethod"
        },
        "enabled": {
          "type": "boolean"
        },
        "host": {
          "type": "string"
        },
        "passphrase": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "privateKey": {
          "type": "string"
        },
        "publicKey": {
          "type": "string"
        },
        "username": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SecretStore": {
      "type": "object",
      "properties": {
        "provider": {
          "$ref": "#/definitions/Provider"
        },
        "ttl": {
          "type": "number"
        },
        "configurationId": {
          "type": "string"
        }
      },
      "required": [
        "configurationId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Provider": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/MockStore"
                },
                "case": {
                  "type": "string",
                  "const": "mock"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AkeylessSecretsManager"
                },
                "case": {
                  "type": "string",
                  "const": "akeylessSecretsManager"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AwsSecretsManager"
                },
                "case": {
                  "type": "string",
                  "const": "awsSecretsManager"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/GcpSecretManager"
                },
                "case": {
                  "type": "string",
                  "const": "gcpSecretManager"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/HashicorpVault"
                },
                "case": {
                  "type": "string",
                  "const": "hashicorpVault"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "MockStore": {
      "type": "object",
      "properties": {
        "data": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          }
        }
      },
      "required": [
        "data"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessSecretsManager": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/AkeylessAuth"
        },
        "host": {
          "type": "string"
        },
        "prefix": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessAuth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AkeylessAuth_ApiKey"
                },
                "case": {
                  "type": "string",
                  "const": "apiKey"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AkeylessAuth_Email"
                },
                "case": {
                  "type": "string",
                  "const": "email"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessAuth_ApiKey": {
      "type": "object",
      "properties": {
        "accessId": {
          "type": "string"
        },
        "accessKey": {
          "type": "string"
        }
      },
      "required": [
        "accessId",
        "accessKey"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessAuth_Email": {
      "type": "object",
      "properties": {
        "email": {
          "type": "string"
        },
        "password": {
          "type": "string"
        }
      },
      "required": [
        "email",
        "password"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsSecretsManager": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/AwsAuth"
        },
        "prefix": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsAuth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AwsAuth_Static"
                },
                "case": {
                  "type": "string",
                  "const": "static"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AwsAuth_AssumeRole"
                },
                "case": {
                  "type": "string",
                  "const": "assumeRole"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        },
        "region": {
          "type": "string"
        }
      },
      "required": [
        "config",
        "region"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsAuth_Static": {
      "type": "object",
      "properties": {
        "accessKeyId": {
          "type": "string"
        },
        "secretAccessKey": {
          "type": "string"
        }
      },
      "required": [
        "accessKeyId",
        "secretAccessKey"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsAuth_AssumeRole": {
      "type": "object",
      "properties": {
        "roleArn": {
          "type": "string"
        }
      },
      "required": [
        "roleArn"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "GcpSecretManager": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/GcpAuth"
        },
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "GcpAuth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "type": "object",
                  "properties": {
                    "BYTES_PER_ELEMENT": {
                      "type": "number"
                    },
                    "buffer": {
                      "type": "object",
                      "properties": {
                        "byteLength": {
                          "type": "number"
                        }
                      },
                      "required": [
                        "byteLength"
                      ],
                      "additionalProperties": {
                        "not": true,
                        "errorMessage": "extra property is ${0#}"
                      }
                    },
                    "byteLength": {
                      "type": "number"
                    },
                    "byteOffset": {
                      "type": "number"
                    },
                    "length": {
                      "type": "number"
                    }
                  },
                  "required": [
                    "BYTES_PER_ELEMENT",
                    "buffer",
                    "byteLength",
                    "byteOffset",
                    "length"
                  ],
                  "additionalProperties": {
                    "type": "number"
                  }
                },
                "case": {
                  "type": "string",
                  "const": "serviceAccount"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/HashicorpVault_Auth"
        },
        "address": {
          "type": "string",
          "description": "The location of the vault server."
        },
        "path": {
          "type": "string",
          "description": "The path to the vault"
        },
        "namespace": {
          "type": "string",
          "description": "The Hashicorp Vault namespace."
        },
        "version": {
          "$ref": "#/definitions/HashicorpVault_Version",
          "description": "The engine version."
        },
        "secretsPath": {
          "type": "string",
          "description": "the path to the secrets"
        }
      },
      "required": [
        "address",
        "version"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault_Auth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string"
                },
                "case": {
                  "type": "string",
                  "const": "token"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/HashicorpVault_Auth_AppRole"
                },
                "case": {
                  "type": "string",
                  "const": "appRole"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault_Auth_AppRole": {
      "type": "object",
      "properties": {
        "roleId": {
          "type": "string"
        },
        "secretId": {
          "type": "string"
        }
      },
      "required": [
        "roleId",
        "secretId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault_Version": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "AuthContext": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "$ref": "#/definitions/RedactableExecutionParam"
        }
      }
    },
    "RedactableExecutionParam": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {},
        "redactedValue": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "required": [
        "key",
        "value"
      ]
    },
    "CreatorDto": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "email",
        "name"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
        "iconLocation": {
          "type": "string"
        },
        "openApiSpecRef": {
          "type": "string"
        },
        "docsUrl": {
          "type": "string"
        },
        "actionFormDocLinks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "url": {
                "type": "string"
              },
              "name": {
                "type": "string"
              },
              "display": {
                "$ref": "#/definitions/FormItemDisplay"
              }
            },
            "required": [
              "url",
              "name"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "responseType": {
          "$ref": "#/definitions/PluginResponseType"
        },
        "rawRequestName": {
          "type": "string"
        },
        "hasRawRequest": {
          "type": "boolean"
        },
        "datasourceTemplate": {
          "$ref": "#/definitions/FormTemplate"
        },
        "actionTemplate": {
          "$ref": "#/definitions/FormTemplate"
        },
        "demoData": {
          "type": "object",
          "additionalProperties": {}
        },
        "hasTest": {
          "type": "boolean"
        },
        "hasMetadata": {
          "type": "boolean"
        },
        "isStreamable": {
          "type": "boolean"
        },
        "kind": {
          "$ref": "#/definitions/IntegrationKind"
        },
        "responseTypeOverride": {
          "$ref": "#/definitions/ResponseTypeOverride"
        }
      },
      "required": [
        "id",
        "name",
        "type",
        "moduleName",
        "modulePath",
        "iconLocation",
        "responseType",
        "hasRawRequest",
        "actionTemplate"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "PluginType": {
      "type": "string",
      "enum": [
        "DB",
        "API",
        "JS",
        "CODE"
      ]
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "PluginResponseType": {
      "type": "string",
      "enum": [
        "TABLE",
        "JSON"
      ]
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
      "required": [
        "sections"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "FormSection": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "sectionHeader": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "$ref": "#/definitions/FormItem"
              },
              {
                "$ref": "#/definitions/FormRow"
              }
            ]
          }
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "layout": {
          "$ref": "#/definitions/FormSectionLayout"
        },
        "borderThreshold": {
          "type": "number"
        },
        "isCollapsible": {
          "type": "boolean"
        },
        "defaultCollapsed": {
          "type": "boolean"
        },
        "asTitle": {
          "type": "boolean"
        }
      },
      "required": [
        "name",
        "items"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "FormItem": {
      "anyOf": [
        {
          "$ref": "#/definitions/DefaultFormItem"
        },
        {
          "$ref": "#/definitions/AlertFormItem"
        },
        {
          "$ref": "#/definitions/InputFormItem"
        },
        {
          "$ref": "#/definitions/DynamicInputFormItem"
        },
        {
          "$ref": "#/definitions/CodeEditorFormItem"
        },
        {
          "$ref": "#/definitions/DropdownFormItem"
        },
        {
          "$ref": "#/definitions/MetadataDropdownFormItem"
        },
        {
          "$ref": "#/definitions/FieldListFormItem"
        },
        {
          "$ref": "#/definitions/ButtonFormItem"
        },
        {
          "$ref": "#/definitions/RadioFormItem"
        },
        {
          "$ref": "#/definitions/CheckboxFormItem"
        },
        {
          "$ref": "#/definitions/DynamicInputWithMetadataOptionsFormItem"
        },
        {
          "$ref": "#/definitions/UrlInputFormItem"
        },
        {
          "$ref": "#/definitions/SwitchFormItem"
        }
      ]
    },
    "DefaultFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "enum": [
            "INPUT_AREA",
            "PRIMARY_KEY_DISPLAY",
            "KEY_MAPPING",
            "FILTER_COLUMNS",
            "SQL_PREVIEW",
            "SQL_PREVIEW_WITH_INSERT_DELETE",
            "OPENAPI_ACTION_DROPDOWN",
            "ONEOF_ACTION_DROPDOWN"
          ]
        },
        "placeholder": {
          "type": "string"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "InitialValue": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "number"
        },
        {
          "type": "boolean"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/definitions/KVPair"
          }
        }
      ]
    },
    "KVPair": {
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
        "file": {
          "type": "object",
          "properties": {
            "filename": {
              "type": "string"
            }
          },
          "required": [
            "filename"
          ],
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "system": {
          "type": "boolean"
        }
      },
      "required": [
        "key",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "FormItemStyle": {
      "type": "object",
      "properties": {
        "minHeight": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "FormItemTooltip": {
      "type": "object",
      "properties": {
        "markdownText": {
          "type": "string"
        },
        "icon": {
          "type": "string"
        },
        "iconType": {
          "$ref": "#/definitions/TooltipIconType"
        }
      },
      "required": [
        "markdownText"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "TooltipIconType": {
      "type": "string",
      "enum": [
        "warning",
        "info"
      ]
    },
    "DisplayUnsupportedState": {
      "type": "string",
      "enum": [
        "hide",
        "disable"
      ]
    },
    "AgentType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "FormItemTransformation": {
      "type": "string",
      "const": "BYTE_ARRAY"
    },
    "AlertFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "ALERT"
        },
        "messageTemplate": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "enum": [
            "success",
            "warning",
            "info",
            "error"
          ]
        },
        "showIcon": {
          "type": "boolean"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "InputFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
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
        },
        "minNumber": {
          "type": "number"
        },
        "subtitle": {
          "type": "string"
        },
        "enableCopy": {
          "type": "boolean"
        },
        "initialValueFromEnv": {
          "type": "string"
        },
        "forcedStatic": {
          "type": "boolean"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "InputDataType": {
      "type": "string",
      "enum": [
        "NUMBER",
        "PASSWORD"
      ]
    },
    "DynamicInputFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "DYNAMIC_INPUT_TEXT"
        },
        "placeholder": {
          "type": "string"
        },
        "dataType": {
          "$ref": "#/definitions/InputDataType"
        },
        "subtitle": {
          "type": "string"
        },
        "showHideIcon": {
          "type": "boolean"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "CodeEditorFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
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
      "required": [
        "componentType",
        "label",
        "language",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "EditorLanguage": {
      "type": "string",
      "enum": [
        "TEXT",
        "SQL",
        "JSON",
        "JAVASCRIPT",
        "PYTHON"
      ]
    },
    "DropdownFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
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
        },
        "showSearch": {
          "type": "boolean"
        },
        "optionFilterProp": {
          "type": "string"
        },
        "subtitle": {
          "type": "string"
        },
        "renderSelectedOptionWithStyles": {
          "type": "boolean"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "options",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
        "enumValue": {
          "type": "number"
        },
        "displayName": {
          "type": "string"
        },
        "subText": {
          "type": "string"
        },
        "subTextMaxLines": {
          "type": "number"
        },
        "subTextPosition": {
          "type": "string",
          "enum": [
            "bottom",
            "right"
          ]
        },
        "parentKey": {
          "type": "string"
        },
        "isGroupHeader": {
          "type": "boolean"
        },
        "groupName": {
          "type": "string"
        },
        "textColor": {
          "type": "string"
        },
        "prefixText": {
          "type": "string"
        },
        "prefixColor": {
          "type": "string"
        },
        "prefixWidth": {
          "type": "number"
        },
        "hasDivider": {
          "type": "boolean"
        }
      },
      "required": [
        "key",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "MetadataDropdownFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "METADATA_DROPDOWN"
        },
        "dependencyFieldName": {
          "type": "string"
        },
        "childIteratorAccessor": {
          "type": "string"
        },
        "keyAccessor": {
          "type": "string"
        },
        "valueAccessor": {
          "type": "string"
        },
        "displayNameAccessor": {
          "type": "string"
        },
        "listAccessor": {
          "type": "string"
        },
        "defaultToFirstOption": {
          "type": "boolean"
        },
        "clearDependentFieldsOnChange": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "filterDependency": {
          "type": "string"
        },
        "filterFieldName": {
          "type": "string"
        },
        "showSearch": {
          "type": "boolean"
        },
        "optionFilterProp": {
          "type": "string"
        },
        "placeholder": {
          "type": "string"
        },
        "gSheetsPagination": {
          "type": "boolean"
        }
      },
      "required": [
        "componentType",
        "displayNameAccessor",
        "keyAccessor",
        "label",
        "name",
        "startVersion",
        "valueAccessor"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "FieldListFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "anyOf": [
            {
              "type": "string",
              "const": "FIELD_LIST"
            },
            {
              "type": "string",
              "const": "FIELD_LIST_FORM"
            },
            {
              "type": "string",
              "const": "DYNAMIC_FIELD_LIST"
            }
          ]
        },
        "secretsNames": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "collapseValue": {
          "type": "string"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ButtonFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "BUTTON"
        },
        "buttonType": {
          "$ref": "#/definitions/ButtonType"
        },
        "valuesFromContext": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "extraValues": {
          "$ref": "#/definitions/ExtraValues"
        },
        "iconUrl": {
          "type": "string"
        },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "buttonType",
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ButtonType": {
      "type": "string",
      "enum": [
        "revokeOAuthTokens",
        "connectOAuth"
      ]
    },
    "ExtraValues": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "responseType": {
          "type": "string"
        },
        "accessType": {
          "type": "string"
        },
        "stateConfigExclude": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/AuthorizationStateConfig"
          }
        },
        "owner": {
          "type": "string"
        },
        "pluginId": {
          "type": "string"
        }
      },
      "required": [
        "pluginId"
      ]
    },
    "AuthorizationStateConfig": {
      "type": "string",
      "const": "datasource-auth-state"
    },
    "RadioFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "RADIO"
        },
        "options": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/DropdownOption"
          }
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "options",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "CheckboxFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "CHECKBOX"
        },
        "mapBooleansTo": {
          "$ref": "#/definitions/MapBooleansTo"
        },
        "validateReduxPath": {
          "$ref": "#/definitions/ValidateReduxPath"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "MapBooleansTo": {
      "type": "object",
      "properties": {
        "true": {
          "type": "string"
        },
        "false": {
          "type": "string"
        }
      },
      "required": [
        "true",
        "false"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ValidateReduxPath": {
      "type": "object",
      "properties": {
        "true": {
          "$ref": "#/definitions/ValidateReduxPathItem"
        },
        "false": {
          "$ref": "#/definitions/ValidateReduxPathItem"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ValidateReduxPathItem": {
      "type": "object",
      "properties": {
        "selector": {
          "type": "string",
          "const": "selectHasConnectedTokens"
        },
        "validValue": {},
        "errorMessage": {
          "type": "string"
        }
      },
      "required": [
        "selector",
        "validValue",
        "errorMessage"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamicInputWithMetadataOptionsFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "DYNAMIC_INPUT_WITH_METADATA_OPTIONS"
        },
        "dependencyFieldName": {
          "type": "string"
        },
        "valueAccessor": {
          "type": "string"
        },
        "listAccessor": {
          "type": "string"
        },
        "defaultToFirstOption": {
          "type": "boolean"
        },
        "clearDependentFieldsOnChange": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "filterDependency": {
          "type": "string"
        },
        "filterFieldName": {
          "type": "string"
        },
        "optionFilterProp": {
          "type": "string"
        },
        "placeholder": {
          "type": "string"
        },
        "dataType": {
          "$ref": "#/definitions/InputDataType"
        },
        "subtitle": {
          "type": "string"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion",
        "valueAccessor"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "UrlInputFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "URL_INPUT_TEXT"
        },
        "placeholder": {
          "type": "string"
        },
        "subtitle": {
          "type": "string"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SwitchFormItem": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "secondaryName": {
          "type": "string"
        },
        "label": {
          "type": "string"
        },
        "startVersion": {
          "type": "string"
        },
        "endVersion": {
          "type": "string"
        },
        "agentVersion": {
          "type": "string"
        },
        "display": {
          "$ref": "#/definitions/FormItemDisplay"
        },
        "doNotClearOnDependenciesChange": {
          "type": "boolean"
        },
        "initialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "secondaryInitialValue": {
          "$ref": "#/definitions/InitialValue"
        },
        "rules": {
          "type": "array",
          "items": {}
        },
        "style": {
          "$ref": "#/definitions/FormItemStyle"
        },
        "disabled": {
          "type": "boolean"
        },
        "disabledPairCount": {
          "type": "number"
        },
        "tooltip": {
          "$ref": "#/definitions/FormItemTooltip"
        },
        "subHeading": {
          "type": "string"
        },
        "singleLine": {
          "type": "boolean"
        },
        "displayUnsupported": {
          "$ref": "#/definitions/DisplayUnsupportedState"
        },
        "hidden": {
          "type": "boolean"
        },
        "triggerGetMetadata": {
          "type": "boolean"
        },
        "immutable": {
          "type": "boolean"
        },
        "agentType": {
          "$ref": "#/definitions/AgentType"
        },
        "actionOptions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string"
              },
              "value": {
                "type": "string"
              },
              "children": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string"
                    },
                    "value": {
                      "type": "string"
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              }
            },
            "required": [
              "value",
              "children"
            ],
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "transformation": {
          "$ref": "#/definitions/FormItemTransformation"
        },
        "ldFlag": {
          "type": "string"
        },
        "componentType": {
          "type": "string",
          "const": "SWITCH"
        },
        "showConfirm": {
          "type": "boolean"
        },
        "confirmTitle": {
          "type": "string"
        },
        "subtitle": {
          "type": "string"
        },
        "lightLabelText": {
          "type": "boolean"
        },
        "renderIconFirst": {
          "type": "boolean"
        },
        "inverseValue": {
          "type": "boolean"
        }
      },
      "required": [
        "componentType",
        "label",
        "name",
        "startVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "FormRow": {
      "type": "object",
      "properties": {
        "rowItems": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/FormItem"
          }
        },
        "gridCss": {
          "type": "object",
          "properties": {
            "gridTemplateColumns": {
              "type": "string"
            },
            "gridTemplateGap": {
              "type": "number"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "subtitle": {
          "type": "string"
        }
      },
      "required": [
        "rowItems"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "FormSectionLayout": {
      "type": "string",
      "const": "TABS"
    },
    "IntegrationKind": {
      "type": "string",
      "enum": [
        "SECRET",
        "PLUGIN"
      ]
    },
    "ResponseTypeOverride": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "values": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "responseType": {
            "$ref": "#/definitions/PluginResponseType"
          }
        },
        "required": [
          "values",
          "responseType"
        ],
        "additionalProperties": {
          "not": true,
          "errorMessage": "extra property is ${0#}"
        }
      }
    }
  }
}
```

</details>

#### `/api/v1/integrations`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/IntegrationsResponseBody",
  "definitions": {
    "IntegrationsResponseBody": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/IntegrationDto"
      }
    },
    "IntegrationDto": {
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
        "isUserConfigured": {
          "type": "boolean"
        },
        "demoIntegrationId": {
          "type": "string"
        },
        "kind": {
          "$ref": "#/definitions/IntegrationKind"
        },
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "updated": {
          "type": "string",
          "format": "date-time"
        },
        "configurations": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/IntegrationConfigurationDto"
          }
        },
        "slug": {
          "type": "string"
        },
        "ownerEmail": {
          "type": "string"
        }
      },
      "required": [
        "configurations",
        "created",
        "id",
        "isUserConfigured",
        "kind",
        "name",
        "organizationId",
        "pluginId",
        "updated"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "IntegrationKind": {
      "type": "string",
      "enum": [
        "SECRET",
        "PLUGIN"
      ]
    },
    "IntegrationConfigurationDto": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "integrationId": {
          "type": "string"
        },
        "configuration": {
          "type": "object"
        },
        "isDefault": {
          "type": "boolean"
        },
        "profileIds": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "profileNames": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "id",
        "created",
        "integrationId",
        "configuration",
        "isDefault"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    }
  }
}
```

</details>

#### `/api/v1/agents/user/userToken`
##### GET

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/GetUserTokenRequestBody",
  "definitions": {
    "GetUserTokenRequestBody": {
      "type": "object",
      "properties": {
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "tokenType": {
          "$ref": "#/definitions/TokenType"
        },
        "eagerRefreshThresholdMs": {
          "type": "number"
        },
        "datasourceId": {
          "type": "string"
        },
        "configurationId": {
          "type": "string"
        }
      },
      "required": [
        "authType",
        "authConfig",
        "tokenType",
        "eagerRefreshThresholdMs"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AuthType": {
      "anyOf": [
        {
          "$ref": "#/definitions/IntegrationAuthType"
        },
        {
          "$ref": "#/definitions/GoogleSheetsAuthType"
        },
        {
          "$ref": "#/definitions/NewAuthType"
        }
      ]
    },
    "IntegrationAuthType": {
      "type": "string",
      "enum": [
        "None",
        "basic",
        "oauth-code",
        "oauth-client-cred",
        "oauth-implicit",
        "oauth-pword",
        "Firebase",
        "bearer",
        "api-key",
        "token-prefixed",
        "api-key-form"
      ]
    },
    "GoogleSheetsAuthType": {
      "type": "string",
      "enum": [
        "oauth-code",
        "service-account"
      ]
    },
    "NewAuthType": {
      "type": "string",
      "enum": [
        "passwordGrantFlow",
        "authorizationCodeFlow",
        "clientCredentialsFlow"
      ]
    },
    "AuthConfig": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "googleServiceAccount": {
          "$ref": "#/definitions/Property"
        },
        "clientSecret": {
          "type": "string"
        },
        "clientId": {
          "type": "string"
        },
        "authorizationUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "userInfoUrl": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "promptType": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "tokenScope": {
          "$ref": "#/definitions/TokenScope"
        },
        "revokeTokenUrl": {
          "type": "string"
        },
        "authToken": {
          "type": "string"
        },
        "hasToken": {
          "type": "boolean"
        },
        "userEmail": {
          "type": "string"
        },
        "sendOAuthState": {
          "type": "boolean"
        },
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "method": {
          "$ref": "#/definitions/ApiKeyMethod"
        },
        "apiKeys": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "header": {
                "type": "string"
              },
              "token": {
                "type": "string"
              }
            },
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "prefix": {
          "type": "string"
        },
        "token": {
          "type": "string"
        },
        "bearerToken": {
          "type": "string"
        },
        "apiKey": {
          "type": "string"
        },
        "google": {
          "type": "boolean"
        },
        "email": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "$ref": "#/definitions/ClientAuthMethod"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "useFixedPasswordCreds": {
          "type": "boolean"
        },
        "shareBasicAuthCreds": {
          "type": [
            "boolean",
            "string"
          ]
        }
      }
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
        "system": {
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "TokenScope": {
      "type": "string",
      "enum": [
        "datasource",
        "user"
      ]
    },
    "ApiKeyMethod": {
      "type": "string",
      "enum": [
        "header",
        "query-param"
      ]
    },
    "ClientAuthMethod": {
      "type": "string",
      "enum": [
        "POST",
        "BASIC"
      ]
    },
    "TokenType": {
      "type": "string",
      "enum": [
        "refresh",
        "userId",
        "token",
        "id-token"
      ]
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
  "$ref": "#/definitions/GetUserTokenResponseBody",
  "definitions": {
    "GetUserTokenResponseBody": {
      "type": "string"
    }
  }
}
```

</details>

##### POST

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PostUserTokenRequestBody",
  "definitions": {
    "PostUserTokenRequestBody": {
      "$ref": "#/definitions/PostUserTokenRequestDto"
    },
    "PostUserTokenRequestDto": {
      "type": "object",
      "properties": {
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "datasourceId": {
          "type": "string"
        },
        "configurationId": {
          "type": "string"
        },
        "expiresAt": {
          "type": "string",
          "format": "date-time"
        },
        "tokenType": {
          "$ref": "#/definitions/TokenType"
        },
        "tokenValue": {
          "type": "string"
        }
      },
      "required": [
        "tokenValue"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AuthConfig": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "googleServiceAccount": {
          "$ref": "#/definitions/Property"
        },
        "clientSecret": {
          "type": "string"
        },
        "clientId": {
          "type": "string"
        },
        "authorizationUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "userInfoUrl": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "promptType": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "tokenScope": {
          "$ref": "#/definitions/TokenScope"
        },
        "revokeTokenUrl": {
          "type": "string"
        },
        "authToken": {
          "type": "string"
        },
        "hasToken": {
          "type": "boolean"
        },
        "userEmail": {
          "type": "string"
        },
        "sendOAuthState": {
          "type": "boolean"
        },
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "method": {
          "$ref": "#/definitions/ApiKeyMethod"
        },
        "apiKeys": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "header": {
                "type": "string"
              },
              "token": {
                "type": "string"
              }
            },
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "prefix": {
          "type": "string"
        },
        "token": {
          "type": "string"
        },
        "bearerToken": {
          "type": "string"
        },
        "apiKey": {
          "type": "string"
        },
        "google": {
          "type": "boolean"
        },
        "email": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "$ref": "#/definitions/ClientAuthMethod"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "useFixedPasswordCreds": {
          "type": "boolean"
        },
        "shareBasicAuthCreds": {
          "type": [
            "boolean",
            "string"
          ]
        }
      }
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
        "system": {
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "TokenScope": {
      "type": "string",
      "enum": [
        "datasource",
        "user"
      ]
    },
    "ApiKeyMethod": {
      "type": "string",
      "enum": [
        "header",
        "query-param"
      ]
    },
    "ClientAuthMethod": {
      "type": "string",
      "enum": [
        "POST",
        "BASIC"
      ]
    },
    "AuthType": {
      "anyOf": [
        {
          "$ref": "#/definitions/IntegrationAuthType"
        },
        {
          "$ref": "#/definitions/GoogleSheetsAuthType"
        },
        {
          "$ref": "#/definitions/NewAuthType"
        }
      ]
    },
    "IntegrationAuthType": {
      "type": "string",
      "enum": [
        "None",
        "basic",
        "oauth-code",
        "oauth-client-cred",
        "oauth-implicit",
        "oauth-pword",
        "Firebase",
        "bearer",
        "api-key",
        "token-prefixed",
        "api-key-form"
      ]
    },
    "GoogleSheetsAuthType": {
      "type": "string",
      "enum": [
        "oauth-code",
        "service-account"
      ]
    },
    "NewAuthType": {
      "type": "string",
      "enum": [
        "passwordGrantFlow",
        "authorizationCodeFlow",
        "clientCredentialsFlow"
      ]
    },
    "TokenType": {
      "type": "string",
      "enum": [
        "refresh",
        "userId",
        "token",
        "id-token"
      ]
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
  "$ref": "#/definitions/PostUserTokenResponseBody",
  "definitions": {
    "PostUserTokenResponseBody": {
      "type": "boolean"
    }
  }
}
```

</details>

##### DELETE

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/DeleteUserTokenResponseBody",
  "definitions": {
    "DeleteUserTokenResponseBody": {
      "type": "boolean"
    }
  }
}
```

</details>

#### `/api/v1/agents/userToken`
##### GET

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/GetOrgTokenRequestBody",
  "definitions": {
    "GetOrgTokenRequestBody": {
      "type": "object",
      "properties": {
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "tokenType": {
          "$ref": "#/definitions/TokenType"
        },
        "eagerRefreshThresholdMs": {
          "type": "number"
        },
        "datasourceId": {
          "type": "string"
        },
        "configurationId": {
          "type": "string"
        }
      },
      "required": [
        "authType",
        "authConfig",
        "tokenType",
        "eagerRefreshThresholdMs"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AuthType": {
      "anyOf": [
        {
          "$ref": "#/definitions/IntegrationAuthType"
        },
        {
          "$ref": "#/definitions/GoogleSheetsAuthType"
        },
        {
          "$ref": "#/definitions/NewAuthType"
        }
      ]
    },
    "IntegrationAuthType": {
      "type": "string",
      "enum": [
        "None",
        "basic",
        "oauth-code",
        "oauth-client-cred",
        "oauth-implicit",
        "oauth-pword",
        "Firebase",
        "bearer",
        "api-key",
        "token-prefixed",
        "api-key-form"
      ]
    },
    "GoogleSheetsAuthType": {
      "type": "string",
      "enum": [
        "oauth-code",
        "service-account"
      ]
    },
    "NewAuthType": {
      "type": "string",
      "enum": [
        "passwordGrantFlow",
        "authorizationCodeFlow",
        "clientCredentialsFlow"
      ]
    },
    "AuthConfig": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "googleServiceAccount": {
          "$ref": "#/definitions/Property"
        },
        "clientSecret": {
          "type": "string"
        },
        "clientId": {
          "type": "string"
        },
        "authorizationUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "userInfoUrl": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "promptType": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "tokenScope": {
          "$ref": "#/definitions/TokenScope"
        },
        "revokeTokenUrl": {
          "type": "string"
        },
        "authToken": {
          "type": "string"
        },
        "hasToken": {
          "type": "boolean"
        },
        "userEmail": {
          "type": "string"
        },
        "sendOAuthState": {
          "type": "boolean"
        },
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "method": {
          "$ref": "#/definitions/ApiKeyMethod"
        },
        "apiKeys": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "header": {
                "type": "string"
              },
              "token": {
                "type": "string"
              }
            },
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "prefix": {
          "type": "string"
        },
        "token": {
          "type": "string"
        },
        "bearerToken": {
          "type": "string"
        },
        "apiKey": {
          "type": "string"
        },
        "google": {
          "type": "boolean"
        },
        "email": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "$ref": "#/definitions/ClientAuthMethod"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "useFixedPasswordCreds": {
          "type": "boolean"
        },
        "shareBasicAuthCreds": {
          "type": [
            "boolean",
            "string"
          ]
        }
      }
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
        "system": {
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "TokenScope": {
      "type": "string",
      "enum": [
        "datasource",
        "user"
      ]
    },
    "ApiKeyMethod": {
      "type": "string",
      "enum": [
        "header",
        "query-param"
      ]
    },
    "ClientAuthMethod": {
      "type": "string",
      "enum": [
        "POST",
        "BASIC"
      ]
    },
    "TokenType": {
      "type": "string",
      "enum": [
        "refresh",
        "userId",
        "token",
        "id-token"
      ]
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
  "$ref": "#/definitions/GetOrgTokenResponseBody",
  "definitions": {
    "GetOrgTokenResponseBody": {
      "type": "string"
    }
  }
}
```

</details>

##### POST

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PostOrgTokenRequestBody",
  "definitions": {
    "PostOrgTokenRequestBody": {
      "$ref": "#/definitions/PostUserTokenRequestDto"
    },
    "PostUserTokenRequestDto": {
      "type": "object",
      "properties": {
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "datasourceId": {
          "type": "string"
        },
        "configurationId": {
          "type": "string"
        },
        "expiresAt": {
          "type": "string",
          "format": "date-time"
        },
        "tokenType": {
          "$ref": "#/definitions/TokenType"
        },
        "tokenValue": {
          "type": "string"
        }
      },
      "required": [
        "tokenValue"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AuthConfig": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "googleServiceAccount": {
          "$ref": "#/definitions/Property"
        },
        "clientSecret": {
          "type": "string"
        },
        "clientId": {
          "type": "string"
        },
        "authorizationUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "userInfoUrl": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "promptType": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "tokenScope": {
          "$ref": "#/definitions/TokenScope"
        },
        "revokeTokenUrl": {
          "type": "string"
        },
        "authToken": {
          "type": "string"
        },
        "hasToken": {
          "type": "boolean"
        },
        "userEmail": {
          "type": "string"
        },
        "sendOAuthState": {
          "type": "boolean"
        },
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "method": {
          "$ref": "#/definitions/ApiKeyMethod"
        },
        "apiKeys": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "header": {
                "type": "string"
              },
              "token": {
                "type": "string"
              }
            },
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "prefix": {
          "type": "string"
        },
        "token": {
          "type": "string"
        },
        "bearerToken": {
          "type": "string"
        },
        "apiKey": {
          "type": "string"
        },
        "google": {
          "type": "boolean"
        },
        "email": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "$ref": "#/definitions/ClientAuthMethod"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "useFixedPasswordCreds": {
          "type": "boolean"
        },
        "shareBasicAuthCreds": {
          "type": [
            "boolean",
            "string"
          ]
        }
      }
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
        "system": {
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "TokenScope": {
      "type": "string",
      "enum": [
        "datasource",
        "user"
      ]
    },
    "ApiKeyMethod": {
      "type": "string",
      "enum": [
        "header",
        "query-param"
      ]
    },
    "ClientAuthMethod": {
      "type": "string",
      "enum": [
        "POST",
        "BASIC"
      ]
    },
    "AuthType": {
      "anyOf": [
        {
          "$ref": "#/definitions/IntegrationAuthType"
        },
        {
          "$ref": "#/definitions/GoogleSheetsAuthType"
        },
        {
          "$ref": "#/definitions/NewAuthType"
        }
      ]
    },
    "IntegrationAuthType": {
      "type": "string",
      "enum": [
        "None",
        "basic",
        "oauth-code",
        "oauth-client-cred",
        "oauth-implicit",
        "oauth-pword",
        "Firebase",
        "bearer",
        "api-key",
        "token-prefixed",
        "api-key-form"
      ]
    },
    "GoogleSheetsAuthType": {
      "type": "string",
      "enum": [
        "oauth-code",
        "service-account"
      ]
    },
    "NewAuthType": {
      "type": "string",
      "enum": [
        "passwordGrantFlow",
        "authorizationCodeFlow",
        "clientCredentialsFlow"
      ]
    },
    "TokenType": {
      "type": "string",
      "enum": [
        "refresh",
        "userId",
        "token",
        "id-token"
      ]
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
  "$ref": "#/definitions/PostOrgTokenResponseBody",
  "definitions": {
    "PostOrgTokenResponseBody": {
      "type": "boolean"
    }
  }
}
```

</details>

#### `/api/v1/oauth2/gsheets/refresh`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/RefreshGsheetsTokenRequestBody",
  "definitions": {
    "RefreshGsheetsTokenRequestBody": {
      "type": "object",
      "properties": {
        "authType": {
          "type": "string"
        },
        "authConfig": {
          "type": "object",
          "additionalProperties": {
            "type": "object"
          }
        },
        "datasourceId": {
          "type": "string"
        },
        "configurationId": {
          "type": "string"
        }
      },
      "required": [
        "authType",
        "authConfig",
        "datasourceId",
        "configurationId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
  "$ref": "#/definitions/RefreshGsheetsTokenResponseBody",
  "definitions": {
    "RefreshGsheetsTokenResponseBody": {
      "type": "string"
    }
  }
}
```

</details>

#### `/api/v2/agents/audit`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/AuditLogRequestBody",
  "definitions": {
    "AuditLogRequestBody": {
      "type": "object",
      "properties": {
        "auditLogs": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/AuditLog"
          }
        }
      },
      "required": [
        "auditLogs"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AuditLog": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "entityId": {
          "type": "string"
        },
        "entityType": {
          "$ref": "#/definitions/AuditLogEntityType"
        },
        "organizationId": {
          "type": "string"
        },
        "isDeployed": {
          "type": "boolean"
        },
        "source": {
          "type": "string"
        },
        "target": {
          "type": "string"
        },
        "type": {
          "$ref": "#/definitions/AuditLogEventType"
        },
        "agentId": {
          "type": "string"
        },
        "status": {
          "$ref": "#/definitions/ApiRunStatus"
        },
        "error": {
          "type": "string"
        },
        "apiLocationContext": {
          "$ref": "#/definitions/ApiLocationContext"
        },
        "apiTiming": {
          "$ref": "#/definitions/ApiTiming"
        },
        "userType": {
          "$ref": "#/definitions/UserType"
        },
        "targetName": {
          "type": "string"
        }
      },
      "required": [
        "id",
        "entityId",
        "entityType",
        "organizationId",
        "isDeployed",
        "source",
        "target",
        "type"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AuditLogEntityType": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "AuditLogEventType": {
      "type": "number",
      "enum": [
        0,
        1
      ]
    },
    "ApiRunStatus": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "ApiLocationContext": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string"
        }
      },
      "required": [
        "applicationId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ApiTiming": {
      "type": "object",
      "properties": {
        "start": {
          "type": "number"
        },
        "end": {
          "type": "number"
        }
      },
      "required": [
        "start"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "UserType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

#### `/api/v2/agents/pending-jobs`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PendingJobsResponseBody",
  "definitions": {
    "PendingJobsResponseBody": {
      "type": "object",
      "properties": {
        "apis": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ApiV2WithIntegrationsResponseWrapper"
          }
        }
      },
      "required": [
        "apis"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ApiV2WithIntegrationsResponseWrapper": {
      "type": "object",
      "properties": {
        "api": {
          "type": "object"
        },
        "integrations": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/DatasourceConfiguration"
          }
        },
        "metadata": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          }
        },
        "stores": {
          "type": "object",
          "properties": {
            "secrets": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/DatasourceConfiguration"
              }
            }
          },
          "required": [
            "secrets"
          ],
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      },
      "required": [
        "api",
        "integrations",
        "metadata",
        "stores"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DatasourceConfiguration": {
      "anyOf": [
        {
          "$ref": "#/definitions/AthenaDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/BigqueryDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/CockroachDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/CosmosDbDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/DynamoDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/EmailDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/GCSDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/GraphQLDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/JavascriptDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MariaDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MongoDBDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MySQLDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/OpenAiDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/PostgresDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/PythonDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RedisDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RedshiftDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RestApiDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RestApiIntegrationDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/S3DatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SnowflakeDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SuperblocksOcrDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/WorkflowDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/MsSqlDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/RocksetDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/GoogleSheetsDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/KafkaDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SalesforceDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SmtpDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/AdlsDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/OracleDbDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/DatabricksDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/CouchbaseDatasourceConfiguration"
        },
        {
          "$ref": "#/definitions/SecretStore"
        }
      ]
    },
    "AthenaDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Connection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Connection": {
      "type": "object",
      "properties": {
        "workgroupName": {
          "type": "string"
        },
        "overrideS3OutputLocation": {
          "type": "boolean"
        },
        "s3OutputLocation": {
          "type": "string"
        },
        "s3OutputLocationSuffix": {
          "$ref": "#/definitions/Connection_DateFolderType"
        },
        "databaseName": {
          "type": "string"
        },
        "awsConfig": {
          "$ref": "#/definitions/AWSConfig"
        }
      },
      "required": [
        "overrideS3OutputLocation",
        "databaseName"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Connection_DateFolderType": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3
      ]
    },
    "AWSConfig": {
      "type": "object",
      "properties": {
        "region": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/AWSConfig_Auth"
        },
        "endpoint": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AWSConfig_Auth": {
      "type": "object",
      "properties": {
        "accessKeyId": {
          "type": "string"
        },
        "secretKey": {
          "type": "string"
        },
        "iamRoleArn": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamicWorkflowConfiguration": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "workflowId": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BigqueryDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "googleServiceAccount": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
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
        "system": {
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamicWorkflowConfig": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "workflowId": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SemVer": {
      "type": "string"
    },
    "CockroachDBDatasourceConfiguration": {
      "$ref": "#/definitions/PostgresDatasourceConfiguration"
    },
    "PostgresDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "tunnel": {
          "$ref": "#/definitions/SSHAuthConfiguration"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "SSHAuthConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authMethod": {
          "$ref": "#/definitions/SharedSSHAuthMethod"
        },
        "authenticationMethod": {
          "$ref": "#/definitions/SSHAuthMethod"
        },
        "enabled": {
          "type": "boolean"
        },
        "host": {
          "type": "string"
        },
        "passphrase": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "privateKey": {
          "type": "string"
        },
        "publicKey": {
          "type": "string"
        },
        "username": {
          "type": "string"
        }
      }
    },
    "SharedSSHAuthMethod": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3
      ]
    },
    "SSHAuthMethod": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "CosmosDbDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_CosmosDbConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_CosmosDbConnection": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "databaseId": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/Azure"
        }
      },
      "required": [
        "host",
        "port",
        "databaseId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Azure": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Azure_Key"
                },
                "case": {
                  "type": "string",
                  "const": "key"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Azure_ClientCredentials"
                },
                "case": {
                  "type": "string",
                  "const": "clientCredentials"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Azure_Key": {
      "type": "object",
      "properties": {
        "masterKey": {
          "type": "string"
        }
      },
      "required": [
        "masterKey"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Azure_ClientCredentials": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamoDBDatasourceConfiguration": {
      "$ref": "#/definitions/AWSDatasourceConfiguration"
    },
    "AWSDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "awsAuthType": {
          "$ref": "#/definitions/AWSAuthType"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "region": {
                  "$ref": "#/definitions/Property"
                },
                "accessKeyID": {
                  "$ref": "#/definitions/Property"
                },
                "secretKey": {
                  "$ref": "#/definitions/Property"
                },
                "iamRoleArn": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {}
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "AWSAuthType": {
      "type": "string",
      "enum": [
        "access-key",
        "token-file",
        "ec2-instance-metadata"
      ]
    },
    "EmailDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "apiKey": {
                  "$ref": "#/definitions/Property"
                },
                "senderEmail": {
                  "$ref": "#/definitions/Property"
                },
                "senderName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "sendgridTemplateId": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "GCSDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "googleServiceAccount": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "GraphQLDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
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
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "AuthConfig": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "googleServiceAccount": {
          "$ref": "#/definitions/Property"
        },
        "clientSecret": {
          "type": "string"
        },
        "clientId": {
          "type": "string"
        },
        "authorizationUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "userInfoUrl": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "promptType": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "tokenScope": {
          "$ref": "#/definitions/TokenScope"
        },
        "revokeTokenUrl": {
          "type": "string"
        },
        "authToken": {
          "type": "string"
        },
        "hasToken": {
          "type": "boolean"
        },
        "userEmail": {
          "type": "string"
        },
        "sendOAuthState": {
          "type": "boolean"
        },
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "method": {
          "$ref": "#/definitions/ApiKeyMethod"
        },
        "apiKeys": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "header": {
                "type": "string"
              },
              "token": {
                "type": "string"
              }
            },
            "additionalProperties": {
              "not": true,
              "errorMessage": "extra property is ${0#}"
            }
          }
        },
        "prefix": {
          "type": "string"
        },
        "token": {
          "type": "string"
        },
        "bearerToken": {
          "type": "string"
        },
        "apiKey": {
          "type": "string"
        },
        "google": {
          "type": "boolean"
        },
        "email": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "$ref": "#/definitions/ClientAuthMethod"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "useFixedPasswordCreds": {
          "type": "boolean"
        },
        "shareBasicAuthCreds": {
          "type": [
            "boolean",
            "string"
          ]
        }
      }
    },
    "TokenScope": {
      "type": "string",
      "enum": [
        "datasource",
        "user"
      ]
    },
    "ApiKeyMethod": {
      "type": "string",
      "enum": [
        "header",
        "query-param"
      ]
    },
    "ClientAuthMethod": {
      "type": "string",
      "enum": [
        "POST",
        "BASIC"
      ]
    },
    "AuthType": {
      "anyOf": [
        {
          "$ref": "#/definitions/IntegrationAuthType"
        },
        {
          "$ref": "#/definitions/GoogleSheetsAuthType"
        },
        {
          "$ref": "#/definitions/NewAuthType"
        }
      ]
    },
    "IntegrationAuthType": {
      "type": "string",
      "enum": [
        "None",
        "basic",
        "oauth-code",
        "oauth-client-cred",
        "oauth-implicit",
        "oauth-pword",
        "Firebase",
        "bearer",
        "api-key",
        "token-prefixed",
        "api-key-form"
      ]
    },
    "GoogleSheetsAuthType": {
      "type": "string",
      "enum": [
        "oauth-code",
        "service-account"
      ]
    },
    "NewAuthType": {
      "type": "string",
      "enum": [
        "passwordGrantFlow",
        "authorizationCodeFlow",
        "clientCredentialsFlow"
      ]
    },
    "JavascriptDatasourceConfiguration": {
      "$ref": "#/definitions/LanguageDatasourceConfiguration"
    },
    "LanguageDatasourceConfiguration": {
      "$ref": "#/definitions/DefaultDatasourceConfiguration"
    },
    "DefaultDatasourceConfiguration": {
      "$ref": "#/definitions/BaseDatasourceConfiguration"
    },
    "BaseDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "MariaDBDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "MongoDBDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "tunnel": {
          "$ref": "#/definitions/SSHAuthConfiguration"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "MySQLDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "tunnel": {
          "$ref": "#/definitions/SSHAuthConfiguration"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "OpenAiDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "bearerToken": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      },
      "required": [
        "bearerToken"
      ]
    },
    "PythonDatasourceConfiguration": {
      "$ref": "#/definitions/LanguageDatasourceConfiguration"
    },
    "RedisDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_Connection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Connection": {
      "type": "object",
      "properties": {
        "connectionType": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Connection_Url"
                },
                "case": {
                  "type": "string",
                  "const": "url"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Connection_Fields"
                },
                "case": {
                  "type": "string",
                  "const": "fields"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "connectionType"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "NOTE: (joey) this does not have to be a separate message right now 1. this follows the \"connection\" pattern 2. this lets us easily add shared connection fields in the future"
    },
    "Plugin_Connection_Url": {
      "type": "object",
      "properties": {
        "urlString": {
          "type": "string"
        }
      },
      "required": [
        "urlString"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Connection_Fields": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "databaseNumber": {
          "type": "number"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "enableSsl": {
          "type": "boolean"
        }
      },
      "required": [
        "host",
        "port",
        "enableSsl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "RedshiftDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                },
                "databaseSchema": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "RestApiDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "urlBase": {
          "type": "string"
        },
        "AuthCodeExplanation": {
          "type": "string"
        },
        "FirebaseAlert": {
          "type": "string"
        },
        "HTTPBasicAlert": {
          "type": "string"
        },
        "oauth-callback-alert": {
          "type": "string"
        },
        "oauth-connect-button": {
          "type": "string"
        },
        "oauth-revoke-shared-tokens-button": {
          "type": "string"
        },
        "OAuth2PasswordAlert": {
          "type": "string"
        },
        "openApiSpecRef": {
          "type": "string"
        },
        "openApiTenantName": {
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
        "authConfig": {
          "$ref": "#/definitions/AuthConfig"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "RestApiIntegrationDatasourceConfiguration": {
      "$ref": "#/definitions/RestApiDatasourceConfiguration"
    },
    "S3DatasourceConfiguration": {
      "$ref": "#/definitions/AWSDatasourceConfiguration"
    },
    "SnowflakeDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "okta",
            "key-pair"
          ]
        },
        "okta": {
          "type": "object",
          "properties": {
            "authenticatorUrl": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "keyPair": {
          "type": "object",
          "properties": {
            "privateKey": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "required": [
            "privateKey"
          ],
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "authentication": {
          "type": "object",
          "properties": {
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            },
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                },
                "account": {
                  "$ref": "#/definitions/Property"
                },
                "warehouse": {
                  "$ref": "#/definitions/Property"
                },
                "schema": {
                  "$ref": "#/definitions/Property"
                },
                "role": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "SuperblocksOcrDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "microsoftComputerVisionApiKey": {
          "type": "string"
        },
        "microsoftComputerVisionResourceBaseUrl": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "WorkflowDatasourceConfiguration": {
      "$ref": "#/definitions/BaseDatasourceConfiguration"
    },
    "MsSqlDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "authentication": {
          "type": "object",
          "properties": {
            "custom": {
              "type": "object",
              "properties": {
                "databaseName": {
                  "$ref": "#/definitions/Property"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "connection": {
          "type": "object",
          "properties": {
            "useSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "useSelfSignedSsl": {
              "type": [
                "boolean",
                "string"
              ]
            },
            "ca": {
              "type": "string"
            },
            "key": {
              "type": "string"
            },
            "cert": {
              "type": "string"
            },
            "mode": {
              "type": "number",
              "const": 0
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "endpoint": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number",
              "minimum": 0,
              "maximum": 65536
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "RocksetDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "apiKey": {
          "type": "string"
        },
        "baseURL": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfig"
        },
        "id": {
          "type": "string"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "$ref": "#/definitions/SemVer"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      },
      "required": [
        "apiKey"
      ]
    },
    "GoogleSheetsDatasourceConfiguration": {
      "$ref": "#/definitions/RestApiDatasourceConfiguration"
    },
    "KafkaDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "name": {
          "type": "string"
        },
        "cluster": {
          "$ref": "#/definitions/Cluster"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        },
        "superblocksMetadata": {
          "type": "object",
          "properties": {
            "pluginVersion": {
              "type": "string"
            },
            "syncedFromProfileId": {
              "type": "string"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "Cluster": {
      "type": "object",
      "properties": {
        "brokers": {
          "type": "string",
          "description": "NOTE(frank): Due to limitations in our plugin template system, we can't use an array....."
        },
        "ssl": {
          "type": "boolean"
        },
        "sasl": {
          "$ref": "#/definitions/SASL"
        }
      },
      "required": [
        "brokers",
        "ssl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SASL": {
      "type": "object",
      "properties": {
        "mechanism": {
          "$ref": "#/definitions/SASL_Mechanism"
        },
        "username": {
          "type": "string",
          "description": "non-aws fields"
        },
        "password": {
          "type": "string"
        },
        "accessKeyId": {
          "type": "string",
          "description": "aws fields"
        },
        "secretKey": {
          "type": "string"
        },
        "sessionToken": {
          "type": "string"
        },
        "authorizationIdentity": {
          "type": "string"
        }
      },
      "required": [
        "mechanism"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SASL_Mechanism": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "SalesforceDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "name": {
          "type": "string",
          "description": "Plugin fields"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_SalesforceConnection"
        },
        "authType": {
          "$ref": "#/definitions/AuthType"
        },
        "authConfig": {
          "type": "object",
          "properties": {
            "authToken": {
              "type": "string"
            },
            "useFixedPasswordCreds": {
              "type": "boolean"
            }
          },
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      }
    },
    "Plugin_SalesforceConnection": {
      "type": "object",
      "properties": {
        "instanceUrl": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/Auth"
        }
      },
      "required": [
        "instanceUrl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "children messages"
    },
    "Auth": {
      "type": "object",
      "properties": {
        "method": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/OAuth_PasswordGrantFlow"
                },
                "case": {
                  "type": "string",
                  "const": "passwordGrantFlow"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/OAuth_AuthorizationCodeFlow"
                },
                "case": {
                  "type": "string",
                  "const": "authorizationCodeFlow"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Basic"
                },
                "case": {
                  "type": "string",
                  "const": "basic"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/OAuth_ClientCredentialsFlow"
                },
                "case": {
                  "type": "string",
                  "const": "clientCredentialsFlow"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Azure_Key",
                  "description": "todo: remove me when cosmos updates"
                },
                "case": {
                  "type": "string",
                  "const": "key"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "method"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "OAuth_PasswordGrantFlow": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret",
        "tokenUrl",
        "username",
        "password",
        "audience",
        "scope"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "OAuth_AuthorizationCodeFlow": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "authUrl": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        },
        "tokenScope": {
          "type": "string"
        },
        "refreshTokenFromServer": {
          "type": "boolean"
        },
        "clientAuthMethod": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret",
        "tokenUrl",
        "authUrl",
        "audience",
        "scope",
        "tokenScope",
        "refreshTokenFromServer",
        "clientAuthMethod"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Basic": {
      "type": "object",
      "properties": {
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        }
      },
      "required": [
        "username",
        "password"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "OAuth_ClientCredentialsFlow": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string"
        },
        "clientSecret": {
          "type": "string"
        },
        "tokenUrl": {
          "type": "string"
        },
        "audience": {
          "type": "string"
        },
        "scope": {
          "type": "string"
        }
      },
      "required": [
        "clientId",
        "clientSecret",
        "tokenUrl",
        "audience",
        "scope"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SmtpDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_SmtpConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_SmtpConnection": {
      "type": "object",
      "properties": {
        "host": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "secure": {
          "type": "boolean"
        }
      },
      "required": [
        "host",
        "port",
        "username",
        "password"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AdlsDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_AdlsConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_AdlsConnection": {
      "type": "object",
      "properties": {
        "accountName": {
          "type": "string"
        },
        "tenant": {
          "type": "string"
        },
        "auth": {
          "$ref": "#/definitions/Azure"
        }
      },
      "required": [
        "accountName",
        "tenant"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "We need to repeat that it's Adls because of the schema checker that's built based off of these types. It errors out when there is a duplicate type name."
    },
    "OracleDbDatasourceConfiguration": {
      "type": "object",
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "properties": {
        "connectionType": {
          "type": "string",
          "enum": [
            "fields",
            "url"
          ]
        },
        "connectionUrl": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_OracleDbConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "required": [
        "name"
      ]
    },
    "Plugin_OracleDbConnection": {
      "type": "object",
      "properties": {
        "hostUrl": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "user": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "databaseService": {
          "type": "string"
        },
        "useTcps": {
          "type": "boolean"
        },
        "connectionType": {
          "type": "string"
        },
        "connectionUrl": {
          "type": "string"
        }
      },
      "required": [
        "hostUrl",
        "port",
        "user",
        "password",
        "databaseService",
        "useTcps",
        "connectionType",
        "connectionUrl"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DatabricksDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_DatabricksConnection"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_DatabricksConnection": {
      "type": "object",
      "properties": {
        "defaultCatalog": {
          "type": "string"
        },
        "defaultSchema": {
          "type": "string"
        },
        "hostUrl": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "connectionType": {
          "$ref": "#/definitions/Plugin_ConnectionType"
        },
        "token": {
          "type": "string",
          "description": "PAT"
        },
        "oauthClientId": {
          "type": "string",
          "description": "M2M"
        },
        "oauthClientSecret": {
          "type": "string"
        }
      },
      "required": [
        "hostUrl",
        "path",
        "port"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_ConnectionType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "CouchbaseDatasourceConfiguration": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "connection": {
          "$ref": "#/definitions/Plugin_CouchbaseConnection"
        },
        "tunnel": {
          "$ref": "#/definitions/SSHConfiguration"
        },
        "dynamicWorkflowConfiguration": {
          "$ref": "#/definitions/DynamicWorkflowConfiguration"
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_CouchbaseConnection": {
      "type": "object",
      "properties": {
        "user": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "url": {
          "type": "string"
        }
      },
      "required": [
        "user",
        "password",
        "url"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SSHConfiguration": {
      "type": "object",
      "properties": {
        "authenticationMethod": {
          "$ref": "#/definitions/SSHAuthMethod"
        },
        "enabled": {
          "type": "boolean"
        },
        "host": {
          "type": "string"
        },
        "passphrase": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "port": {
          "type": "number"
        },
        "privateKey": {
          "type": "string"
        },
        "publicKey": {
          "type": "string"
        },
        "username": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SecretStore": {
      "type": "object",
      "properties": {
        "provider": {
          "$ref": "#/definitions/Provider"
        },
        "ttl": {
          "type": "number"
        },
        "configurationId": {
          "type": "string"
        }
      },
      "required": [
        "configurationId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Provider": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/MockStore"
                },
                "case": {
                  "type": "string",
                  "const": "mock"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AkeylessSecretsManager"
                },
                "case": {
                  "type": "string",
                  "const": "akeylessSecretsManager"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AwsSecretsManager"
                },
                "case": {
                  "type": "string",
                  "const": "awsSecretsManager"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/GcpSecretManager"
                },
                "case": {
                  "type": "string",
                  "const": "gcpSecretManager"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/HashicorpVault"
                },
                "case": {
                  "type": "string",
                  "const": "hashicorpVault"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "MockStore": {
      "type": "object",
      "properties": {
        "data": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          }
        }
      },
      "required": [
        "data"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessSecretsManager": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/AkeylessAuth"
        },
        "host": {
          "type": "string"
        },
        "prefix": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessAuth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AkeylessAuth_ApiKey"
                },
                "case": {
                  "type": "string",
                  "const": "apiKey"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AkeylessAuth_Email"
                },
                "case": {
                  "type": "string",
                  "const": "email"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessAuth_ApiKey": {
      "type": "object",
      "properties": {
        "accessId": {
          "type": "string"
        },
        "accessKey": {
          "type": "string"
        }
      },
      "required": [
        "accessId",
        "accessKey"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AkeylessAuth_Email": {
      "type": "object",
      "properties": {
        "email": {
          "type": "string"
        },
        "password": {
          "type": "string"
        }
      },
      "required": [
        "email",
        "password"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsSecretsManager": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/AwsAuth"
        },
        "prefix": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsAuth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AwsAuth_Static"
                },
                "case": {
                  "type": "string",
                  "const": "static"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/AwsAuth_AssumeRole"
                },
                "case": {
                  "type": "string",
                  "const": "assumeRole"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        },
        "region": {
          "type": "string"
        }
      },
      "required": [
        "config",
        "region"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsAuth_Static": {
      "type": "object",
      "properties": {
        "accessKeyId": {
          "type": "string"
        },
        "secretAccessKey": {
          "type": "string"
        }
      },
      "required": [
        "accessKeyId",
        "secretAccessKey"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "AwsAuth_AssumeRole": {
      "type": "object",
      "properties": {
        "roleArn": {
          "type": "string"
        }
      },
      "required": [
        "roleArn"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "GcpSecretManager": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/GcpAuth"
        },
        "projectId": {
          "type": "string"
        }
      },
      "required": [
        "projectId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "GcpAuth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "type": "object",
                  "properties": {
                    "BYTES_PER_ELEMENT": {
                      "type": "number"
                    },
                    "buffer": {
                      "type": "object",
                      "properties": {
                        "byteLength": {
                          "type": "number"
                        }
                      },
                      "required": [
                        "byteLength"
                      ],
                      "additionalProperties": {
                        "not": true,
                        "errorMessage": "extra property is ${0#}"
                      }
                    },
                    "byteLength": {
                      "type": "number"
                    },
                    "byteOffset": {
                      "type": "number"
                    },
                    "length": {
                      "type": "number"
                    }
                  },
                  "required": [
                    "BYTES_PER_ELEMENT",
                    "buffer",
                    "byteLength",
                    "byteOffset",
                    "length"
                  ],
                  "additionalProperties": {
                    "type": "number"
                  }
                },
                "case": {
                  "type": "string",
                  "const": "serviceAccount"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault": {
      "type": "object",
      "properties": {
        "auth": {
          "$ref": "#/definitions/HashicorpVault_Auth"
        },
        "address": {
          "type": "string",
          "description": "The location of the vault server."
        },
        "path": {
          "type": "string",
          "description": "The path to the vault"
        },
        "namespace": {
          "type": "string",
          "description": "The Hashicorp Vault namespace."
        },
        "version": {
          "$ref": "#/definitions/HashicorpVault_Version",
          "description": "The engine version."
        },
        "secretsPath": {
          "type": "string",
          "description": "the path to the secrets"
        }
      },
      "required": [
        "address",
        "version"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault_Auth": {
      "type": "object",
      "properties": {
        "config": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string"
                },
                "case": {
                  "type": "string",
                  "const": "token"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/HashicorpVault_Auth_AppRole"
                },
                "case": {
                  "type": "string",
                  "const": "appRole"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "config"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault_Auth_AppRole": {
      "type": "object",
      "properties": {
        "roleId": {
          "type": "string"
        },
        "secretId": {
          "type": "string"
        }
      },
      "required": [
        "roleId",
        "secretId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "HashicorpVault_Version": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    }
  }
}
```

</details>

#### `/api/v3/apis/:apiId`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/GetApiResponseBody",
  "definitions": {
    "GetApiResponseBody": {
      "type": "object",
      "properties": {
        "api": {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "apiPb": {
              "type": "object"
            },
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "applicationId": {
              "type": [
                "string",
                "null"
              ]
            },
            "pageId": {
              "type": [
                "string",
                "null"
              ]
            },
            "organizationId": {
              "type": "string"
            },
            "actions": {
              "$ref": "#/definitions/Actions"
            },
            "triggerType": {
              "$ref": "#/definitions/ApiTriggerType"
            },
            "updated": {
              "anyOf": [
                {
                  "type": "number"
                },
                {
                  "type": "string",
                  "format": "date-time"
                }
              ]
            },
            "canDelete": {
              "type": "boolean"
            },
            "scheduleState": {
              "$ref": "#/definitions/ScheduleState"
            },
            "liveSchedule": {
              "$ref": "#/definitions/ScheduleConfig"
            },
            "folderId": {
              "type": [
                "string",
                "null"
              ]
            },
            "isDeployed": {
              "type": "boolean"
            },
            "deployedCommitId": {
              "type": "string"
            },
            "sendEmailOnFailure": {
              "type": "boolean"
            },
            "integrations": {
              "type": "object",
              "additionalProperties": {
                "$ref": "#/definitions/IntegrationDto"
              }
            },
            "creator": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                }
              },
              "required": [
                "id",
                "name"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "settings": {
              "$ref": "#/definitions/ApiSettings"
            },
            "repoConnection": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "created": {
                      "type": "string",
                      "format": "date-time"
                    }
                  },
                  "required": [
                    "created"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "null"
                }
              ]
            },
            "restricted": {
              "type": "boolean"
            }
          },
          "required": [
            "apiPb",
            "id",
            "name",
            "organizationId",
            "triggerType",
            "updated"
          ]
        }
      },
      "required": [
        "api"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Actions": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "triggerActionId": {
          "$ref": "#/definitions/ActionId"
        },
        "schedule": {
          "$ref": "#/definitions/ScheduleConfig"
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
            "$ref": "#/definitions/ExecutionParam"
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
          "enum": [
            "GET",
            "POST"
          ]
        },
        "workflowParams": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionParam"
          }
        },
        "workflowQueries": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/ExecutionParam"
          }
        },
        "triggerType": {
          "$ref": "#/definitions/ApiTriggerType"
        }
      },
      "required": [
        "name",
        "triggerActionId",
        "actions"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ActionId": {
      "type": "string"
    },
    "ScheduleConfig": {
      "type": "object",
      "properties": {
        "frequency": {
          "type": "number"
        },
        "interval": {
          "$ref": "#/definitions/Interval"
        },
        "time": {
          "type": "string",
          "format": "date-time"
        },
        "dayOfMonth": {
          "type": "number"
        },
        "daysOfWeek": {
          "type": "array",
          "items": {
            "type": "boolean"
          }
        },
        "timezoneLocale": {
          "type": "string"
        }
      },
      "required": [
        "frequency",
        "interval",
        "time",
        "dayOfMonth",
        "daysOfWeek",
        "timezoneLocale"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Interval": {
      "type": "string",
      "enum": [
        "minute",
        "hour",
        "day",
        "week",
        "month"
      ]
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
        "pluginId",
        "datasourceId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ActionType": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3
      ]
    },
    "ActionConfiguration": {
      "anyOf": [
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "runSql": {
              "$ref": "#/definitions/SQLExecution"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "cosmosdbAction": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_Sql"
                    },
                    "case": {
                      "type": "string",
                      "const": "sql"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_PointOperation",
                      "description": "these operations will only ever affect a single item"
                    },
                    "case": {
                      "type": "string",
                      "const": "pointOperation"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "case": {
                      "not": {}
                    },
                    "value": {
                      "not": {}
                    }
                  },
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              ],
              "description": "ideally, this would be inside the connection_type but due to our auth flow we do this."
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "action": {
              "type": "string"
            },
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "emailFrom": {
              "type": "string"
            },
            "emailTo": {
              "type": "string"
            },
            "emailCc": {
              "type": "string"
            },
            "emailBcc": {
              "type": "string"
            },
            "emailSubject": {
              "type": "string"
            },
            "emailBody": {
              "type": "string"
            },
            "emailAttachments": {
              "type": "string"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "resource": {
              "type": "string"
            },
            "action": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "prefix": {
              "type": "string"
            },
            "body": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "$ref": "#/definitions/global.Buffer"
                }
              ]
            },
            "fileObjects": {},
            "custom": {
              "type": "object",
              "additionalProperties": {
                "$ref": "#/definitions/Property"
              }
            },
            "responseType": {
              "$ref": "#/definitions/ActionResponseType"
            },
            "resourceType": {
              "$ref": "#/definitions/ActionResponseType"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "path": {
              "type": "string"
            },
            "headers": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/Property"
              }
            },
            "body": {
              "type": "string"
            },
            "custom": {
              "type": "object",
              "additionalProperties": {
                "$ref": "#/definitions/Property"
              }
            },
            "verboseHttpOutput": {
              "type": "boolean"
            },
            "doNotFailOnRequestError": {
              "type": "boolean"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "resource": {
              "type": "string"
            },
            "action": {
              "type": "string"
            },
            "pipeline": {
              "type": "string"
            },
            "projection": {
              "type": "string"
            },
            "query": {
              "type": "string"
            },
            "field": {
              "type": "string"
            },
            "sortby": {
              "type": "string"
            },
            "limit": {
              "type": "string"
            },
            "skip": {
              "type": "string"
            },
            "document": {
              "type": "string"
            },
            "replacement": {
              "type": "string"
            },
            "filter": {
              "type": "string"
            },
            "options": {
              "type": "string"
            },
            "update": {
              "type": "string"
            },
            "distinctKey": {
              "type": "string"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "action": {
              "type": "string"
            },
            "generateChatGptResponsePrompt": {
              "type": "string"
            },
            "generateChatGptResponseMessageHistory": {
              "type": "string"
            },
            "generateChatGptResponseSystemInstruction": {
              "type": "string"
            },
            "generateTextType": {
              "type": "string"
            },
            "generateTextNewTextPrompt": {
              "type": "string"
            },
            "generateTextEditTextTextToEdit": {
              "type": "string"
            },
            "generateTextEditTextPrompt": {
              "type": "string"
            },
            "generateCodeType": {
              "type": "string"
            },
            "generateCodeNewCodePrompt": {
              "type": "string"
            },
            "generateCodeEditCodeCodeToEdit": {
              "type": "string"
            },
            "generateCodeEditCodePrompt": {
              "type": "string"
            },
            "checkModerationText": {
              "type": "string"
            },
            "embeddingText": {
              "type": "string"
            },
            "generateImageMethod": {
              "type": "string"
            },
            "generateImageGenerateFromPromptPrompt": {
              "type": "string"
            },
            "generateImageGenerateFromPromptImageImageSize": {
              "type": "string"
            },
            "generateImageEditImagePrompt": {
              "type": "string"
            },
            "generateImageEditImageImageFileToEdit": {},
            "generateImageEditImageImageMask": {
              "type": "string"
            },
            "generateImageEditImageImageSizes": {
              "type": "string"
            },
            "generateImageVaryImageImageFile": {},
            "generateImageVaryImageImageSize": {
              "type": "string"
            },
            "transcribeAudioToTextAudioFile": {},
            "transcribeAudioToTextInputLanguage": {
              "type": "string"
            },
            "transcribeAudioToTextTranslateToEnglish": {
              "type": "string"
            },
            "generateChatGPTResponseAiModel": {
              "type": "string"
            },
            "generateTextNewTextAiModel": {
              "type": "string"
            },
            "generateTextEditTextAiModel": {
              "type": "string"
            },
            "generateCodeNewCodeAiModel": {
              "type": "string"
            },
            "generateCodeEditCodeAiModel": {
              "type": "string"
            },
            "checkModerationAiModel": {
              "type": "string"
            },
            "generateTextEmbeddingAiModel": {
              "type": "string"
            },
            "transcribeAudioToTextAiModel": {
              "type": "string"
            },
            "generateChatGptResponseMaxTokens": {
              "type": "string"
            },
            "generateTextNewTextMaxTokens": {
              "type": "string"
            },
            "temperature": {
              "type": "string"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "commandType": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_Raw"
                    },
                    "case": {
                      "type": "string",
                      "const": "raw"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_Structured"
                    },
                    "case": {
                      "type": "string",
                      "const": "structured"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "case": {
                      "not": {}
                    },
                    "value": {
                      "not": {}
                    }
                  },
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              ]
            },
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "path": {
              "type": "string"
            },
            "httpMethod": {
              "$ref": "#/definitions/HttpMethod"
            },
            "responseType": {
              "$ref": "#/definitions/ActionResponseType"
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
            "bodyType": {
              "$ref": "#/definitions/RestApiBodyDataType"
            },
            "body": {
              "type": "string"
            },
            "formData": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/Property"
              }
            },
            "fileFormKey": {
              "type": "string"
            },
            "fileName": {
              "type": "string"
            },
            "verboseHttpOutput": {
              "type": "boolean"
            },
            "doNotFailOnRequestError": {
              "type": "boolean"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "urlBase": {
              "type": "string"
            },
            "urlPath": {
              "type": "string"
            },
            "authType": {
              "$ref": "#/definitions/IntegrationAuthType"
            },
            "openApiAction": {
              "type": "string"
            },
            "openApiSpecRef": {
              "type": "string"
            },
            "openApiTenantName": {
              "type": "string"
            },
            "httpMethod": {
              "$ref": "#/definitions/HttpMethod"
            },
            "responseType": {
              "$ref": "#/definitions/ActionResponseType"
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
            "bodyType": {
              "$ref": "#/definitions/RestApiBodyDataType"
            },
            "body": {
              "type": "string"
            },
            "formData": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/Property"
              }
            },
            "fileFormKey": {
              "type": "string"
            },
            "fileName": {
              "type": "string"
            },
            "verboseHttpOutput": {
              "type": "boolean"
            },
            "doNotFailOnRequestError": {
              "type": "boolean"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "resource": {
              "type": "string"
            },
            "action": {
              "type": "string"
            },
            "path": {
              "type": "string"
            },
            "body": {
              "type": "string"
            },
            "fileObjects": {},
            "custom": {
              "type": "object",
              "additionalProperties": {
                "$ref": "#/definitions/Property"
              }
            },
            "responseType": {
              "$ref": "#/definitions/ActionResponseType"
            },
            "listFilesConfig": {
              "type": "object",
              "properties": {
                "prefix": {
                  "type": "string"
                },
                "delimiter": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "body": {
              "type": "string"
            },
            "usePreparedSql": {
              "type": "boolean"
            },
            "operation": {
              "type": "string"
            },
            "useAdvancedMatching": {
              "type": "string",
              "enum": [
                "auto",
                "advanced"
              ]
            },
            "schema": {
              "type": "string"
            },
            "table": {
              "type": "string"
            },
            "oldValues": {},
            "insertedRows": {},
            "newValues": {},
            "deletedRows": {},
            "filterBy": {},
            "mappingMode": {
              "type": "string",
              "enum": [
                "auto",
                "manual"
              ]
            },
            "mappedColumns": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "json": {
                    "type": "string"
                  },
                  "sql": {
                    "type": "string"
                  }
                },
                "required": [
                  "json",
                  "sql"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "action": {
              "type": "string"
            },
            "file": {},
            "fileUrl": {
              "type": "string"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "salesforceAction": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_Soql"
                    },
                    "case": {
                      "type": "string",
                      "const": "soql"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_Crud"
                    },
                    "case": {
                      "type": "string",
                      "const": "crud"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_Bulk"
                    },
                    "case": {
                      "type": "string",
                      "const": "bulk"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "case": {
                      "not": {}
                    },
                    "value": {
                      "not": {}
                    }
                  },
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              ]
            },
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "workflow": {
              "type": "string"
            },
            "custom": {
              "type": "object",
              "additionalProperties": {
                "$ref": "#/definitions/Property"
              }
            },
            "queryParams": {
              "type": "object",
              "additionalProperties": {
                "type": "object",
                "properties": {
                  "value": {}
                },
                "required": [
                  "value"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "action": {
              "$ref": "#/definitions/GoogleSheetsActionType"
            },
            "spreadsheetId": {
              "type": "string"
            },
            "sheetTitle": {
              "type": "string"
            },
            "range": {
              "type": "string"
            },
            "rowNumber": {
              "type": "string",
              "description": "a string containing an integer"
            },
            "extractFirstRowHeader": {
              "type": "boolean"
            },
            "headerRowNumber": {
              "type": "string",
              "description": "a string containing an integer"
            },
            "format": {
              "$ref": "#/definitions/GoogleSheetsFormatType"
            },
            "data": {
              "type": "string"
            },
            "preserveHeaderRow": {
              "type": "boolean"
            },
            "includeHeaderRow": {
              "type": "boolean"
            },
            "writeToDestinationType": {
              "$ref": "#/definitions/GoogleSheetsDestinationType"
            },
            "pageToken": {
              "type": "string",
              "description": "used by metadata to fetch spreadsheets with pagination"
            },
            "keyword": {
              "type": "string",
              "description": "used by metadata to fetch spreadsheets with keyword"
            },
            "addSheet": {
              "type": "object",
              "properties": {
                "sheetTitle": {
                  "type": "string"
                },
                "rowCount": {
                  "type": "string"
                },
                "columnCount": {
                  "type": "string"
                }
              },
              "required": [
                "sheetTitle"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "operation": {
              "$ref": "#/definitions/Operation"
            },
            "produce": {
              "$ref": "#/definitions/Plugin_Produce"
            },
            "consume": {
              "$ref": "#/definitions/Plugin_Consume"
            },
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "operationType": {
              "$ref": "#/definitions/Plugin_OperationType"
            },
            "put": {
              "$ref": "#/definitions/Plugin_KinesisPut"
            },
            "get": {
              "$ref": "#/definitions/Plugin_KinesisGet"
            },
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "from": {
              "type": "string"
            },
            "replyTo": {
              "type": "string"
            },
            "to": {
              "type": "string"
            },
            "cc": {
              "type": "string"
            },
            "bcc": {
              "type": "string"
            },
            "subject": {
              "type": "string"
            },
            "body": {
              "type": "string"
            },
            "attachments": {
              "type": "string",
              "description": "stringified representation of a JSON array of objects with fields content, name, and type"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "adlsAction": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_CreateContainer"
                    },
                    "case": {
                      "type": "string",
                      "const": "createContainer"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_CreateDirectory"
                    },
                    "case": {
                      "type": "string",
                      "const": "createDirectory"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_RenameDirectory"
                    },
                    "case": {
                      "type": "string",
                      "const": "renameDirectory"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_DeleteDirectory"
                    },
                    "case": {
                      "type": "string",
                      "const": "deleteDirectory"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_ListDirectoryContents"
                    },
                    "case": {
                      "type": "string",
                      "const": "listDirectoryContents"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_UploadFile"
                    },
                    "case": {
                      "type": "string",
                      "const": "uploadFile"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_DownloadFile"
                    },
                    "case": {
                      "type": "string",
                      "const": "downloadFile"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_DeleteFile"
                    },
                    "case": {
                      "type": "string",
                      "const": "deleteFile"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "case": {
                      "not": {}
                    },
                    "value": {
                      "not": {}
                    }
                  },
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              ]
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "runSql": {
              "$ref": "#/definitions/SQLExecution"
            },
            "bulkEdit": {
              "$ref": "#/definitions/SQLBulkEdit"
            },
            "operation": {
              "$ref": "#/definitions/SQLOperation"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "operation": {
              "$ref": "#/definitions/SQLOperation"
            },
            "runSql": {
              "$ref": "#/definitions/SQLExecution"
            },
            "bulkEdit": {
              "$ref": "#/definitions/SQLBulkEdit"
            },
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          },
          "properties": {
            "dynamicWorkflowConfiguration": {
              "$ref": "#/definitions/DynamicWorkflowConfiguration"
            },
            "bucketName": {
              "type": "string",
              "description": "used for all couchbase actions"
            },
            "couchbaseAction": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/SQLExecution"
                    },
                    "case": {
                      "type": "string",
                      "const": "runSql"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_CouchbaseInsert"
                    },
                    "case": {
                      "type": "string",
                      "const": "insert"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_CouchbaseGet"
                    },
                    "case": {
                      "type": "string",
                      "const": "get"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "value": {
                      "$ref": "#/definitions/Plugin_CouchbaseRemove"
                    },
                    "case": {
                      "type": "string",
                      "const": "remove"
                    }
                  },
                  "required": [
                    "value",
                    "case"
                  ],
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                },
                {
                  "type": "object",
                  "properties": {
                    "case": {
                      "not": {}
                    },
                    "value": {
                      "not": {}
                    }
                  },
                  "additionalProperties": {
                    "not": true,
                    "errorMessage": "extra property is ${0#}"
                  }
                }
              ]
            },
            "superblocksMetadata": {
              "type": "object",
              "properties": {
                "pluginVersion": {
                  "$ref": "#/definitions/SemVer"
                },
                "syncedFromProfileId": {
                  "type": "string"
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          }
        }
      ]
    },
    "SQLExecution": {
      "type": "object",
      "properties": {
        "sqlBody": {
          "type": "string"
        },
        "useParameterized": {
          "type": "boolean"
        }
      },
      "required": [
        "sqlBody",
        "useParameterized"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SemVer": {
      "type": "string"
    },
    "Plugin_Sql": {
      "type": "object",
      "properties": {
        "action": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Sql_Singleton"
                },
                "case": {
                  "type": "string",
                  "const": "singleton"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "action"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "Action Fields"
    },
    "Plugin_Sql_Singleton": {
      "type": "object",
      "properties": {
        "containerId": {
          "type": "string"
        },
        "query": {
          "type": "string"
        },
        "crossPartition": {
          "type": "boolean"
        },
        "partitionKey": {
          "type": "string"
        }
      },
      "required": [
        "containerId",
        "query",
        "crossPartition"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L87"
    },
    "Plugin_PointOperation": {
      "type": "object",
      "properties": {
        "containerId": {
          "type": "string"
        },
        "action": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_PointOperation_Read"
                },
                "case": {
                  "type": "string",
                  "const": "read"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_PointOperation_Replace"
                },
                "case": {
                  "type": "string",
                  "const": "replace"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_PointOperation_Upsert"
                },
                "case": {
                  "type": "string",
                  "const": "upsert"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_PointOperation_Delete"
                },
                "case": {
                  "type": "string",
                  "const": "delete"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_PointOperation_Create"
                },
                "case": {
                  "type": "string",
                  "const": "create"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "containerId",
        "action"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_PointOperation_Read": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "partitionKey": {
          "type": "string"
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L78"
    },
    "Plugin_PointOperation_Replace": {
      "type": "object",
      "properties": {
        "body": {
          "type": "string"
        },
        "partitionKey": {
          "type": "string"
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L128"
    },
    "Plugin_PointOperation_Upsert": {
      "type": "object",
      "properties": {
        "body": {
          "type": "string"
        },
        "partitionKey": {
          "type": "string"
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L355"
    },
    "Plugin_PointOperation_Delete": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "partitionKey": {
          "type": "string"
        }
      },
      "required": [
        "id"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Item.ts#L196"
    },
    "Plugin_PointOperation_Create": {
      "type": "object",
      "properties": {
        "body": {
          "type": "string"
        },
        "partitionKey": {
          "type": "string"
        }
      },
      "required": [
        "body"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/cosmosdb/cosmos/src/client/Item/Items.ts#L295"
    },
    "global.Buffer": {
      "type": "object",
      "additionalProperties": {
        "type": "number"
      },
      "properties": {
        "BYTES_PER_ELEMENT": {
          "type": "number"
        },
        "buffer": {
          "type": "object",
          "properties": {
            "byteLength": {
              "type": "number"
            }
          },
          "required": [
            "byteLength"
          ],
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        },
        "byteLength": {
          "type": "number"
        },
        "byteOffset": {
          "type": "number"
        },
        "length": {
          "type": "number"
        }
      },
      "required": [
        "BYTES_PER_ELEMENT",
        "buffer",
        "byteLength",
        "byteOffset",
        "length"
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
        "system": {
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ActionResponseType": {
      "type": "string",
      "enum": [
        "auto",
        "json",
        "text",
        "binary",
        "raw"
      ]
    },
    "Plugin_Raw": {
      "type": "object",
      "properties": {
        "action": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Raw_Singleton"
                },
                "case": {
                  "type": "string",
                  "const": "singleton"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "action"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Raw_Singleton": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string"
        }
      },
      "required": [
        "query"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Structured": {
      "type": "object",
      "properties": {
        "action": {
          "anyOf": [
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Get"
                },
                "case": {
                  "type": "string",
                  "const": "get"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Set"
                },
                "case": {
                  "type": "string",
                  "const": "set"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Del"
                },
                "case": {
                  "type": "string",
                  "const": "del"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Keys"
                },
                "case": {
                  "type": "string",
                  "const": "keys"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Mget"
                },
                "case": {
                  "type": "string",
                  "const": "mget"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hget"
                },
                "case": {
                  "type": "string",
                  "const": "hget"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hmget"
                },
                "case": {
                  "type": "string",
                  "const": "hmget"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hgetall"
                },
                "case": {
                  "type": "string",
                  "const": "hgetall"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hset"
                },
                "case": {
                  "type": "string",
                  "const": "hset"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hsetnx"
                },
                "case": {
                  "type": "string",
                  "const": "hsetnx"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hlen"
                },
                "case": {
                  "type": "string",
                  "const": "hlen"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hdel"
                },
                "case": {
                  "type": "string",
                  "const": "hdel"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hkeys"
                },
                "case": {
                  "type": "string",
                  "const": "hkeys"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Hvals"
                },
                "case": {
                  "type": "string",
                  "const": "hvals"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Lindex"
                },
                "case": {
                  "type": "string",
                  "const": "lindex"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Llen"
                },
                "case": {
                  "type": "string",
                  "const": "llen"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Lpush"
                },
                "case": {
                  "type": "string",
                  "const": "lpush"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Lrem"
                },
                "case": {
                  "type": "string",
                  "const": "lrem"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Lrange"
                },
                "case": {
                  "type": "string",
                  "const": "lrange"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Sadd"
                },
                "case": {
                  "type": "string",
                  "const": "sadd"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Scard"
                },
                "case": {
                  "type": "string",
                  "const": "scard"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Smembers"
                },
                "case": {
                  "type": "string",
                  "const": "smembers"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Sismember"
                },
                "case": {
                  "type": "string",
                  "const": "sismember"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Srandmember"
                },
                "case": {
                  "type": "string",
                  "const": "srandmember"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Srem"
                },
                "case": {
                  "type": "string",
                  "const": "srem"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Zadd"
                },
                "case": {
                  "type": "string",
                  "const": "zadd"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Zcard"
                },
                "case": {
                  "type": "string",
                  "const": "zcard"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Zcount"
                },
                "case": {
                  "type": "string",
                  "const": "zcount"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Zrange"
                },
                "case": {
                  "type": "string",
                  "const": "zrange"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Zrank"
                },
                "case": {
                  "type": "string",
                  "const": "zrank"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Zrem"
                },
                "case": {
                  "type": "string",
                  "const": "zrem"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Zscore"
                },
                "case": {
                  "type": "string",
                  "const": "zscore"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Expire"
                },
                "case": {
                  "type": "string",
                  "const": "expire"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "value": {
                  "$ref": "#/definitions/Plugin_Ttl"
                },
                "case": {
                  "type": "string",
                  "const": "ttl"
                }
              },
              "required": [
                "value",
                "case"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            {
              "type": "object",
              "properties": {
                "case": {
                  "not": {}
                },
                "value": {
                  "not": {}
                }
              },
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            }
          ]
        }
      },
      "required": [
        "action"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Get": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Set": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "expirationMs": {
          "type": "number"
        }
      },
      "required": [
        "key",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Del": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Keys": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string"
        }
      },
      "required": [
        "pattern"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Mget": {
      "type": "object",
      "properties": {
        "keys": {
          "type": "string",
          "description": "comma-separated list"
        }
      },
      "required": [
        "keys"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hget": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "field": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "field"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hmget": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "fields": {
          "type": "string",
          "description": "comma-separated list"
        }
      },
      "required": [
        "key",
        "fields"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hgetall": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hset": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "field": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "field",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hsetnx": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "field": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "field",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hlen": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hdel": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "field": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "field"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hkeys": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Hvals": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Lindex": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "index": {
          "type": "number"
        }
      },
      "required": [
        "key",
        "index"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Llen": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Lpush": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Lrem": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "count": {
          "type": "number"
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "count",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Lrange": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "start": {
          "type": "number"
        },
        "stop": {
          "type": "number"
        }
      },
      "required": [
        "key",
        "start",
        "stop"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Sadd": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "member": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "member"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Scard": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Smembers": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Sismember": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "member": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "member"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Srandmember": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "count": {
          "type": "number"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Srem": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "member": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "member"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Zadd": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "score": {
          "type": "number"
        },
        "member": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "score",
        "member"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "TODO: (joey) support options as well: https://redis.io/commands/zadd/"
    },
    "Plugin_Zcard": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Zcount": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "min": {
          "type": "number"
        },
        "max": {
          "type": "number"
        }
      },
      "required": [
        "key",
        "min",
        "max"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Zrange": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "start": {
          "type": "number"
        },
        "stop": {
          "type": "number"
        }
      },
      "required": [
        "key",
        "start",
        "stop"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Zrank": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "member": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "member"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "TODO: (joey) add optional withscore"
    },
    "Plugin_Zrem": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "member": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "member"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Zscore": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "member": {
          "type": "string"
        }
      },
      "required": [
        "key",
        "member"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Expire": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "seconds": {
          "type": "number"
        },
        "option": {
          "$ref": "#/definitions/Plugin_Expire_Option"
        }
      },
      "required": [
        "key",
        "seconds"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Expire_Option": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "Plugin_Ttl": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "DynamicWorkflowConfiguration": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "workflowId": {
          "type": "string"
        }
      },
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
    "RestApiBodyDataType": {
      "type": "string",
      "enum": [
        "jsonBody",
        "rawBody",
        "formData",
        "fileForm"
      ]
    },
    "IntegrationAuthType": {
      "type": "string",
      "enum": [
        "None",
        "basic",
        "oauth-code",
        "oauth-client-cred",
        "oauth-implicit",
        "oauth-pword",
        "Firebase",
        "bearer",
        "api-key",
        "token-prefixed",
        "api-key-form"
      ]
    },
    "Plugin_Soql": {
      "type": "object",
      "properties": {
        "sqlBody": {
          "type": "string"
        },
        "action": {
          "$ref": "#/definitions/Plugin_Soql_SoqlAction"
        }
      },
      "required": [
        "sqlBody",
        "action"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "Action Fields"
    },
    "Plugin_Soql_SoqlAction": {
      "type": "number",
      "enum": [
        0,
        1
      ],
      "description": "Specified for singleton types."
    },
    "Plugin_Crud": {
      "type": "object",
      "properties": {
        "resourceType": {
          "type": "string"
        },
        "action": {
          "$ref": "#/definitions/Plugin_Crud_CrudAction"
        },
        "resourceBody": {
          "type": "string",
          "description": "delete doesn't require body, other actions do"
        },
        "resourceId": {
          "type": "string",
          "description": "delete requires resource_id, other actions don't"
        }
      },
      "required": [
        "resourceType",
        "action",
        "resourceBody",
        "resourceId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Crud_CrudAction": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "Plugin_Bulk": {
      "type": "object",
      "properties": {
        "resourceType": {
          "type": "string"
        },
        "action": {
          "$ref": "#/definitions/Plugin_Bulk_BulkAction"
        },
        "resourceBody": {
          "type": "string",
          "description": "delete and update require Id, which will be part of body"
        },
        "externalId": {
          "type": "string",
          "description": "only used for upsert https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/walkthrough_upsert.htm"
        }
      },
      "required": [
        "resourceType",
        "action",
        "resourceBody",
        "externalId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Bulk_BulkAction": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "GoogleSheetsActionType": {
      "type": "string",
      "enum": [
        "CREATE_WORKSHEET",
        "READ_SPREADSHEET",
        "READ_SPREADSHEET_RANGE",
        "APPEND_SPREADSHEET",
        "CREATE_SPREADSHEET_ROWS",
        "CLEAR_SPREADSHEET"
      ]
    },
    "GoogleSheetsFormatType": {
      "type": "string",
      "enum": [
        "EFFECTIVE_VALUE",
        "USER_ENTERED_VALUE",
        "FORMATTED_VALUE"
      ]
    },
    "GoogleSheetsDestinationType": {
      "type": "string",
      "enum": [
        "ROW_NUMBER",
        "APPEND"
      ]
    },
    "Operation": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "Plugin_Produce": {
      "type": "object",
      "properties": {
        "acks": {
          "$ref": "#/definitions/Acks"
        },
        "clientId": {
          "type": "string"
        },
        "timeout": {
          "type": "number"
        },
        "compression": {
          "$ref": "#/definitions/Compression"
        },
        "transactionId": {
          "type": "string"
        },
        "autoCreateTopic": {
          "type": "boolean"
        },
        "idempotent": {
          "type": "boolean"
        },
        "transaction": {
          "type": "boolean"
        },
        "messages": {
          "type": "string"
        }
      },
      "required": [
        "acks",
        "autoCreateTopic",
        "idempotent",
        "transaction",
        "messages"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Acks": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3
      ]
    },
    "Compression": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    "Plugin_Consume": {
      "type": "object",
      "properties": {
        "from": {
          "$ref": "#/definitions/Plugin_Consume_From"
        },
        "topic": {
          "type": "string",
          "description": "NOTE(frank): SMH. Because our form template system if VERY limited, there no way to send an array to the backend if we take in one topic in the UI."
        },
        "groupId": {
          "type": "string"
        },
        "clientId": {
          "type": "string"
        },
        "seek": {
          "$ref": "#/definitions/Plugin_Consume_Seek",
          "description": "NOTE(frank): Another instance of template system limitations..."
        },
        "readUncommitted": {
          "type": "boolean"
        }
      },
      "required": [
        "from",
        "topic",
        "readUncommitted"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_Consume_From": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3
      ]
    },
    "Plugin_Consume_Seek": {
      "type": "object",
      "properties": {
        "topic": {
          "type": "string"
        },
        "offset": {
          "type": "number"
        },
        "partition": {
          "type": "number"
        }
      },
      "required": [
        "topic",
        "offset",
        "partition"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_OperationType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "Plugin_KinesisPut": {
      "type": "object",
      "properties": {
        "data": {
          "type": "string"
        },
        "partitionKey": {
          "type": "string"
        },
        "streamIdentifierType": {
          "$ref": "#/definitions/Plugin_StreamIdentifier"
        },
        "streamName": {
          "type": "string"
        },
        "streamArn": {
          "type": "string"
        }
      },
      "required": [
        "data",
        "partitionKey",
        "streamIdentifierType"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecord.html https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html"
    },
    "Plugin_StreamIdentifier": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "Plugin_KinesisGet": {
      "type": "object",
      "properties": {
        "shardId": {
          "type": "string"
        },
        "shardIteratorType": {
          "$ref": "#/definitions/Plugin_ShardIteratorType"
        },
        "limit": {
          "type": "number"
        },
        "pollingCooldownMs": {
          "type": "number",
          "description": "not required by kinesis, but something we want to allow users to configure this is the amount of time in milliseconds between asking kinesis to get records when polling in a loop"
        },
        "startingSequenceNumber": {
          "type": "string",
          "description": "these 2 are required depending on the shard iterator type selected"
        },
        "timestamp": {
          "type": "string"
        },
        "streamIdentifierType": {
          "$ref": "#/definitions/Plugin_StreamIdentifier"
        },
        "streamName": {
          "type": "string"
        },
        "streamArn": {
          "type": "string"
        }
      },
      "required": [
        "shardId",
        "shardIteratorType",
        "limit",
        "pollingCooldownMs",
        "streamIdentifierType"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetRecords.html we will need to get a shard iterator first https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetShardIterator.html"
    },
    "Plugin_ShardIteratorType": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "description": "https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetShardIterator.html#API_GetShardIterator_RequestSyntax"
    },
    "Plugin_CreateContainer": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "Actions"
    },
    "Plugin_CreateDirectory": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        },
        "path": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem",
        "path"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_RenameDirectory": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "newPath": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem",
        "path",
        "newPath"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_DeleteDirectory": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        },
        "path": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem",
        "path"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_ListDirectoryContents": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        },
        "path": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem",
        "path"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_UploadFile": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        },
        "path": {
          "type": "string"
        },
        "content": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem",
        "path",
        "content"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_DownloadFile": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        },
        "path": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem",
        "path"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_DeleteFile": {
      "type": "object",
      "properties": {
        "fileSystem": {
          "type": "string"
        },
        "path": {
          "type": "string"
        }
      },
      "required": [
        "fileSystem",
        "path"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SQLBulkEdit": {
      "type": "object",
      "properties": {
        "matchingMode": {
          "$ref": "#/definitions/SQLMatchingMode"
        },
        "schema": {
          "type": "string"
        },
        "table": {
          "type": "string"
        },
        "updatedRows": {
          "type": "string"
        },
        "oldRows": {
          "type": "string"
        },
        "filterBy": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "mappingMode": {
          "$ref": "#/definitions/SQLMappingMode"
        },
        "mappedColumns": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/SQLMappedColumns"
          }
        },
        "insertedRows": {
          "type": "string"
        },
        "deletedRows": {
          "type": "string"
        }
      },
      "required": [
        "filterBy",
        "mappedColumns"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SQLMatchingMode": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "SQLMappingMode": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "SQLMappedColumns": {
      "type": "object",
      "properties": {
        "json": {
          "type": "string"
        },
        "sql": {
          "type": "string"
        }
      },
      "required": [
        "json",
        "sql"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SQLOperation": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "Plugin_CouchbaseInsert": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {
          "type": "string"
        },
        "identifier": {
          "$ref": "#/definitions/Plugin_CouchbaseIdentifier"
        }
      },
      "required": [
        "key",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_CouchbaseIdentifier": {
      "type": "object",
      "properties": {
        "scope": {
          "type": "string"
        },
        "collection": {
          "type": "string"
        }
      },
      "required": [
        "scope",
        "collection"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_CouchbaseGet": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "identifier": {
          "$ref": "#/definitions/Plugin_CouchbaseIdentifier"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Plugin_CouchbaseRemove": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "identifier": {
          "$ref": "#/definitions/Plugin_CouchbaseIdentifier"
        }
      },
      "required": [
        "key"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ExecutionParam": {
      "type": "object",
      "properties": {
        "key": {
          "type": "string"
        },
        "value": {}
      },
      "required": [
        "key",
        "value"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ApiTriggerType": {
      "type": "number",
      "enum": [
        0,
        1,
        2
      ]
    },
    "ScheduleState": {
      "type": "number",
      "enum": [
        0,
        1
      ]
    },
    "IntegrationDto": {
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
        "isUserConfigured": {
          "type": "boolean"
        },
        "demoIntegrationId": {
          "type": "string"
        },
        "kind": {
          "$ref": "#/definitions/IntegrationKind"
        },
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "updated": {
          "type": "string",
          "format": "date-time"
        },
        "configurations": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/IntegrationConfigurationDto"
          }
        },
        "slug": {
          "type": "string"
        },
        "ownerEmail": {
          "type": "string"
        }
      },
      "required": [
        "configurations",
        "created",
        "id",
        "isUserConfigured",
        "kind",
        "name",
        "organizationId",
        "pluginId",
        "updated"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "IntegrationKind": {
      "type": "string",
      "enum": [
        "SECRET",
        "PLUGIN"
      ]
    },
    "IntegrationConfigurationDto": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "created": {
          "type": "string",
          "format": "date-time"
        },
        "integrationId": {
          "type": "string"
        },
        "configuration": {
          "type": "object"
        },
        "isDefault": {
          "type": "boolean"
        },
        "profileIds": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "profileNames": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "id",
        "created",
        "integrationId",
        "configuration",
        "isDefault"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ApiSettings": {
      "$ref": "#/definitions/EntityProfileSettings"
    },
    "EntityProfileSettings": {
      "type": "object",
      "properties": {
        "profiles": {
          "type": "object",
          "properties": {
            "editor": {
              "$ref": "#/definitions/EntityModeProfileSettings"
            },
            "preview": {
              "$ref": "#/definitions/EntityModeProfileSettings"
            },
            "deployed": {
              "$ref": "#/definitions/EntityModeProfileSettings"
            }
          },
          "required": [
            "editor",
            "deployed"
          ],
          "additionalProperties": {
            "not": true,
            "errorMessage": "extra property is ${0#}"
          }
        }
      },
      "required": [
        "profiles"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "EntityModeProfileSettings": {
      "type": "object",
      "properties": {
        "availableProfileIds": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "defaultProfileId": {
          "type": "string"
        }
      },
      "required": [
        "availableProfileIds",
        "defaultProfileId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    }
  }
}
```

</details>

#### `/api/v3/apis/signatures`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PutApiSignaturesRequestBody",
  "definitions": {
    "PutApiSignaturesRequestBody": {
      "type": "object",
      "properties": {
        "updates": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/UpdateApiSignature"
          }
        }
      },
      "required": [
        "updates"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "UpdateApiSignature": {
      "type": "object",
      "properties": {
        "apiId": {
          "type": "string"
        },
        "commitId": {
          "$ref": "#/definitions/CommitId"
        },
        "branchName": {
          "$ref": "#/definitions/BranchName"
        },
        "signature": {
          "$ref": "#/definitions/Signature"
        },
        "errors": {
          "$ref": "#/definitions/SignatureRotationErrors"
        },
        "updated": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "apiId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "CommitId": {
      "type": "object",
      "properties": {
        "commitId": {
          "type": "string"
        }
      },
      "required": [
        "commitId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BranchName": {
      "type": "object",
      "properties": {
        "branchName": {
          "type": "string"
        }
      },
      "required": [
        "branchName"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Signature": {
      "type": "object",
      "properties": {
        "keyId": {
          "type": "string",
          "description": "The id of the key used to sign the data."
        },
        "data": {
          "type": "string",
          "description": "The actual signature, in base64."
        },
        "publicKey": {
          "type": "string",
          "description": "The public key for the key used to sign the data, in base64."
        },
        "algorithm": {
          "type": "string",
          "description": "The algorithm used to sign the data."
        }
      },
      "required": [
        "keyId",
        "data"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "A signature, as produced by the agent."
    },
    "SignatureRotationErrors": {
      "type": "object",
      "properties": {
        "errors": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/SignatureRotationError"
          }
        },
        "keyId": {
          "type": "string"
        },
        "publicKey": {
          "type": "object",
          "properties": {
            "BYTES_PER_ELEMENT": {
              "type": "number"
            },
            "buffer": {
              "type": "object",
              "properties": {
                "byteLength": {
                  "type": "number"
                }
              },
              "required": [
                "byteLength"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "byteLength": {
              "type": "number"
            },
            "byteOffset": {
              "type": "number"
            },
            "length": {
              "type": "number"
            }
          },
          "required": [
            "BYTES_PER_ELEMENT",
            "buffer",
            "byteLength",
            "byteOffset",
            "length"
          ],
          "additionalProperties": {
            "type": "number"
          }
        },
        "algorithm": {
          "type": "string"
        }
      },
      "required": [
        "errors",
        "keyId",
        "publicKey",
        "algorithm"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SignatureRotationError": {
      "type": "object",
      "properties": {
        "message": {
          "type": "string"
        }
      },
      "required": [
        "message"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
  "$ref": "#/definitions/PutApiSignaturesResponseBody",
  "definitions": {
    "PutApiSignaturesResponseBody": {
      "type": "object",
      "properties": {
        "statuses": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/UpdateApiSignatureStatus"
          }
        }
      },
      "required": [
        "statuses"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "UpdateApiSignatureStatus": {
      "type": "object",
      "properties": {
        "apiId": {
          "type": "string"
        },
        "commitId": {
          "$ref": "#/definitions/CommitId"
        },
        "branchName": {
          "$ref": "#/definitions/BranchName"
        },
        "code": {
          "type": "number"
        },
        "message": {
          "type": "string"
        },
        "error": {
          "$ref": "#/definitions/V1Error"
        }
      },
      "required": [
        "apiId",
        "code",
        "message",
        "error"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "CommitId": {
      "type": "object",
      "properties": {
        "commitId": {
          "type": "string"
        }
      },
      "required": [
        "commitId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BranchName": {
      "type": "object",
      "properties": {
        "branchName": {
          "type": "string"
        }
      },
      "required": [
        "branchName"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "V1Error": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "message": {
          "type": "string"
        },
        "handled": {
          "type": "boolean"
        },
        "blockPath": {
          "type": "string"
        },
        "formPath": {
          "type": "string"
        },
        "code": {
          "$ref": "#/definitions/Code"
        }
      },
      "required": [
        "name",
        "message",
        "handled",
        "blockPath",
        "formPath",
        "code"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Code": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ]
    }
  }
}
```

</details>

#### `/api/v2/applications/signatures`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PutApplicationSignaturesRequestBody",
  "definitions": {
    "PutApplicationSignaturesRequestBody": {
      "type": "object",
      "properties": {
        "updates": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/UpdateApplicationSignature"
          }
        }
      },
      "required": [
        "updates"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "UpdateApplicationSignature": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string"
        },
        "commitId": {
          "$ref": "#/definitions/CommitId"
        },
        "branchName": {
          "$ref": "#/definitions/BranchName"
        },
        "signature": {
          "$ref": "#/definitions/Signature"
        },
        "errors": {
          "$ref": "#/definitions/SignatureRotationErrors"
        },
        "updated": {
          "type": "string",
          "format": "date-time"
        },
        "pageVersion": {
          "type": "number"
        }
      },
      "required": [
        "applicationId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "CommitId": {
      "type": "object",
      "properties": {
        "commitId": {
          "type": "string"
        }
      },
      "required": [
        "commitId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BranchName": {
      "type": "object",
      "properties": {
        "branchName": {
          "type": "string"
        }
      },
      "required": [
        "branchName"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Signature": {
      "type": "object",
      "properties": {
        "keyId": {
          "type": "string",
          "description": "The id of the key used to sign the data."
        },
        "data": {
          "type": "string",
          "description": "The actual signature, in base64."
        },
        "publicKey": {
          "type": "string",
          "description": "The public key for the key used to sign the data, in base64."
        },
        "algorithm": {
          "type": "string",
          "description": "The algorithm used to sign the data."
        }
      },
      "required": [
        "keyId",
        "data"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "A signature, as produced by the agent."
    },
    "SignatureRotationErrors": {
      "type": "object",
      "properties": {
        "errors": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/SignatureRotationError"
          }
        },
        "keyId": {
          "type": "string"
        },
        "publicKey": {
          "type": "object",
          "properties": {
            "BYTES_PER_ELEMENT": {
              "type": "number"
            },
            "buffer": {
              "type": "object",
              "properties": {
                "byteLength": {
                  "type": "number"
                }
              },
              "required": [
                "byteLength"
              ],
              "additionalProperties": {
                "not": true,
                "errorMessage": "extra property is ${0#}"
              }
            },
            "byteLength": {
              "type": "number"
            },
            "byteOffset": {
              "type": "number"
            },
            "length": {
              "type": "number"
            }
          },
          "required": [
            "BYTES_PER_ELEMENT",
            "buffer",
            "byteLength",
            "byteOffset",
            "length"
          ],
          "additionalProperties": {
            "type": "number"
          }
        },
        "algorithm": {
          "type": "string"
        }
      },
      "required": [
        "errors",
        "keyId",
        "publicKey",
        "algorithm"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "SignatureRotationError": {
      "type": "object",
      "properties": {
        "message": {
          "type": "string"
        }
      },
      "required": [
        "message"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
  "$ref": "#/definitions/PutApplicationSignaturesResponseBody",
  "definitions": {
    "PutApplicationSignaturesResponseBody": {
      "type": "object",
      "properties": {
        "statuses": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/UpdateApplicationSignatureStatus"
          }
        }
      },
      "required": [
        "statuses"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "UpdateApplicationSignatureStatus": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string"
        },
        "commitId": {
          "$ref": "#/definitions/CommitId"
        },
        "branchName": {
          "$ref": "#/definitions/BranchName"
        },
        "code": {
          "type": "number"
        },
        "message": {
          "type": "string"
        },
        "error": {
          "$ref": "#/definitions/V1Error"
        }
      },
      "required": [
        "applicationId",
        "code",
        "message",
        "error"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "CommitId": {
      "type": "object",
      "properties": {
        "commitId": {
          "type": "string"
        }
      },
      "required": [
        "commitId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BranchName": {
      "type": "object",
      "properties": {
        "branchName": {
          "type": "string"
        }
      },
      "required": [
        "branchName"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "V1Error": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "message": {
          "type": "string"
        },
        "handled": {
          "type": "boolean"
        },
        "blockPath": {
          "type": "string"
        },
        "formPath": {
          "type": "string"
        },
        "code": {
          "$ref": "#/definitions/Code"
        }
      },
      "required": [
        "name",
        "message",
        "handled",
        "blockPath",
        "formPath",
        "code"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Code": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ]
    }
  }
}
```

</details>

#### `/api/v2/keyrotations/claim-resources`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PostClaimKeyRotationResourcesRequestBody",
  "definitions": {
    "PostClaimKeyRotationResourcesRequestBody": {
      "type": "object",
      "properties": {
        "claimedBy": {
          "type": "string"
        },
        "limit": {
          "type": "number"
        }
      },
      "required": [
        "claimedBy",
        "limit"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
  "$ref": "#/definitions/PostClaimKeyRotationResourcesResponseBody",
  "definitions": {
    "PostClaimKeyRotationResourcesResponseBody": {
      "type": "object",
      "properties": {
        "resources": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Resource"
          }
        }
      },
      "required": [
        "resources"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Resource": {
      "type": "object",
      "properties": {
        "api": {
          "type": "object"
        },
        "apiLiteral": {
          "$ref": "#/definitions/ApiLiteral"
        },
        "literal": {
          "$ref": "#/definitions/Literal"
        },
        "commitId": {
          "$ref": "#/definitions/CommitId"
        },
        "branchName": {
          "$ref": "#/definitions/BranchName"
        },
        "lastUpdated": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "lastUpdated"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "ApiLiteral": {
      "type": "object",
      "properties": {
        "data": {
          "type": "object"
        }
      },
      "required": [
        "data"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Literal": {
      "type": "object",
      "properties": {
        "data": {
          "type": "object"
        },
        "signature": {
          "$ref": "#/definitions/Signature"
        },
        "resourceId": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        },
        "lastUpdated": {
          "type": "string",
          "format": "date-time"
        },
        "type": {
          "type": "string"
        },
        "pageVersion": {
          "type": "number"
        }
      },
      "required": [
        "data",
        "signature",
        "resourceId",
        "organizationId",
        "type",
        "pageVersion"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Signature": {
      "type": "object",
      "properties": {
        "keyId": {
          "type": "string",
          "description": "The id of the key used to sign the data."
        },
        "data": {
          "type": "string",
          "description": "The actual signature, in base64."
        },
        "publicKey": {
          "type": "string",
          "description": "The public key for the key used to sign the data, in base64."
        },
        "algorithm": {
          "type": "string",
          "description": "The algorithm used to sign the data."
        }
      },
      "required": [
        "keyId",
        "data"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      },
      "description": "A signature, as produced by the agent."
    },
    "CommitId": {
      "type": "object",
      "properties": {
        "commitId": {
          "type": "string"
        }
      },
      "required": [
        "commitId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "BranchName": {
      "type": "object",
      "properties": {
        "branchName": {
          "type": "string"
        }
      },
      "required": [
        "branchName"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    }
  }
}
```

</details>

### Optional Requests
The following table lists the optional outgoing calls from the agent to Superblocks Cloud, that are used primarily for observability. The Superblocks Cloud host is specific to each call, and all of these calls are authenticated with the organization-specific agent key, which is loaded into the agent as the `SUPERBLOCKS_AGENT_KEY` environment variable.

| Host                                                                            | Type     | Source | Target            | Description                                                                                 | Authentication                        |
| ------------------------------------------------------------------------------- | -------- | ------ | ----------------- | ------------------------------------------------------------------------------------------- |-------------------------------------- |
| [`events.intake.superblocks.com`](#eventsintakesuperblockscom)                             | `POST`   | Agent  | Superblocks Cloud | Route called to upload execution analytics events.                                          | Superblocks Agent Key      |
| [`metadata.intake.superblocks.com`](#metadataintakesuperblockscom)                             | `POST`   | Agent  | Superblocks Cloud | Route called to upload integration configuration metadata to the Superblocks Cloud.                                          | Superblocks Agent Key      |
| [`logs.intake.superblocks.com`](#logsintakesuperblockscom)                             | `POST`   | Agent  | Superblocks Cloud | Route called to upload batched agent platform logs for the Observability feature.                                          | Superblocks Agent Key      |


#### `events.intake.superblocks.com`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/IntakeLogCloudEventsRequestBody",
  "definitions": {
    "IntakeLogCloudEventsRequestBody": {
      "type": "object",
      "properties": {
        "events": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "BYTES_PER_ELEMENT": {
                "type": "number"
              },
              "buffer": {
                "type": "object",
                "properties": {
                  "byteLength": {
                    "type": "number"
                  }
                },
                "required": [
                  "byteLength"
                ],
                "additionalProperties": {
                  "not": true,
                  "errorMessage": "extra property is ${0#}"
                }
              },
              "byteLength": {
                "type": "number"
              },
              "byteOffset": {
                "type": "number"
              },
              "length": {
                "type": "number"
              }
            },
            "required": [
              "BYTES_PER_ELEMENT",
              "buffer",
              "byteLength",
              "byteOffset",
              "length"
            ],
            "additionalProperties": {
              "type": "number"
            }
          }
        }
      },
      "required": [
        "events"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

#### `metadata.intake.superblocks.com`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/IntakeUpsertMetadataRequestBody",
  "definitions": {
    "IntakeUpsertMetadataRequestBody": {
      "type": "object",
      "properties": {
        "metadata": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/Metadata"
          }
        }
      },
      "required": [
        "metadata"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Metadata": {
      "type": "object",
      "properties": {
        "configurationId": {
          "type": "string"
        },
        "integrationId": {
          "type": "string"
        },
        "rawMetadata": {
          "type": "object"
        },
        "updatedDatetimeUtc": {
          "type": "string",
          "format": "date-time"
        },
        "integrationType": {
          "type": "string"
        },
        "organizationId": {
          "type": "string"
        }
      },
      "required": [
        "configurationId",
        "integrationId",
        "rawMetadata",
        "updatedDatetimeUtc",
        "integrationType",
        "organizationId"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
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
  "$ref": "#/definitions/IntakeUpsertMetadataResponseBody",
  "definitions": {
    "IntakeUpsertMetadataResponseBody": {
      "type": "object",
      "properties": {
        "errors": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/V1Error"
          }
        }
      },
      "required": [
        "errors"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "V1Error": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "message": {
          "type": "string"
        },
        "handled": {
          "type": "boolean"
        },
        "blockPath": {
          "type": "string"
        },
        "formPath": {
          "type": "string"
        },
        "code": {
          "$ref": "#/definitions/Code"
        }
      },
      "required": [
        "name",
        "message",
        "handled",
        "blockPath",
        "formPath",
        "code"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    },
    "Code": {
      "type": "number",
      "enum": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ]
    }
  }
}
```

</details>

#### `logs.intake.superblocks.com`

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/IntakeSendRemoteLogsRequestBody",
  "definitions": {
    "IntakeSendRemoteLogsRequestBody": {
      "type": "object",
      "properties": {
        "logs": {
          "type": "array",
          "items": {
            "type": "object"
          }
        }
      },
      "required": [
        "logs"
      ],
      "additionalProperties": {
        "not": true,
        "errorMessage": "extra property is ${0#}"
      }
    }
  }
}
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>
