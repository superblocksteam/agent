import { BillingPlan } from '../billing';
import { Agent } from '../organization';

export type AgentRegisterResponseDto = {
  agent: Agent;
  billingPlan?: BillingPlan;
  organizationId?: string;
  organizationName?: string;
};

export type AgentPingResponseDto = {
  billingPlan?: BillingPlan;
};
