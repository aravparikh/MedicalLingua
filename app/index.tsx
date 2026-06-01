import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getPreferredLanguage } from '../services/preferences';

import { Theme } from '../constants/theme';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [hasLanguage, setHasLanguage] = useState(false);

  useEffect(() => {
    getPreferredLanguage()
      .then(language => setHasLanguage(Boolean(language)))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.bg }}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }

  return <Redirect href={hasLanguage ? '/home' : '/welcome'} />;
}
