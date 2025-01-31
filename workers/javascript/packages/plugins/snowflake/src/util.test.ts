import { SnowflakeDatasourceConfiguration } from '@superblocks/shared';

import { connectionOptionsFromDatasourceConfiguration, getMetadataQuery } from './util';

describe('connectionOptionsFromDatasourceConfiguration', () => {
  it('works for fields when connectionType is not given (backwards compatible)', async () => {
    const datasourceConfiguration = {
      authentication: {
        username: 'username',
        password: 'password',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' },
          warehouse: { value: 'warehouse' },
          role: { value: 'role' },
          schema: { value: 'schema' }
        }
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      username: 'username',
      password: 'password',
      account: 'account',
      database: 'databaseName',
      warehouse: 'warehouse',
      role: 'role',
      schema: 'schema'
    });
  });

  it('works for fields when connectionType is given', async () => {
    const datasourceConfiguration = {
      connectionType: 'fields',
      authentication: {
        username: 'username',
        password: 'password',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' },
          warehouse: { value: 'warehouse' },
          role: { value: 'role' },
          schema: { value: 'schema' }
        }
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      username: 'username',
      password: 'password',
      account: 'account',
      database: 'databaseName',
      warehouse: 'warehouse',
      role: 'role',
      schema: 'schema'
    });
  });

  it('works for okta', async () => {
    const datasourceConfiguration = {
      connectionType: 'okta',
      authentication: {
        username: 'username',
        password: 'password',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' },
          warehouse: { value: 'warehouse' },
          role: { value: 'role' },
          schema: { value: 'schema' }
        }
      },
      okta: {
        authenticatorUrl: 'foo.com'
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      username: 'username',
      password: 'password',
      account: 'account',
      authenticator: 'foo.com',
      database: 'databaseName',
      warehouse: 'warehouse',
      schema: 'schema',
      role: 'role'
    });
  });

  it('works for key-pair without private key password', async () => {
    const datasourceConfiguration = {
      connectionType: 'key-pair',
      authentication: {
        username: 'user',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' },
          warehouse: { value: 'warehouse' },
          role: { value: 'role' },
          schema: { value: 'schema' }
        }
      },
      keyPair: {
        privateKey: 'pk'
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      account: 'account',
      username: 'user',
      authenticator: 'SNOWFLAKE_JWT',
      privateKey: 'pk',
      database: 'databaseName',
      warehouse: 'warehouse',
      schema: 'schema',
      role: 'role'
    });
  });

  it('trims leading and trailing whitespace from private key', async () => {
    const datasourceConfiguration = {
      connectionType: 'key-pair',
      authentication: {
        username: 'user',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' }
        }
      },
      keyPair: {
        privateKey: ' pk   '
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      account: 'account',
      username: 'user',
      database: 'databaseName',
      authenticator: 'SNOWFLAKE_JWT',
      privateKey: 'pk'
    });
  });

  // openssl genpkey -algorithm RSA -outform PEM -aes256 -pass pass:foo -pkeyopt rsa_keygen_bits:2048 | pbcopy
  it('works for key-pair with password', async () => {
    const datasourceConfiguration = {
      connectionType: 'key-pair',
      authentication: {
        username: 'user',
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' }
        }
      },
      keyPair: {
        privateKey: `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFNTBfBgkqhkiG9w0BBQ0wUjAxBgkqhkiG9w0BBQwwJAQQae5CUXLDXyT0NKTd
nC9rFwICCAAwDAYIKoZIhvcNAgkFADAdBglghkgBZQMEASoEENiexhDUrSkVh8Lq
CLysnhEEggTQDRGIgcyjfxVPgdsnBqXIVJwk6CbEw6u3rA3sS53si4m5wkZEnuOt
BgC79tbGSCTpAjbb226D04DofI3vt/VaeCvwrS3bObCcY0Y1E1f+KkhIwVz4WG1I
0OdnHdQ0GA5Zda0265tUoOPb2BTZdSj6RWlXNBjQZSSpekCJGfvkOtc0xA1tiFo1
u1qFKHs8dXOjCYLY00U39EhAuC7oa12l8BMXSyblyWE8HFFz2qVwI2bdg+JmseFe
oV41Zs0kTPwuWTzPSi+fa8Lo28v/lysTNozeY21AFUmoIH5Fnu4l58s9hzk45uHJ
1eLI+k9l62tbA935B47AOnSDlppUzU83y2iMCvJduWBhuQ76y+AnLybDOpQDnfX9
I9kmto22s/AUMohi2F8+V6B9cCWQ3rVDgoLqfGh3EzJfRtWWSynmLmbf5vgz8yZ7
uZy/UN1zELWHciN0hRWRlZ56UxGgUj27nA88VsarT9RQP/FN+XR/S7p+6UPK8ul0
BnSZu3HroBSj/hV3NrbaYE5i3SUhp8A/n3RQc1LaTk+ZhaXWEOYqUoRjB9AUEAjG
/7MglilS/PCVt+ofwUUtuwbFp4+F6B1eo3bFTT310BNYoc7/pRgh2pUYvzFByqhQ
RlLVzK66KYE+O6TAF5BJhlSrt/NvzYELYXJb91UoltqIC0rtMMADwrJKfn4Lr/Zl
ejpHiUcHB9n53ej0DACJt1gxa57Uqum2S0ds1JZ9Mmb+aNy/lO/e9lbkQo4z1qrO
LH6oRyVdHIOEPARBYuSGZ4LOAg0SnmRTEmhl4MG8fEifUXhcjrOyb0ynjns4s+6l
wA3W/+HegjTSvPpAPB1jeDx9gGaAje5rGEbnqqqLj7F4SrakD5VxAU5wdzFpr26b
026Nmdf66UcYcKAjTDOAQjtqjXA4J+RS73P41yt7YRAji4cPt29t96iiLFYRLQRo
qw3qRz1EWUrLDNNfLs2HDD3wDuSCX+UaObgPpY11R2yTgl5S3FkXRanLdJ+0gqdg
iWh01qfIo8/GTnc5WoonsHQLSp1oV6UwCcptjOVg35UwiABqBUpmLog6vSqRSgR6
arakRDZ84kzxKtJIMYpS9UOSkBgUTKfMVikPj8eeuZec/uJWUGHsBclpdXle3Cye
EcZnVOuC7/+bNMF6m6qV1vFomeBoq0wfhkAfNStwEq2BJC8ME84hGmLNpXF8tC46
UnEmYjGIpuL+qBKVOuta1XMqbY1D0v6OUzYvE3RxKGHu7QyZCr3VzNMVMqQkeqhS
KvnXi8st6gmyyXddE+VRmwWXmbW+czK8hhlAUuoybdYZA7T29ALk6QOxskZKbi3+
BuJYdb583IAMQ4/I1UXbAPCFEpnDCcmhprIztRhuXofE6pg0KkR0XhqKce2Xypog
RZyZfnsRP78B5OTE2EfFoNX9f5aHR79nHU7gh4nJRnCPb0xvrd0fRNy/aK/RVenk
f2MHcntgA2HdZ8RUgrF7SoN1JpBQUsNIGlmQz2KCK4Nx78jrlHGjQu3TeRQ7FoLR
H45q4UkZQdcKzSlLUgIVxu1l292muCV1+6g/SZl8rLJjfRNxV3RRFt0IYnm439n3
y4BdZfATsd4Q1gjGoALvDK0i7pwG+40wxmKFDkj95QmskRMSX8q0DUg=
-----END ENCRYPTED PRIVATE KEY-----`,
        password: 'foo'
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      account: 'account',
      authenticator: 'SNOWFLAKE_JWT',
      username: 'user',
      database: 'databaseName',
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCXjMqyEL55ZO7b
/20zZeOPOCeWT87Z2L+mt7fz0Jw9F9Qi7xjopxfadEf9+lAKzFA0WqpaflF0CkUh
a8PVVW7yIx/fxgdgPmPdYeM8L0WO4ZuqqAU0/GXUsB9clucGvSPlb3LwN1SPeePy
jp9QAVhuXuxxJYckcIDtDJqdotEH4CWRlkT7sfsVvLewHfLrZMrx2fT+vEPkG6iO
xc2gGFY3qGSR4ol6gek2OrPul3LOonFP4J2LCq961V/oqEZVNmY8uJRIIVYGE9wJ
FzYNcAbPmY45PNHbsRBxySkva4sqCHvdlTDyF4J0zrgGTUSn8zFy1GuUHPxU9jj1
yA3H3KTvAgMBAAECggEACITdkAzo6CIIW02Mces0U4SwlP5/fjd07oY9TPNZFQYV
4rDWEZ3y9VC8C0ba4QCDMa43DUc0hPVe1XYdWAypY+sdi5KyL3LSYktyXpu5qUJ9
YaZ4RHY7sy0DVk0VR4eyUN9m8qHpmvcbHTNvOSwaMHodiG63nhDE7o5a0qmoXmzh
BNstWaTxkAe0n9lSTDKACJWS2adGamlhhpqzp+EVVrVqODXslk8+OhMLmS2+FWuy
mYzdqTdNbvMLkdQvdmoBXF8BkgfU/Kgwcn6Y/g1wZw5NEKGfzUYWhjvq+s3WZoeN
5uuRTYII2QFwtj5bzKBySjDIXN9kJ3TD1KfbSIHUgQKBgQDOJx2Y93d4CLng7KBo
vZrFjpF4CrgEk91vLmU649pyir+vK7CtM+XWHVXGBx69um6gagpY5AAH/AURnNT/
7faoEDwJqR0s5SDVP8K5PwYZyxWVIMwgTzxWwbCsEb0P/Bbvqenp0zNAG8Vh5YI3
eecOh6+BMiNMt/W2xmYvgYRy3wKBgQC8McEQ28Pg7udGiLS0UrPEr+NZtMWzqTQ4
0lMS+RA4MHhZSCpM1TbcP3Eupyt8bvib/7lqT2rr/qQ2m+T5gY2WQrKbyFWrvD8c
R94c3YhUqW9lS6z7AZ+LhjttXHGGRbZP/aSXYEILqBiBO9HbxhLh+Iz4/998jIne
pYlXt6yf8QKBgEykdDeDgVIKBHkf3/8wxpK+D00Oxx1Ej+We3RnIzlUZSmxolNW/
3qn82/+0c/RblHdlFRW5Jl3Rj1zd7r57jOEsr/VzfxpK0SsW+mD+klkSjKKVv+4f
JzKl7fX63kxMD4bop8M7tukVqgtcVU4krwdS4KfqqP8DwYFDP4hX4ZMHAoGAd3dS
KySHRQwDjvgLVolFiy9osLKb6kAYYZXKnLm0/SZvz6WLDLkxGUHA1K/UYCqF8Wm1
x3Hg2y0MC4qNIYKHYgK3JUNYdyuKGKbarhJHkA77Ix+WEMVoBYdRxEux2V35rO/E
A0BczM+JtshFoTEtHXvN6edsdME2aDtHY4K6t9ECgYBMvDlYOHcMu/NF07JmbQD0
DQn5LpdqpVxSridY+uhvMQyByqJ7F9/kCg591jnIh0guaGBWIk+Xtqslgs1yuobM
DJuQTfIrVUrtlBiKbK68eu8BWQmDkrry7lspDBBrAlL/Av23LtUHAhfaryHP91Hm
oBHJaYtVCXd3VBWCVLcfnw==
-----END PRIVATE KEY-----
`
    });
  });

  it('works for oauth2-on-behalf-of-token-exchange', async () => {
    const datasourceConfiguration = {
      connectionType: 'oauth2-on-behalf-of-token-exchange',
      authentication: {
        custom: {
          account: { value: 'account' },
          databaseName: { value: 'databaseName' },
          warehouse: { value: 'warehouse' },
          role: { value: 'role' },
          schema: { value: 'schema' }
        }
      },
      authConfig: {
        authToken: 'token'
      }
    } as SnowflakeDatasourceConfiguration;
    const connectionOptions = connectionOptionsFromDatasourceConfiguration(datasourceConfiguration);

    expect(connectionOptions).toEqual({
      account: 'account',
      authenticator: 'OAUTH',
      token: 'token',
      database: 'databaseName',
      warehouse: 'warehouse',
      schema: 'schema',
      role: 'role'
    });
  });

  it('fails for key-pair when required fields are not present', () => {
    expect(() =>
      connectionOptionsFromDatasourceConfiguration({
        connectionType: 'key-pair',
        authentication: {
          custom: {
            account: { value: 'account' }
          }
        }
      })
    ).toThrow('Missing required fields: databaseName,username,privateKey');
  });

  it('fails when authentication is not present', () => {
    expect(() => connectionOptionsFromDatasourceConfiguration({})).toThrow('authentication expected but not present');
  });

  it('fails with missing fields listed for connection type fields', () => {
    const datasourceConfiguration = {
      connectionType: 'fields',
      authentication: {}
    } as SnowflakeDatasourceConfiguration;
    expect(() => connectionOptionsFromDatasourceConfiguration(datasourceConfiguration)).toThrow(
      'Missing required fields: account,databaseName,username,password'
    );
  });

  it('fails with missing fields listed for connection type okta', () => {
    const datasourceConfiguration = {
      connectionType: 'okta',
      authentication: {}
    } as SnowflakeDatasourceConfiguration;
    expect(() => connectionOptionsFromDatasourceConfiguration(datasourceConfiguration)).toThrow(
      'Missing required fields: account,databaseName,username,password,authenticatorUrl'
    );
  });

  it('fails for oauth-2-on-behalf-of-token-exchange when required fields are not present', () => {
    expect(() =>
      connectionOptionsFromDatasourceConfiguration({
        connectionType: 'oauth2-on-behalf-of-token-exchange',
        authentication: {
          custom: {
            account: { value: 'account' }
          }
        }
      })
    ).toThrow('Missing required fields: databaseName,token');
  });
});

describe('getMetadataQuery', () => {
  it('without schema, not quoted', async () => {
    const metadataQuery = getMetadataQuery('db');

    expect(metadataQuery).toEqual(
      `select c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, t.TABLE_TYPE
      FROM "db"."INFORMATION_SCHEMA"."COLUMNS" as c
      LEFT JOIN "db"."INFORMATION_SCHEMA"."TABLES" AS t ON t.TABLE_NAME = c.TABLE_NAME WHERE c.TABLE_SCHEMA != 'INFORMATION_SCHEMA'  ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION ASC;`
    );
  });

  it('with schema, not quoted', async () => {
    const metadataQuery = getMetadataQuery('db', 'schema');

    expect(metadataQuery).toEqual(
      `select c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, t.TABLE_TYPE
      FROM "db"."INFORMATION_SCHEMA"."COLUMNS" as c
      LEFT JOIN "db"."INFORMATION_SCHEMA"."TABLES" AS t ON t.TABLE_NAME = c.TABLE_NAME WHERE c.TABLE_SCHEMA ILIKE 'schema' ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION ASC;`
    );
  });

  it('quoted', async () => {
    const metadataQuery = getMetadataQuery('"db"', 'schema', false);

    expect(metadataQuery).toEqual(
      `select c.TABLE_CATALOG, c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.ORDINAL_POSITION, c.DATA_TYPE, t.TABLE_TYPE
      FROM "db"."INFORMATION_SCHEMA"."COLUMNS" as c
      LEFT JOIN "db"."INFORMATION_SCHEMA"."TABLES" AS t ON t.TABLE_NAME = c.TABLE_NAME WHERE c.TABLE_SCHEMA ILIKE 'schema' ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION ASC;`
    );
  });
});
