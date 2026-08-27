import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/useAppStore';
import { ADD_EXPENSE_DEEP_LINK, subscribeShake } from '../services/shakeDetect';
import {
  isBackgroundShakeRunning,
  setBackgroundShakeSensitivity,
  startBackgroundShakeService,
  stopBackgroundShakeService,
} from '../services/backgroundShake';
import {
  getBackgroundShakeEnabled,
} from '../services/storage';

function openAddExpenseModal() {
  const store = useAppStore.getState();
  store.setEditingExpense(null);
  store.setAddExpenseModalVisible(true);
}

function handleIncomingUrl(url: string | null) {
  if (!url) return;
  if (
    url.includes('add-expense') ||
    url.startsWith(ADD_EXPENSE_DEEP_LINK) ||
    url.includes('://add')
  ) {
    openAddExpenseModal();
  }
}

/**
 * Foreground + optional background (home-screen) shake → Add Expense.
 * Background requires Settings toggle; shows a persistent notification while active.
 */
export function ShakeToAddListener() {
  const sensitivity = useAppStore((s) => s.shakeSensitivity);
  const modalVisible = useAppStore((s) => s.addExpenseModalVisible);
  const backgroundShakeEnabled = useAppStore((s) => s.backgroundShakeEnabled);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const modalVisibleRef = useRef(modalVisible);
  modalVisibleRef.current = modalVisible;
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;

  // Deep link / notification → open modal
  useEffect(() => {
    if (!isAuthenticated) return;

    const subUrl = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url);
    });
    void Linking.getInitialURL().then(handleIncomingUrl);

    const subNotif = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          openAddExpense?: boolean;
        };
        if (data?.openAddExpense) openAddExpenseModal();
        handleIncomingUrl(ADD_EXPENSE_DEEP_LINK);
      },
    );

    return () => {
      subUrl.remove();
      subNotif.remove();
    };
  }, [isAuthenticated]);

  // Keep sensitivity synced into background service
  useEffect(() => {
    setBackgroundShakeSensitivity(sensitivity);
  }, [sensitivity]);

  // Start/stop Android foreground service for home-screen shake
  useEffect(() => {
    if (!isAuthenticated) {
      void stopBackgroundShakeService();
      return;
    }

    let cancelled = false;
    (async () => {
      const enabled =
        backgroundShakeEnabled || (await getBackgroundShakeEnabled());
      if (cancelled) return;
      if (enabled) {
        await startBackgroundShakeService(sensitivityRef.current);
      } else if (isBackgroundShakeRunning()) {
        await stopBackgroundShakeService();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backgroundShakeEnabled, isAuthenticated]);

  // In-app / foreground shake (always on while authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    let sub: { unsubscribe: () => void } | null = null;
    let appState: AppStateStatus = AppState.currentState;

    const stop = () => {
      sub?.unsubscribe();
      sub = null;
    };

    const start = () => {
      if (sub) return;
      // When background service is running it already listens — avoid double fire
      // still listen in foreground for instant modal without notification hop
      sub = subscribeShake(
        () => sensitivityRef.current,
        () => {
          if (modalVisibleRef.current) return;
          if (appState !== 'active') return;
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => undefined);
          openAddExpenseModal();
        },
      );
    };

    if (appState === 'active') start();

    const appSub = AppState.addEventListener('change', (next) => {
      appState = next;
      if (next === 'active') {
        start();
        // If user returned via deep link, ensure modal opens
        void Linking.getInitialURL().then(handleIncomingUrl);
      } else {
        // Foreground listener stops; background FGS continues if enabled
        stop();
      }
    });

    return () => {
      appSub.remove();
      stop();
    };
  }, [isAuthenticated]);

  return null;
}
