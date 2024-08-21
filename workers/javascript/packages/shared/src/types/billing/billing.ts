export enum BillingPlan {
  TRIAL = 'TRIAL',
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export type Billing = {
  plan: BillingPlan;
  isExpired: boolean;
  expiryDate: Date;
  daysLeft: number;
};
