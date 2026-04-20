import { describe, expect, it } from '@jest/globals';
import { ExecutionContext, ExecutionOutput, KVStore, VariableType } from '@superblocks/shared';

import { executeCode } from './bootstrap';
import { MockKVStore } from './kvStoreMock';

/**
 * Validates that customer-facing npm dependencies remain functional across
 * Node.js version upgrades. Each test exercises a real require() + usage
 * pattern inside the VM2 sandbox, matching what deployed customer apps do.
 *
 * If any of these tests break after a Node upgrade, it means customer
 * applications using that dependency will also break.
 */
describe('Node.js runtime compatibility: customer-facing dependencies', () => {
  async function runInSandbox(code: string): Promise<ExecutionOutput> {
    const mockStore = new MockKVStore();
    await mockStore.write('testVar', 'test-value');
    const context: ExecutionContext = new ExecutionContext();
    context.variables = {
      testVar: {
        key: 'testVar',
        type: VariableType.Native,
        mode: 'read'
      }
    };
    context.kvStore = mockStore as unknown as KVStore;
    const files: Array<{ originalname: string; path: string }> = [];
    const inheritedEnv: string[] = [];

    return executeCode({ context, code, files, inheritedEnv });
  }

  describe('lodash', () => {
    it('should perform basic operations', async () => {
      const result = await runInSandbox(`
        const _ = require('lodash');
        const arr = [1, 2, 3, 4, 5];
        return {
          chunk: _.chunk(arr, 2),
          uniq: _.uniq([1, 1, 2, 3, 3]),
          get: _.get({ a: { b: 42 } }, 'a.b'),
          version: typeof _.VERSION === 'string'
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        chunk: [[1, 2], [3, 4], [5]],
        uniq: [1, 2, 3],
        get: 42,
        version: true
      });
    });
  });

  describe('moment and moment-timezone', () => {
    it('should parse dates and format with timezones', async () => {
      const result = await runInSandbox(`
        const moment = require('moment');
        require('moment-timezone');
        const d = moment('2024-01-15T12:00:00Z');
        return {
          formatted: d.format('YYYY-MM-DD'),
          unix: typeof d.unix() === 'number',
          tz: moment.tz('2024-01-15T12:00:00', 'America/New_York').format('Z')
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        formatted: '2024-01-15',
        unix: true,
        tz: '-05:00'
      });
    });
  });

  describe('axios', () => {
    it('should construct instances and validate configuration', async () => {
      const result = await runInSandbox(`
        const axios = require('axios');
        const instance = axios.create({
          baseURL: 'https://api.example.com',
          timeout: 5000,
          headers: { 'X-Custom': 'test' }
        });
        return {
          hasGet: typeof instance.get === 'function',
          hasPost: typeof instance.post === 'function',
          hasInterceptors: typeof instance.interceptors === 'object',
          defaultTimeout: instance.defaults.timeout
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        hasGet: true,
        hasPost: true,
        hasInterceptors: true,
        defaultTimeout: 5000
      });
    });
  });

  describe('aws-sdk v2', () => {
    it('should construct service clients and build requests', async () => {
      const result = await runInSandbox(`
        const AWS = require('aws-sdk');
        AWS.config.update({ region: 'us-east-1', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } });
        const s3 = new AWS.S3();
        const dynamo = new AWS.DynamoDB();
        const params = { Bucket: 'test-bucket', Key: 'test-key' };
        const req = s3.getObject(params);
        return {
          s3Type: typeof s3.getObject === 'function',
          dynamoType: typeof dynamo.putItem === 'function',
          hasRequest: typeof req.promise === 'function',
          region: AWS.config.region
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        s3Type: true,
        dynamoType: true,
        hasRequest: true,
        region: 'us-east-1'
      });
    });
  });

  describe('jsonwebtoken', () => {
    it('should sign and verify tokens', async () => {
      const result = await runInSandbox(`
        const jwt = require('jsonwebtoken');
        const secret = 'test-secret-key-for-compat-test';
        const payload = { sub: '1234567890', name: 'Test User' };
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });
        const decoded = jwt.verify(token, secret);
        return {
          hasToken: typeof token === 'string' && token.split('.').length === 3,
          sub: decoded.sub,
          name: decoded.name
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        hasToken: true,
        sub: '1234567890',
        name: 'Test User'
      });
    });
  });

  describe('date-fns', () => {
    it('should format and manipulate dates', async () => {
      const result = await runInSandbox(`
        const { format, addDays, parseISO } = require('date-fns');
        const date = parseISO('2024-01-15');
        return {
          formatted: format(date, 'yyyy-MM-dd'),
          plusWeek: format(addDays(date, 7), 'yyyy-MM-dd')
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        formatted: '2024-01-15',
        plusWeek: '2024-01-22'
      });
    });
  });

  describe('xmlbuilder2', () => {
    it('should build and serialize XML', async () => {
      const result = await runInSandbox(`
        const { create } = require('xmlbuilder2');
        const doc = create({ version: '1.0' })
          .ele('root')
            .ele('item').att('id', '1').txt('hello').up()
          .up();
        const xml = doc.end({ prettyPrint: false });
        return {
          hasXmlDecl: xml.includes('<?xml'),
          hasRoot: xml.includes('<root>'),
          hasItem: xml.includes('<item id="1">hello</item>')
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        hasXmlDecl: true,
        hasRoot: true,
        hasItem: true
      });
    });
  });

  describe('base64url', () => {
    it('should encode and decode', async () => {
      const result = await runInSandbox(`
        const base64url = require('base64url');
        const encoded = base64url('Hello, World!');
        const decoded = base64url.decode(encoded);
        return { encoded, decoded };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        encoded: 'SGVsbG8sIFdvcmxkIQ',
        decoded: 'Hello, World!'
      });
    });
  });

  describe('crypto (Node.js built-in)', () => {
    it('should perform hashing and random generation', async () => {
      const result = await runInSandbox(`
        const hash = crypto.createHash('sha256').update('test').digest('hex');
        const uuid = crypto.randomUUID();
        const bytes = crypto.randomBytes(16);
        return {
          hashLength: hash.length,
          hashPrefix: hash.substring(0, 8),
          uuidFormat: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid),
          bytesLength: bytes.length
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        hashLength: 64,
        hashPrefix: '9f86d081',
        uuidFormat: true,
        bytesLength: 16
      });
    });
  });

  describe('esprima', () => {
    it('should parse JavaScript', async () => {
      const result = await runInSandbox(`
        const esprima = require('esprima');
        const ast = esprima.parseScript('var x = 42;');
        return {
          type: ast.type,
          bodyLength: ast.body.length,
          declType: ast.body[0].type
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        type: 'Program',
        bodyLength: 1,
        declType: 'VariableDeclaration'
      });
    });
  });

  describe('jmespath', () => {
    it('should query JSON structures', async () => {
      const result = await runInSandbox(`
        const jmespath = require('jmespath');
        const data = { people: [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }] };
        return {
          names: jmespath.search(data, 'people[*].name'),
          first: jmespath.search(data, 'people[0].name')
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        names: ['Alice', 'Bob'],
        first: 'Alice'
      });
    });
  });

  describe('cuid2', () => {
    it('should generate unique IDs', async () => {
      const result = await runInSandbox(`
        const { createId } = require('@paralleldrive/cuid2');
        const id1 = createId();
        const id2 = createId();
        return {
          isString: typeof id1 === 'string',
          hasLength: id1.length > 0,
          unique: id1 !== id2
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        isString: true,
        hasLength: true,
        unique: true
      });
    });
  });

  describe('Node.js built-in modules', () => {
    it('should access allowed built-in modules', async () => {
      const result = await runInSandbox(`
        const path = require('path');
        const url = require('url');
        const qs = require('querystring');
        const buffer = require('buffer');
        const util = require('util');
        return {
          pathJoin: path.join('/tmp', 'test', 'file.txt'),
          urlParse: typeof url.parse === 'function',
          qsStringify: qs.stringify({ a: '1', b: '2' }),
          bufferFrom: buffer.Buffer.from('hello').toString('base64'),
          utilFormat: util.format('hello %s', 'world')
        };
      `);
      expect(result.error).not.toBeDefined();
      expect(result.output).toEqual({
        pathJoin: '/tmp/test/file.txt',
        urlParse: true,
        qsStringify: 'a=1&b=2',
        bufferFrom: 'aGVsbG8=',
        utilFormat: 'hello world'
      });
    });
  });

  describe('process.version reports correct Node.js version', () => {
    it('should report a valid semver version string', async () => {
      const result = await runInSandbox(`
        return {
          version: process.version,
          isSemver: /^v\\d+\\.\\d+\\.\\d+$/.test(process.version)
        };
      `);
      expect(result.error).not.toBeDefined();
      expect((result.output as Record<string, unknown>).isSemver).toBe(true);
    });
  });
});
