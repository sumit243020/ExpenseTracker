import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import {
  CurrencyCode,
  Expense,
  ShakeSensitivity,
  STORAGE_KEYS,
  UserProfile,
  expensesKeyForEmail,
} from '../models/expense.models';

@Injectable({ providedIn: 'root' })
export class StorageService {
  async get(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (value != null) return value;
    } catch {
      // fall through to localStorage
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch {
      // ignore
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  async saveUserProfile(user: UserProfile): Promise<void> {
    await this.set(STORAGE_KEYS.userProfile, JSON.stringify(user));
    await this.set(STORAGE_KEYS.sessionEmail, user.email.trim().toLowerCase());
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const raw = await this.get(STORAGE_KEYS.userProfile);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  async saveToken(token: string | null): Promise<void> {
    if (!token) {
      await this.remove(STORAGE_KEYS.authToken);
      return;
    }
    await this.set(STORAGE_KEYS.authToken, token);
  }

  async getToken(): Promise<string | null> {
    return this.get(STORAGE_KEYS.authToken);
  }

  async clearSession(): Promise<void> {
    await this.remove(STORAGE_KEYS.userProfile);
    await this.remove(STORAGE_KEYS.sessionEmail);
    await this.remove(STORAGE_KEYS.authToken);
  }

  async loadExpensesForEmail(email: string): Promise<Expense[]> {
    const raw = await this.get(expensesKeyForEmail(email));
    if (!raw) return [];
    try {
      const list = JSON.parse(raw) as Expense[];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  async saveExpensesForEmail(email: string, expenses: Expense[]): Promise<void> {
    await this.set(expensesKeyForEmail(email), JSON.stringify(expenses));
  }

  async getCurrency(): Promise<CurrencyCode> {
    const value = await this.get(STORAGE_KEYS.currency);
    return (value as CurrencyCode) || 'INR';
  }

  async setCurrency(code: CurrencyCode): Promise<void> {
    await this.set(STORAGE_KEYS.currency, code);
  }

  async getMonthlyBudget(): Promise<number | null> {
    const raw = await this.get(STORAGE_KEYS.monthlyBudget);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  async setMonthlyBudget(amount: number | null): Promise<void> {
    if (amount == null) {
      await this.remove(STORAGE_KEYS.monthlyBudget);
    } else {
      await this.set(STORAGE_KEYS.monthlyBudget, String(amount));
    }
  }

  async getBudgetAlertsEnabled(): Promise<boolean> {
    return (await this.get(STORAGE_KEYS.budgetAlertsEnabled)) === 'true';
  }

  async setBudgetAlertsEnabled(enabled: boolean): Promise<void> {
    await this.set(STORAGE_KEYS.budgetAlertsEnabled, String(enabled));
  }

  async getShakeSensitivity(): Promise<ShakeSensitivity> {
    const raw = await this.get(STORAGE_KEYS.shakeSensitivity);
    if (raw === 'low' || raw === 'medium' || raw === 'high') return raw;
    return 'medium';
  }

  async setShakeSensitivity(level: ShakeSensitivity): Promise<void> {
    await this.set(STORAGE_KEYS.shakeSensitivity, level);
  }
}
