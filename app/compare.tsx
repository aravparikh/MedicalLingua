import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from '../components/BottomNav';
import LanguagePill from '../components/LanguagePill';
import { useLanguage } from '../hooks/useLanguage';
import { translateNaive, translateToSpanish } from '../services/claude';
import { scanForSafetyFlags } from '../utils/safetyScan';
import type { SafetyFlag } from '../types';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';
type Lang = 'es' | 'en';

const L = {
  es: {
    home: 'Inicio',
    eyebrow: 'EL EXAMEN',
    title: 'Vea por qué Google Translate es peligroso',
    subtitle: 'Escriba o toque cualquier frase médica. Compare lado a lado.',
    inputPlaceholder: 'Ej: Take this pill once daily',
    runCompare: '▷ Comparar',
    running: 'Analizando...',
    google: 'Google Translate',
    googleBadge: 'TRADUCCIÓN GENÉRICA',
    medlingua: 'MedLingua',
    medlinguaBadge: 'IA MÉDICA',
    safetyVerified: '🛡️ Seguridad verificada',
    flaggedCount: (n: number) => `${n} riesgo${n === 1 ? '' : 's'} detectado${n === 1 ? '' : 's'}`,
    suggestions: 'Pruebe estos ejemplos:',
    shareBtn: 'Compartir esta comparación',
    shareTitle: 'MedLingua catches translation errors that Google Translate misses',
    googleSubcaption: 'Sin contexto médico',
    medlinguaSubcaption: 'Entrenado en medicina',
    presets: [
      'Take this pill once daily.',
      'Apply 0.5 mg cream qid PO.',
      'I am allergic to penicillin and have chest pain.',
      'No drugs before the test at 7am.',
    ],
  },
  en: {
    home: 'Home',
    eyebrow: 'THE EXAM',
    title: 'See why Google Translate is dangerous',
    subtitle: 'Type or tap any medical phrase. Compare side by side.',
    inputPlaceholder: 'e.g. Take this pill once daily',
    runCompare: '▷ Compare',
    running: 'Analyzing…',
    google: 'Google Translate',
    googleBadge: 'GENERIC TRANSLATION',
    medlingua: 'MedLingua',
    medlinguaBadge: 'MEDICAL AI',
    safetyVerified: '🛡️ Safety verified',
    flaggedCount: (n: number) => `${n} risk${n === 1 ? '' : 's'} caught`,
    suggestions: 'Try these examples:',
    shareBtn: 'Share this comparison',
    shareTitle: 'MedLingua catches translation errors that Google Translate misses',
    googleSubcaption: 'No medical context',
    medlinguaSubcaption: 'Trained on medicine',
    presets: [
      'Take this pill once daily.',
      'Apply 0.5 mg cream qid PO.',
      'I am allergic to penicillin and have chest pain.',
      'No drugs before the test at 7am.',
    ],
  },
};

