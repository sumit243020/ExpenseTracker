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
  date: string; // YYYY-MM-DD
  description: string;
  category: ExpenseCategory;
  amount: number;
  createdAt: string; // ISO
  /** 1-based sheet row index including header (header = 1). Present when loaded from sheet. */
  sheetRowIndex?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type ShakeSensitivity = 'low' | 'medium' | 'high';

export interface PendingExpense {
  rowId: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}
