import { Injectable, NgZone } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AppStateService } from './app-state.service';
import type { ShakeSensitivity } from '../models/expense.models';

export const DELTA_THRESHOLDS: Record<ShakeSensitivity, number> = {
  low: 1.6,
  medium: 1.05,
  high: 0.7,
};

@Injectable({ providedIn: 'root' })
export class ShakeService {
  private listening = false;
  private lastShakeAt = 0;
  private last = { x: 0, y: 0, z: 0, ready: false };
  private handler: ((e: DeviceMotionEvent) => void) | null = null;
  private onShakeCb: (() => void) | null = null;
  private cooldownMs = 1500;

  constructor(
    private readonly state: AppStateService,
    private readonly zone: NgZone,
  ) {}

  async start(onShake: () => void): Promise<void> {
    if (this.listening) return;
    this.onShakeCb = onShake;
    this.listening = true;

    // iOS requires permission
    const anyDM = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<PermissionState>;
    };
    if (typeof anyDM.requestPermission === 'function') {
      try {
        const result = await anyDM.requestPermission();
        if (result !== 'granted') {
          this.listening = false;
          return;
        }
      } catch {
        this.listening = false;
        return;
      }
    }

    this.handler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      const x = acc.x;
      const y = acc.y;
      const z = acc.z;

      if (!this.last.ready) {
        this.last = { x, y, z, ready: true };
        return;
      }

      const dx = x - this.last.x;
      const dy = y - this.last.y;
      const dz = z - this.last.z;
      this.last = { x, y, z, ready: true };

      const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const threshold = DELTA_THRESHOLDS[this.state.shakeSensitivity];
      if (delta <= threshold) return;

      const now = Date.now();
      if (now - this.lastShakeAt < this.cooldownMs) return;
      this.lastShakeAt = now;

      if (!this.state.isAuthenticated) return;

      this.zone.run(() => {
        void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => undefined);
        this.onShakeCb?.();
      });
    };

    window.addEventListener('devicemotion', this.handler);
  }

  stop(): void {
    if (this.handler) {
      window.removeEventListener('devicemotion', this.handler);
      this.handler = null;
    }
    this.listening = false;
    this.onShakeCb = null;
    this.last = { x: 0, y: 0, z: 0, ready: false };
  }
}
