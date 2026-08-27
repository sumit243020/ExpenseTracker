import * as Crypto from 'expo-crypto';
import {
  SHEET_HEADERS,
  SHEET_TAB_NAME,
} from '../config';
import type { Expense, ExpenseCategory, PendingExpense } from '../types';
import {
  getSpreadsheetIdForEmail,
  saveSpreadsheetId,
} from './storage';
import { getValidAccessToken } from './google-auth';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';

export interface NewExpenseInput {
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  rowId?: string;
  createdAt?: string;
}

function sheetFileName(email: string): string {
  return `ExpenseTracker_${email}`;
}

async function authHeaders(accessToken?: string): Promise<HeadersInit> {
  const token = accessToken ?? (await getValidAccessToken());
  if (!token) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function mapRowToExpense(
  row: string[],
  sheetRowIndex: number,
): Expense | null {
  const [rowId, date, description, category, amountRaw, createdAt] = row;
  if (!rowId || !date) return null;
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) return null;
  return {
    rowId,
    date,
    description: description ?? '',
    category: (category as ExpenseCategory) || 'Other',
    amount,
    createdAt: createdAt ?? new Date().toISOString(),
    sheetRowIndex,
  };
}

/**
 * Finds or creates ExpenseTracker_<email> in the LOGGED-IN user's Drive.
 * Uses that user's OAuth access token — never a shared/service sheet.
 * Client IDs in config.ts only authenticate the app; sheet ownership is per user.
 */
export async function findOrCreateUserSheet(
  email: string,
  accessToken: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  if (accessToken === 'demo-token') {
    const demoId = 'demo-spreadsheet';
    await saveSpreadsheetId(demoId, normalizedEmail);
    return demoId;
  }

  const expectedName = sheetFileName(normalizedEmail);
  const cached = await getSpreadsheetIdForEmail(normalizedEmail);

  if (cached && cached !== 'demo-spreadsheet') {
    try {
      const check = await fetch(
        `${DRIVE_BASE}/files/${cached}?fields=id,name,trashed`,
        { headers: await authHeaders(accessToken) },
      );
      if (check.ok) {
        const meta = (await check.json()) as {
          id: string;
          name?: string;
          trashed?: boolean;
        };
        // Only reuse cache if this file still belongs to this user email
        if (
          !meta.trashed &&
          meta.name?.toLowerCase() === expectedName.toLowerCase()
        ) {
          return cached;
        }
      }
    } catch {
      // fall through to search/create
    }
  }

  const query = encodeURIComponent(
    `name='${expectedName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
  );
  const searchRes = await fetch(
    `${DRIVE_BASE}/files?q=${query}&spaces=drive&fields=files(id,name)`,
    { headers: await authHeaders(accessToken) },
  );
  if (!searchRes.ok) {
    throw new Error(`Drive search failed (${searchRes.status})`);
  }
  const searchData = (await searchRes.json()) as {
    files?: { id: string; name: string }[];
  };
  const existing = searchData.files?.[0];
  if (existing?.id) {
    await saveSpreadsheetId(existing.id, normalizedEmail);
    return existing.id;
  }

  // Create spreadsheet in THIS user's Drive via their token
  const createRes = await fetch(SHEETS_BASE, {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({
      properties: { title: expectedName },
      sheets: [{ properties: { title: SHEET_TAB_NAME } }],
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Failed to create spreadsheet (${createRes.status})`);
  }
  const created = (await createRes.json()) as { spreadsheetId: string };
  const spreadsheetId = created.spreadsheetId;

  // Write header row
  const headerRes = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
      `${SHEET_TAB_NAME}!A1:F1`,
    )}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: await authHeaders(accessToken),
      body: JSON.stringify({ values: [[...SHEET_HEADERS]] }),
    },
  );
  if (!headerRes.ok) {
    throw new Error(`Failed to write sheet headers (${headerRes.status})`);
  }

  await saveSpreadsheetId(spreadsheetId, normalizedEmail);
  return spreadsheetId;
}

/**
 * Appends a new expense row. Generates a UUID RowID client-side.
 */
export async function appendExpense(
  spreadsheetId: string,
  expense: NewExpenseInput,
  accessToken: string,
): Promise<Expense> {
  const rowId = expense.rowId ?? Crypto.randomUUID();
  const createdAt = expense.createdAt ?? new Date().toISOString();
  const row = [
    rowId,
    expense.date,
    expense.description,
    expense.category,
    String(expense.amount),
    createdAt,
  ];

  if (spreadsheetId === 'demo-spreadsheet' || accessToken === 'demo-token') {
    return {
      rowId,
      date: expense.date,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      createdAt,
    };
  }

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
      `${SHEET_TAB_NAME}!A:F`,
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: await authHeaders(accessToken),
      body: JSON.stringify({ values: [row] }),
    },
  );
  if (!res.ok) {
    throw new Error(`appendExpense failed (${res.status})`);
  }

  return {
    rowId,
    date: expense.date,
    description: expense.description,
    category: expense.category,
    amount: expense.amount,
    createdAt,
  };
}

