export type ExpenseCategory =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Bills'
  | 'Health'
  | 'Entertainment'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
];

export interface Expense {
  rowId: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency?: CurrencyCode;
  monthlyBudget?: number | null;
  budgetAlertsEnabled?: boolean;
  shakeSensitivity?: ShakeSensitivity;
  photoUrl?: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type ShakeSensitivity = 'low' | 'medium' | 'high';

export interface ExpenseInput {
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
}

export const CATEGORY_META: Record<ExpenseCategory, { icon: string; color: string }> = {
  Food: { icon: 'restaurant-outline', color: '#F97316' },
  Travel: { icon: 'airplane-outline', color: '#3B82F6' },
  Shopping: { icon: 'bag-handle-outline', color: '#A855F7' },
  Bills: { icon: 'document-text-outline', color: '#64748B' },
  Health: { icon: 'medkit-outline', color: '#EF4444' },
  Entertainment: { icon: 'film-outline', color: '#EC4899' },
  Other: { icon: 'cube-outline', color: '#0F766E' },
};

export const STORAGE_KEYS = {
  userProfile: 'et_user_profile',
  sessionEmail: 'et_session_email',
  authToken: 'et_auth_token',
  expensesPrefix: 'et_expenses_',
  currency: 'et_currency',
  monthlyBudget: 'et_monthly_budget',
  budgetAlertsEnabled: 'et_budget_alerts',
  shakeSensitivity: 'et_shake_sensitivity',
} as const;

export function expensesKeyForEmail(email: string): string {
  return `${STORAGE_KEYS.expensesPrefix}${email.trim().toLowerCase()}`;
}
