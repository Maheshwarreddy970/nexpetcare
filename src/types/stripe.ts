
// ✅ Simplified - just for documentation
export type StripeSubscriptionWithPeriod = {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  current_period_start: number;
};
