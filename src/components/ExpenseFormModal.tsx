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
  deleteExpenseLocal,
  saveExpense,
  updateExpenseLocal,
} from '../services/expenseSync';

export function ExpenseFormModal() {
  const visible = useAppStore((s) => s.addExpenseModalVisible);
  const editing = useAppStore((s) => s.editingExpense);
  const setVisible = useAppStore((s) => s.setAddExpenseModalVisible);
  const setEditing = useAppStore((s) => s.setEditingExpense);
  const currency = useAppStore((s) => s.currency);

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
        await updateExpenseLocal(editing.rowId, payload);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        showToast('Expense updated', 'success');
        close();
      } else {
        await saveExpense(payload);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        showToast('Expense saved', 'success');
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
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpenseLocal(editing.rowId);
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
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{isEdit ? 'Edit expense' : 'Add expense'}</Text>

          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>{getCurrencySymbol(currency)}</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What did you spend on?"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Category</Text>
          <CategoryChips value={category} onChange={setCategory} />

          <Text style={styles.label}>Date</Text>
          <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{formatDisplayDate(toDateKey(date))}</Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selected) => {
                setShowPicker(Platform.OS === 'ios');
                if (selected) setDate(selected);
              }}
            />
          )}

          <Pressable
            style={[styles.saveBtn, (!canSubmit || saving) && styles.disabled]}
            onPress={() => void onSubmit()}
            disabled={!canSubmit || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>
            )}
          </Pressable>

          {isEdit ? (
            <Pressable style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: { ...typography.heading, marginBottom: spacing.sm },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currency: { ...typography.heading, color: colors.primary },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  dateText: { ...typography.body },
  saveBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.6 },
  deleteBtn: { alignItems: 'center', paddingVertical: 12 },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
