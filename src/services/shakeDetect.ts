import { Accelerometer } from 'expo-sensors';
import type { ShakeSensitivity } from '../types';

export const DELTA_THRESHOLDS: Record<ShakeSensitivity, number> = {
  low: 1.6,
  medium: 1.05,
  high: 0.7,
};

export const ADD_EXPENSE_DEEP_LINK = 'expensetracker://add-expense';

type Sub = { unsubscribe: () => void };

/**
 * Soft shake subscription via expo-sensors.
 * Never throws into React lifecycle — returns a no-op unsubscribe on failure.
 */
export function subscribeShake(
  getSensitivity: () => ShakeSensitivity,
  onShake: () => void,
  options?: { intervalMs?: number; cooldownMs?: number },
): Sub {
  const intervalMs = options?.intervalMs ?? 100;
  const cooldownMs = options?.cooldownMs ?? 1500;

  let lastShakeAt = 0;
  let last = { x: 0, y: 0, z: 0, ready: false };
  let subscription: { remove: () => void } | null = null;
  let cancelled = false;

  void (async () => {
    try {
      const available = await Accelerometer.isAvailableAsync();
      if (!available || cancelled) return;

      Accelerometer.setUpdateInterval(intervalMs);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        try {
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
        } catch {
          // ignore sample errors
        }
      });
    } catch (e) {
      console.warn('Shake sensors unavailable', e);
    }
  })();

  return {
    unsubscribe: () => {
      cancelled = true;
      try {
        subscription?.remove();
      } catch {
        // ignore
      }
    },
  };
}
