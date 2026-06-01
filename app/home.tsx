import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import LanguagePill from '../components/LanguagePill';
import { useLanguage } from '../hooks/useLanguage';
import { saveCall } from '../services/storage';
import { createDemoCall } from '../utils/demo';
import { hapticMedium, hapticSuccess } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';

const L = {
  es: {
    kicker: 'Intérprete médico con IA',
    title: 'Entienda a su doctor. En vivo.',
    subtitle: 'Traducción en vivo entre español e inglés. Para visitas en persona, por video o por teléfono.',
    startVisitTitle: 'Comenzar visita',
    startVisitSub: 'Traduzca su conversación en tiempo real',
    disclaimer: 'MedLingua ayuda con traducción. Siempre confirme medicinas, dosis y fechas con su doctor.',
    demoTitle: 'Modo demo',
    demoBody: '¿Cargar una visita médica de ejemplo para la presentación?',
    demoCancel: 'Cancelar',
    demoLoad: 'Cargar demo',
  },
  en: {
    kicker: 'AI Medical Interpreter',
    title: 'Understand your doctor. Live.',
    subtitle: 'Live translation between English and Spanish. For in-person, video, or phone visits.',
    startVisitTitle: 'Start a visit',
    startVisitSub: 'Translate your conversation in real time',
    disclaimer: 'MedLingua helps with translation. Always confirm medications, doses, and dates with your doctor.',
    demoTitle: 'Demo mode',
    demoBody: 'Load a sample doctor visit for the presentation?',
    demoCancel: 'Cancel',
    demoLoad: 'Load demo',
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const { lang, toggle: toggleLanguage } = useLanguage();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = L[lang];

  useFocusEffect(
    useCallback(() => {
      // Clean focus effect
      return () => {};
    }, [])
  );

  async function loadDemo() {
    hapticSuccess();
    const demo = createDemoCall(lang);
    await saveCall(demo);
    router.push({ pathname: '/summary', params: { id: demo.id } });
  }

  function handleLogoTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 700);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      Alert.alert(t.demoTitle, t.demoBody, [
        { text: t.demoCancel, style: 'cancel' },
        { text: t.demoLoad, onPress: loadDemo },
      ]);
    }
  }

  function startVisit() {
    hapticMedium();
    router.push('/dial');
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Bar */}
          <View style={s.headerRow}>
            <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.9} style={s.logoGroup}>
              <View style={s.logoMark}>
                <Ionicons name="pulse" size={24} color={C.primary} />
              </View>
              <View>
                <Text style={s.wordmark}>MedLingua</Text>
                <View style={s.privacyRow}>
                  <Ionicons name="lock-closed" size={12} color={C.listen} style={{ marginRight: 3 }} />
                  <Text style={s.privacyText}>{lang === 'es' ? 'Conversación privada' : 'Private conversation'}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <LanguagePill lang={lang} onToggle={toggleLanguage} />
          </View>

          {/* Hero Section */}
          <View style={s.hero}>
            <Text style={s.kicker}>{t.kicker}</Text>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.subtitle}>{t.subtitle}</Text>
          </View>

          {/* Single Primary CTA */}
          <TouchableOpacity
            style={s.ctaCard}
            onPress={startVisit}
            activeOpacity={0.88}
          >
            <View style={s.ctaIconContainer}>
              <Ionicons name="mic" size={44} color="#FFF" />
            </View>
            <Text style={s.ctaTitle}>{t.startVisitTitle}</Text>
            <Text style={s.ctaSubtitle}>{t.startVisitSub}</Text>
            <View style={s.ctaArrow}>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text style={s.disclaimer}>{t.disclaimer}</Text>
        </ScrollView>
        <BottomNav active="home" lang={lang} />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 10, flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingVertical: 4 },
  logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.soft,
    borderWidth: 1, borderColor: C.line,
  },
  wordmark: { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.3 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  privacyText: { fontSize: 13, fontWeight: '700', color: C.listen },
  
  hero: { paddingVertical: 12 },
  kicker: { fontSize: 13, fontWeight: '900', color: C.warm, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '900', color: C.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 17, lineHeight: 24, color: C.inkSoft, marginTop: 12, fontWeight: '500' },

  ctaCard: {
    backgroundColor: C.primary,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: C.primaryStrong,
    ...Shadows.glowPrimary,
  },
  ctaIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#EAF4FF',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    opacity: 0.9,
  },
  ctaArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  disclaimer: { fontSize: 14, lineHeight: 20, color: C.inkMute, textAlign: 'center', fontWeight: '500', paddingHorizontal: 16 },
});
