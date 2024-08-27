import { Timestamp } from '@bufbuild/protobuf';
import { Metadata } from '@superblocksteam/types';

export type ResourceMetadata = object;

export const buildCommonMetadata = ({
  id,
  type,
  organization,
  timestamp,
  tags
}: {
  id: string;
  type: string;
  organization: string;
  timestamp?: {
    created: Date;
    updated: Date;
    deactivated: Date | null;
  };
  tags?: {
    [key: string]: string;
  };
}): Metadata => {
  let timestamps;
  if (timestamp) {
    timestamps = {
      created: Timestamp.fromDate(timestamp.created),
      updated: Timestamp.fromDate(timestamp.updated),
      deactivated: timestamp.deactivated ? Timestamp.fromDate(timestamp.deactivated) : undefined
    };
  }
  return {
    id,
    type,
    organization,
    timestamps,
    tags
  } as Metadata;
};
