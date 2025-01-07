# On-Premise Agent Variants
The Superblocks on-premise agent comes in two different variants: the `standard` variant and the `slim` variant.

## Standard
```unset
superblocksteam/agent:<version>
```
The `standard` on-premise agent is the defacto Superblocks agent image. It includes:
* All the supported JavaScript libraries in cloud agents (see [supported JavaScript libraries](https://docs.superblocks.com/writing-code/backend-javascript#supported-libraries))
* All the supported Python packages in cloud agents (see [supported Python packages](https://docs.superblocks.com/writing-code/python#supported-libraries))

From a functionality point of view, running workloads against this agent is akin to running workloads against the cloud agents.

## Slim
```unset
superblocksteam/agent:<version>-slim
```
The `slim` variant of the on-premise agent maintains the same functionality of the cloud agents with the exception of:
* It only contains the minimum set of JavaScript libraries required for the agent to run (see [package-slim.json](../workers/javascript/packages/server/package-slim.json))
* It only contains the minimum set of Python packages required for the agent to run (see [requirements-slim.txt](../workers/python/requirements-slim.txt))

As a result the size of the `slim` image is much smaller than that of the `standard` image (~60% the size of the `standard` image).

The `slim` image is also the recommended base image if you plan to add custom packages to the agent, as it should minimize the chance of any dependency version conflicts (see [add custom dependencies documentation](https://docs.superblocks.com/on-premise-agent/extend/customize_packages#add-custom-dependencies-and-dockerfile)).
