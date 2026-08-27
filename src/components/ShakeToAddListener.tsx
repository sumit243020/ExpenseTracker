import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import type { ShakeSensitivity } from '../types';

/**
 * Delta (jerk) thresholds — Expo Accelerometer is in G's (~1.0 at rest),
 * so absolute magnitude checks are unreliable. We detect sudden changes.
 * lower number = more sensitive
 */
const DELTA_THRESHOLDS: Record<ShakeSensitivity, number> = {
  low: 1.6,
  medium: 1.05,
  high: 0.7,
};

/**
 * Global shake detector while the app process is alive (foreground).
 * Android does not allow continuous shake listening after the app is killed.
 */
export function ShakeToAddListener() {
  const sensitivity = useAppStore((s) => s.shakeSensitivity);
  const modalVisible = useAppStore((s) => s.addExpenseModalVisible);
  const setVisible = useAppStore((s) => s.setAddExpenseModalVisible);
  const setEditing = useAppStore((s) => s.setEditingExpense);

  const lastShakeAt = useRef(0);
  const lastSample = useRef({ x: 0, y: 0, z: 0, ready: false });
  const modalVisibleRef = useRef(modalVisible);
  const sensitivityRef = useRef(sensitivity);
  const setVisibleRef = useRef(setVisible);
  const setEditingRef = useRef(setEditing);

  modalVisibleRef.current = modalVisible;
  sensitivityRef.current = sensitivity;
  setVisibleRef.current = setVisible;
  setEditingRef.current = setEditing;

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    let appState: AppStateStatus = AppState.currentState;

    const stop = () => {
      sub?.remove();
      sub = null;
      lastSample.current = { x: 0, y: 0, z: 0, ready: false };
    };

    const start = async () => {
      if (cancelled || sub) return;
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!available || cancelled) return;

        // Faster sampling = more reliable shake detection
        Accelerometer.setUpdateInterval(50);

        sub = Accelerometer.addListener(({ x, y, z }) => {
          if (modalVisibleRef.current) return;
          if (appState !== 'active') return;

          const prev = lastSample.current;
          if (!prev.ready) {
            lastSample.current = { x, y, z, ready: true };
            return;
          }

          const dx = x - prev.x;
          const dy = y - prev.y;
          const dz = z - prev.z;
          const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
          lastSample.current = { x, y, z, ready: true };

          const threshold = DELTA_THRESHOLDS[sensitivityRef.current];
          const now = Date.now();
          if (delta > threshold && now - lastShakeAt.current > 1200) {
            lastShakeAt.current = now;
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => undefined);
            setEditingRef.current(null);
            setVisibleRef.current(true);
          }
        });
      } catch (e) {
        console.warn('Shake detector unavailable', e);
      }
    };

    if (appState === 'active') {
      void start();
    }

    const onAppState = (next: AppStateStatus) => {
      appState = next;
      if (next === 'active') {
        void start();
      } else {
        // Pause while minimized to save battery; resume when opened again
        stop();
      }
    };

    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      cancelled = true;
      appSub.remove();
      stop();
    };
  }, []);

  return null;
}
