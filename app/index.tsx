import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getPreferredLanguage } from '../services/preferences';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F1EB' }}>
        <ActivityIndicator color="#0F5BA8" />
      </View>
    );
  }

  return <Redirect href={hasLanguage ? '/home' : '/welcome'} />;
}
