import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_NAME, APP_TAGLINE } from '../config';
import { colors, radius, spacing, typography } from '../constants/theme';
import {
  handleGoogleAuthResponse,
  isGoogleConfigured,
  useGoogleAuthRequest,
} from '../services/google-auth';
import { useAppStore } from '../store/useAppStore';

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);
  const setAccessToken = useAppStore((s) => s.setAccessToken);
  const [request, response, promptAsync] = useGoogleAuthRequest();

  useEffect(() => {
    if (!response) return;
    (async () => {
      setLoading(true);
      try {
        const ok = await handleGoogleAuthResponse(response);
        if (!ok && response.type === 'error') {
          Alert.alert('Sign-in failed', response.error?.message ?? 'Unknown error');
        }
      } catch (e) {
        Alert.alert(
          'Sign-in failed',
          e instanceof Error ? e.message : 'Something went wrong',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [response]);

  const handleGoogle = async () => {
    if (!isGoogleConfigured()) {
      Alert.alert(
        'Google OAuth not configured',
        'Add your Web Client ID in src/config.ts, then try again.\n\nYou can use Demo Login below to explore the UI.',
      );
      return;
    }
    setLoading(true);
    try {
      await promptAsync();
    } catch (e) {
      Alert.alert(
        'Sign-in failed',
        e instanceof Error ? e.message : 'Could not open Google Sign-In',
      );
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setUser({
      id: 'demo',
      name: 'Demo User',
      email: 'demo@example.com',
      photoUrl: undefined,
    });
    setAccessToken('demo-token');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationIcon}>💼</Text>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.googleBtn, (loading || !request) && styles.disabled]}
            onPress={handleGoogle}
            disabled={loading || (!request && isGoogleConfigured())}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.demoBtn} onPress={handleDemo}>
            <Text style={styles.demoText}>Continue with Demo Account</Text>
          </Pressable>

          <Text style={styles.privacy}>
            Your data stays in your own Google Sheet
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  illustrationIcon: { fontSize: 64 },
  appName: {
    ...typography.title,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: { gap: spacing.md },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  disabled: { opacity: 0.7 },
  googleG: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  demoBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  demoText: {
    ...typography.label,
    color: colors.primary,
  },
  privacy: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
