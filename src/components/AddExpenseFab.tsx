import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

export function AddExpenseFab() {
  const insets = useSafeAreaInsets();
  const setVisible = useAppStore((s) => s.setAddExpenseModalVisible);
  const setEditing = useAppStore((s) => s.setEditingExpense);

  return (
    <Pressable
      accessibilityLabel="Add expense"
      style={[styles.fab, { bottom: insets.bottom + 72 }]}
      onPress={() => {
        setEditing(null);
        setVisible(true);
      }}
    >
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 50,
  },
  plus: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '400',
    marginTop: -2,
  },
});
