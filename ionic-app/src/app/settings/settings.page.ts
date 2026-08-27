import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { Subscription } from 'rxjs';
import { CurrencyCode, ShakeSensitivity, UserProfile } from '../models/expense.models';
import { AuthService } from '../services/auth.service';
import { AppStateService } from '../services/app-state.service';
import { ExpenseService } from '../services/expense.service';
import { ApiService } from '../services/api.service';
import { expensesThisMonth, sumAmount } from '../utils/expense-stats';
import { formatAmount } from '../utils/format';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  currency: CurrencyCode = 'INR';
  monthlyBudget: number | null = null;
  budgetText = '';
  shakeSensitivity: ShakeSensitivity = 'medium';
  isOnline = false;
  apiUrl = '';
  monthSpend = 0;
  currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];
  shakeLevels: ShakeSensitivity[] = ['low', 'medium', 'high'];
  private subs: Subscription[] = [];

  constructor(
    private readonly state: AppStateService,
    private readonly auth: AuthService,
    private readonly expenses: ExpenseService,
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly alertCtrl: AlertController,
    private readonly toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.apiUrl = this.api.getApiUrl();
    this.subs.push(
      this.state.user$.subscribe((u) => (this.user = u)),
      this.state.currency$.subscribe((c) => (this.currency = c)),
      this.state.monthlyBudget$.subscribe((b) => {
        this.monthlyBudget = b;
        this.budgetText = b != null ? String(b) : '';
      }),
      this.state.shakeSensitivity$.subscribe((s) => (this.shakeSensitivity = s)),
      this.state.isOnline$.subscribe((o) => (this.isOnline = o)),
      this.state.expenses$.subscribe((list) => {
        this.monthSpend = sumAmount(expensesThisMonth(list));
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  get avatarLetter(): string {
    return (this.user?.name ?? 'U')[0].toUpperCase();
  }

  formatSpend(): string {
    return formatAmount(this.monthSpend, this.currency);
  }

  async setCurrency(code: CurrencyCode): Promise<void> {
    await this.expenses.saveSettings({ currency: code });
  }

  async setShake(level: ShakeSensitivity): Promise<void> {
    await this.expenses.saveSettings({ shakeSensitivity: level });
  }

  async saveBudget(): Promise<void> {
    const n = this.budgetText.trim() === '' ? null : Number(this.budgetText);
    if (n != null && (!Number.isFinite(n) || n <= 0)) {
      const t = await this.toastCtrl.create({
        message: 'Enter a valid budget amount',
        duration: 1800,
        color: 'danger',
      });
      await t.present();
      return;
    }
    await this.expenses.saveSettings({ monthlyBudget: n });
    const t = await this.toastCtrl.create({
      message: 'Budget saved',
      duration: 1500,
      color: 'success',
    });
    await t.present();
  }

  applyApiUrl(): void {
    const url = this.apiUrl.trim();
    if (url) this.api.setApiUrl(url);
  }

  async logout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Log out?',
      message: 'Your expenses stay saved for this email on this device.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log out',
          role: 'destructive',
          handler: () => {
            void (async () => {
              await this.auth.signOut();
              await this.router.navigateByUrl('/login', { replaceUrl: true });
            })();
          },
        },
      ],
    });
    await alert.present();
  }
}
