import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular/lazy';
import { Subscription } from 'rxjs';
import { ExpenseFormPage } from '../expense-form/expense-form.page';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
} from '../models/expense.models';
import { AppStateService } from '../services/app-state.service';
import { ExpenseService } from '../services/expense.service';
import { categoryColor, categoryIcon, formatAmount, formatDisplayDate } from '../utils/format';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
  standalone: false,
})
export class ExpensesPage implements OnInit, OnDestroy {
  query = '';
  category: ExpenseCategory | 'All' = 'All';
  categories: Array<ExpenseCategory | 'All'> = ['All', ...EXPENSE_CATEGORIES];
  filtered: Expense[] = [];
  currency = this.state.currency;
  private sub?: Subscription;

  constructor(
    private readonly state: AppStateService,
    private readonly expenseService: ExpenseService,
    private readonly modalCtrl: ModalController,
    private readonly alertCtrl: AlertController,
  ) {}

  ngOnInit(): void {
    this.sub = this.state.expenses$.subscribe(() => this.applyFilter());
    this.state.currency$.subscribe((c) => {
      this.currency = c;
    });
    this.applyFilter();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  applyFilter(): void {
    let list = this.state.expenses;
    if (this.category !== 'All') {
      list = list.filter((e) => e.category === this.category);
    }
    const q = this.query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }
    this.filtered = list;
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

  selectCategory(cat: ExpenseCategory | 'All'): void {
    this.category = cat;
    this.applyFilter();
  }

  async openAdd(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseFormPage,
      componentProps: { expense: null },
    });
    await modal.present();
  }

  async openEdit(expense: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseFormPage,
      componentProps: { expense },
    });
    await modal.present();
  }

  async confirmDelete(expense: Expense): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Delete expense?',
      message: `"${expense.description}" will be removed.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            void this.expenseService.delete(expense.rowId);
          },
        },
      ],
    });
    await alert.present();
  }
}
