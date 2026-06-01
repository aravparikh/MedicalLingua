import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
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
import { setTutorialSeen } from '../services/preferences';
import { hapticLight, hapticSuccess } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';
type Lang = 'es' | 'en';

interface Slide {
  emoji: string;
  title: string;
  body: string;
  tip?: string;
}

const SLIDES: Record<Lang, Slide[]> = {
  es: [
    {
      emoji: '🩺',
      title: 'Bienvenido a MedLingua',
      body: 'Una app simple para entender a su doctor. Funciona en visitas en persona, por video o por teléfono.',
      tip: 'Mantenga el teléfono cerca de usted y de su doctor.',
    },
    {
      emoji: '👨‍⚕️',
      title: 'Cuando hable el doctor',
      body: 'Toque el botón azul "El doctor habla" cuando su doctor empiece a hablar. La app escucha en inglés y muestra la traducción en español al instante.',
      tip: 'Toque otra vez para detener cuando termine.',
    },
    {
      emoji: '🗣️',
      title: 'Cuando hable usted',
      body: 'Toque el botón naranja "Yo hablo" y diga lo que quiere en español. La app traduce al inglés para el doctor.',
      tip: 'Hable claro y a velocidad normal.',
    },
    {
      emoji: '📋',
      title: 'Reciba su resumen',
      body: 'Al terminar, toque "Terminar". MedLingua le da un resumen sencillo con medicinas, próxima cita y qué hacer en casa.',
      tip: 'Puede compartir el resumen con su familia.',
    },
  ],
  en: [
    {
      emoji: '🩺',
      title: 'Welcome to MedLingua',
      body: 'A simple app to help you understand your doctor. Works for in-person, video, and phone visits.',
      tip: 'Keep the phone close to you and your doctor.',
    },
    {
      emoji: '👨‍⚕️',
      title: 'When the doctor speaks',
      body: 'Tap the blue "Doctor speaks" button when your doctor starts talking. The app listens in English and shows the Spanish translation instantly.',
      tip: 'Tap again to stop when they finish.',
    },
    {
      emoji: '🗣️',
      title: 'When you speak',
      body: 'Tap the orange "I speak" button and say what you want in Spanish. The app translates to English for the doctor.',
      tip: 'Speak clearly at a normal pace.',
    },
    {
      emoji: '📋',
      title: 'Get your summary',
      body: 'When done, tap "End". MedLingua gives you a plain-language summary with medications, next appointment, and what to do at home.',
      tip: 'You can share the summary with family.',
    },
  ],
};

const L = {
  es: {
    skip: 'Saltar',
    next: 'Siguiente',
    start: 'Empezar',
    back: 'Atrás',
    tip: 'Consejo',
    progress: (a: number, b: number) => `Paso ${a} de ${b}`,
  },
  en: {
    skip: 'Skip',
    next: 'Next',
    start: 'Start',
    back: 'Back',
    tip: 'Tip',
    progress: (a: number, b: number) => `Step ${a} of ${b}`,
  },
};

const { width } = Dimensions.get('window');

export default function TutorialScreen() {
  const router = useRouter();
  const { lang, toggle } = useLanguage();
  const t = L[lang];
  const slides = SLIDES[lang];
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function go(toIndex: number) {
    hapticLight();
    const clamped = Math.max(0, Math.min(slides.length - 1, toIndex));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  }

  async function finish() {
    hapticSuccess();
    await setTutorialSeen();
    router.replace('/home');
  }

  async function skip() {
    hapticLight();
    await setTutorialSeen();
    router.replace('/home');
  }

  function onScrollEnd(e: any) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  }

  const isLast = index === slides.length - 1;

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.topBar}>
          <Text style={s.progressText}>{t.progress(index + 1, slides.length)}</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <LanguagePill lang={lang} onToggle={toggle} />
            <TouchableOpacity onPress={skip} style={s.skipBtn}>
              <Text style={s.skipText}>{t.skip}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={{ flex: 1 }}
        >
          {slides.map((slide, i) => (
            <View key={i} style={[s.slide, { width }]}>
              <View style={s.emojiWrap}>
                <Text style={s.emoji}>{slide.emoji}</Text>
              </View>
              <Text style={s.title}>{slide.title}</Text>
              <Text style={s.body}>{slide.body}</Text>
              {slide.tip && (
                <View style={s.tipCard}>
                  <Text style={s.tipLabel}>💡 {t.tip}</Text>
                  <Text style={s.tipText}>{slide.tip}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={s.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </View>

        <View style={s.controls}>
          <TouchableOpacity
            style={[s.backBtn, index === 0 && s.btnDisabled]}
            onPress={() => go(index - 1)}
            disabled={index === 0}
            activeOpacity={0.7}
          >
            <Text style={[s.backText, index === 0 && s.textDisabled]}>← {t.back}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.nextBtn}
            onPress={() => (isLast ? finish() : go(index + 1))}
            activeOpacity={0.85}
          >
            <Text style={s.nextText}>{isLast ? t.start : t.next} →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4,
  },
  progressText: { fontSize: 13, fontWeight: '800', color: C.inkMute, letterSpacing: 0.4, textTransform: 'uppercase' },
  skipBtn: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12 },
  skipText: { fontSize: 15, fontWeight: '800', color: C.inkSoft },

  slide: {
    paddingHorizontal: 28, paddingTop: 20, alignItems: 'center',
  },
  emojiWrap: {
    width: 132, height: 132, borderRadius: 40,
    backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28, marginTop: 12,
    shadowColor: C.primary, shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
  },
  emoji: { fontSize: 78 },
  title: {
    fontSize: 30, lineHeight: 36, fontWeight: '900', color: C.ink,
    textAlign: 'center', marginBottom: 14, letterSpacing: -0.4,
  },
  body: {
    fontSize: 18, lineHeight: 26, color: C.inkSoft,
    textAlign: 'center', fontWeight: '600', marginBottom: 22,
  },
  tipCard: {
    backgroundColor: C.warmTint, borderRadius: 18,
    borderWidth: 1, borderColor: '#C2410C33',
    paddingHorizontal: 18, paddingVertical: 14,
    alignSelf: 'stretch',
  },
  tipLabel: {
    fontSize: 13, fontWeight: '900', color: C.warm,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4,
  },
  tipText: { fontSize: 16, lineHeight: 22, color: C.ink2, fontWeight: '600' },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line },
  dotActive: { backgroundColor: C.primary, width: 24 },

  controls: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingBottom: 24, paddingTop: 4,
  },
  backBtn: {
    minHeight: 56, paddingHorizontal: 18,
    borderRadius: 16, borderWidth: 1, borderColor: C.line,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 16, fontWeight: '800', color: C.ink2 },
  nextBtn: {
    flex: 1, minHeight: 60,
    borderRadius: 18, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  nextText: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  btnDisabled: { opacity: 0.4 },
  textDisabled: { color: C.inkMute },
});
