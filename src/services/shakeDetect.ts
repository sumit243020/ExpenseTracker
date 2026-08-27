import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import type { ShakeSensitivity } from '../types';

export const DELTA_THRESHOLDS: Record<ShakeSensitivity, number> = {
  low: 1.6,
  medium: 1.05,
  high: 0.7,
};

export const ADD_EXPENSE_DEEP_LINK = 'expensetracker://add-expense';

/** Shared shake detector using react-native-sensors (keeps running in background FGS). */
export function subscribeShake(
  getSensitivity: () => ShakeSensitivity,
  onShake: () => void,
  options?: { intervalMs?: number; cooldownMs?: number },
): { unsubscribe: () => void } {
  const intervalMs = options?.intervalMs ?? 50;
  const cooldownMs = options?.cooldownMs ?? 1500;

  let lastShakeAt = 0;
  let last = { x: 0, y: 0, z: 0, ready: false };

  try {
    setUpdateIntervalForType(SensorTypes.accelerometer, intervalMs);
  } catch {
    // ignore
  }

  const subscription = accelerometer.subscribe(({ x, y, z }) => {
    if (!last.ready) {
      last = { x, y, z, ready: true };
      return;
    }
    const dx = x - last.x;
    const dy = y - last.y;
    const dz = z - last.z;
    last = { x, y, z, ready: true };
    const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (delta <= DELTA_THRESHOLDS[getSensitivity()]) return;

    const now = Date.now();
    if (now - lastShakeAt < cooldownMs) return;
    lastShakeAt = now;
    onShake();
  });

  return {
    unsubscribe: () => {
      try {
        subscription.unsubscribe();
      } catch {
        // ignore
      }
    },
  };
}
