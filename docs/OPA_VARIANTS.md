# On-Premise Agent Variants
The Superblocks On-premise Agent has two variants: the `standard` agent and the `slim` agent. The agent variants give you different levels of control over the packages included in the agent and that are available when your developers write Python and JavaScript code in their APIs.

## Which variant should I use?

If you're unsure where to start, want to get up and running quickly, or need to minimize dependencies on your DevOps team, the `standard` image is the way to go. The `standard` image includes all the same JavaScript and Python libraries included in Superblocks Cloud, so will let developers get started quickly with a bunch of useful libraries out of the box. Since devs have access to many of the libraries they may need, they won't need to come to your DevOps team to install new packages to unblock development.

The `standard` image is also recommended if you're a current Superblocks Cloud customer and already have tools deployed and you're not sure which packages/libraries you're developers are using.

The `slim` image on the other hand is ideal for organizations that have a high need for customization or have stringent security requirements where it is acceptable for the DevOps team to be involved in assisting developers with installing or upgrading necessary packages.

Unlike the `standard` image the `slim` image only includes the minimum packages required for the agent to run. Because of this, you'll have greater control over your agent's dependencies and can fully manage security patches and version upgrades on your own.

## Variants
### Standard
```unset
superblocksteam/agent:<version>
```

#### Supported Libraries
The `standard` on-premise agent is the defacto Superblocks agent image. It includes:
* All the supported JavaScript libraries in cloud agents (see [supported JavaScript libraries](https://docs.superblocks.com/writing-code/backend-javascript#supported-libraries))
* All the supported Python packages in cloud agents (see [supported Python packages](https://docs.superblocks.com/writing-code/python#supported-libraries))

From a functionality point of view, running workloads against this agent is akin to running workloads against the cloud agents.

#### How to use

To use this agent variant, you'll set an environment variable as follows based on how you deploy your agents:

 | Deployment Type | Environment Variable |
 |-------------------|----------------------|
 | Docker  | `SUPERBLOCKS_DOCKER_AGENT_TAG=<version>` |
 | Terraform | `superblocks_agent_image = "ghcr.io/superblocksteam/agent:<version>"` |
 | Helm | <pre>image: <br>&emsp; repository: ghcr.io/superblocksteam/agent</pre> |


### Slim
```unset
superblocksteam/agent:<version>-slim
```

#### Supported Libraries
The `slim` variant of the agent contains the minimum set of dependencies required to run the agent. This includes:
* JavaScript libraries required for the agent to run (see [package-slim.json](../workers/javascript/packages/server/package-slim.json))
* Python packages required for the agent to run (see [requirements-slim.txt](../workers/python/requirements-slim.txt))

#### How to use

To use this agent variant, you'll set an environment variable as follows based on how you deploy your agents:
 | Deployment Type | Environment Variable |
 |-------------------|----------------------|
 | Docker  | `SUPERBLOCKS_DOCKER_AGENT_TAG=<version>-slim` |
 | Terraform | `superblocks_agent_image = "ghcr.io/superblocksteam/agent:<version>-slim"` |
 | Helm | <pre>image: <br>&emsp; repository: ghcr.io/superblocksteam/agent<br>&emsp; tag: \<version\>-slim</pre> |


## Building From Source
When building the on-premise agent from source, there are four build arguments that are used to determine the variant of the agent being built:
* `SLIM_IMAGE`
* `REQUIREMENTS_FILE`
* `WORKER_JS_LOCK_FILE`
* `WORKER_JS_SERVER_PACKAGE_JSON`

If none of these arguments are specified, building the image from source will build the `slim` variant of the agent (i.e. the default value for all of these arguments is the `slim` variant value).

The following table describes the build arguments and what their respective values should be to build the desired variant from source:

| Build Argument                    | Type    | Standard Variant                  | Slim Variant                           | Description |
| --------------------------------- | ------- | --------------------------------- | -------------------------------------- | ----------- |
| `SLIM_IMAGE`                      | boolean | `false`                           | `true`                                 | Sets `SUPERBLOCKS_SLIM_IMAGE` env var, which is used by the Python worker to determine which modules to import |
| `REQUIREMENTS_FILE`               | string  | `/app/worker.py/requirements.txt` | `/app/worker.py/requirements-slim.txt` | Specifies the path to the requirements file to use when installing dependencies for the Python worker |
| `WORKER_JS_LOCK_FILE`             | string  | `pnpm-lock.yaml`                  | `pnpm-lock-slim.yaml`                  | Specifies the path to the JavaScript worker's pnpm lock file to use when installing dependencies for the JavaScript worker (relative from `/app/worker.js/`) |
| `WORKER_JS_SERVER_PACKAGE_JSON`   | string  | `packages/server/package.json`    | `packages/server/package-slim.json`    | Specifies the path to the JavaScript worker's, `server` package's `package.json` to use when installing dependencies for the JavaScript worker (relative from `/app/worker.js/`) |

### Build Command
The following command can be used to build the on-premise agent from source, setting each of the build arguments to the appropriate value for the desired variant:
```bash
$ docker build -t superblocks \
    --build-arg VERSION=$(git describe --tags --abbrev=0 --match "v*")+$(git describe --always --dirty) \
    --build-arg SLIM_IMAGE=<slim_image> \
    --build-arg REQUIREMENTS_FILE=<requirements_file> \
    --build-arg WORKER_JS_LOCK_FILE=<lock_file> \
    --build-arg WORKER_JS_SERVER_PACKAGE_JSON=<package_json_file> \
    .
```

Follow [these instructions](https://docs.superblocks.com/administration/security/access-tokens) to create an agent key, then run the following commands to test that the newly built agent is operational:
```bash
$ docker run --rm -p 8080:8080 -e SB_AGENT_KEY=${SB_AGENT_KEY} superblocks
$ curl -s http://127.0.0.1:8080/health | jq
{
  "message": "OK",
  ...
}
```
