import { AuditLogDto } from '../audit';
import { DiagnosticMetadata, Metrics } from '../common';
import { AgentType } from '../organization';
import { SupportedPluginVersions } from '../plugin';

export type PostRegistrationRequestBody = {
  pluginVersions: SupportedPluginVersions;
  type: AgentType;
};

export type PostDiagnosticRequestBody = DiagnosticMetadata;

export type PostHealthcheckRequestBody = Metrics;

export type PostAuditLogRequestBody = AuditLogDto;

export type PutAuditLogRequestBody = AuditLogDto & { id: string };
