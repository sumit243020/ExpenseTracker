import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { APP_NAME } from '../config';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoMark}>₹</Text>
      </View>
      <Text style={styles.title}>{APP_NAME}</Text>
      <ActivityIndicator
        color={colors.primary}
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoMark: {
    fontSize: 36,
    color: colors.white,
    fontWeight: '700',
  },
  title: {
    ...typography.heading,
    color: colors.primary,
  },
});
