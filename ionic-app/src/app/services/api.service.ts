import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import {
  CurrencyCode,
  Expense,
  ExpenseInput,
  ShakeSensitivity,
  UserProfile,
} from '../models/expense.models';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
  ) {}

  private get baseUrl(): string {
    return this.config.apiUrl.replace(/\/$/, '');
  }

  setApiUrl(url: string): void {
    this.config.setApiUrl(url);
  }

  getApiUrl(): string {
    return this.baseUrl;
  }

  private async headers(): Promise<HttpHeaders> {
    const token = await this.storage.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  async login(email: string, name?: string): Promise<LoginResponse> {
    if (!this.baseUrl) {
      throw new Error('API URL not configured');
    }
    return firstValueFrom(
      this.http
        .post<LoginResponse>(`${this.baseUrl}/api/auth/login`, {
          email,
          name: name?.trim() || undefined,
        })
        .pipe(timeout(20000)),
    );
  }

  async me(): Promise<UserProfile> {
    const headers = await this.headers();
    return firstValueFrom(
      this.http
        .get<UserProfile>(`${this.baseUrl}/api/auth/me`, { headers })
        .pipe(timeout(20000)),
    );
  }

  async updateSettings(body: {
    name?: string;
    currency?: CurrencyCode;
    monthlyBudget?: number | null;
    budgetAlertsEnabled?: boolean;
    shakeSensitivity?: ShakeSensitivity;
  }): Promise<UserProfile> {
    const headers = await this.headers();
    return firstValueFrom(
      this.http
        .put<UserProfile>(`${this.baseUrl}/api/auth/settings`, body, {
          headers,
        })
        .pipe(timeout(20000)),
    );
  }

  async listExpenses(): Promise<Expense[]> {
    const headers = await this.headers();
    return firstValueFrom(
      this.http
        .get<Expense[]>(`${this.baseUrl}/api/expenses`, { headers })
        .pipe(timeout(20000)),
    );
  }

  async createExpense(input: ExpenseInput): Promise<Expense> {
    const headers = await this.headers();
    return firstValueFrom(
      this.http
        .post<Expense>(`${this.baseUrl}/api/expenses`, input, { headers })
        .pipe(timeout(20000)),
    );
  }

  async updateExpense(rowId: string, input: ExpenseInput): Promise<Expense> {
    const headers = await this.headers();
    return firstValueFrom(
      this.http
        .put<Expense>(`${this.baseUrl}/api/expenses/${rowId}`, input, {
          headers,
        })
        .pipe(timeout(20000)),
    );
  }

  async deleteExpense(rowId: string): Promise<void> {
    const headers = await this.headers();
    await firstValueFrom(
      this.http
        .delete<void>(`${this.baseUrl}/api/expenses/${rowId}`, { headers })
        .pipe(timeout(20000)),
    );
  }
}
