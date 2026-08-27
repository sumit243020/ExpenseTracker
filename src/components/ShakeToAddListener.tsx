import React, { useEffect, useRef } from 'react';
import {
  AppState,
  InteractionManager,
  type AppStateStatus,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { subscribeShake } from '../services/shakeDetect';

function openAddExpenseModal() {
  const store = useAppStore.getState();
  store.setEditingExpense(null);
  store.setAddExpenseModalVisible(true);
}

/** Shake on any in-app screen → Add Expense popup. */
export function ShakeToAddListener() {
  const sensitivity = useAppStore((s) => s.shakeSensitivity);
  const modalVisible = useAppStore((s) => s.addExpenseModalVisible);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const modalVisibleRef = useRef(modalVisible);
  modalVisibleRef.current = modalVisible;
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;

  useEffect(() => {
    if (!isAuthenticated) return;

    let sub: { unsubscribe: () => void } | null = null;
    let appState: AppStateStatus = AppState.currentState;
    let interactionHandle: { cancel: () => void } | null = null;

    const stop = () => {
      sub?.unsubscribe();
      sub = null;
    };

    const start = () => {
      if (sub) return;
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

    interactionHandle = InteractionManager.runAfterInteractions(() => {
      if (appState === 'active') start();
    });

    const appSub = AppState.addEventListener('change', (next) => {
      appState = next;
      if (next === 'active') start();
      else stop();
    });

    return () => {
      interactionHandle?.cancel();
      appSub.remove();
      stop();
    };
  }, [isAuthenticated]);

  return null;
}
