import path from 'path';
import {
  AdlsActionConfiguration,
  AdlsDatasourceConfiguration,
  DUMMY_EXECUTION_CONTEXT,
  ExecutionOutput,
  PluginExecutionProps,
  RelayDelegate,
  prepContextForBindings
} from '@superblocks/shared';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import AdlsPlugin from '.';

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const LOCAL_DEV = process.env.ADLS_LOCAL_DEV; // safeguard to prevent running these tests in CI
const ACCOUNT_NAME = process.env.ACCOUNT_NAME;
const TENANT = process.env.TENANT;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const runTests = LOCAL_DEV ? describe : describe.skip;

const plugin: AdlsPlugin = new AdlsPlugin();
// @ts-ignore
plugin.logger = { debug: (): void => undefined, info: (): void => undefined, warn: (): void => undefined, error: (): void => undefined };

const validDatasourceConfiguration = {
  connection: {
    accountName: ACCOUNT_NAME,
    tenant: TENANT,
    auth: {
      config: {
        case: 'clientCredentials',
        value: {
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET
        }
      }
    }
  },
  name: 'ADLS Plugin Test'
} as AdlsDatasourceConfiguration;

export const DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS = {
  files: [],
  agentCredentials: {},
  recursionContext: {
    executedWorkflowsPath: [],
    isEvaluatingDatasource: false
  },
  environment: 'dev',
  relayDelegate: new RelayDelegate({
    body: {},
    headers: {},
    query: {}
  })
};

const context = DUMMY_EXECUTION_CONTEXT;

