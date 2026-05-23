import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hasSeenTutorial, setPreferredLanguage, type AppLanguage } from '../services/preferences';
import { hapticSuccess } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  surfaceSunk: '#FAF7F1',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkSoft: '#555960',
  inkMute: '#8A8E96',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

export default function WelcomeScreen() {
  const router = useRouter();

  // Animations — cinematic entry
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.8)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo first
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(haloOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(haloScale, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Title fades up 350ms later
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 350);

    // Card slides up 700ms later
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardSlide, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]).start();
    }, 700);

    // Subtle continuous halo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, { toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(haloScale, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  async function choose(language: AppLanguage) {
    hapticSuccess();
    await setPreferredLanguage(language);
    const seen = await hasSeenTutorial();
    router.replace(seen ? '/home' : '/tutorial');
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safe}>
        <View style={s.heroSection}>
          {/* Pulsing halo behind the logo */}
          <Animated.View
            style={[
              s.halo,
              { opacity: haloOpacity, transform: [{ scale: haloScale }] },
            ]}
          />
          <Animated.View
            style={[
              s.heroIcon,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
          >
            <Text style={s.heroEmoji}>🩺</Text>
          </Animated.View>

          <Animated.View
            style={{ opacity: titleOpacity, transform: [{ translateY: titleSlide }], alignItems: 'center' }}
          >
            <Text style={s.brand}>MedLingua</Text>
            <View style={s.tagPill}>
              <Text style={s.tagPillText}>AI medical interpreter</Text>
            </View>

            <Text style={s.subtitleBig}>
              Understand your doctor.{'\n'}
              <Text style={{ color: C.primary }}>In any language.</Text>
            </Text>
            <Text style={s.subtitleSmall}>
              Entiende a tu doctor en cualquier idioma.
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            s.card,
            { opacity: cardOpacity, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <Text style={s.question}>Choose your language · Elija su idioma</Text>

          <TouchableOpacity style={s.primaryButton} onPress={() => choose('es')} activeOpacity={0.85}>
            <View style={s.btnFlagWrap}>
              <Text style={s.btnFlag}>🇪🇸</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.primaryButtonText}>Hablo Español</Text>
              <Text style={s.buttonSub}>Continuar en español</Text>
            </View>
            <Text style={s.btnArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryButton} onPress={() => choose('en')} activeOpacity={0.85}>
            <View style={s.btnFlagWrap}>
              <Text style={s.btnFlag}>🇺🇸</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.secondaryButtonText}>I speak English</Text>
              <Text style={s.secondarySub}>Continue in English</Text>
            </View>
            <Text style={[s.btnArrow, { color: C.warm }]}>→</Text>
          </TouchableOpacity>

          <View style={s.trustRow}>
            <View style={s.trustItem}>
              <Text style={s.trustIcon}>🔒</Text>
              <Text style={s.trustLabel}>Private</Text>
            </View>
            <View style={s.trustDivider} />
            <View style={s.trustItem}>
              <Text style={s.trustIcon}>⚡</Text>
              <Text style={s.trustLabel}>Real-time</Text>
            </View>
            <View style={s.trustDivider} />
            <View style={s.trustItem}>
              <Text style={s.trustIcon}>🩺</Text>
              <Text style={s.trustLabel}>Medical AI</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.Text style={[s.footer, { opacity: cardOpacity }]}>
          You can change this later · Puede cambiar esto después
        </Animated.Text>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },

  heroSection: {
    alignItems: 'center',
    paddingTop: 32, paddingBottom: 26,
  },
  halo: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    top: 18,
    backgroundColor: C.primary,
    opacity: 0.08,
  },
  heroIcon: {
    width: 108, height: 108, borderRadius: 34,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1, borderColor: C.primaryTint,
  },
  heroEmoji: { fontSize: 56 },

  brand: {
    fontSize: 38, fontWeight: '900', color: C.ink,
    letterSpacing: -1, marginBottom: 8,
  },
  tagPill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: C.primaryTint,
    borderWidth: 1, borderColor: '#0F5BA822',
    marginBottom: 22,
  },
  tagPillText: { fontSize: 12, fontWeight: '900', color: C.primaryStrong, letterSpacing: 0.6, textTransform: 'uppercase' },

  subtitleBig: {
    fontSize: 24, lineHeight: 30, fontWeight: '800',
    color: C.ink, textAlign: 'center', letterSpacing: -0.3,
  },
  subtitleSmall: {
    fontSize: 14, lineHeight: 19, color: C.inkSoft,
    fontWeight: '600', textAlign: 'center', marginTop: 6, fontStyle: 'italic',
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 26,
    borderWidth: 1, borderColor: C.line,
    padding: 18, gap: 12,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 6,
  },
  question: {
    fontSize: 13, fontWeight: '900', color: C.inkMute,
    textAlign: 'center', letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 4,
  },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    minHeight: 72,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  btnFlagWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnFlag: { fontSize: 24 },
  primaryButtonText: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: -0.2 },
  buttonSub: { fontSize: 13, color: '#D5E5F6', marginTop: 2, fontWeight: '700' },
  btnArrow: { fontSize: 22, color: '#FFF', fontWeight: '900' },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    minHeight: 72,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: C.warmTint,
    borderWidth: 1, borderColor: '#B66A3E33',
  },
  secondaryButtonText: { fontSize: 18, fontWeight: '900', color: C.warm, letterSpacing: -0.2 },
  secondarySub: { fontSize: 13, color: C.inkSoft, marginTop: 2, fontWeight: '700' },

  trustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 14, marginTop: 4,
    borderTopWidth: 1, borderTopColor: C.line,
  },
  trustItem: { alignItems: 'center', gap: 4, flex: 1 },
  trustIcon: { fontSize: 18 },
  trustLabel: { fontSize: 11, fontWeight: '900', color: C.inkMute, letterSpacing: 0.4, textTransform: 'uppercase' },
  trustDivider: { width: 1, height: 22, backgroundColor: C.line },

  footer: {
    fontSize: 12, color: C.inkMute, textAlign: 'center',
    marginTop: 20, fontWeight: '600',
  },
});
