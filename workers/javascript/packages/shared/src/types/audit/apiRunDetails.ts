import { ApiLocationContext } from '../api';
import { AuditLogDetails } from './audit';

export interface ApiRunDetails extends AuditLogDetails {
  target: string;
  locationContext?: ApiLocationContext;
  endTime?: Date;
  status?: ApiRunStatus;
  error?: string;
}

export enum ApiRunStatus {
  SUCCESS,
  FAIL
}

export function isApiRunDetails(details: AuditLogDetails | undefined): details is ApiRunDetails {
  if (!details) {
    return false;
  }
  return 'target' in details;
}
