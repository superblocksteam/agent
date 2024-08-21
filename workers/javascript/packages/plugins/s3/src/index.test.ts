import { GetObjectCommandInput, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { Options } from '@aws-sdk/lib-storage';
import { DUMMY_EXECUTE_COMMON_PARAMETERS, ExecutionOutput, S3ActionType } from '@superblocks/shared';
import S3Plugin from '.';

const DUMMY_ZIP_FILE = {
  destination: '/temp-folder/dev-agent-key',
  fieldname: 'files',
  filename: 'uppy-superblocks_master_zip-1d-1e-application_zip-11343326-1669048984124_dev-agent-key',
  mimetype: 'application/zip',
  originalname: 'uppy-superblocks_master_zip-1d-1e-application_zip-11343326-1669048984124',
  path: '/temp-folder/dev-agent-key/uppy-superblocks_master_zip-1d-1e-application_zip-11343326-1669048984124_dev-agent-key'
};

const DUMMY_ZIP_FILE_OBJECT = {
  name: 'superblocks-master.zip',
  extension: 'zip',
  type: 'application/zip',
  size: 1005,
  encoding: 'text',
  $superblocksId: 'uppy-superblocks_master_zip-1d-1e-application_zip-11343326-1669048984124'
};

let putObjectCommandconstructorArgs: PutObjectCommandInput;
let getObjectCommandConstructorArgs: GetObjectCommandInput;
let uploadConstructorArgs: Options;

const sendMock: jest.Mock = jest.fn();
const doneMock: jest.Mock = jest.fn().mockReturnValue({
  Key: 'superblocks-master.zip',
  Bucket: 'fancy-bucket',
  ETag: '"123123123XYxyzabc123abcXYZABCDAB"',
  Location: 'https://fancy-bucket.s3.amazonaws.com/superblocks-master.zip'
});

jest.mock('@aws-sdk/client-s3', () => {
  const s3ClientMock = jest.fn().mockImplementation(() => {
    return {
      send: sendMock
    };
  });

  return {
    PutObjectCommand: jest.fn().mockImplementation(function (input: PutObjectCommandInput) {
      putObjectCommandconstructorArgs = input;
      this.input = input;
    }),
    GetObjectCommand: jest.fn().mockImplementation(function (input: GetObjectCommandInput) {
      getObjectCommandConstructorArgs = input;
    }),
    S3Client: s3ClientMock
  };
});

jest.mock('@superblocks/shared', () => {
  const originalModule = jest.requireActual('@superblocks/shared');
  return {
    __esModule: true,
    ...originalModule,
    getFileStream: jest.fn((context, location) => {
      return 'some content';
    })
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockReturnValue('https://fancy-bucket.s3.us-west-2.amazonaws.com/superblocks-master.zip?extra_headers')
}));

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(function (options: Options) {
    uploadConstructorArgs = options;
    this.on = jest.fn();
    this.done = doneMock;
  })
}));

describe('s3 upload', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockImplementation(async () => ({
      Location: 'https://fancy-bucket.s3.amazonaws.com/superblocks-master.zip',
      ETag: '"123123123XYxyzabc123abcXYZABCDAB"',
      Bucket: 'fancy-bucket',
      Key: 'superblocks-master.zip'
    }));
  });
  const plugin: S3Plugin = new S3Plugin();
  test('uploading single file, happy path scenario', async () => {
    const uploadObjectResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      datasourceConfiguration: {},
      mutableOutput: new ExecutionOutput(),
      actionConfiguration: {
        action: S3ActionType.UPLOAD_OBJECT,
        resource: 'fancy-bucket',
        path: 'superblocks-master.zip',
        body: 'some content'
      },
      files: [DUMMY_ZIP_FILE]
    });
    expect(uploadObjectResult).toEqual({
      log: [],
      structuredLog: [],
      output: {
        Bucket: 'fancy-bucket',
        ETag: '"123123123XYxyzabc123abcXYZABCDAB"',
        Key: 'superblocks-master.zip',
        Location: 'https://fancy-bucket.s3.amazonaws.com/superblocks-master.zip',
        presignedURL: 'https://fancy-bucket.s3.us-west-2.amazonaws.com/superblocks-master.zip?extra_headers'
      }
    });
    expect(getObjectCommandConstructorArgs).toEqual({
      Bucket: 'fancy-bucket',
      Key: 'superblocks-master.zip'
    });
    expect(putObjectCommandconstructorArgs).toEqual({
      Body: 'some content',
      Bucket: 'fancy-bucket',
      ContentType: 'application/zip',
      Key: 'superblocks-master.zip'
    });
    expect(sendMock).toBeCalledTimes(1);
  });
  test('uploading multiple files, happy path scenario', async () => {
    const uploadMulitpleResult = await plugin.execute({
      ...DUMMY_EXECUTE_COMMON_PARAMETERS,
      datasourceConfiguration: {},
      mutableOutput: new ExecutionOutput(),
      actionConfiguration: {
        action: S3ActionType.UPLOAD_MULTIPLE_OBJECTS,
        resource: 'fancy-bucket',
        fileObjects: JSON.stringify([DUMMY_ZIP_FILE_OBJECT])
      },
      files: [DUMMY_ZIP_FILE]
    });
    expect(uploadMulitpleResult).toEqual({
      log: [],
      structuredLog: [],
      output: [
        {
          Bucket: 'fancy-bucket',
          ETag: '"123123123XYxyzabc123abcXYZABCDAB"',
          Key: 'superblocks-master.zip',
          Location: 'https://fancy-bucket.s3.amazonaws.com/superblocks-master.zip',
          presignedURL: 'https://fancy-bucket.s3.us-west-2.amazonaws.com/superblocks-master.zip?extra_headers'
        }
      ]
    });
    expect(getObjectCommandConstructorArgs).toEqual({
      Bucket: 'fancy-bucket',
      Key: 'superblocks-master.zip'
    });
    expect(putObjectCommandconstructorArgs).toEqual({
      Body: 'some content',
      Bucket: 'fancy-bucket',
      ContentType: 'application/zip',
      Key: 'superblocks-master.zip'
    });
    expect(uploadConstructorArgs).toEqual({
      client: expect.anything(),
      params: {
        Bucket: 'fancy-bucket',
        Key: 'superblocks-master.zip',
        Body: 'some content'
      }
    });
  });
});
