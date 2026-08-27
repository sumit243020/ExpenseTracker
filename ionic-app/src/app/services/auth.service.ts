import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AppStateService } from './app-state.service';
import { StorageService } from './storage.service';
import { UserProfile } from '../models/expense.models';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly api: ApiService,
    private readonly storage: StorageService,
    private readonly state: AppStateService,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  isValidEmail(email: string): boolean {
    return EMAIL_RE.test(this.normalizeEmail(email));
  }

  private profileFromEmail(email: string, name?: string): UserProfile {
    const normalized = this.normalizeEmail(email);
    const local = normalized.split('@')[0] || 'User';
    const display =
      (name?.trim() || local)
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: `email:${normalized}`,
      name: display,
      email: normalized,
    };
  }

  private applyUserSettings(user: UserProfile): void {
    if (user.currency) this.state.setCurrency(user.currency);
    if (user.monthlyBudget !== undefined) {
      this.state.setMonthlyBudget(user.monthlyBudget ?? null);
    }
    if (user.budgetAlertsEnabled !== undefined) {
      this.state.setBudgetAlertsEnabled(!!user.budgetAlertsEnabled);
    }
    if (user.shakeSensitivity) {
      this.state.setShakeSensitivity(user.shakeSensitivity);
    }
  }

  async login(email: string, name?: string): Promise<UserProfile> {
    if (!this.isValidEmail(email)) {
      throw new Error('Enter a valid email address');
    }

    try {
      const res = await this.api.login(email, name);
      await this.storage.saveToken(res.token);
      await this.storage.saveUserProfile(res.user);
      this.applyUserSettings(res.user);
      this.state.setUser(res.user);
      this.state.setOnline(true);

      try {
        const expenses = await this.api.listExpenses();
        await this.storage.saveExpensesForEmail(res.user.email, expenses);
        this.state.setExpenses(expenses);
      } catch {
        const local = await this.storage.loadExpensesForEmail(res.user.email);
        this.state.setExpenses(local);
      }
      return res.user;
    } catch {
      // Offline / API unavailable — local session
      const user = this.profileFromEmail(email, name);
      await this.storage.saveToken(null);
      await this.storage.saveUserProfile(user);
      this.state.setUser(user);
      this.state.setOnline(false);
      const expenses = await this.storage.loadExpensesForEmail(user.email);
      this.state.setExpenses(expenses);

      const currency = await this.storage.getCurrency();
      const budget = await this.storage.getMonthlyBudget();
      const alerts = await this.storage.getBudgetAlertsEnabled();
      const shake = await this.storage.getShakeSensitivity();
      this.state.setCurrency(currency);
      this.state.setMonthlyBudget(budget);
      this.state.setBudgetAlertsEnabled(alerts);
      this.state.setShakeSensitivity(shake);
      return user;
    }
  }

  async restoreSession(): Promise<UserProfile | null> {
    const user = await this.storage.getUserProfile();
    if (!user?.email || !this.isValidEmail(user.email)) {
      this.state.setHydrating(false);
      return null;
    }

    const currency = await this.storage.getCurrency();
    const budget = await this.storage.getMonthlyBudget();
    const alerts = await this.storage.getBudgetAlertsEnabled();
    const shake = await this.storage.getShakeSensitivity();
    this.state.setCurrency(user.currency || currency);
    this.state.setMonthlyBudget(
      user.monthlyBudget !== undefined ? user.monthlyBudget ?? null : budget,
    );
    this.state.setBudgetAlertsEnabled(
      user.budgetAlertsEnabled !== undefined ? !!user.budgetAlertsEnabled : alerts,
    );
    this.state.setShakeSensitivity(user.shakeSensitivity || shake);
    this.state.setUser(user);

    const token = await this.storage.getToken();
    if (token) {
      try {
        const me = await this.api.me();
        await this.storage.saveUserProfile(me);
        this.applyUserSettings(me);
        this.state.setUser(me);
        this.state.setOnline(true);
        const expenses = await this.api.listExpenses();
        await this.storage.saveExpensesForEmail(me.email, expenses);
        this.state.setExpenses(expenses);
      } catch {
        this.state.setOnline(false);
        const local = await this.storage.loadExpensesForEmail(user.email);
        this.state.setExpenses(local);
      }
    } else {
      this.state.setOnline(false);
      const local = await this.storage.loadExpensesForEmail(user.email);
      this.state.setExpenses(local);
    }

    this.state.setHydrating(false);
    return this.state.user;
  }

  async signOut(): Promise<void> {
    await this.storage.clearSession();
    this.state.logout();
  }
}
