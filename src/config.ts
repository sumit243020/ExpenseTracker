export const APP_NAME = 'ExpenseTracker';
export const APP_TAGLINE = 'Track every rupee, effortlessly';

export const STORAGE_KEYS = {
  userProfile: 'et_user_profile',
  sessionEmail: 'et_session_email',
  expensesPrefix: 'et_expenses_',
  currency: 'et_currency',
  monthlyBudget: 'et_monthly_budget',
  budgetAlertsEnabled: 'et_budget_alerts',
  shakeSensitivity: 'et_shake_sensitivity',
} as const;

export function expensesKeyForEmail(email: string): string {
  return `${STORAGE_KEYS.expensesPrefix}${email.trim().toLowerCase()}`;
}
