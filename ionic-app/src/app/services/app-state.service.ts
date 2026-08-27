import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  CurrencyCode,
  Expense,
  ShakeSensitivity,
  UserProfile,
} from '../models/expense.models';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  private readonly expensesSubject = new BehaviorSubject<Expense[]>([]);
  private readonly currencySubject = new BehaviorSubject<CurrencyCode>('INR');
  private readonly monthlyBudgetSubject = new BehaviorSubject<number | null>(null);
  private readonly budgetAlertsSubject = new BehaviorSubject<boolean>(false);
  private readonly shakeSubject = new BehaviorSubject<ShakeSensitivity>('medium');
  private readonly hydratingSubject = new BehaviorSubject<boolean>(true);
  private readonly onlineSubject = new BehaviorSubject<boolean>(false);
  private readonly editingSubject = new BehaviorSubject<Expense | null>(null);

  readonly user$ = this.userSubject.asObservable();
  readonly expenses$ = this.expensesSubject.asObservable();
  readonly currency$ = this.currencySubject.asObservable();
  readonly monthlyBudget$ = this.monthlyBudgetSubject.asObservable();
  readonly budgetAlertsEnabled$ = this.budgetAlertsSubject.asObservable();
  readonly shakeSensitivity$ = this.shakeSubject.asObservable();
  readonly isHydrating$ = this.hydratingSubject.asObservable();
  readonly isOnline$ = this.onlineSubject.asObservable();
  readonly editingExpense$ = this.editingSubject.asObservable();

  get user(): UserProfile | null {
    return this.userSubject.value;
  }

  get expenses(): Expense[] {
    return this.expensesSubject.value;
  }

  get currency(): CurrencyCode {
    return this.currencySubject.value;
  }

  get monthlyBudget(): number | null {
    return this.monthlyBudgetSubject.value;
  }

  get budgetAlertsEnabled(): boolean {
    return this.budgetAlertsSubject.value;
  }

  get shakeSensitivity(): ShakeSensitivity {
    return this.shakeSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  get editingExpense(): Expense | null {
    return this.editingSubject.value;
  }

  setUser(user: UserProfile | null): void {
    this.userSubject.next(user);
  }

  setExpenses(expenses: Expense[]): void {
    this.expensesSubject.next(
      [...expenses].sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }

  upsertExpense(expense: Expense): void {
    const without = this.expenses.filter((e) => e.rowId !== expense.rowId);
    this.setExpenses([...without, expense]);
  }

  removeExpense(rowId: string): void {
    this.setExpenses(this.expenses.filter((e) => e.rowId !== rowId));
  }

  setCurrency(currency: CurrencyCode): void {
    this.currencySubject.next(currency);
  }

  setMonthlyBudget(amount: number | null): void {
    this.monthlyBudgetSubject.next(amount);
  }

  setBudgetAlertsEnabled(enabled: boolean): void {
    this.budgetAlertsSubject.next(enabled);
  }

  setShakeSensitivity(level: ShakeSensitivity): void {
    this.shakeSubject.next(level);
  }

  setHydrating(value: boolean): void {
    this.hydratingSubject.next(value);
  }

  setOnline(value: boolean): void {
    this.onlineSubject.next(value);
  }

  setEditingExpense(expense: Expense | null): void {
    this.editingSubject.next(expense);
  }

  logout(): void {
    this.userSubject.next(null);
    this.expensesSubject.next([]);
    this.editingSubject.next(null);
    this.onlineSubject.next(false);
  }
}
