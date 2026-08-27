import { Linking, Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import * as Notifications from 'expo-notifications';
import {
  ADD_EXPENSE_DEEP_LINK,
  subscribeShake,
} from './shakeDetect';
import { getShakeSensitivity } from './storage';
import type { ShakeSensitivity } from '../types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let sensitivityCache: ShakeSensitivity = 'medium';

export function setBackgroundShakeSensitivity(level: ShakeSensitivity) {
  sensitivityCache = level;
}

async function notifyAndOpenAddExpense() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Add Expense',
        body: 'Shake detected — opening ExpenseTracker',
        data: { openAddExpense: true },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  } catch {
    // ignore
  }

  try {
    await Linking.openURL(ADD_EXPENSE_DEEP_LINK);
  } catch {
    // Android may block background activity starts; notification is the fallback
  }
}

const backgroundTask = async () => {
  const shake = subscribeShake(
    () => sensitivityCache,
    () => {
      void notifyAndOpenAddExpense();
    },
  );

  // Keep the foreground-service JS loop alive
  while (BackgroundService.isRunning()) {
    await sleep(1000);
  }
  shake.unsubscribe();
};

const options = {
  taskName: 'ExpenseShake',
  taskTitle: 'ExpenseTracker',
  taskDesc: 'Shake anywhere to add an expense',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap' as const,
  },
  color: '#0F766E',
  linkingURI: ADD_EXPENSE_DEEP_LINK,
  parameters: {},
};

export async function startBackgroundShakeService(
  sensitivity: ShakeSensitivity = 'medium',
): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  sensitivityCache = sensitivity;
  try {
    const stored = await getShakeSensitivity();
    sensitivityCache = stored;
  } catch {
    // keep default
  }

  if (BackgroundService.isRunning()) {
    return true;
  }

  try {
    await BackgroundService.start(backgroundTask, options);
    return true;
  } catch (e) {
    console.warn('Failed to start background shake service', e);
    return false;
  }
}

export async function stopBackgroundShakeService(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
    }
  } catch (e) {
    console.warn('Failed to stop background shake service', e);
  }
}

export function isBackgroundShakeRunning(): boolean {
  try {
    return BackgroundService.isRunning();
  } catch {
    return false;
  }
}
