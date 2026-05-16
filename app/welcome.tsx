import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { setPreferredLanguage, type AppLanguage } from '../services/preferences';
import { hapticSuccess } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  inkSoft: '#555960',
  primary: '#0F5BA8',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
};

export default function WelcomeScreen() {
  const router = useRouter();

  async function choose(language: AppLanguage) {
    hapticSuccess();
    await setPreferredLanguage(language);
    router.replace('/home');
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safe}>
        <View style={s.heroIcon}>
          <Text style={s.heroEmoji}>🩺</Text>
        </View>

        <Text style={s.title}>MedLingua</Text>
        <Text style={s.subtitle}>
          Para entender a su doctor con calma, en palabras claras.
        </Text>

        <View style={s.card}>
          <Text style={s.question}>¿Qué idioma prefiere?</Text>
          <TouchableOpacity style={s.primaryButton} onPress={() => choose('es')} activeOpacity={0.85}>
            <Text style={s.primaryButtonText}>Hablo Español</Text>
            <Text style={s.buttonSub}>Usar la app en español</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryButton} onPress={() => choose('en')} activeOpacity={0.85}>
            <Text style={s.secondaryButtonText}>I speak English</Text>
            <Text style={s.secondarySub}>Use the app in English</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>Puede cambiar esto después.</Text>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: C.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 22,
  },
  heroEmoji: { fontSize: 46 },
  title: { fontSize: 42, fontWeight: '800', color: C.ink, textAlign: 'center', letterSpacing: -0.8 },
  subtitle: { fontSize: 22, lineHeight: 31, color: C.inkSoft, textAlign: 'center', marginTop: 10, marginBottom: 32 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.line,
    padding: 18,
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  question: { fontSize: 21, fontWeight: '800', color: C.ink, marginBottom: 14, textAlign: 'center' },
  primaryButton: {
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { fontSize: 24, fontWeight: '900', color: '#fff' },
  buttonSub: { fontSize: 16, color: '#EAF4FF', marginTop: 3, fontWeight: '700' },
  secondaryButton: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: C.warmTint,
    borderWidth: 1,
    borderColor: '#B66A3E44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 21, fontWeight: '800', color: C.warm },
  secondarySub: { fontSize: 16, color: C.inkSoft, marginTop: 3, fontWeight: '700' },
  footer: { fontSize: 16, color: C.inkSoft, textAlign: 'center', marginTop: 24, fontWeight: '600' },
});
