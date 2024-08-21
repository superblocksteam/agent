import * as semver from 'semver';
import { SemVer } from '../plugin';

export enum AgentType {
  MULTITENANT = 0,
  DEDICATED = 1,
  ONPREMISE = 2
}

export type AgentTags = Record<string, string[]>;

// This function returns a descriptive name for each known agent type
export const getAgentTypeName = (agentType: AgentType): string => {
  switch (agentType) {
    case AgentType.DEDICATED:
    case AgentType.MULTITENANT:
      return 'Cloud';
    case AgentType.ONPREMISE:
      return 'On-premise';
  }
};

export enum AgentStatus {
  ACTIVE = 'Active',
  DISCONNECTED = 'Disconnected',
  BROWSER_UNREACHABLE = 'Browser Unreachable',
  // TODO: remove PENDING_REGISTRATION after the DB migration
  PENDING_REGISTRATION = 'Pending Registration',
  STALE = 'Stale'
}

export type Agents = Record<string, Agent>;

export type Agent = {
  id: string;
  key: string;
  environment: string;
  status: AgentStatus;
  version: string;
  versionExternal: string;
  supportedPluginVersions: Record<string, SemVer[]>;
  url: string;
  type: AgentType;
  updated: Date;
  created: Date;
  tags: AgentTags;
  verificationKeyIds?: null | string[];
  verificationKeys?: null | Record<string, string>;
  signingKeyId?: null | string;
};

export type AgentKey = {
  key: string;
};

export const compareSemVer = (version1: SemVer, version2: SemVer): number => {
  if (!semver.valid(version1)) {
    throw new Error(`Invalid semver ${version1}.`);
  }

  if (!semver.valid(version2)) {
    throw new Error(`Invalid semver ${version2}.`);
  }

  return semver.compare(version1, version2);
};

/**
 * Return a negative number if version1 is lower than version2;
 * positive if the version1 is greater than version2;
 * 0 if they are equivalent.
 *
 * If the versions are both invalid, return 0.
 * Otherwise, the valid version is treated as greater than an invalid version.
 */
export const compareAgentExternalVersions = ({ currentVersion, minVersion }: { currentVersion: string; minVersion: string }): number => {
  const isCurrentVersionValid = semver.valid(currentVersion);
  const isMinVersionValid = semver.valid(minVersion);

  // If both versions are invalid, return 0.
  if (!isCurrentVersionValid && !isMinVersionValid) {
    return 0;
  }

  if (!isCurrentVersionValid) {
    // If the current version is invalid, treat it as lower than the min version.
    return -1;
  } else if (!isMinVersionValid) {
    // If the min version is invalid, treat it as lower than the current version.
    return 1;
  }

  return semver.compare(currentVersion, minVersion);
};
