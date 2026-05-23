import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'es' | 'en';

const LANGUAGE_KEY = 'medlingua_language';
const TUTORIAL_SEEN_KEY = 'medlingua_tutorial_seen';
const TTS_RATE_KEY = 'medlingua_tts_rate';
const READ_ALOUD_KEY = 'medlingua_read_aloud';
const HAPTICS_KEY = 'medlingua_haptics';

export async function getPreferredLanguage(): Promise<AppLanguage | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  return value === 'en' || value === 'es' ? value : null;
}

export async function setPreferredLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export async function hasSeenTutorial(): Promise<boolean> {
  const value = await AsyncStorage.getItem(TUTORIAL_SEEN_KEY);
  return value === 'true';
}

export async function setTutorialSeen(): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
}

// TTS speech rate (0.7 = slow & clear, 1.0 = normal)
export async function getTTSRate(): Promise<number> {
  const value = await AsyncStorage.getItem(TTS_RATE_KEY);
  const n = value ? parseFloat(value) : NaN;
  return isFinite(n) && n >= 0.5 && n <= 1.5 ? n : 0.88;
}

export async function setTTSRate(rate: number): Promise<void> {
  await AsyncStorage.setItem(TTS_RATE_KEY, String(rate));
}

// Whether the call screen reads translations aloud by default
export async function getReadAloudDefault(): Promise<boolean> {
  const value = await AsyncStorage.getItem(READ_ALOUD_KEY);
  return value === 'true';
}

export async function setReadAloudDefault(on: boolean): Promise<void> {
  await AsyncStorage.setItem(READ_ALOUD_KEY, on ? 'true' : 'false');
}

// Haptics on/off (some people find them annoying)
export async function getHapticsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(HAPTICS_KEY);
  return value !== 'false'; // default ON
}

export async function setHapticsEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(HAPTICS_KEY, on ? 'true' : 'false');
}

// Reset tutorial flag (for re-watching from settings)
export async function resetTutorial(): Promise<void> {
  await AsyncStorage.removeItem(TUTORIAL_SEEN_KEY);
}
