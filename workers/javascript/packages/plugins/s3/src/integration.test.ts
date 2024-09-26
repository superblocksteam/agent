import { ActionResponseType, DUMMY_EXECUTE_COMMON_PARAMETERS, ErrorCode, ExecutionOutput, S3ActionType } from '@superblocks/shared';
import S3Plugin from '.';

const REGION = 'us-east-1';
// this role has access to s3, this role is under staging aws account
const ROLE_ARN = '';
// this is a user that is trusted by the role, this user is under staging aws account
const USER1_ACCESS_KEY_ID = '';
const USER1_SECRET_KEY = '';
// this is a user that is not trusted by the role, this user is under staging aws account
const USER2_ACCESS_KEY_ID = '';
const USER2_SECRET_KEY = '';
// this is a user that has s3 access
const USER3_ACCESS_KEY_ID = '';
const USER3_SECRET_KEY = '';

// TODO(dlamotte): skipping these tests as they rely on the above variables being non-empty strings,
// but they used to be hardcoded credentials that were removed. as a result, these tests no longer
// run
xdescribe('s3 list with iam auth', () => {
  const plugin: S3Plugin = new S3Plugin();

  test('user has direct s3 access', async () => {
    await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {
        authentication: {
          custom: {
            accessKeyID: {
              key: 'accessKeyID',
              value: USER3_ACCESS_KEY_ID
            },
            secretKey: {
              key: 'secretKey',
              value: USER3_SECRET_KEY
            },
            region: {
              key: 'region',
              value: REGION
            }
          }
        }
      },
      actionConfiguration: {
        action: S3ActionType.LIST_BUCKETS
      }
    });
  });

  test('user with no direct s3 access', async () => {
    try {
      await plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: {
          authentication: {
            custom: {
              accessKeyID: {
                key: 'accessKeyID',
                value: USER1_ACCESS_KEY_ID
              },
              secretKey: { key: 'secretKey', value: USER1_SECRET_KEY },
              region: {
                key: 'region',
                value: REGION
              }
            }
          }
        },
        actionConfiguration: {
          action: S3ActionType.LIST_BUCKETS
        }
      });
    } catch (err) {
      expect(err.message).toContain('Access Denied');
      expect(err.code).toBe(ErrorCode.INTEGRATION_AUTHORIZATION);
    }
  });

  // this is a user that is trusted by the role
  test('assume role should grant user s3 access', async () => {
    await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {
        authentication: {
          custom: {
            accessKeyID: {
              key: 'accessKeyID',
              value: USER1_ACCESS_KEY_ID
            },
            secretKey: {
              key: 'secretKey',
              value: USER1_SECRET_KEY
            },
            region: {
              key: 'region',
              value: REGION
            },
            iamRoleArn: {
              key: 'iamRoleArn',
              value: ROLE_ARN
            }
          }
        }
      },
      actionConfiguration: {
        action: S3ActionType.LIST_BUCKETS
      }
    });
  });

  // this is a user that is not trusted by the role
  test('assume role should fail', async () => {
    try {
      await plugin.execute({
        ...DUMMY_EXECUTE_COMMON_PARAMETERS,
        mutableOutput: new ExecutionOutput(),
        datasourceConfiguration: {
          authentication: {
            custom: {
              accessKeyID: {
                key: 'accessKeyID',
                value: USER2_ACCESS_KEY_ID
              },
              secretKey: {
                key: 'secretKey',
                value: USER2_SECRET_KEY
              },
              region: {
                key: 'region',
                value: REGION
              },
              iamRoleArn: {
                key: 'iamRoleArn',
                value: ROLE_ARN
              }
            }
          }
        },
        actionConfiguration: {
          action: S3ActionType.LIST_BUCKETS
        }
      });
    } catch (err) {
      expect(err.message).toContain('not authorized');
      expect(err.code).toBe(ErrorCode.INTEGRATION_AUTHORIZATION);
    }
  });

  test('test s3 get file without resource type', async () => {
    const result = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {
        authentication: {
          custom: {
            accessKeyID: {
              key: 'accessKeyID',
              value: USER3_ACCESS_KEY_ID
            },
            secretKey: {
              key: 'secretKey',
              value: USER3_SECRET_KEY
            },
            region: {
              key: 'region',
              value: REGION
            }
          }
        }
      },
      actionConfiguration: {
        action: S3ActionType.GET_OBJECT,
        resource: 'superblocks-temp',
        path: 'ro-test.png'
        // with resource type, this test verifies backward compatibility
      }
    });
    // This is the expected output when resource type is missing, it's what a png toString looks like
    //  output: '�PNG\r\n' +
    //         '\x1A\n' + ...
    expect(JSON.stringify(result)).toContain('PNG');
  });

  test('test s3 get file with binary resource type', async () => {
    const result = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      mutableOutput: new ExecutionOutput(),
      datasourceConfiguration: {
        authentication: {
          custom: {
            accessKeyID: {
              key: 'accessKeyID',
              value: USER3_ACCESS_KEY_ID
            },
            secretKey: {
              key: 'secretKey',
              value: USER3_SECRET_KEY
            },
            region: {
              key: 'region',
              value: REGION
            }
          }
        }
      },
      actionConfiguration: {
        action: S3ActionType.GET_OBJECT,
        resource: 'superblocks-temp',
        path: 'ro-test.png',
        responseType: ActionResponseType.BINARY
      }
    });
    // This is the expected output
    // output: {
    //   type: 'Buffer',
    //   data: [ 137,  80,  78,  71,  13,  10,  26,  10,   0,   0,   0,  13, ... ]
    // }
    expect(JSON.stringify(result)).toContain('Buffer');
  });
});
