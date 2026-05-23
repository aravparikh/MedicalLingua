import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Cached locally so haptic calls don't all become async — we read once,
// then watch for changes via AsyncStorage. Default: enabled.
let enabled = true;
let hydrated = false;

const KEY = 'medlingua_haptics';

async function hydrate() {
  if (hydrated) return;
  try {
    const value = await AsyncStorage.getItem(KEY);
    enabled = value !== 'false';
  } catch {
    enabled = true;
  } finally {
    hydrated = true;
  }
}

// Kick off hydration immediately on module load.
hydrate();

/**
 * Call this from anywhere that updates the preference to keep the cache fresh.
 * Settings screen calls this implicitly via AsyncStorage; we re-read on app focus too.
 */
export async function refreshHapticsPreference() {
  hydrated = false;
  await hydrate();
}

export function hapticLight() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function hapticMedium() {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function hapticSuccess() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticWarning() {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
