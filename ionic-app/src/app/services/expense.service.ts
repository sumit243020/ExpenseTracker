import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AppStateService } from './app-state.service';
import { StorageService } from './storage.service';
import {
  CurrencyCode,
  Expense,
  ExpenseInput,
  ShakeSensitivity,
} from '../models/expense.models';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  constructor(
    private readonly api: ApiService,
    private readonly storage: StorageService,
    private readonly state: AppStateService,
  ) {}

  private async persistLocal(): Promise<void> {
    const email = this.state.user?.email;
    if (!email) return;
    await this.storage.saveExpensesForEmail(email, this.state.expenses);
  }

  async refresh(): Promise<void> {
    const email = this.state.user?.email;
    if (!email) return;
    const token = await this.storage.getToken();
    if (token) {
      try {
        const list = await this.api.listExpenses();
        this.state.setExpenses(list);
        await this.storage.saveExpensesForEmail(email, list);
        this.state.setOnline(true);
        return;
      } catch {
        this.state.setOnline(false);
      }
    }
    const local = await this.storage.loadExpensesForEmail(email);
    this.state.setExpenses(local);
  }

  async create(input: ExpenseInput): Promise<Expense> {
    if (!this.state.user?.email) throw new Error('Please log in first');

    let expense: Expense | null = null;
    const token = await this.storage.getToken();
    if (token) {
      try {
        expense = await this.api.createExpense(input);
        this.state.setOnline(true);
      } catch {
        this.state.setOnline(false);
      }
    }

    if (!expense) {
      expense = {
        rowId: newId(),
        date: input.date,
        description: input.description,
        category: input.category,
        amount: input.amount,
        createdAt: new Date().toISOString(),
      };
    }

    this.state.upsertExpense(expense);
    await this.persistLocal();
    return expense;
  }

  async update(rowId: string, input: ExpenseInput): Promise<Expense> {
    const existing = this.state.expenses.find((e) => e.rowId === rowId);
    if (!existing) throw new Error('Expense not found');

    let updated: Expense = { ...existing, ...input };
    const token = await this.storage.getToken();
    if (token) {
      try {
        updated = await this.api.updateExpense(rowId, input);
        this.state.setOnline(true);
      } catch {
        this.state.setOnline(false);
      }
    }

    this.state.upsertExpense(updated);
    await this.persistLocal();
    return updated;
  }

  async delete(rowId: string): Promise<void> {
    const token = await this.storage.getToken();
    if (token) {
      try {
        await this.api.deleteExpense(rowId);
        this.state.setOnline(true);
      } catch {
        this.state.setOnline(false);
      }
    }
    this.state.removeExpense(rowId);
    await this.persistLocal();
  }

  async saveSettings(partial: {
    name?: string;
    currency?: CurrencyCode;
    monthlyBudget?: number | null;
    budgetAlertsEnabled?: boolean;
    shakeSensitivity?: ShakeSensitivity;
  }): Promise<void> {
    if (partial.currency) {
      this.state.setCurrency(partial.currency);
      await this.storage.setCurrency(partial.currency);
    }
    if (partial.monthlyBudget !== undefined) {
      this.state.setMonthlyBudget(partial.monthlyBudget);
      await this.storage.setMonthlyBudget(partial.monthlyBudget);
    }
    if (partial.budgetAlertsEnabled !== undefined) {
      this.state.setBudgetAlertsEnabled(partial.budgetAlertsEnabled);
      await this.storage.setBudgetAlertsEnabled(partial.budgetAlertsEnabled);
    }
    if (partial.shakeSensitivity) {
      this.state.setShakeSensitivity(partial.shakeSensitivity);
      await this.storage.setShakeSensitivity(partial.shakeSensitivity);
    }

    const user = this.state.user;
    if (user && partial.name) {
      const next = { ...user, name: partial.name };
      this.state.setUser(next);
      await this.storage.saveUserProfile(next);
    } else if (user) {
      const next: UserProfileLike = {
        ...user,
        currency: partial.currency ?? user.currency,
        monthlyBudget:
          partial.monthlyBudget !== undefined
            ? partial.monthlyBudget
            : user.monthlyBudget,
        budgetAlertsEnabled:
          partial.budgetAlertsEnabled !== undefined
            ? partial.budgetAlertsEnabled
            : user.budgetAlertsEnabled,
        shakeSensitivity: partial.shakeSensitivity ?? user.shakeSensitivity,
      };
      this.state.setUser(next);
      await this.storage.saveUserProfile(next);
    }

    const token = await this.storage.getToken();
    if (token) {
      try {
        const me = await this.api.updateSettings(partial);
        this.state.setUser(me);
        await this.storage.saveUserProfile(me);
        this.state.setOnline(true);
      } catch {
        this.state.setOnline(false);
      }
    }
  }
}

type UserProfileLike = import('../models/expense.models').UserProfile;