/**
 * Reads all expense rows (skips header) into typed Expense[].
 */
export async function getAllExpenses(
  spreadsheetId: string,
  accessToken: string,
): Promise<Expense[]> {
  if (spreadsheetId === 'demo-spreadsheet' || accessToken === 'demo-token') {
    return [];
  }

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
      `${SHEET_TAB_NAME}!A:F`,
    )}`,
    { headers: await authHeaders(accessToken) },
  );
  if (!res.ok) {
    throw new Error(`getAllExpenses failed (${res.status})`);
  }
  const data = (await res.json()) as { values?: string[][] };
  const values = data.values ?? [];
  if (values.length <= 1) return [];

  const expenses: Expense[] = [];
  for (let i = 1; i < values.length; i++) {
    const mapped = mapRowToExpense(values[i], i + 1); // 1-based including header
    if (mapped) expenses.push(mapped);
  }
  return expenses;
}

function findSheetRowIndex(cached: Expense[], rowId: string): number {
  const found = cached.find((e) => e.rowId === rowId);
  if (found?.sheetRowIndex != null) return found.sheetRowIndex;
  throw new Error(`Expense row not found for RowID ${rowId}`);
}

/**
 * Updates the sheet row matching rowId using the cached sheetRowIndex.
 */
export async function updateExpense(
  spreadsheetId: string,
  rowId: string,
  updated: NewExpenseInput,
  accessToken: string,
  cached: Expense[],
): Promise<Expense> {
  const sheetRowIndex = findSheetRowIndex(cached, rowId);
  const existing = cached.find((e) => e.rowId === rowId)!;
  const createdAt = existing.createdAt;
  const row = [
    rowId,
    updated.date,
    updated.description,
    updated.category,
    String(updated.amount),
    createdAt,
  ];

  if (spreadsheetId === 'demo-spreadsheet' || accessToken === 'demo-token') {
    return {
      rowId,
      date: updated.date,
      description: updated.description,
      category: updated.category,
      amount: updated.amount,
      createdAt,
      sheetRowIndex,
    };
  }

  const range = `${SHEET_TAB_NAME}!A${sheetRowIndex}:F${sheetRowIndex}`;
  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
      range,
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: await authHeaders(accessToken),
      body: JSON.stringify({ values: [row] }),
    },
  );
  if (!res.ok) {
    throw new Error(`updateExpense failed (${res.status})`);
  }

  return {
    rowId,
    date: updated.date,
    description: updated.description,
    category: updated.category,
    amount: updated.amount,
    createdAt,
    sheetRowIndex,
  };
}

/**
 * Deletes the sheet row for rowId via deleteDimension batchUpdate.
 */
export async function deleteExpense(
  spreadsheetId: string,
  rowId: string,
  accessToken: string,
  cached: Expense[],
): Promise<void> {
  const sheetRowIndex = findSheetRowIndex(cached, rowId);

  if (spreadsheetId === 'demo-spreadsheet' || accessToken === 'demo-token') {
    return;
  }

  // Get sheetId (gid) for Expenses tab
  const metaRes = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties`,
    { headers: await authHeaders(accessToken) },
  );
  if (!metaRes.ok) {
    throw new Error(`Failed to load sheet metadata (${metaRes.status})`);
  }
  const meta = (await metaRes.json()) as {
    sheets: { properties: { sheetId: number; title: string } }[];
  };
  const sheet = meta.sheets.find((s) => s.properties.title === SHEET_TAB_NAME);
  if (!sheet) throw new Error('Expenses tab not found');

  // sheetRowIndex is 1-based; deleteDimension uses 0-based startIndex
  const startIndex = sheetRowIndex - 1;
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: await authHeaders(accessToken),
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex,
              endIndex: startIndex + 1,
            },
          },
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`deleteExpense failed (${res.status})`);
  }
}

/** Flush offline pending queue to the sheet. */
export async function syncPendingExpenses(
  spreadsheetId: string,
  accessToken: string,
  queue: PendingExpense[],
): Promise<Expense[]> {
  const synced: Expense[] = [];
  for (const item of queue) {
    const expense = await appendExpense(spreadsheetId, item, accessToken);
    synced.push(expense);
  }
  return synced;
}
