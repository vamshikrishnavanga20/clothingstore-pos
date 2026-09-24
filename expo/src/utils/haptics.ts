import * as Haptics from 'expo-haptics';

/**
 * Ultra-responsive, zero-latency haptics utility.
 * Guaranteed non-blocking and fire-and-forget to eliminate any touch delay or JS thread stalls.
 */

let lastHapticTime = 0;
const HAPTIC_DEBOUNCE_MS = 60;

function canTriggerHaptic(): boolean {
  const now = Date.now();
  if (now - lastHapticTime < HAPTIC_DEBOUNCE_MS) {
    return false;
  }
  lastHapticTime = now;
  return true;
}

export function hapticTap() {
  if (!canTriggerHaptic()) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // Non-blocking no-op
  }
}

export function hapticMedium() {
  if (!canTriggerHaptic()) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  } catch {
    // Non-blocking no-op
  }
}

export function hapticSelection() {
  if (!canTriggerHaptic()) return;
  try {
    Haptics.selectionAsync().catch(() => {});
  } catch {
    // Non-blocking no-op
  }
}

export function hapticSuccess() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // Non-blocking no-op
  }
}

export function hapticWarning() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  } catch {
    // Non-blocking no-op
  }
}
