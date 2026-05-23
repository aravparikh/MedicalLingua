import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  getPreferredLanguage,
  setPreferredLanguage,
  type AppLanguage,
} from '../services/preferences';
import { hapticLight } from '../utils/haptics';

/**
 * Reads the saved language preference + provides a toggle.
 * Re-syncs on screen focus so changes from other screens propagate.
 */
export function useLanguage() {
  const [lang, setLang] = useState<AppLanguage>('es');

  useFocusEffect(
    useCallback(() => {
      getPreferredLanguage().then(l => l && setLang(l));
    }, [])
  );

  const toggle = useCallback(async () => {
    hapticLight();
    const next: AppLanguage = lang === 'es' ? 'en' : 'es';
    setLang(next);
    await setPreferredLanguage(next);
  }, [lang]);

  return { lang, toggle };
}
