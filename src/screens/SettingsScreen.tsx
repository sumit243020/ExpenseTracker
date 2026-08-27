import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import type { CurrencyCode, ShakeSensitivity } from '../types';
import {
  setBudgetAlertsEnabled as persistBudgetAlerts,
  setCurrency as persistCurrency,
  setMonthlyBudget as persistBudget,
  setShakeSensitivity as persistShake,
} from '../services/storage';
import { signOut } from '../services/auth';
import { expensesThisMonth, sumAmount } from '../utils/expenseStats';
import { formatAmount, getCurrencySymbol } from '../utils/format';
import { useToast } from '../components/Toast';

const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];
const SHAKE_LEVELS: ShakeSensitivity[] = ['low', 'medium', 'high'];

export function SettingsScreen() {
  const user = useAppStore((s) => s.user);
  const currency = useAppStore((s) => s.currency);
  const monthlyBudget = useAppStore((s) => s.monthlyBudget);
  const budgetAlertsEnabled = useAppStore((s) => s.budgetAlertsEnabled);
  const shakeSensitivity = useAppStore((s) => s.shakeSensitivity);
  const expenses = useAppStore((s) => s.expenses);

  const setCurrency = useAppStore((s) => s.setCurrency);
  const setMonthlyBudget = useAppStore((s) => s.setMonthlyBudget);
  const setBudgetAlertsEnabled = useAppStore((s) => s.setBudgetAlertsEnabled);
  const setShakeSensitivity = useAppStore((s) => s.setShakeSensitivity);

  const { showToast } = useToast();
  const [budgetText, setBudgetText] = useState(
    monthlyBudget != null ? String(monthlyBudget) : '',
  );

  const monthSpend = sumAmount(expensesThisMonth(expenses));

  const onCurrency = async (code: CurrencyCode) => {
    setCurrency(code);
    await persistCurrency(code);
  };

  const onShake = async (level: ShakeSensitivity) => {
    setShakeSensitivity(level);
    await persistShake(level);
  };

  const onBudgetToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Notifications needed',
            'Enable notifications to get budget alerts when spend hits 80% and 100%.',
          );
          return;
        }
      } catch {
        // continue without notifications on broken devices
      }
    }
    setBudgetAlertsEnabled(enabled);
    await persistBudgetAlerts(enabled);
    maybeAlertBudget(enabled, monthlyBudget, monthSpend, showToast);
  };

  const onBudgetSave = async () => {
    const n = budgetText.trim() === '' ? null : Number(budgetText);
    if (n != null && (!Number.isFinite(n) || n <= 0)) {
      showToast('Enter a valid budget amount', 'error');
      return;
    }
    setMonthlyBudget(n);
    await persistBudget(n);
    showToast('Budget saved', 'success');
    maybeAlertBudget(budgetAlertsEnabled, n, monthSpend, showToast);
  };

  const onLogout = () => {
    Alert.alert('Log out?', 'Your expenses stay saved for this email on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.profile}>
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>
              {(user?.name ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.section}>Currency</Text>
        <View style={styles.rowWrap}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, currency === c && styles.chipActive]}
              onPress={() => void onCurrency(c)}
            >
              <Text
                style={[
                  styles.chipText,
                  currency === c && styles.chipTextActive,
                ]}
              >
                {getCurrencySymbol(c)} {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>Monthly budget</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.currencySym}>{getCurrencySymbol(currency)}</Text>
          <TextInput
            style={styles.budgetInput}
            keyboardType="decimal-pad"
            placeholder="e.g. 20000"
            placeholderTextColor={colors.textMuted}
            value={budgetText}
            onChangeText={setBudgetText}
            onBlur={() => void onBudgetSave()}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Budget alerts (80% / 100%)</Text>
          <Switch
            value={budgetAlertsEnabled}
            onValueChange={(v) => void onBudgetToggle(v)}
            trackColor={{ true: colors.primaryLight, false: colors.border }}
            thumbColor={budgetAlertsEnabled ? colors.primary : '#f4f4f5'}
          />
        </View>
        {monthlyBudget != null && (
          <Text style={styles.hint}>
            This month: {formatAmount(monthSpend, currency)} /{' '}
            {formatAmount(monthlyBudget, currency)}
          </Text>
        )}

        <Text style={styles.section}>Shake sensitivity</Text>
        <View style={styles.rowWrap}>
          {SHAKE_LEVELS.map((level) => (
            <Pressable
              key={level}
              style={[
                styles.chip,
                shakeSensitivity === level && styles.chipActive,
              ]}
              onPress={() => void onShake(level)}
            >
              <Text
                style={[
                  styles.chipText,
                  shakeSensitivity === level && styles.chipTextActive,
                ]}
              >
                {level[0].toUpperCase() + level.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>
          Shake your phone on any screen in the app to open Add Expense. Use the
          + button anytime as a backup.
        </Text>

        <Pressable style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function maybeAlertBudget(
  enabled: boolean,
  budget: number | null,
  spend: number,
  showToast: (m: string, t?: 'success' | 'error' | 'info') => void,
) {
  if (!enabled || budget == null || budget <= 0) return;
  const ratio = spend / budget;
  if (ratio >= 1) {
    showToast('Budget limit reached for this month', 'error');
  } else if (ratio >= 0.8) {
    showToast('You’ve used 80% of your monthly budget', 'info');
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  title: { ...typography.heading, marginBottom: spacing.lg },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.primary, fontWeight: '700', fontSize: 22 },
  name: { ...typography.subheading },
  email: { ...typography.caption, marginTop: 2 },
  section: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  currencySym: { ...typography.subheading, color: colors.primary },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    ...typography.body,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  switchLabel: { ...typography.body, flex: 1, paddingRight: spacing.md },
  hint: { ...typography.caption, marginTop: 4 },
  logout: {
    marginTop: spacing.xl,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '700' },
});
