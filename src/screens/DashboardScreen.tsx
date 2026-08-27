import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { PieChart } from 'react-native-gifted-charts';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import {
  categoryBreakdown,
  expensesThisMonth,
  expensesThisWeek,
  expensesToday,
  sumAmount,
} from '../utils/expenseStats';
import { CATEGORY_META, formatAmount, formatDisplayDate } from '../utils/format';
import { bootstrapExpenses, refreshExpenses } from '../services/expenseSync';
import type { MainTabParamList } from '../navigation/MainTabs';
import { useToast } from '../components/Toast';

export function DashboardScreen() {
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const user = useAppStore((s) => s.user);
  const expenses = useAppStore((s) => s.expenses);
  const currency = useAppStore((s) => s.currency);
  const isSyncing = useAppStore((s) => s.isSyncing);
  const setEditing = useAppStore((s) => s.setEditingExpense);
  const setModal = useAppStore((s) => s.setAddExpenseModalVisible);
  const { showToast } = useToast();
  const [booting, setBooting] = useState(true);

  const load = useCallback(async () => {
    try {
      await Promise.race([
        bootstrapExpenses(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Sheet setup timed out — pull to refresh')),
            20000,
          ),
        ),
      ]);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'Could not load expenses',
        'error',
      );
    } finally {
      setBooting(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    try {
      await refreshExpenses();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'Refresh failed',
        'error',
      );
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const todayTotal = sumAmount(expensesToday(expenses));
  const weekTotal = sumAmount(expensesThisWeek(expenses));
  const monthExpenses = expensesThisMonth(expenses);
  const monthTotal = sumAmount(monthExpenses);
  const breakdown = categoryBreakdown(monthExpenses);
  const recent = expenses.slice(0, 5);

  const pieData = useMemo(
    () =>
      breakdown.map((b) => ({
        value: b.amount,
        color: b.color,
        text: b.category,
      })),
    [breakdown],
  );

  if (booting) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your expenses…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Here’s your spending overview</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Settings')}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>
                  {(user?.name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.monthCard}>
          <Text style={styles.monthLabel}>This Month’s Total</Text>
          <Text style={styles.monthAmount}>
            {formatAmount(monthTotal, currency)}
          </Text>
        </View>

        <View style={styles.statRow}>
          {[
            { label: 'Today', value: todayTotal },
            { label: 'This Week', value: weekTotal },
            { label: 'This Month', value: monthTotal },
          ].map((s) => (
            <View key={s.label} style={styles.statChip}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>
                {formatAmount(s.value, currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By category</Text>
          {pieData.length === 0 ? (
            <Text style={styles.emptyHint}>No spending this month yet</Text>
          ) : (
            <View style={styles.chartRow}>
              <PieChart
                data={pieData}
                donut
                radius={70}
                innerRadius={42}
                centerLabelComponent={() => (
                  <Text style={styles.centerLabel}>Month</Text>
                )}
              />
              <View style={styles.legend}>
                {breakdown.slice(0, 5).map((b) => (
                  <View key={b.category} style={styles.legendRow}>
                    <View
                      style={[styles.dot, { backgroundColor: b.color }]}
                    />
                    <Text style={styles.legendText}>
                      {b.category} · {formatAmount(b.amount, currency)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Pressable onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>

          {recent.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🧾</Text>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyHint}>
                Shake your phone or tap + to add your first expense
              </Text>
            </View>
          ) : (
            recent.map((e) => (
              <Pressable
                key={e.rowId}
                style={styles.row}
                onPress={() => {
                  setEditing(e);
                  setModal(true);
                }}
              >
                <Text style={styles.rowIcon}>
                  {CATEGORY_META[e.category]?.icon ?? '📦'}
                </Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowDesc} numberOfLines={1}>
                    {e.description}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {formatDisplayDate(e.date)} · {e.category}
                  </Text>
                </View>
                <Text style={styles.rowAmount}>
                  {formatAmount(e.amount, currency)}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 120 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...typography.body, color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: { ...typography.heading },
  subGreeting: { ...typography.caption, marginTop: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.primary, fontWeight: '700', fontSize: 18 },
  monthCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  monthLabel: { color: colors.primaryMuted, fontWeight: '500' },
  monthAmount: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
    marginTop: 6,
  },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { ...typography.caption, marginBottom: 4 },
  statValue: { ...typography.bodyBold, fontSize: 14 },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.subheading, marginBottom: spacing.sm },
  viewAll: { color: colors.primary, fontWeight: '600' },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerLabel: { ...typography.caption, fontWeight: '600' },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, flexShrink: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rowIcon: { fontSize: 22 },
  rowBody: { flex: 1 },
  rowDesc: { ...typography.bodyBold },
  rowMeta: { ...typography.caption, marginTop: 2 },
  rowAmount: { ...typography.bodyBold, color: colors.primary },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: { ...typography.subheading, marginBottom: 4 },
  emptyHint: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
