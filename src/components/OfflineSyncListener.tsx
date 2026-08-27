import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { flushPendingQueue } from '../services/expenseSync';
import { useToast } from './Toast';

/** Flushes offline expense queue when connectivity returns. */
export function OfflineSyncListener() {
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        flushPendingQueue()
          .then(() => undefined)
          .catch(() => {
            showToast('Could not sync pending expenses', 'error');
          });
      }
    });
    return () => unsub();
  }, [showToast]);

  return null;
}
