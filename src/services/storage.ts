import AsyncStorage from '@react-native-async-storage/async-storage';
import { expensesKeyForEmail, STORAGE_KEYS } from '../config';
import type {
  CurrencyCode,
  Expense,
  ShakeSensitivity,
  UserProfile,
} from '../types';

export async function saveUserProfile(user: UserProfile): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.userProfile, JSON.stringify(user)],
    [STORAGE_KEYS.sessionEmail, user.email.trim().toLowerCase()],
  ]);
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

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.userProfile,
    STORAGE_KEYS.sessionEmail,
  ]);
}

export async function loadExpensesForEmail(email: string): Promise<Expense[]> {
  const raw = await AsyncStorage.getItem(expensesKeyForEmail(email));
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as Expense[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveExpensesForEmail(
  email: string,
  expenses: Expense[],
): Promise<void> {
  await AsyncStorage.setItem(
    expensesKeyForEmail(email),
    JSON.stringify(expenses),
  );
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
