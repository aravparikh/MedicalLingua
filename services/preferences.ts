import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'es' | 'en';

const LANGUAGE_KEY = 'medlingua_language';

export async function getPreferredLanguage(): Promise<AppLanguage | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  return value === 'en' || value === 'es' ? value : null;
}

export async function setPreferredLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
