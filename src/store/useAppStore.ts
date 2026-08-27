import { create } from 'zustand';
import type {
  CurrencyCode,
  Expense,
  ShakeSensitivity,
  UserProfile,
} from '../types';

interface AppState {
  user: UserProfile | null;
  accessToken: string | null;
  spreadsheetId: string | null;
  expenses: Expense[];
  isAuthenticated: boolean;
  isHydrating: boolean;
  isSyncing: boolean;
  currency: CurrencyCode;
  monthlyBudget: number | null;
  budgetAlertsEnabled: boolean;
  shakeSensitivity: ShakeSensitivity;
  backgroundShakeEnabled: boolean;
  addExpenseModalVisible: boolean;
  editingExpense: Expense | null;

  setUser: (user: UserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
  setSpreadsheetId: (id: string | null) => void;
  setExpenses: (expenses: Expense[]) => void;
  upsertExpense: (expense: Expense) => void;
  removeExpense: (rowId: string) => void;
  setHydrating: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setMonthlyBudget: (amount: number | null) => void;
  setBudgetAlertsEnabled: (enabled: boolean) => void;
  setShakeSensitivity: (level: ShakeSensitivity) => void;
  setBackgroundShakeEnabled: (enabled: boolean) => void;
  setAddExpenseModalVisible: (visible: boolean) => void;
  setEditingExpense: (expense: Expense | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  accessToken: null,
  spreadsheetId: null,
  expenses: [],
  isAuthenticated: false,
  isHydrating: true,
  isSyncing: false,
  currency: 'INR',
  monthlyBudget: null,
  budgetAlertsEnabled: false,
  shakeSensitivity: 'medium',
  backgroundShakeEnabled: true,
  addExpenseModalVisible: false,
  editingExpense: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setSpreadsheetId: (spreadsheetId) => set({ spreadsheetId }),
  setExpenses: (expenses) =>
    set({
      expenses: [...expenses].sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      ),
    }),
  upsertExpense: (expense) =>
    set((state) => {
      const without = state.expenses.filter((e) => e.rowId !== expense.rowId);
      const next = [...without, expense].sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      );
      return { expenses: next };
    }),
  removeExpense: (rowId) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.rowId !== rowId),
    })),
  setHydrating: (isHydrating) => set({ isHydrating }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setCurrency: (currency) => set({ currency }),
  setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),
  setBudgetAlertsEnabled: (budgetAlertsEnabled) => set({ budgetAlertsEnabled }),
  setShakeSensitivity: (shakeSensitivity) => set({ shakeSensitivity }),
  setBackgroundShakeEnabled: (backgroundShakeEnabled) =>
    set({ backgroundShakeEnabled }),
  setAddExpenseModalVisible: (addExpenseModalVisible) =>
    set({ addExpenseModalVisible }),
  setEditingExpense: (editingExpense) => set({ editingExpense }),
  logout: () =>
    set({
      user: null,
      accessToken: null,
      spreadsheetId: null,
      expenses: [],
      isAuthenticated: false,
      addExpenseModalVisible: false,
      editingExpense: null,
    }),
}));
