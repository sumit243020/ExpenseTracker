import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { MainTabs } from './MainTabs';
import { useAppStore } from '../store/useAppStore';
import {
  getCurrency,
  getMonthlyBudget,
  getBudgetAlertsEnabled,
  getShakeSensitivity,
  getSpreadsheetId,
} from '../services/storage';
import { restoreSession } from '../services/google-auth';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [ready, setReady] = useState(false);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setUser = useAppStore((s) => s.setUser);
  const setAccessToken = useAppStore((s) => s.setAccessToken);
  const setSpreadsheetId = useAppStore((s) => s.setSpreadsheetId);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const setMonthlyBudget = useAppStore((s) => s.setMonthlyBudget);
  const setBudgetAlertsEnabled = useAppStore((s) => s.setBudgetAlertsEnabled);
  const setShakeSensitivity = useAppStore((s) => s.setShakeSensitivity);
  const setHydrating = useAppStore((s) => s.setHydrating);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setHydrating(false);
        setReady(true);
      }
    }, 5000);

    (async () => {
      try {
        const [session, sheetId, currency, budget, alerts, shake] =
          await Promise.all([
            restoreSession().catch(() => null),
            getSpreadsheetId().catch(() => null),
            getCurrency().catch(() => 'INR' as const),
            getMonthlyBudget().catch(() => null),
            getBudgetAlertsEnabled().catch(() => false),
            getShakeSensitivity().catch(() => 'medium' as const),
          ]);

        if (cancelled) return;

        setCurrency(currency);
        setMonthlyBudget(budget);
        setBudgetAlertsEnabled(alerts);
        setShakeSensitivity(shake);

        if (session) {
          setUser(session.user);
          setAccessToken(session.accessToken);
          if (sheetId) setSpreadsheetId(sheetId);
        }
      } catch (e) {
        console.warn('Hydration failed', e);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) {
          setHydrating(false);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [
    setAccessToken,
    setBudgetAlertsEnabled,
    setCurrency,
    setHydrating,
    setMonthlyBudget,
    setShakeSensitivity,
    setSpreadsheetId,
    setUser,
  ]);

  if (!ready) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
