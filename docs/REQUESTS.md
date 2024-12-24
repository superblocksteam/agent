# Requests

This documents contains a detailed list of all the outbound network requests the Superblocks On-Premise agent makes to the Superblocks Cloud.

## Outgoing

The following table lists all the operational outgoing calls from the agent to Superblocks Cloud. The Superblocks Cloud host is `https://api.superblocks.com`, and most calls to Superblocks Cloud are authenticated with the organization-specific agent key, which is loaded into the agent as the `SUPERBLOCKS_AGENT_KEY` environment variable.

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
| [`/api/v3/apis/:apiId`](#apiv3apisapiid)                             | `POST`   | Agent  | Superblocks Cloud | Route called to fetch a API definition from Superblocks Cloud. For deployed APIs, definitions are fetched from the Global Edge Network by default, and round trip to the Superblocks Cloud only if unavailable. | Superblocks Agent Key + User JWT + Org API Token      |
| [`/api/v3/apis/signatures`](#apiv3apissignatures)                             | `PUT`   | Agent  | Superblocks Cloud | When Agent Signing is enabled, this route is called to update the signature of an API when signatures are updated as a result of a re-signing job. | Superblocks Agent Key      |
| [`/api/v2/applications/signatures`](#apiv2applicationssignatures)                             | `PUT`   | Agent  | Superblocks Cloud | When Agent Signing is enabled, this route is called to update the signature on an Application when signatures are updated as a result of a re-signing job.                                          | Superblocks Agent Key      |
| [`/api/v2/keyrotations/claim-resources`](#apiv2keyrotationsclaim-resources)                             | `POST`   | Agent  | Superblocks Cloud | When Agent Signing is enabled, this route is called when a re-signing job is in progress to fetch a batch of resources (APIs and Applications) for the agent to re-sign.                                          | Superblocks Agent Key      |

The following table lists the optional outgoing calls from the agent to Superblocks Cloud, that are used primarily for observability. The Superblocks Cloud host is specific to each call, and all of these calls are authenticated with the organization-specific agent key, which is loaded into the agent as the `SUPERBLOCKS_AGENT_KEY` environment variable.

| Host                                                                            | Type     | Source | Target            | Description                                                                                 | Authentication                        |
| ------------------------------------------------------------------------------- | -------- | ------ | ----------------- | ------------------------------------------------------------------------------------------- |-------------------------------------- |
| [`events.intake.superblocks.com`](#eventsintakesuperblockscom)                             | `POST`   | Agent  | Superblocks Cloud | Route called to upload execution analytics events.                                          | Superblocks Agent Key      |
| [`metadata.intake.superblocks.com`](#metadataintakesuperblockscom)                             | `POST`   | Agent  | Superblocks Cloud | Route called to upload integration configuration metadata to the Superblocks Cloud.                                          | Superblocks Agent Key      |
| [`logs.intake.superblocks.com`](#logsintakesuperblockscom)                             | `POST`   | Agent  | Superblocks Cloud | Route called to upload batched agent platform logs for the Observability feature.                                          | Superblocks Agent Key      |


### `/api/v1/agents/register`

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
```

</details>

### `/api/v1/agents`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v1/agents/healthcheck`

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

_None_

</details>

### `/api/v1/agents/datasource/:id`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/FetchIntegrationResponse",
  "definitions": {
    "FetchIntegrationResponse": {
      "datasource": {
        "$ref": "#/definitions/Integration"
      }
    },
    "Integration": {
      "pluginId": {
        "type": "string"
      },
      "configuration": {
      "type": "object",
      "properties": {}
      }
    }
  }
}
```

</details>

### `/api/v1/agents/integrations/:id`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v1/agents/user/userToken`
#### GET

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PostUserTokenResponseDto",
  "definitions": {
    "PostUserTokenResponseDto": {
      "type": "object",
      "properties": {
        "data": {
          "type": "string",
        }
      }
    }
  }
}
```

</details>

#### POST

<details>
<summary>Request body</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$ref": "#/definitions/PostUserTokenRequest",
  "definitions": {
    "PostUserTokenRequest": {
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

_None_

</details>

#### DELETE

<details>
<summary>Request body</summary>


_None_

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v1/agents/userToken`
#### POST

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

#### DELETE

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v1/oauth2/gsheets/refresh`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v1/integrations`

<details>
<summary>Request body</summary>

_None_

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v2/agents/audit`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v2/agents/pending-jobs`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v3/apis/:apiId`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v3/apis/signatures`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v2/applications/signatures`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `/api/v2/keyrotations/claim-resources`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `events.intake.superblocks.com`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `metadata.intake.superblocks.com`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>

### `logs.intake.superblocks.com`

<details>
<summary>Request body</summary>

```json
```

</details>

<details>
<summary>Response body</summary>

_None_

</details>
