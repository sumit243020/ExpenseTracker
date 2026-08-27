import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

/** Placeholder — real edit modal built in Phase 6. */
export function EditExpenseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Expense</Text>
      <Text style={styles.subtitle}>Implemented in Phase 6</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  title: { ...typography.heading, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary },
});
