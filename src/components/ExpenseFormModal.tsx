import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { CategoryChips } from './CategoryChips';
import { useToast } from './Toast';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import type { ExpenseCategory } from '../types';
import { formatDisplayDate, getCurrencySymbol, toDateKey } from '../utils/format';
import {
  refreshExpenses,
  saveExpenseOnlineOrQueue,
} from '../services/expenseSync';
import { deleteExpense, updateExpense } from '../services/sheets-api';
import { getValidAccessToken } from '../services/google-auth';

export function ExpenseFormModal() {
  const visible = useAppStore((s) => s.addExpenseModalVisible);
  const editing = useAppStore((s) => s.editingExpense);
  const setVisible = useAppStore((s) => s.setAddExpenseModalVisible);
  const setEditing = useAppStore((s) => s.setEditingExpense);
  const currency = useAppStore((s) => s.currency);
  const spreadsheetId = useAppStore((s) => s.spreadsheetId);
  const accessToken = useAppStore((s) => s.accessToken);
  const expenses = useAppStore((s) => s.expenses);
  const upsertExpense = useAppStore((s) => s.upsertExpense);
  const removeExpense = useAppStore((s) => s.removeExpense);

  const { showToast } = useToast();
  const isEdit = !!editing;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      const [y, m, d] = editing.date.split('-').map(Number);
      setDate(new Date(y, m - 1, d));
    } else {
      setDescription('');
      setAmount('');
      setCategory('Food');
      setDate(new Date());
    }
  }, [visible, editing]);

  const canSubmit = useMemo(() => {
    const n = Number(amount);
    return description.trim().length > 0 && Number.isFinite(n) && n > 0;
  }, [amount, description]);

  const close = () => {
    setVisible(false);
    setEditing(null);
  };

  const onSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const payload = {
        date: toDateKey(date),
        description: description.trim().slice(0, 200),
        category,
        amount: Number(amount),
      };

      if (isEdit && editing) {
        if (!spreadsheetId || !accessToken) throw new Error('Not ready');
        const token = (await getValidAccessToken()) ?? accessToken;
        const updated = await updateExpense(
          spreadsheetId,
          editing.rowId,
          payload,
          token,
          expenses,
        );
        upsertExpense(updated);
        if (token !== 'demo-token') await refreshExpenses();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('Expense updated', 'success');
        close();
      } else {
        const result = await saveExpenseOnlineOrQueue(payload);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast(
          result.queued
            ? 'Saved offline — will sync when online'
            : 'Expense saved to your sheet',
          result.queued ? 'info' : 'success',
        );
        close();
      }
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : 'Could not save expense',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert(
      'Delete expense?',
      'This removes the row from your Google Sheet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!spreadsheetId || !accessToken) throw new Error('Not ready');
              const token = (await getValidAccessToken()) ?? accessToken;
              await deleteExpense(
                spreadsheetId,
                editing.rowId,
                token,
                expenses,
              );
              removeExpense(editing.rowId);
              if (token !== 'demo-token') await refreshExpenses();
              showToast('Expense deleted', 'success');
              close();
            } catch (e) {
              showToast(
                e instanceof Error ? e.message : 'Delete failed',
                'error',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>
              {isEdit ? 'Edit Expense' : 'Add Expense'}
            </Text>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lunch at cafe"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
            />

            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>{getCurrencySymbol(currency)}</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={styles.label}>Category</Text>
            <CategoryChips value={category} onChange={setCategory} />

            <Text style={styles.label}>Date</Text>
            <Pressable
              style={styles.dateChip}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.dateChipText}>
                {formatDisplayDate(toDateKey(date))}
              </Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                maximumDate={new Date()}
                onChange={(_, selected) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (selected) setDate(selected);
                }}
              />
            )}

            <Pressable
              style={[
                styles.submit,
                (!canSubmit || saving) && styles.submitDisabled,
              ]}
              disabled={!canSubmit || saving}
              onPress={onSubmit}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>
                  {isEdit ? 'Update' : 'Submit'}
                </Text>
              )}
            </Pressable>
            {saving && (
              <Text style={styles.savingHint}>Saving to your sheet...</Text>
            )}

            {isEdit && (
              <Pressable style={styles.deleteBtn} onPress={onDelete}>
                <Text style={styles.deleteText}>Delete expense</Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: { ...typography.heading, marginBottom: spacing.sm },
  label: { ...typography.label, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    backgroundColor: colors.background,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currency: { ...typography.subheading, color: colors.primary },
  amountInput: { flex: 1 },
  dateChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  dateChipText: { color: colors.primary, fontWeight: '600' },
  submit: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { ...typography.bodyBold, color: colors.white },
  savingHint: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textMuted,
  },
  deleteBtn: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: { color: colors.danger, fontWeight: '600' },
});
