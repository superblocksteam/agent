<p align="center">
  <img src="./assets/logo.png" height="60"/>
</p>

<h1 align="center">On Premise Agent (OPA)</h1>
<p align="center">Keep customer data in your VPC for internal tools, while keeping Superblocks up-to-date from our cloud.</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v0.41.0-blue" height="20"/>
  <img src="https://img.shields.io/badge/helm-v0.28.0-blue" height="20"/>
  <img src="https://img.shields.io/badge/build-passing-green" height="20"/>
</p>

<br/>

<p align="center">
  <img src="./assets/architecture.png" width="50%"/>
</p>

<br/>


This document contains configuration and deployment details for running the Superblocks agent independently.

**DISCLAIMER**: Parts of this document currently refer to an `agent` service that has been deprecated in favor of the Superblocks Agent Platform. We have introduced an `agent-controller` service and an `agent-worker` service. For now, you can find updated information in linked repositories of the [Source-Available Repositories](#source-available-repositories) section. We are currently in the process of updating the other sections of this document.

## Deployment

### kubernetes (Recommended)

The Superblocks agent can be deployed on any Kubernetes cluster.

Our charts are currently hosted under `https://charts.superblocks.com/superblocks`. Use the following commands to deploy the agent platform using the public helm chart. The latest version of the helm chart can be found [here](./helm).

```shell
helm repo add superblocks https://charts.superblocks.com/superblocks

# This will fetch the latest charts info from the Superblocks charts repo
helm repo update

helm upgrade -i -n superblocks superblocks-agent superblocks/superblocks-agent \
  --create-namespace \
  --set superblocks.agentKey='<agent-key>' # obtained during agent onboarding \
  --set superblocks.agentHostUrl='http[s]://<agent-host[:port]>/agent' \
  --set superblocks.agentEnvironment='<"*"|"staging"|"production">'
```

### docker

The Superblocks agent can also be deployed using the docker CLI.

To do so, first export the agent configuration.

```sh
# obtained during agent onboarding
export SUPERBLOCKS_AGENT_KEY='<agent-key>'
export SUPERBLOCKS_AGENT_HOST_URL='http[s]://<agent-host[:port]>/agent'
export SUPERBLOCKS_AGENT_ENVIRONMENT='<"*"|"staging"|"production">'
```

Then, use our docker compose file to start the agent platform. The referenced docker compose file can be found [here](./docker/compose.yaml).

```sh
curl -s https://raw.githubusercontent.com/superblocksteam/agent/main/docker/compose.yaml | docker compose -p superblocks -f - up
```

## Requests

The Superblocks Agent Platform is designed with security as a primary consideration. Any data accessed and processed by the agent is only available to the user's browser or client, and never sent to Superblocks Cloud. Additionally, the agent only supports incoming requests from a browser/client, and not even Superblocks Cloud can call into the agent to have it perform any operations.

A detailed list of all network requests that can be made to the agent and that the agent makes can be [found here](./docs/requests.md).

## Configuration

The agent application can be configured via the use of several environment variables, and they are [documented here](./docs/configuration.md).

## Source-Available Repositories

The agent platform source code is available and can be built from source!
The following is a comprehensive list of repositories required to build the agent from source:

### Services

- [superblocksteam/agent-controller](https://github.com/superblocksteam/agent-controller) - [Docs](https://docs.superblocks.com/on-premise-agent/overview)
- [superblocksteam/agent-worker](https://github.com/superblocksteam/agent-worker) - [Docs](https://docs.superblocks.com/on-premise-agent/overview)

### Libraries

- [superblocksteam/shared](https://github.com/superblocksteam/shared)
- [superblocksteam/shared-backend](https://github.com/superblocksteam/shared-backend)

### Integrations

Superblocks supports the following plugins. Click on each to visit its repository.

<style>
td, th {
   border: none!important;
}
</style>

<table>
  <tr>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/bigquery"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/bigquery.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/dynamodb"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/dynamodb.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/email"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/email.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/restapi"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/restapi.png" width="75%"/></p></a></td>
  </tr>
  <tr>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/graphql"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/graphql.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/gsheets"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/gsheets.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/javascript"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/javascript.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/mariadb"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/mariadb.png" width="75%"/></p></a></td>
  </tr>
  <tr>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/mongodb"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/mongodb.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/mssql"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/mssql.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/mysql"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/mysql.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/postgres"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/postgres.png" width="75%"/></p></a></td>
  </tr>
  <tr>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/python"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/python.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/redshift"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/redshift.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/rockset"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/rockset.png" width="75%"/></p></a></td>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/s3"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/s3.png" width="75%"/></p></a></td>
  </tr>
  <tr>
    <td valign="center" width="25%"><a href="https://github.com/superblocksteam/snowflake"><p align="center"><img src="https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/snowflake.png" width="75%"/></p></a></td>
  </tr>
</table>