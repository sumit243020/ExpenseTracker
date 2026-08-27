import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config';
import type {
  AuthTokens,
  CurrencyCode,
  PendingExpense,
  ShakeSensitivity,
  UserProfile,
} from '../types';

/** Persist OAuth tokens in encrypted secure storage. */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, tokens.accessToken);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  }
  if (tokens.expiresAt != null) {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.tokenExpiry,
      String(tokens.expiresAt),
    );
  }
}

export async function getTokens(): Promise<AuthTokens | null> {
  const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
  if (!accessToken) return null;
  const refreshToken =
    (await SecureStore.getItemAsync(STORAGE_KEYS.refreshToken)) ?? undefined;
  const expiryRaw = await SecureStore.getItemAsync(STORAGE_KEYS.tokenExpiry);
  return {
    accessToken,
    refreshToken,
    expiresAt: expiryRaw ? Number(expiryRaw) : undefined,
  };
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.tokenExpiry);
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(user));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userProfile);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearUserProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.userProfile);
}

export async function saveSpreadsheetId(
  id: string,
  email?: string,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.spreadsheetId, id);
  if (email) {
    await AsyncStorage.setItem(
      STORAGE_KEYS.spreadsheetEmail,
      email.trim().toLowerCase(),
    );
  }
}

export async function getSpreadsheetId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.spreadsheetId);
}

/** Spreadsheet cache is only valid when it belongs to this Google account. */
export async function getSpreadsheetIdForEmail(
  email: string,
): Promise<string | null> {
  const [id, boundEmail] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.spreadsheetId),
    AsyncStorage.getItem(STORAGE_KEYS.spreadsheetEmail),
  ]);
  if (!id) return null;
  if (
    !boundEmail ||
    boundEmail.trim().toLowerCase() !== email.trim().toLowerCase()
  ) {
    return null;
  }
  return id;
}

export async function clearSpreadsheetId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.spreadsheetId);
  await AsyncStorage.removeItem(STORAGE_KEYS.spreadsheetEmail);
}

export async function getPendingQueue(): Promise<PendingExpense[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.pendingQueue);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingExpense[];
  } catch {
    return [];
  }
}

export async function setPendingQueue(queue: PendingExpense[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.pendingQueue, JSON.stringify(queue));
}

export async function enqueuePending(expense: PendingExpense): Promise<void> {
  const queue = await getPendingQueue();
  queue.push(expense);
  await setPendingQueue(queue);
}

export async function getCurrency(): Promise<CurrencyCode> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.currency);
  return (value as CurrencyCode) || 'INR';
}

export async function setCurrency(code: CurrencyCode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.currency, code);
}

export async function getMonthlyBudget(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.monthlyBudget);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function setMonthlyBudget(amount: number | null): Promise<void> {
  if (amount == null) {
    await AsyncStorage.removeItem(STORAGE_KEYS.monthlyBudget);
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.monthlyBudget, String(amount));
  }
}

export async function getBudgetAlertsEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.budgetAlertsEnabled);
  return raw === 'true';
}

export async function setBudgetAlertsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.budgetAlertsEnabled, String(enabled));
}

export async function getShakeSensitivity(): Promise<ShakeSensitivity> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.shakeSensitivity);
  if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
  return 'medium';
}

export async function setShakeSensitivity(
  level: ShakeSensitivity,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.shakeSensitivity, level);
}

/** Clears all auth-related local data on logout / account switch. */
export async function clearAllAuthData(): Promise<void> {
  await clearTokens();
  await clearUserProfile();
  await clearSpreadsheetId();
  await AsyncStorage.removeItem(STORAGE_KEYS.pendingQueue);
}
