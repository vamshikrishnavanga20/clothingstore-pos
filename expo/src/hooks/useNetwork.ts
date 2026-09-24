/**
 * useNetwork — Network connectivity and server health hook.
 */

import { useState, useEffect } from 'react';
import { getBaseApiUrl } from '../services/api';

let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo')?.default || require('@react-native-community/netinfo');
} catch (e) {
  // fallback if not linked
}

export function useNetwork() {
  const [isOffline, setIsOffline] = useState(false);
  const [isServerReachable, setIsServerReachable] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    if (NetInfo && typeof NetInfo.addEventListener === 'function') {
      try {
        unsubscribe = NetInfo.addEventListener((state: any) => {
          setIsOffline(!state.isConnected);
        });
      } catch (e) {
        // fallback
      }
    }

    // Also periodic ping to Next.js API
    let active = true;
    const checkServer = async () => {
      try {
        const baseUrl = await getBaseApiUrl();
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${baseUrl}/api/branches`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (active) setIsServerReachable(res.ok);
      } catch (e) {
        if (active) setIsServerReachable(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);

    return () => {
      active = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { isOffline: isOffline || !isServerReachable, isServerReachable };
}
