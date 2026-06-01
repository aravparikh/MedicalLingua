import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LanguagePill from '../components/LanguagePill';
import { useLanguage } from '../hooks/useLanguage';
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

const L = {
  es: {
    back: 'Inicio',
    headerTitle: 'Antes de empezar',
    title: '¿Dónde está su doctor?',
    subtitle: 'Elija una opción. MedLingua no hace la llamada; traduce lo que escucha.',
    inPersonTitle: 'Está conmigo',
    inPersonBody: 'Use esto en la sala médica. Ponga el teléfono cerca de usted.',
    inPersonCta: 'Empezar traducción',
    phoneTitle: 'Estoy en una llamada',
    phoneBody: 'Ponga la llamada en altavoz, luego regrese aquí.',
    important: 'Importante',
    importantText: 'En Expo Go, MedLingua no puede conectarse directamente a la llamada del iPhone. Funciona escuchando el altavoz.',
  },
  en: {
    back: 'Home',
    headerTitle: 'Before we start',
    title: 'Where is your doctor?',
    subtitle: 'Pick an option. MedLingua does not place the call; it translates what it hears.',
    inPersonTitle: 'With me in the room',
    inPersonBody: 'Use this at the clinic. Place the phone near you.',
    inPersonCta: 'Start translation',
    phoneTitle: 'I am on a call',
    phoneBody: 'Put the call on speaker, then come back here.',
    important: 'Important',
    importantText: 'In Expo Go, MedLingua cannot connect directly to your iPhone call. It works by listening to the speaker.',
  },
};

export default function DialScreen() {
  const router = useRouter();
  const { lang, toggle } = useLanguage();
  const t = L[lang];

  function startTranslator(mode: 'room' | 'phone') {
    hapticMedium();
    router.push({ pathname: '/call', params: { mode } });
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => { hapticLight(); router.replace('/home'); }}
              style={s.backBtn}
            >
              <Text style={s.backText}>← {t.back}</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>{t.headerTitle}</Text>
            <LanguagePill lang={lang} onToggle={toggle} />
          </View>

          <View style={s.hero}>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.subtitle}>{t.subtitle}</Text>
          </View>

          <View style={s.cards}>
            <TouchableOpacity style={s.primaryCard} onPress={() => startTranslator('room')} activeOpacity={0.86}>
              <View style={s.iconBlue}>
                <Text style={s.emoji}>🩺</Text>
              </View>
              <Text style={s.cardTitle}>{t.inPersonTitle}</Text>
              <Text style={s.cardText}>{t.inPersonBody}</Text>
              <View style={s.cardButton}>
                <Text style={s.cardButtonText}>{t.inPersonCta}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.phoneCard} onPress={() => startTranslator('phone')} activeOpacity={0.86}>
              <View style={s.iconWarm}>
                <Text style={s.emoji}>🔊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.phoneTitle}>{t.phoneTitle}</Text>
                <Text style={s.phoneText}>{t.phoneBody}</Text>
              </View>
              <Text style={s.chev}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={s.truthCard}>
            <Text style={s.truthTitle}>{t.important}</Text>
            <Text style={s.truthText}>{t.importantText}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24, flexGrow: 1 },

  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  backBtn: { minHeight: 48, paddingVertical: 8, paddingRight: 8, justifyContent: 'center' },
  backText: { fontSize: 16, color: C.primary, fontWeight: '700' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: C.ink, textAlign: 'center' },

  hero: { paddingTop: 18, paddingBottom: 16 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, lineHeight: 22, color: C.inkSoft, fontWeight: '500', marginTop: 8 },

  cards: { gap: 12 },
  primaryCard: {
    backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 18,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  iconBlue: { width: 56, height: 56, borderRadius: 18, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  iconWarm: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.warmTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emoji: { fontSize: 28 },
  cardTitle: { fontSize: 24, fontWeight: '900', color: C.ink, marginBottom: 6 },
  cardText: { fontSize: 16, lineHeight: 22, color: C.inkSoft, fontWeight: '500', marginBottom: 14 },
  cardButton: { minHeight: 56, paddingVertical: 14, borderRadius: 16, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  cardButtonText: { fontSize: 16, fontWeight: '900', color: '#fff' },

  phoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16,
  },
  phoneTitle: { fontSize: 20, fontWeight: '800', color: C.ink },
  phoneText: { fontSize: 16, lineHeight: 22, color: C.inkSoft, fontWeight: '500', marginTop: 2 },
  chev: { fontSize: 24, color: C.warm, fontWeight: '700' },

  truthCard: { marginTop: 20, backgroundColor: C.listenTint, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#2F8F7333' },
  truthTitle: { fontSize: 16, fontWeight: '900', color: C.listen, marginBottom: 4, letterSpacing: 0.3, textTransform: 'uppercase' },
  truthText: { fontSize: 16, lineHeight: 22, color: C.ink, fontWeight: '500' },
});
