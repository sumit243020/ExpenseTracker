import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import type { Expense, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { CATEGORY_META, formatAmount, formatDisplayDate } from '../utils/format';
import {
  expensesThisMonth,
  expensesThisWeek,
  expensesToday,
} from '../utils/expenseStats';
import { deleteExpenseLocal } from '../services/expenseSync';
import { useToast } from '../components/Toast';

type DateFilter = 'all' | 'today' | 'week' | 'month';

export function ExpenseListScreen() {
  const expenses = useAppStore((s) => s.expenses);
  const currency = useAppStore((s) => s.currency);
  const setEditing = useAppStore((s) => s.setEditingExpense);
  const setModal = useAppStore((s) => s.setAddExpenseModalVisible);
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | 'All'>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filtered = useMemo(() => {
    let list = expenses;
    if (dateFilter === 'today') list = expensesToday(list);
    else if (dateFilter === 'week') list = expensesThisWeek(list);
    else if (dateFilter === 'month') list = expensesThisMonth(list);

    if (category !== 'All') {
      list = list.filter((e) => e.category === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }
    return list;
  }, [expenses, query, category, dateFilter]);

  const sections = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, data]) => ({
        title: formatDisplayDate(date),
        data,
      }));
  }, [filtered]);

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setModal(true);
  };

  const confirmDelete = (expense: Expense) => {
    Alert.alert('Delete expense?', `"${expense.description}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpenseLocal(expense.rowId);
            showToast('Expense deleted', 'success');
          } catch (e) {
            showToast(
              e instanceof Error ? e.message : 'Delete failed',
              'error',
            );
          }
        },
      },
    ]);
  };

  const renderRightActions = (expense: Expense) => (
    <View style={styles.actions}>
      <Pressable
        style={[styles.actionBtn, styles.editBtn]}
        onPress={() => openEdit(expense)}
      >
        <Text style={styles.actionText}>Edit</Text>
      </Pressable>
      <Pressable
        style={[styles.actionBtn, styles.deleteBtn]}
        onPress={() => confirmDelete(expense)}
      >
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Expenses</Text>
        <TextInput
          style={styles.search}
          placeholder="Search description…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />

        <View style={styles.filters}>
          {(['all', 'today', 'week', 'month'] as DateFilter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, dateFilter === f && styles.filterActive]}
              onPress={() => setDateFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  dateFilter === f && styles.filterTextActive,
                ]}
              >
                {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.filters}>
          <Pressable
            style={[
              styles.filterChip,
              category === 'All' && styles.filterActive,
            ]}
            onPress={() => setCategory('All')}
          >
            <Text
              style={[
                styles.filterText,
                category === 'All' && styles.filterTextActive,
              ]}
            >
              All cats
            </Text>
          </Pressable>
          {EXPENSE_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.filterChip,
                category === c && styles.filterActive,
              ]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[
                  styles.filterText,
                  category === c && styles.filterTextActive,
                ]}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.rowId}
          contentContainerStyle={{ paddingBottom: 120 }}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No matching expenses</Text>
              <Text style={styles.emptyHint}>
                Try clearing search or filters
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={() => renderRightActions(item)}>
              <Pressable style={styles.row} onPress={() => openEdit(item)}>
                <Text style={styles.icon}>
                  {CATEGORY_META[item.category]?.icon ?? '📦'}
                </Text>
                <View style={styles.body}>
                  <Text style={styles.desc} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={styles.meta}>{item.category}</Text>
                </View>
                <Text style={styles.amount}>
                  {formatAmount(item.amount, currency)}
                </Text>
              </Pressable>
            </Swipeable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { ...typography.heading, marginBottom: spacing.md },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  filterText: { ...typography.caption, color: colors.textSecondary },
  filterTextActive: { color: colors.primary, fontWeight: '600' },
  sectionHeader: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
    fontWeight: '700',
  },
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
  icon: { fontSize: 22 },
  body: { flex: 1 },
  desc: { ...typography.bodyBold },
  meta: { ...typography.caption, marginTop: 2 },
  amount: { ...typography.bodyBold, color: colors.primary },
  actions: { flexDirection: 'row', marginBottom: spacing.sm },
  actionBtn: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginLeft: 6,
  },
  editBtn: { backgroundColor: colors.primary },
  deleteBtn: { backgroundColor: colors.danger },
  actionText: { color: colors.white, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: { ...typography.subheading },
  emptyHint: { ...typography.caption, marginTop: 4 },
});