const props: PluginExecutionProps<AdlsDatasourceConfiguration, AdlsActionConfiguration> = {
  context,
  datasourceConfiguration: validDatasourceConfiguration,
  actionConfiguration: { adlsAction: undefined }, // this will be overridden by the test
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

const execute = async (actionConfiguration: AdlsActionConfiguration, allowError = false) => {
  const newProps = cloneDeep(props);
  newProps.actionConfiguration = actionConfiguration;
  const execOutput = await plugin.setupAndExecute({
    ...newProps,
    redactedContext: newProps.context,
    redactedDatasourceConfiguration: newProps.datasourceConfiguration
  });
  if (!allowError) {
    expect(execOutput.error).toEqual(undefined);
  }
  return execOutput;
};

const makeAction = (action: string, value: Record<string, unknown>) => {
  return {
    adlsAction: {
      case: action,
      value: { fileSystem: 'my-new-fs', ...value }
    }
  } as AdlsActionConfiguration;
};

runTests('ADLS Plugin', () => {
  describe('impossible states', () => {
    it('should throw when no action is specified', async () => {
      const ret = await execute({ adlsAction: undefined }, true);
      expect(ret.error).toEqual('No action selected');
    });

    it('should throw when an invalid action is specified', async () => {
      const ret = await execute(makeAction('invalidAction', {}), true);
      expect(ret.error).toContain('Unknown action');
    });

    it('should throw when creating a directory with no path', async () => {
      const ret = await execute(makeAction('createDirectory', {}), true);
      expect(ret.error).toContain('No path');
    });
  });

  describe('test', () => {
    it('should return success from test on valid connection', async () => {
      expect(await plugin.test(validDatasourceConfiguration));
    });
    it('should fail with invalid client secret', async () => {
      const invalidDatasourceConfiguration = cloneDeep(validDatasourceConfiguration);
      if (
        !invalidDatasourceConfiguration?.connection?.auth?.config?.value ||
        invalidDatasourceConfiguration.connection.auth.config.case !== 'clientCredentials'
      ) {
        throw new Error('Invalid auth');
      }
      invalidDatasourceConfiguration.connection.auth.config.value.clientSecret = 'bad';
      await expect(async () => {
        await plugin.test(invalidDatasourceConfiguration);
      }).rejects.toThrow();
    });
    it('should fail with invalid client id', async () => {
      const invalidDatasourceConfiguration = cloneDeep(validDatasourceConfiguration);
      if (
        !invalidDatasourceConfiguration?.connection?.auth?.config?.value ||
        invalidDatasourceConfiguration.connection.auth.config.case !== 'clientCredentials'
      ) {
        throw new Error('Invalid auth');
      }
      invalidDatasourceConfiguration.connection.auth.config.value.clientId = 'bad';
      await expect(async () => {
        await plugin.test(invalidDatasourceConfiguration);
      }).rejects.toThrow();
    });
    it('should fail with invalid account', async () => {
      const invalidDatasourceConfiguration = cloneDeep(validDatasourceConfiguration);
      if (
        !invalidDatasourceConfiguration?.connection?.auth?.config?.value ||
        invalidDatasourceConfiguration.connection.auth.config.case !== 'clientCredentials'
      ) {
        throw new Error('Invalid auth');
      }
      invalidDatasourceConfiguration.connection.accountName = 'bad';
      await expect(async () => {
        await plugin.test(invalidDatasourceConfiguration);
      }).rejects.toThrow();
    });
    it('should fail with invalid tenant', async () => {
      const invalidDatasourceConfiguration = cloneDeep(validDatasourceConfiguration);
      if (
        !invalidDatasourceConfiguration?.connection?.auth?.config?.value ||
        invalidDatasourceConfiguration.connection.auth.config.case !== 'clientCredentials'
      ) {
        throw new Error('Invalid auth');
      }
      invalidDatasourceConfiguration.connection.accountName = 'bad';
      await expect(async () => {
        await plugin.test(invalidDatasourceConfiguration);
      }).rejects.toThrow();
    });
  });

  describe('metadata', () => {
    it('should return all expected filesystems with a valid auth config', async () => {
      expect(await plugin.metadata(validDatasourceConfiguration)).toEqual({ adls: { fileSystems: ['my-filesystem', 'my-new-fs'] } });
    });

    it('should fail with invalid client secret', async () => {
      const invalidDatasourceConfiguration = cloneDeep(validDatasourceConfiguration);
      if (
        !invalidDatasourceConfiguration?.connection?.auth?.config?.value ||
        invalidDatasourceConfiguration.connection.auth.config.case !== 'clientCredentials'
      ) {
        throw new Error('Invalid auth');
      }
      invalidDatasourceConfiguration.connection.auth.config.value.clientSecret = 'bad';
      await expect(async () => {
        await plugin.test(invalidDatasourceConfiguration);
      }).rejects.toThrow();
    });
  });

  describe('execute', () => {
    it('handles directory operations', async () => {
      // This test is longer so that we can group a series of stateful
      // operations to make a stateless test.
      jest.setTimeout(60000);
      // This test walks through a series of stateful actions that test the
      // directory operations. Note that the entire test should be idempontent.

      const parentDir = 'my-new-dir';
      await execute(makeAction('createDirectory', { path: parentDir }), true);
      const originalDir = `${parentDir}/sub-dir`;
      const interDir = `${parentDir}/sub-dir/a`;
      const nestedDir = `${parentDir}/sub-dir/a/b`;
      const renameDir = `${parentDir}/rename-dir`;

      // Cleanup in case something went wrong in a previous iteration.
      await execute(makeAction('deleteDirectory', { path: originalDir }), true);
      await execute(makeAction('deleteDirectory', { path: renameDir }), true);
      await execute(makeAction('deleteDirectory', { path: interDir }), true);
      await execute(makeAction('deleteDirectory', { path: nestedDir }), true);

      // Assert that listDir doesn't find it.
      const listBefore = await execute(makeAction('listDirectoryContents', { path: parentDir }));
      expect(listBefore.output).not.toContain(originalDir);
      expect(listBefore.output).not.toContain(renameDir);

      // Create a dir.
      await execute(makeAction('createDirectory', { path: originalDir }));

      // Create a nested dir.
      await execute(makeAction('createDirectory', { path: nestedDir }));

      // Assert that it exists
      const listAfterCreate = await execute(makeAction('listDirectoryContents', { path: parentDir }));
      expect(listAfterCreate.output).toContain(originalDir);
      expect(listAfterCreate.output).toContain(nestedDir);
      expect(listAfterCreate.output).not.toContain(renameDir);

      // Rename it
      await execute(makeAction('renameDirectory', { path: originalDir, newPath: renameDir }));

      // Assert it was renamed
      const listAfterRename = await execute(makeAction('listDirectoryContents', { path: parentDir }));
      expect(listAfterRename.output).not.toContain(originalDir);
      expect(listAfterRename.output).toContain(renameDir);

      // Do a final cleanup, but don't allow failures here.
      await execute(makeAction('deleteDirectory', { path: renameDir }));
      // Deleting it again should result in an error.
      const ret = await execute(makeAction('deleteDirectory', { path: renameDir }), true);
      expect(ret.error).toContain('The specified path does not exist');
    });

    it('handles file upload and download', async () => {
      const parentDir = 'my-new-dir';
      await execute(makeAction('createDirectory', { path: parentDir }), true);
      const file = `${parentDir}/my-new-file.txt`;

      // Cleanup file if it exists
      await execute(makeAction('deleteFile', { path: file }), true);

      // Asserts that we can't read the file originally.
      const checkDNE = await execute(makeAction('downloadFile', { path: file }), true);
      expect(checkDNE.error).toContain('The specified blob does not exist');

      // Can upload content
      await execute(makeAction('uploadFile', { path: file, content: 'hello world' }));

      // Can download the content and read it
      const checkFileContent = await execute(makeAction('downloadFile', { path: file }));
      expect(checkFileContent.output).toEqual('hello world');

      // Re-uploads override
      await execute(makeAction('uploadFile', { path: file, content: 'another string' }));
      const checkFileContent2 = await execute(makeAction('downloadFile', { path: file }));
      expect(checkFileContent2.output).toEqual('another string');

      // Try uploading with no content.
      const uploadResp = await execute(makeAction('uploadFile', { path: file }), true);
      expect(uploadResp.error).toContain('No content to upload');
    });

    it('executes requests with bindings', async () => {
      const parentDir = 'binding-tests';
      const newDir = 'binding-tests/binding-dir-val';

      // Create parent if it doesn't exist
      await execute(makeAction('createDirectory', { path: parentDir }), true);

      // Define context variables
      prepContextForBindings(props.context, { binding1: 'binding-dir-val', contentBinding: 'hi there' });

      // Cleanup
      await execute(makeAction('deleteDirectory', { path: newDir }), true);

      const listBefore = await execute(makeAction('listDirectoryContents', { path: parentDir }));
      expect(listBefore.output).not.toContain(newDir);

      // Create a directory that's based on a binding
      await execute(makeAction('createDirectory', { path: `${parentDir}/{{binding1}}` }));

      const listAfter = await execute(makeAction('listDirectoryContents', { path: parentDir }));
      expect(listAfter.output).toContain(newDir);

      // Upload a file to that with content in bindings
      const checkDNE = await execute(makeAction('downloadFile', { path: `${parentDir}/{{binding1}}/file.txt` }), true);
      expect(checkDNE.error).toContain('The specified blob does not exist');

      await execute(makeAction('uploadFile', { path: `${parentDir}/{{binding1}}/file.txt`, content: '{{contentBinding}}' }));

      // Read the file and assert that the content is correct
      const checkFileContent = await execute(makeAction('downloadFile', { path: `${parentDir}/{{binding1}}/file.txt` }));
      expect(checkFileContent.output).toEqual('hi there');

      // Cleanup
      await execute(makeAction('deleteDirectory', { path: parentDir }), true);
    });
  });

  describe('describe request', () => {
    it('describes a request', async () => {
      const req = plugin.getRequest(makeAction('createDirectory', { directoryName: 'my-new-dir' }));
      expect(JSON.parse(req as string)).toEqual({
        action: 'createDirectory',
        fileSystem: 'my-new-fs',
        directoryName: 'my-new-dir'
      });
    });
  });
});
