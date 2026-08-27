import type { Expense } from '../types';
import {
  enqueuePending,
  getPendingQueue,
  setPendingQueue,
} from './storage';
import {
  appendExpense,
  findOrCreateUserSheet,
  getAllExpenses,
  syncPendingExpenses,
} from './sheets-api';
import { useAppStore } from '../store/useAppStore';
import { getValidAccessToken } from './google-auth';

/** Ensure sheet exists and load all expenses into the store. */
export async function bootstrapExpenses(): Promise<void> {
  const store = useAppStore.getState();
  const { user, accessToken } = store;
  if (!user || !accessToken) return;

  store.setSyncing(true);
  try {
    const token = (await getValidAccessToken()) ?? accessToken;
    const spreadsheetId = await findOrCreateUserSheet(user.email, token);
    store.setSpreadsheetId(spreadsheetId);

    if (token !== 'demo-token') {
      const remote = await getAllExpenses(spreadsheetId, token);
      store.setExpenses(remote);
    }
  } finally {
    store.setSyncing(false);
  }
}

export async function refreshExpenses(): Promise<void> {
  const store = useAppStore.getState();
  const { spreadsheetId, accessToken } = store;
  if (!spreadsheetId || !accessToken || accessToken === 'demo-token') return;

  store.setSyncing(true);
  try {
    const token = (await getValidAccessToken()) ?? accessToken;
    const remote = await getAllExpenses(spreadsheetId, token);
    store.setExpenses(remote);
  } finally {
    store.setSyncing(false);
  }
}

export async function flushPendingQueue(): Promise<void> {
  const store = useAppStore.getState();
  const { spreadsheetId, accessToken } = store;
  if (!spreadsheetId || !accessToken || accessToken === 'demo-token') return;

  const queue = await getPendingQueue();
  if (queue.length === 0) return;

  const token = (await getValidAccessToken()) ?? accessToken;
  const synced = await syncPendingExpenses(spreadsheetId, token, queue);
  for (const e of synced) store.upsertExpense(e);
  await setPendingQueue([]);

  // Re-fetch so sheetRowIndex values are accurate
  await refreshExpenses();
}

export async function saveExpenseOnlineOrQueue(input: {
  date: string;
  description: string;
  category: Expense['category'];
  amount: number;
}): Promise<{ queued: boolean }> {
  const store = useAppStore.getState();
  const { spreadsheetId, accessToken } = store;
  if (!spreadsheetId || !accessToken) {
    throw new Error('Not ready to save expense');
  }

  try {
    const token = (await getValidAccessToken()) ?? accessToken;
    const expense = await appendExpense(spreadsheetId, input, token);
    store.upsertExpense(expense);
    if (token !== 'demo-token') {
      await refreshExpenses();
    }
    return { queued: false };
  } catch {
    const { randomUUID } = await import('expo-crypto');
    const pending = {
      rowId: randomUUID(),
      date: input.date,
      description: input.description,
      category: input.category,
      amount: input.amount,
      createdAt: new Date().toISOString(),
    };
    await enqueuePending(pending);
    store.upsertExpense(pending);
    return { queued: true };
  }
}
