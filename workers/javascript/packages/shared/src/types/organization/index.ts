import { PluginExecutionVersions } from '../plugin';
import { Agent } from './agent';

export const SUPERBLOCKS_ORG_NAME = 'superblockshq.com';
// for server tests
export const SUPERBLOCKS_TEST_ORG_NAME = 'superblocksservertest.com';
// for server tests
export const SUPERBLOCKS_TEST_ORG_NAME2 = 'superblocksservertest2.com';
// for manual testing
export const SUPERBLOCKS_MANUAL_TEST_ORG_NAME = 'superblockstest.com';
export const SUPERBLOCKS_SUPPORT = 'Superblocks Support';

export const VISITOR_ORG_NAME = 'visitor';

export type OrgBriefDto = {
  id: string;
  name: string;
};

export interface IOrganizationDto {
  id: string;
  name: string;
  email: string;
  slug: string;
  logoUrl: string;
  new: boolean;
  userPermissions: string[];

  agents: Agent[] | undefined;
  pluginExecutionVersions: PluginExecutionVersions;
  minExternalAgentVersion: string;
}

export * from './agent';
export * from './invite';
export * from './token';
