import { X509Certificate } from 'node:crypto';
import { getCACertificates } from 'node:tls';

import { getAwsRdsTlsCaCertificates, parseAwsRdsCaCertificates } from './rds-ca';

describe('AWS RDS CA certificates', () => {
  it('preserves the Node default trust roots and adds commercial RDS roots', () => {
    const defaultCertificates = getCACertificates('default');
    const certificates = getAwsRdsTlsCaCertificates();
    const subjects = certificates.map((certificate) => new X509Certificate(certificate).subject);

    expect(certificates).toEqual(expect.arrayContaining(defaultCertificates));
    expect(subjects).toContain(
      'C=US\nO=Amazon Web Services\\, Inc.\nOU=Amazon RDS\nST=WA\nCN=Amazon RDS us-east-1 Root CA RSA2048 G1\nL=Seattle'
    );
  });

  it('rejects a bundle without PEM certificates', () => {
    expect(() => parseAwsRdsCaCertificates('not a certificate')).toThrow('contains no certificates');
  });

  it('rejects a bundle containing a non-CA certificate', () => {
    const caCertificate = getCACertificates('default')[0];
    const caProperty = jest.spyOn(X509Certificate.prototype, 'ca', 'get').mockReturnValue(false);

    expect(() => parseAwsRdsCaCertificates(caCertificate)).toThrow('contains a non-CA certificate');

    caProperty.mockRestore();
  });
});
