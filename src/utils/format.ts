import type { CurrencyCode, ExpenseCategory } from '../types';
import { colors } from '../constants/theme';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCY_SYMBOLS[code] ?? '₹';
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const CATEGORY_META: Record<
  ExpenseCategory,
  { icon: string; color: string }
> = {
  Food: { icon: '🍽️', color: '#F97316' },
  Travel: { icon: '✈️', color: '#3B82F6' },
  Shopping: { icon: '🛍️', color: '#A855F7' },
  Bills: { icon: '📄', color: '#64748B' },
  Health: { icon: '💊', color: '#EF4444' },
  Entertainment: { icon: '🎬', color: '#EC4899' },
  Other: { icon: '📦', color: colors.primary },
};
