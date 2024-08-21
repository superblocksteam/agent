# The Superblocks Agent

[![codecov](https://codecov.io/gh/superblocksteam/agent/branch/main/graph/badge.svg?token=3EUVKX3VZF)](https://codecov.io/gh/superblocksteam/agent) [![default](https://github.com/superblocksteam/agent/actions/workflows/default.yaml/badge.svg)](https://github.com/superblocksteam/agent/actions/workflows/default.yaml)
[![PyPi Version](https://img.shields.io/pypi/v/superblocks-agent-sdk)](https://pypi.org/project/superblocks-agent-sdk/) ![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/superblocksteam/agent?sort=semver)

<img src="https://superblocks.s3.us-west-2.amazonaws.com/logo.png" width="100">

----

The Superblocks [On-Premise Agent](https://www.superblocks.com/on-prem-agent) is a stateless service that securly connects the Superblocks platform to your data without leaving your network. It is the execution engine that powers Superblocks Application APIs, Workflows, and Scheduled Jobs. Here's how it works.

When your developers build apps in Superblocks and write SQL statements or API calls, your customer data flows from your Database to the On-premise Agent to the browser directly; never to Superblocks Cloud. In addition, the Superblocks Cloud cannot make any inbound network calls to the customer’s network.

The Browser will call out to the Superblocks Cloud only for Authentication, Permissions, App UI Definitions and App Integration Definitions. This approach keeps Superblocks components and functionality up-to-date for your developers with each release and bug fix, without needing to upgrade the On-Premise Agent.

When the Developer is ready to go to production, they click “Deploy” (Superblocks can alternatively integrate into your version control system) and the application will be accessible on a URL.

In the deployed app, when a user clicks a button to trigger an API call, the call is routed to the On-Premise Agent and the App Integration Definition will be fetched from Superblocks Cloud (Optionally customers can connect to their version control system so API Integration Definitions are fetched directly from a branch). This round-trip restricts end users from running arbitrary APIs, only APIs from the App Integration Definition approved by Developers with the right permissions can be triggered. The On-Premise Agent will execute the API logic based on the definition and all customer data flows from the data sources to the agent to the browser directly, never leaving the customer’s network and never going to the Superblocks Cloud.

---

## Quick Start

Build and run the agent from source. You can create an agent key access token [here](https://app.superblocks.com/access-tokens).

```sh
$ docker build -t superblocks --build-arg VERSION=$(git describe --tags --abbrev=0)+$(git describe --always --dirty) .
$ docker run --rm -p 8080:8080 -e SB_AGENT_KEY=${SB_AGENT_KEY} superblocks
$ curl -s http://127.0.0.1:8080/health | jq
{
  "message": "OK"
}
```

## Usage

The agent exposes HTTP and gRPC interfaces to run APIs. A full OpenAPI specification is under development. Here is an exmaple that runs a basic API.

> NOTE: To avoid authentication errors, run the docker container with `-e SB_AUTH_JWT_ENABLED=false`.

```sh
$ curl -s -X POST http://127.0.0.1:8080/v2/execute -d @- << EOF | jq
{
  "definition": {
    "api": {
      "metadata": {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "MyTestApi",
        "organization": "00000000-0000-0000-0000-000000000001"
      },
      "blocks": [
          {
            "name": "TestJavascriptBlock",
            "step": {
              "javascript": {
                "body": "return 5;"
              }
            }
          }
        ]
    }
  }
}
EOF
{
  "execution": "01915cc7-0ee2-7f9c-896a-2e5c056991d7",
  "output": {
    "result": 5
  },
  "status": "STATUS_COMPLETED"
}
```

## Development

Learn how to develop locally with our [guide](DEVELOPMENT.md).

## Contributing

Learn how to contribute with our [guide](CONTRIBUTING.md).

## Support

Send an email to [help@superblocks.com](help@superblocks.com).
