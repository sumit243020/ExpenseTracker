import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/lazy';
import { Haptics, NotificationType } from '@capacitor/haptics';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseCategory,
} from '../models/expense.models';
import { AppStateService } from '../services/app-state.service';
import { ExpenseService } from '../services/expense.service';
import { getCurrencySymbol, toDateKey } from '../utils/format';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.page.html',
  styleUrls: ['./expense-form.page.scss'],
  standalone: false,
})
export class ExpenseFormPage implements OnInit {
  @Input() expense: Expense | null = null;

  description = '';
  amount = '';
  category: ExpenseCategory = 'Food';
  date = toDateKey(new Date());
  categories = EXPENSE_CATEGORIES;
  saving = false;
  currencySymbol = '₹';

  constructor(
    private readonly modalCtrl: ModalController,
    private readonly expenseService: ExpenseService,
    private readonly state: AppStateService,
    private readonly toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.currencySymbol = getCurrencySymbol(this.state.currency);
    const editing = this.expense ?? this.state.editingExpense;
    if (editing) {
      this.expense = editing;
      this.description = editing.description;
      this.amount = String(editing.amount);
      this.category = editing.category;
      this.date = editing.date;
    }
  }

  get isEdit(): boolean {
    return !!this.expense;
  }

  get canSubmit(): boolean {
    const n = Number(this.amount);
    return this.description.trim().length > 0 && Number.isFinite(n) && n > 0;
  }

  selectCategory(cat: ExpenseCategory): void {
    this.category = cat;
  }

  async dismiss(): Promise<void> {
    this.state.setEditingExpense(null);
    await this.modalCtrl.dismiss();
  }

  async save(): Promise<void> {
    if (!this.canSubmit || this.saving) return;
    this.saving = true;
    try {
      const payload = {
        date: this.date,
        description: this.description.trim().slice(0, 200),
        category: this.category,
        amount: Number(this.amount),
      };
      if (this.isEdit && this.expense) {
        await this.expenseService.update(this.expense.rowId, payload);
        await this.toast('Expense updated');
      } else {
        await this.expenseService.create(payload);
        await this.toast('Expense saved');
      }
      void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
      await this.dismiss();
    } catch (e) {
      await this.toast(e instanceof Error ? e.message : 'Could not save', 'danger');
    } finally {
      this.saving = false;
    }
  }

  private async toast(message: string, color: string = 'success'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 1800, color, position: 'top' });
    await t.present();
  }
}
