import { randomUUID } from 'expo-crypto';
import type { Expense } from '../types';
import {
  loadExpensesForEmail,
  saveExpensesForEmail,
} from './storage';
import { useAppStore } from '../store/useAppStore';

async function persistCurrentUserExpenses(expenses: Expense[]): Promise<void> {
  const email = useAppStore.getState().user?.email;
  if (!email) return;
  await saveExpensesForEmail(email, expenses);
}

/** Load this user's expenses from local storage into the store. */
export async function bootstrapExpenses(): Promise<void> {
  const store = useAppStore.getState();
  const email = store.user?.email;
  if (!email) return;

  store.setSyncing(true);
  try {
    const list = await loadExpensesForEmail(email);
    store.setExpenses(list);
  } finally {
    store.setSyncing(false);
  }
}

export async function refreshExpenses(): Promise<void> {
  await bootstrapExpenses();
}

export async function flushPendingQueue(): Promise<void> {
  // Local-only app — nothing to flush
}

export async function saveExpense(input: {
  date: string;
  description: string;
  category: Expense['category'];
  amount: number;
}): Promise<Expense> {
  const store = useAppStore.getState();
  if (!store.user?.email) throw new Error('Please log in first');

  const expense: Expense = {
    rowId: randomUUID(),
    date: input.date,
    description: input.description,
    category: input.category,
    amount: input.amount,
    createdAt: new Date().toISOString(),
  };

  store.upsertExpense(expense);
  await persistCurrentUserExpenses(useAppStore.getState().expenses);
  return expense;
}

export async function updateExpenseLocal(
  rowId: string,
  input: {
    date: string;
    description: string;
    category: Expense['category'];
    amount: number;
  },
): Promise<Expense> {
  const store = useAppStore.getState();
  const existing = store.expenses.find((e) => e.rowId === rowId);
  if (!existing) throw new Error('Expense not found');

  const updated: Expense = {
    ...existing,
    ...input,
  };
  store.upsertExpense(updated);
  await persistCurrentUserExpenses(useAppStore.getState().expenses);
  return updated;
}

export async function deleteExpenseLocal(rowId: string): Promise<void> {
  const store = useAppStore.getState();
  store.removeExpense(rowId);
  await persistCurrentUserExpenses(useAppStore.getState().expenses);
}

/** @deprecated use saveExpense */
export async function saveExpenseOnlineOrQueue(input: {
  date: string;
  description: string;
  category: Expense['category'];
  amount: number;
}): Promise<{ queued: boolean }> {
  await saveExpense(input);
  return { queued: false };
}
