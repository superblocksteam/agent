# AWS RDS commercial CA bundle

Source: <https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem>

Retrieved: 2026-07-15

SHA-256: `e5bb2084ccf45087bda1c9bffdea0eb15ee67f0b91646106e466714f9de3c7e3`

This is the AWS global bundle for commercial Regions. GovCloud and China
partitions are not included in the initial Postgres IAM support.

## Rotation

The earliest `notAfter` date in this copy is May 18, 2061. AWS can add or
retire roots before that date, so expiry is not the only refresh trigger.
Monitor the [AWS RDS certificate rotation
documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL-certificate-rotation.html)
and update this file when AWS changes the commercial bundle.

Refresh the bundle and checksum with:

```bash
curl --fail --silent --show-error --location \
  "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" \
  --output "workers/javascript/packages/plugins/postgres/src/rds-ca/global-bundle.pem"
shasum -a 256 \
  "workers/javascript/packages/plugins/postgres/src/rds-ca/global-bundle.pem"
```

Update the retrieval date and SHA-256 above, then run the Postgres CA tests and
package build to verify the new roots and deployed asset path.
