import type { Expense } from '../types';
import { CATEGORY_META, parseDateKey, startOfDay, toDateKey } from './format';

export function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function expensesToday(expenses: Expense[], now = new Date()): Expense[] {
  const key = toDateKey(now);
  return expenses.filter((e) => e.date === key);
}

export function expensesThisWeek(
  expenses: Expense[],
  now = new Date(),
): Expense[] {
  const today = startOfDay(now);
  const day = today.getDay(); // 0 Sun
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  return expenses.filter((e) => {
    const d = parseDateKey(e.date);
    return d >= weekStart && d <= today;
  });
}

export function expensesThisMonth(
  expenses: Expense[],
  now = new Date(),
): Expense[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  return expenses.filter((e) => {
    const d = parseDateKey(e.date);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

export function categoryBreakdown(
  expenses: Expense[],
): { category: string; amount: number; color: string }[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      color:
        CATEGORY_META[category as keyof typeof CATEGORY_META]?.color ??
        '#0F766E',
    }))
    .sort((a, b) => b.amount - a.amount);
}
