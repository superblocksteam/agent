import { X509Certificate } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCACertificates } from 'node:tls';

const CERTIFICATE_PATTERN = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;
const RDS_CA_BUNDLE_PATH = join(__dirname, 'rds-ca', 'global-bundle.pem');

export function parseAwsRdsCaCertificates(bundle: string): string[] {
  const certificates = bundle.match(CERTIFICATE_PATTERN) ?? [];
  if (certificates.length === 0) {
    throw new Error('The packaged AWS RDS CA bundle contains no certificates');
  }
  for (const certificate of certificates) {
    const parsed = new X509Certificate(certificate);
    if (!parsed.ca) {
      throw new Error('The packaged AWS RDS CA bundle contains a non-CA certificate');
    }
  }
  return certificates;
}

let rdsCaCertificates: string[] | undefined;

function getPackagedRdsCaCertificates(): string[] {
  rdsCaCertificates ??= parseAwsRdsCaCertificates(readFileSync(RDS_CA_BUNDLE_PATH, 'utf8'));
  return rdsCaCertificates;
}

export function getAwsRdsTlsCaCertificates(): string[] {
  return [...new Set([...getCACertificates('default'), ...getPackagedRdsCaCertificates()])];
}
