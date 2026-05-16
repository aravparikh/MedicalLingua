import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hapticLight, hapticMedium } from '../utils/haptics';

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
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

export default function DialScreen() {
  const router = useRouter();

  function startTranslator(mode: 'room' | 'phone') {
    hapticMedium();
    router.push({ pathname: '/call', params: { mode } });
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              router.back();
            }}
            style={s.backBtn}
          >
            <Text style={s.backText}>Atrás</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Antes de empezar</Text>
          <View style={{ width: 76 }} />
        </View>

        <View style={s.hero}>
          <Text style={s.title}>¿Dónde está su doctor?</Text>
          <Text style={s.subtitle}>Elija una opción. MedLingua no hace la llamada; traduce lo que escucha.</Text>
        </View>

        <View style={s.cards}>
          <TouchableOpacity style={s.primaryCard} onPress={() => startTranslator('room')} activeOpacity={0.86}>
            <View style={s.iconBlue}>
              <Text style={s.emoji}>🩺</Text>
            </View>
            <Text style={s.cardTitle}>Está conmigo</Text>
            <Text style={s.cardText}>Use esto en la sala médica. Ponga el teléfono cerca de usted.</Text>
            <View style={s.cardButton}>
              <Text style={s.cardButtonText}>Empezar traducción</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.phoneCard} onPress={() => startTranslator('phone')} activeOpacity={0.86}>
            <View style={s.iconWarm}>
              <Text style={s.emoji}>🔊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.phoneTitle}>Estoy en una llamada</Text>
              <Text style={s.phoneText}>Ponga la llamada en altavoz, luego regrese aquí.</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.truthCard}>
          <Text style={s.truthTitle}>Importante</Text>
          <Text style={s.truthText}>
            En Expo Go, MedLingua no puede conectarse directamente a la llamada del iPhone. Funciona escuchando el altavoz.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, paddingHorizontal: 20 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { minWidth: 76, minHeight: 60, justifyContent: 'center' },
  backText: { fontSize: 18, color: C.primary, fontWeight: '900' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.ink },
  hero: { paddingTop: 28, paddingBottom: 20 },
  title: { fontSize: 36, lineHeight: 42, fontWeight: '900', color: C.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 20, lineHeight: 29, color: C.inkSoft, fontWeight: '700', marginTop: 10 },
  cards: { gap: 14 },
  primaryCard: {
    backgroundColor: C.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: C.line,
    padding: 22,
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconBlue: { width: 74, height: 74, borderRadius: 24, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  iconWarm: { width: 62, height: 62, borderRadius: 21, backgroundColor: C.warmTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emoji: { fontSize: 34 },
  cardTitle: { fontSize: 28, fontWeight: '900', color: C.ink, marginBottom: 8 },
  cardText: { fontSize: 19, lineHeight: 28, color: C.inkSoft, fontWeight: '700', marginBottom: 18 },
  cardButton: { minHeight: 64, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  cardButtonText: { fontSize: 21, fontWeight: '900', color: '#fff' },
  phoneCard: {
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.line,
    padding: 18,
  },
  phoneTitle: { fontSize: 22, fontWeight: '900', color: C.ink },
  phoneText: { fontSize: 17, lineHeight: 24, color: C.inkSoft, fontWeight: '700', marginTop: 3 },
  chev: { fontSize: 32, color: C.warm, fontWeight: '700' },
  truthCard: { marginTop: 'auto', marginBottom: 20, backgroundColor: C.listenTint, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#2F8F7333' },
  truthTitle: { fontSize: 18, fontWeight: '900', color: C.listen, marginBottom: 4 },
  truthText: { fontSize: 16, lineHeight: 23, color: C.ink, fontWeight: '700' },
});
