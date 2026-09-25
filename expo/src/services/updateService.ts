/**
 * updateService — Production Over-The-Air (OTA) & In-App Upgrade System
 * Powers automatic updates, manual check-for-updates, and seamless bundle reloads.
 */

import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { getBaseApiUrl } from './api';
import { safeStorage } from '../utils/storage';

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_NUMBER = 1;

export interface VersionInfo {
  currentVersion: string;
  buildNumber: number;
  otaEnabled: boolean;
  channel: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  createdAt: Date | null;
  isEmergencyLaunch: boolean;
  lastCheckedDate: string | null;
}

export interface RemoteUpdateCheckResult {
  hasUpdate: boolean;
  isOta: boolean;
  latestVersion: string;
  releaseNotes: string[];
  releaseDate?: string;
  forceUpdate?: boolean;
  apkDownloadUrl?: string;
  message?: string;
}

/**
 * Get current running update and app metadata
 */
export async function getAppVersionInfo(): Promise<VersionInfo> {
  const lastChecked = await safeStorage.getItem('roman_pos_last_update_check');

  return {
    currentVersion: CURRENT_APP_VERSION,
    buildNumber: CURRENT_BUILD_NUMBER,
    otaEnabled: Updates.isEnabled,
    channel: Updates.channel || (Platform.OS === 'web' ? 'web' : 'standalone'),
    runtimeVersion: Updates.runtimeVersion || CURRENT_APP_VERSION,
    updateId: Updates.updateId || null,
    createdAt: Updates.createdAt || null,
    isEmergencyLaunch: Updates.isEmergencyLaunch || false,
    lastCheckedDate: lastChecked,
  };
}

/**
 * Check if an update is available via EAS Update (native OTA) or via Store Server API
 */
export async function checkForAppUpdates(): Promise<RemoteUpdateCheckResult> {
  await safeStorage.setItem('roman_pos_last_update_check', new Date().toISOString());

  // 1. Try Native EAS Over-The-Air Update if enabled (in standalone APK)
  if (Updates.isEnabled) {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        return {
          hasUpdate: true,
          isOta: true,
          latestVersion: (Updates.manifest as any)?.extra?.expoClient?.version || 'New Patch',
          releaseNotes: [
            'Instant Over-The-Air bundle update',
            'Bug fixes and performance improvements',
            'No manual APK reinstallation needed',
          ],
          message: 'A new Over-The-Air update is ready to download!',
        };
      }
    } catch (err: any) {
      console.warn('[Updates] Native OTA check notice:', err?.message || err);
      // Fall through to server API check
    }
  }

  // 2. Query Store Server Version API
  try {
    const baseUrl = await getBaseApiUrl();
    const res = await fetch(`${baseUrl}/api/app-version`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (res.ok) {
      const data = await res.json();
      const serverVersion = data.latestVersion || CURRENT_APP_VERSION;
      const isNewer = compareVersions(serverVersion, CURRENT_APP_VERSION) > 0;

      return {
        hasUpdate: isNewer,
        isOta: Updates.isEnabled,
        latestVersion: serverVersion,
        releaseNotes: Array.isArray(data.releaseNotes) ? data.releaseNotes : [
          'Performance enhancements',
          'Latest UI and billing improvements',
        ],
        releaseDate: data.releaseDate,
        forceUpdate: !!data.forceUpdate,
        apkDownloadUrl: data.apkDownloadUrl,
        message: isNewer
          ? `Version ${serverVersion} is available with new enhancements!`
          : 'You are running the latest version.',
      };
    }
  } catch (err) {
    console.warn('[Updates] Server version endpoint unavailable:', err);
  }

  // 3. If in development / Expo Go / Web and not standalone
  if (!Updates.isEnabled) {
    return {
      hasUpdate: false,
      isOta: false,
      latestVersion: CURRENT_APP_VERSION,
      releaseNotes: [
        'Development/Expo Go Mode: Native OTA updates activate automatically inside the built Android APK.',
      ],
      message: 'Running development environment. OTA active in production APK.',
    };
  }

  return {
    hasUpdate: false,
    isOta: true,
    latestVersion: CURRENT_APP_VERSION,
    releaseNotes: [],
    message: 'Your Roman Island POS terminal is completely up to date.',
  };
}

/**
 * Downloads the OTA update and immediately applies it by reloading the JS runtime.
 */
export async function downloadAndApplyUpdate(
  onProgress?: (status: string) => void
): Promise<{ success: boolean; error?: string }> {
  if (!Updates.isEnabled) {
    onProgress?.('Simulating update applied...');
    await new Promise((r) => setTimeout(r, 1200));
    return {
      success: true,
      error: undefined,
    };
  }

  try {
    onProgress?.('Downloading update package...');
    const result = await Updates.fetchUpdateAsync();

    if (result.isNew) {
      onProgress?.('Installing update & restarting terminal...');
      // Give UI 500ms to show the restart status before reload
      await new Promise((r) => setTimeout(r, 500));
      await Updates.reloadAsync();
      return { success: true };
    } else {
      return { success: false, error: 'Update package was already cached.' };
    }
  } catch (err: any) {
    console.error('[Updates] Error fetching update:', err);
    return {
      success: false,
      error: err?.message || 'Failed to download update package.',
    };
  }
}

/**
 * Compare two semver strings (e.g., '1.0.1' vs '1.0.0')
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
function compareVersions(v1: string, v2: string): number {
  const clean1 = (v1 || '').replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  const clean2 = (v2 || '').replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);

  const length = Math.max(clean1.length, clean2.length);
  for (let i = 0; i < length; i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
