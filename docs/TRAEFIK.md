# Traefik

We package a load balancer along with the docker compose files we release for a local quickstart or a manual deployment onto baremetal or a VM.

The load balancer offers us an easy way to handle redirects and terminate TLS.
All configuration can be located here: <https://doc.traefik.io/traefik/>.

The compose file offers a set of sensible defaults as a starting point.
This configures the docker engine as a provider for Traefik, and allows the load balancer to perform service discovery via container labels.

## Custom certificate

To deploy using custom certificate, using the provided default configuration, run `compose.traefik.yaml`.
The following environmental variables MUST be supplied to the command:

* SUPERBLOCKS_AGENT_KEY
* SUPERBLOCKS_AGENT_DOMAIN - This must match any certificate CN

```bash
SUPERBLOCKS_AGENT_KEY=<my-key> SUPERBLOCKS_AGENT_DOMAIN=<my-domain> docker compose -f 'compose.traefik.yaml` up
```

In addition, the following files and directories must be available in the working directory where the compose file is run:

* tls.yaml
* traefik.yaml
* certs/

Sample files are provided in this repository.
The `certs/` directory should contain the custom certificates that are to be used. The configuration in `tls.yaml` must reference the correct filenames in the `certs/` directory.

Then, simply specify the file provider in the provided `traefik.yaml` to start using custom certificates.

## ACME provider

We also have configuration provided to allow users to leverage LetsEncrypt to generate certificates.
To allow HTTP01 ACME challenges, uncomment the `certificatesResolvers` block in `traefik.yaml`.
Additional configuration can be specified for other types of ACME challenges.
A full list of configurations can be found here: <https://doc.traefik.io/traefik/https/acme/>
