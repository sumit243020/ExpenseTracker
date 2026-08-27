export const colors = {
  primary: '#0F766E',
  primaryDark: '#0D5F59',
  primaryLight: '#14B8A6',
  primaryMuted: '#CCFBF1',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  danger: '#DC2626',
  dangerMuted: '#FEE2E2',
  warning: '#D97706',
  success: '#059669',
  overlay: 'rgba(15, 23, 42, 0.45)',
  chipBg: '#F1F5F9',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 14, fontWeight: '500' as const, color: colors.textSecondary },
};
