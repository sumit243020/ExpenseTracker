import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../types';
import { CATEGORY_META } from '../utils/format';
import { colors, radius, spacing, typography } from '../constants/theme';

interface Props {
  value: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
}

export function CategoryChips({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {EXPENSE_CATEGORIES.map((cat) => {
        const selected = cat === value;
        return (
          <Pressable
            key={cat}
            onPress={() => onChange(cat)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={styles.icon}>{CATEGORY_META[cat].icon}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  icon: { fontSize: 14 },
  label: { ...typography.caption, color: colors.textSecondary },
  labelSelected: { color: colors.primary, fontWeight: '600' },
});
