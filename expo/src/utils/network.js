// Network & Connectivity Engine for Roman Island POS Mobile Terminal
import { Platform, NativeModules } from 'react-native';
import { Storage, STORAGE_KEYS } from './storage';

let Constants = null;
try {
  Constants = require('expo-constants')?.default || require('expo-constants');
} catch (e) {
  // fallback if expo-constants not installed
}


/**
 * Smartly resolve the default server IP based on runtime environment
 */
export function getDefaultServerUrl() {
  // 1. Try to extract Metro LAN Host IP from Expo configuration
  try {
    const hostUri = Constants?.expoConfig?.hostUri;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:3000`;
      }
    }
  } catch (e) {
    // ignore
  }

  // 2. Android Emulator special localhost mapping
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // 3. Web or iOS simulator
  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    return 'http://localhost:3000';
  }

  // 4. Fallback LAN IP
  return 'http://192.168.29.89:3000';
}

/**
 * Fetch wrapper with timeout prevention
 */
export async function fetchWithTimeout(resource, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Test connectivity and measure latency to the Next.js POS API
 */
export async function testServerConnection(baseUrl) {
  const cleanUrl = (baseUrl || '').trim().replace(/\/$/, '');
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(`${cleanUrl}/api/branches`, {
      headers: { Accept: 'application/json' },
    }, 4000);

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        latencyMs: Date.now() - start,
        branchesCount: Array.isArray(data) ? data.length : 0,
        error: null,
      };
    } else {
      return {
        online: false,
        latencyMs: Date.now() - start,
        branchesCount: 0,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err) {
    return {
      online: false,
      latencyMs: 0,
      branchesCount: 0,
      error: err.name === 'AbortError' ? 'Connection timed out (4s)' : (err.message || 'Server unreachable'),
    };
  }
}