export default function CompareScreen() {
  const router = useRouter();
  const { lang, toggle } = useLanguage();
  const t = L[lang];

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [naive, setNaive] = useState<string | null>(null);
  const [smart, setSmart] = useState<string | null>(null);
  const [flags, setFlags] = useState<SafetyFlag[]>([]);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!naive || !smart) return;
    fade.setValue(0); slide.setValue(20);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [naive, smart]);

  async function runCompare(text?: string) {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    hapticMedium();
    setInput(value);
    setBusy(true);
    setNaive(null);
    setSmart(null);
    setFlags([]);
    try {
      const [naiveResult, smartResult] = await Promise.all([
        translateNaive(value, 'en-es'),
        translateToSpanish(value),
      ]);
      setNaive(naiveResult);
      setSmart(smartResult);
      setFlags(scanForSafetyFlags(value, 'en-es'));
      hapticSuccess();
    } catch (e) {
      setNaive('—');
      setSmart('—');
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    hapticLight();
    const text = [
      t.shareTitle,
      '',
      `EN: "${input}"`,
      '',
      `${t.google}: ${naive ?? '—'}`,
      `${t.medlingua}: ${smart ?? '—'}`,
      '',
      flags.length > 0 ? `🛡️ ${t.flaggedCount(flags.length)}` : '🛡️ Safety verified',
      '',
      'medlingua.app',
    ].join('\n');
    await Share.share({ message: text });
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => { hapticLight(); router.replace('/home'); }}
          >
            <Text style={s.backText}>← {t.home}</Text>
          </TouchableOpacity>
          <LanguagePill lang={lang} onToggle={toggle} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.eyebrow}>{t.eyebrow}</Text>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.subtitle}>{t.subtitle}</Text>

            <View style={s.inputCard}>
              <TextInput
                style={s.input}
                placeholder={t.inputPlaceholder}
                placeholderTextColor={C.inkMute}
                value={input}
                onChangeText={setInput}
                multiline
                onSubmitEditing={() => runCompare()}
                editable={!busy}
              />
              <TouchableOpacity
                style={[s.runBtn, (!input.trim() || busy) && s.runBtnDisabled]}
                onPress={() => runCompare()}
                disabled={!input.trim() || busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={s.runText}>{t.runCompare}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Preset suggestions */}
            {!naive && !busy && (
              <View style={s.presets}>
                <Text style={s.presetLabel}>{t.suggestions}</Text>
                {t.presets.map((p, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.presetChip}
                    onPress={() => { setInput(p); runCompare(p); }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.presetText}>{p}</Text>
                    <Text style={s.presetArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Results */}
            {(naive || smart) && (
              <Animated.View style={[s.results, { opacity: fade, transform: [{ translateY: slide }] }]}>
                {/* Google card — red-tinted, looks "wrong" */}
                <View style={[s.compareCard, s.googleCard]}>
                  <View style={s.cardHeader}>
                    <View style={s.cardLogo}>
                      <Text style={s.googleLogo}>G</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{t.google}</Text>
                      <Text style={s.cardSubcaption}>{t.googleSubcaption}</Text>
                    </View>
                    <View style={[s.cardBadge, s.googleBadge]}>
                      <Text style={s.googleBadgeText}>{t.googleBadge}</Text>
                    </View>
                  </View>
                  <Text style={s.translationText}>{naive ?? '…'}</Text>
                  {flags.length > 0 && (
                    <View style={s.flagBanner}>
                      <Text style={s.flagBannerText}>
                        ⚠️  Contains {flags.length} undetected risk{flags.length === 1 ? '' : 's'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* MedLingua card — green-tinted, looks "safe" */}
                <View style={[s.compareCard, s.mlCard]}>
                  <View style={s.cardHeader}>
                    <View style={s.mlLogoWrap}>
                      <Text style={s.mlLogo}>🩺</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{t.medlingua}</Text>
                      <Text style={s.cardSubcaption}>{t.medlinguaSubcaption}</Text>
                    </View>
                    <View style={[s.cardBadge, s.mlBadge]}>
                      <Text style={s.mlBadgeText}>{t.medlinguaBadge}</Text>
                    </View>
                  </View>
                  <Text style={s.translationText}>{smart ?? '…'}</Text>
                  {flags.length === 0 ? (
                    <View style={[s.flagBanner, s.safeBanner]}>
                      <Text style={s.safeBannerText}>{t.safetyVerified}</Text>
                    </View>
                  ) : (
                    <View style={s.flagsList}>
                      {flags.map((f, i) => (
                        <View key={i} style={s.flagItem}>
                          <Text style={s.flagItemTitle}>🛡️  {f.title}</Text>
                          <Text style={s.flagItemDetail}>{f.detail}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity style={s.shareBtn} onPress={onShare} activeOpacity={0.85}>
                  <Text style={s.shareText}>{t.shareBtn}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        <BottomNav active="compare" lang={lang} />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 6, paddingBottom: 4,
  },
  backBtn: {
    minHeight: 48, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: C.line,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 16, color: C.primary, fontWeight: '900' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 110 },
  eyebrow: {
    fontSize: 16, fontWeight: '900', color: C.warm,
    letterSpacing: 1.4, marginTop: 14, marginBottom: 6,
  },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '900', color: C.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 16, lineHeight: 22, color: C.inkSoft, marginTop: 8, marginBottom: 18, fontWeight: '500' },

  inputCard: {
    backgroundColor: C.surface,
    borderRadius: 20, borderWidth: 1, borderColor: C.line,
    padding: 14, gap: 12,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  input: {
    minHeight: 80, maxHeight: 140,
    fontSize: 18, lineHeight: 24, color: C.ink, fontWeight: '600',
    paddingHorizontal: 0, paddingVertical: 4,
    textAlignVertical: 'top',
  },
  runBtn: {
    minHeight: 60, borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  runBtnDisabled: { backgroundColor: '#98A2B3', shadowOpacity: 0 },
  runText: { fontSize: 18, color: '#FFF', fontWeight: '900', letterSpacing: 0.3 },

  presets: { marginTop: 22, gap: 8 },
  presetLabel: {
    fontSize: 16, fontWeight: '900', color: C.inkMute,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4,
  },
  presetChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 48,
  },
  presetText: { flex: 1, fontSize: 16, color: C.ink2, fontWeight: '700' },
  presetArrow: { fontSize: 20, color: C.inkMute, fontWeight: '700' },

  results: { marginTop: 18, gap: 12 },
  compareCard: {
    borderRadius: 22, borderWidth: 1.5,
    padding: 16, gap: 12,
    shadowColor: '#1E293B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  googleCard: { backgroundColor: '#FCEBE7', borderColor: '#E2887C' },
  mlCard: { backgroundColor: '#E6F2EB', borderColor: '#7FB89F' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardLogo: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2887C55',
  },
  googleLogo: { fontSize: 22, fontWeight: '900', color: '#4285F4', letterSpacing: -1 },
  mlLogoWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  mlLogo: { fontSize: 22 },
  cardTitle: { fontSize: 16, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  cardSubcaption: { fontSize: 14, color: C.inkSoft, fontWeight: '700', marginTop: 1 },
  cardBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  googleBadge: { backgroundColor: '#DC2626' },
  googleBadgeText: { fontSize: 12, color: '#FFF', fontWeight: '900', letterSpacing: 0.5 },
  mlBadge: { backgroundColor: C.listen },
  mlBadgeText: { fontSize: 12, color: '#FFF', fontWeight: '900', letterSpacing: 0.5 },

  translationText: {
    fontSize: 19, lineHeight: 26, color: C.ink,
    fontWeight: '800', letterSpacing: 0.1,
    paddingHorizontal: 4,
  },

  flagBanner: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(181, 68, 58, 0.12)',
    borderWidth: 1, borderColor: 'rgba(181, 68, 58, 0.3)',
  },
  flagBannerText: { fontSize: 16, color: '#DC2626', fontWeight: '900' },
  safeBanner: {
    backgroundColor: 'rgba(47, 143, 115, 0.16)',
    borderColor: 'rgba(47, 143, 115, 0.35)',
  },
  safeBannerText: { fontSize: 16, color: '#0F766E', fontWeight: '900' },

  flagsList: { gap: 8 },
  flagItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12,
    borderLeftWidth: 4, borderLeftColor: C.listen,
  },
  flagItemTitle: { fontSize: 16, fontWeight: '900', color: '#0F766E', marginBottom: 4 },
  flagItemDetail: { fontSize: 16, lineHeight: 22, color: C.ink2, fontWeight: '600' },

  shareBtn: {
    marginTop: 6, minHeight: 60, borderRadius: 18,
    backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.ink, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  shareText: { fontSize: 18, color: '#FFF', fontWeight: '900', letterSpacing: 0.3 },
});
