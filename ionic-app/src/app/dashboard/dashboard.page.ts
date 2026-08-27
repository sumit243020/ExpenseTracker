import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/lazy';
import { Subscription } from 'rxjs';
import { ExpenseFormPage } from '../expense-form/expense-form.page';
import { Expense } from '../models/expense.models';
import { AppStateService } from '../services/app-state.service';
import { ExpenseService } from '../services/expense.service';
import {
  categoryBreakdown,
  expensesThisMonth,
  expensesThisWeek,
  expensesToday,
  sumAmount,
} from '../utils/expense-stats';
import { categoryColor, categoryIcon, formatAmount, formatDisplayDate } from '../utils/format';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  firstName = 'there';
  todayTotal = 0;
  weekTotal = 0;
  monthTotal = 0;
  breakdown: { category: string; amount: number; color: string }[] = [];
  recent: Expense[] = [];
  currency = this.state.currency;
  refreshing = false;
  private sub?: Subscription;

  constructor(
    private readonly state: AppStateService,
    private readonly expenses: ExpenseService,
    private readonly modalCtrl: ModalController,
  ) {}

  ngOnInit(): void {
    this.sub = this.state.expenses$.subscribe(() => this.recompute());
    this.state.currency$.subscribe((c) => {
      this.currency = c;
      this.recompute();
    });
    this.state.user$.subscribe((u) => {
      this.firstName = u?.name?.split(' ')[0] ?? 'there';
    });
    this.recompute();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private recompute(): void {
    const list = this.state.expenses;
    this.todayTotal = sumAmount(expensesToday(list));
    this.weekTotal = sumAmount(expensesThisWeek(list));
    const month = expensesThisMonth(list);
    this.monthTotal = sumAmount(month);
    this.breakdown = categoryBreakdown(month);
    this.recent = list.slice(0, 5);
    this.currency = this.state.currency;
  }

  format(amount: number): string {
    return formatAmount(amount, this.currency);
  }

  displayDate(key: string): string {
    return formatDisplayDate(key);
  }

  iconFor(category: string): string {
    return categoryIcon(category);
  }

  colorFor(category: string): string {
    return categoryColor(category);
  }

  async refresh(event?: CustomEvent): Promise<void> {
    this.refreshing = true;
    try {
      await this.expenses.refresh();
    } finally {
      this.refreshing = false;
      (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    }
  }

  async openAdd(): Promise<void> {
    this.state.setEditingExpense(null);
    const modal = await this.modalCtrl.create({
      component: ExpenseFormPage,
      componentProps: { expense: null },
    });
    await modal.present();
  }

  async openEdit(expense: Expense): Promise<void> {
    this.state.setEditingExpense(expense);
    const modal = await this.modalCtrl.create({
      component: ExpenseFormPage,
      componentProps: { expense },
    });
    await modal.present();
  }
}
