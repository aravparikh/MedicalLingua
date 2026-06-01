import * as ExpoSpeech from 'expo-speech';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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
import BottomNav from '../components/BottomNav';
import LanguagePill from '../components/LanguagePill';
import { useLanguage } from '../hooks/useLanguage';
import { getTTSRate } from '../services/preferences';
import { clearAllCalls, deleteCall, loadCalls, saveCall } from '../services/storage';
import type { CallRecord } from '../types';
import { createDemoCall } from '../utils/demo';
import { formatTimestamp } from '../utils/format';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  surfaceSunk: '#FAF7F1',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkSoft: '#4A4E54',
  inkMute: '#666A73',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmStrong: '#8E5028',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

const L = {
  es: {
    privacy: '🔒 Conversación privada',
    kicker: 'Intérprete médico con IA',
    title: 'Entienda a su doctor. En vivo.',
    subtitle: 'Traducción en vivo entre español e inglés. Para visitas en persona, por video o por teléfono.',
    inPersonTitle: 'Visita en persona',
    inPersonBody: 'Ponga el teléfono entre usted y el doctor.',
    inPersonCta: 'Empezar ahora',
    phoneTitle: 'Visita virtual o llamada',
    phoneBody: 'Use altavoz en Zoom, MyChart o teléfono.',
    lastLabel: 'Última visita',
    noVisits: 'Todavía no hay visitas',
    listenBtn: '🔊 Escuchar resumen',
    stopBtn: '⏹ Detener',
    openBtn: 'Ver',
    noVisitHint: 'Su resumen aparecerá aquí al terminar una visita.',
    disclaimer: 'MedLingua ayuda con traducción. Siempre confirme medicinas, dosis y fechas con su doctor.',
    demoTitle: 'Modo demo',
    demoBody: '¿Cargar una visita médica de ejemplo para la presentación?',
    demoCancel: 'Cancelar',
    demoLoad: 'Cargar demo',
    howToUse: '❓ ¿Cómo se usa?',
    defaultSummary: 'Después de su visita, aquí aparecerá un resumen sencillo para usted y su familia.',
    summaryReady: 'Resumen listo para revisar.',
    // Differentiation strip
    diffTitle: '¿Por qué MedLingua?',
    diff1Title: 'Entrenado para medicina',
    diff1Body: 'Conserva nombres de medicinas y dosis. Detecta errores peligrosos.',
    diff2Title: 'Resumen inteligente',
    diff2Body: 'Plan en palabras simples al terminar. Comparta con su familia.',
    diff3Title: 'Privado siempre',
    diff3Body: 'Sin cuentas. Sus conversaciones nunca salen de su teléfono.',
    // Quick actions
    quickActionsLabel: 'Acciones rápidas',
    tryDemoTitle: 'Probar visita de ejemplo',
    tryDemoBody: 'Vea cómo funciona en 10 segundos',
    historyTitle: 'Mi historial de salud',
    historyBody: 'Medicinas y citas guardadas',
    askChip: 'Pregunte a la IA',
    poweredBy: 'Whisper + GPT-4o',
    // Settings / delete
    settingsTitle: 'Ajustes',
    settingsBody: '¿Qué le gustaría hacer?',
    settingsCancel: 'Cancelar',
    clearAll: 'Borrar todas las visitas',
    clearAllTitle: '¿Borrar todas las visitas?',
    clearAllBody: 'Se eliminarán todas sus visitas y resúmenes guardados. No se puede deshacer.',
    clearAllConfirm: 'Borrar todo',
    deleteVisitMenu: 'Eliminar esta visita',
    deleteVisitTitle: '¿Eliminar esta visita?',
    deleteVisitBody: 'Esta visita se borrará para siempre.',
    deleteConfirm: 'Eliminar',
  },
  en: {
    privacy: '🔒 Private conversation',
    kicker: 'AI Medical Interpreter',
    title: 'Understand your doctor. Live.',
    subtitle: 'Live translation between English and Spanish. For in-person, video, or phone visits.',
    inPersonTitle: 'In-person visit',
    inPersonBody: 'Place the phone between you and the doctor.',
    inPersonCta: 'Start now',
    phoneTitle: 'Video or phone call',
    phoneBody: 'Use speaker on Zoom, MyChart, or any call.',
    lastLabel: 'Last visit',
    noVisits: 'No visits yet',
    listenBtn: '🔊 Listen to summary',
    stopBtn: '⏹ Stop',
    openBtn: 'Open',
    noVisitHint: 'Your summary will appear here after a visit.',
    disclaimer: 'MedLingua helps with translation. Always confirm medications, doses, and dates with your doctor.',
    demoTitle: 'Demo mode',
    demoBody: 'Load a sample doctor visit for the presentation?',
    demoCancel: 'Cancel',
    demoLoad: 'Load demo',
    howToUse: '❓ How to use',
    defaultSummary: 'After your visit, a simple summary will appear here for you and your family.',
    summaryReady: 'Summary ready to review.',
    // Differentiation strip
    diffTitle: 'Why MedLingua?',
    diff1Title: 'Medical-trained AI',
    diff1Body: 'Preserves drug names and doses. Catches dangerous translation errors.',
    diff2Title: 'Smart summaries',
    diff2Body: 'Plain-language plan when you finish. Share with family in one tap.',
    diff3Title: 'Private by default',
    diff3Body: 'No accounts. Your conversations never leave your phone.',
    // Quick actions
    quickActionsLabel: 'Quick actions',
    tryDemoTitle: 'Try a sample visit',
    tryDemoBody: 'See how it works in 10 seconds',
    historyTitle: 'My health history',
    historyBody: 'Saved medications and appointments',
    askChip: 'Ask AI',
    poweredBy: 'Whisper + GPT-4o',
    // Settings / delete
    settingsTitle: 'Settings',
    settingsBody: 'What would you like to do?',
    settingsCancel: 'Cancel',
    clearAll: 'Clear all visits',
    clearAllTitle: 'Clear all visits?',
    clearAllBody: 'All your saved visits and summaries will be erased permanently. This cannot be undone.',
    clearAllConfirm: 'Erase everything',
    deleteVisitMenu: 'Delete this visit',
    deleteVisitTitle: 'Delete this visit?',
    deleteVisitBody: 'This visit will be erased permanently.',
    deleteConfirm: 'Delete',
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const [lastCall, setLastCall] = useState<CallRecord | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { lang, toggle: toggleLanguage } = useLanguage();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = L[lang];

  useFocusEffect(
    useCallback(() => {
      loadCalls().then(calls => setLastCall(calls[0] ?? null)).catch(console.error);
      // Stop any TTS when leaving the screen
      return () => {
        ExpoSpeech.stop();
        setIsSpeaking(false);
      };
    }, [])
  );

  function getLastSummary(call: CallRecord | null) {
    if (!call?.summary) return t.defaultSummary;
    // Only show content when we can confirm it matches the current language
    if (!call.summary.lang || call.summary.lang !== lang) return t.summaryReady;
    return call.summary.simpleExplanation || call.summary.rawText || t.summaryReady;
  }

  function startVisit(mode: 'room' | 'phone') {
    hapticMedium();
    router.push({ pathname: '/call', params: { mode } });
  }

  async function togglePlayLastSummary() {
    hapticLight();
    if (isSpeaking) {
      ExpoSpeech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const rate = await getTTSRate();
    ExpoSpeech.speak(getLastSummary(lastCall), {
      language: lang === 'es' ? 'es-MX' : 'en-US',
      rate,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  async function loadDemo() {
    hapticSuccess();
    const demo = createDemoCall(lang);
    await saveCall(demo);
    setLastCall(demo);
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

  function confirmClearAll() {
    Alert.alert(t.clearAllTitle, t.clearAllBody, [
      { text: t.settingsCancel, style: 'cancel' },
      {
        text: t.clearAllConfirm,
        style: 'destructive',
        onPress: async () => {
          await clearAllCalls();
          setLastCall(null);
          hapticSuccess();
        },
      },
    ]);
  }

  function confirmDeleteLastVisit() {
    if (!lastCall) return;
    Alert.alert(t.deleteVisitTitle, t.deleteVisitBody, [
      { text: t.settingsCancel, style: 'cancel' },
      {
        text: t.deleteConfirm,
        style: 'destructive',
        onPress: async () => {
          await deleteCall(lastCall.id);
          const calls = await loadCalls();
          setLastCall(calls[0] ?? null);
          hapticSuccess();
        },
      },
    ]);
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
          <View style={s.logoRow}>
            <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.9} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={s.logoMark}>
                <Text style={s.logoEmoji}>🩺</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.wordmark}>MedLingua</Text>
                <Text style={s.privacy}>{t.privacy}</Text>
              </View>
            </TouchableOpacity>

            <LanguagePill lang={lang} onToggle={toggleLanguage} />
          </View>

          <View style={s.hero}>
            <View style={s.kickerRow}>
              <Text style={s.kicker}>{t.kicker}</Text>
              <View style={s.poweredPill}>
                <Text style={s.poweredText}>{t.poweredBy}</Text>
              </View>
            </View>
            <Text style={s.title}>{t.title}</Text>
            <Text style={s.subtitle}>{t.subtitle}</Text>
          </View>

          {/* Differentiation strip — what makes MedLingua different */}
          <View style={s.diffStrip}>
            <Text style={s.diffStripTitle}>{t.diffTitle}</Text>
            <View style={s.diffList}>
              <View style={s.diffItem}>
                <View style={[s.diffIcon, { backgroundColor: C.primaryTint }]}>
                  <Text style={s.diffIconEmoji}>💊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.diffItemTitle}>{t.diff1Title}</Text>
                  <Text style={s.diffItemBody}>{t.diff1Body}</Text>
                </View>
              </View>
              <View style={s.diffItem}>
                <View style={[s.diffIcon, { backgroundColor: C.warmTint }]}>
                  <Text style={s.diffIconEmoji}>📋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.diffItemTitle}>{t.diff2Title}</Text>
                  <Text style={s.diffItemBody}>{t.diff2Body}</Text>
                </View>
              </View>
              <View style={s.diffItem}>
                <View style={[s.diffIcon, { backgroundColor: C.listenTint }]}>
                  <Text style={s.diffIconEmoji}>🔒</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.diffItemTitle}>{t.diff3Title}</Text>
                  <Text style={s.diffItemBody}>{t.diff3Body}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.modeGrid}>
            <TouchableOpacity
              style={[s.modeCard, s.modeCardPrimary]}
              onPress={() => startVisit('room')}
              activeOpacity={0.86}
            >
              <View style={s.modeIconPrimary}>
                <Text style={s.modeEmoji}>🏥</Text>
              </View>
              <Text style={s.modeTitlePrimary}>{t.inPersonTitle}</Text>
              <Text style={s.modeBodyPrimary}>{t.inPersonBody}</Text>
              <View style={s.modePillPrimary}>
                <Text style={s.modePillPrimaryText}>{t.inPersonCta}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.modeCard} onPress={() => startVisit('phone')} activeOpacity={0.86}>
              <View style={s.modeIcon}>
                <Text style={s.modeEmoji}>📱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.modeTitle}>{t.phoneTitle}</Text>
                <Text style={s.modeBody}>{t.phoneBody}</Text>
              </View>
              <Text style={s.modeArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={s.lastCard}>
            <View style={s.lastHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.lastLabel}>{t.lastLabel}</Text>
                <Text style={s.lastDate}>
                  {lastCall ? formatTimestamp(lastCall.startedAt, lang) : t.noVisits}
                </Text>
              </View>
              <Text style={s.lastIcon}>📋</Text>
            </View>

            <Text style={s.lastSummary}>{getLastSummary(lastCall)}</Text>

            {lastCall ? (
              <View style={s.lastActions}>
                <TouchableOpacity
                  style={[s.listenButton, isSpeaking && s.listenButtonActive]}
                  onPress={togglePlayLastSummary}
                  activeOpacity={0.85}
                >
                  <Text style={[s.listenText, isSpeaking && s.listenTextActive]}>
                    {isSpeaking ? t.stopBtn : t.listenBtn}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.openButton}
                  onPress={() => {
                    hapticLight();
                    router.push({ pathname: '/summary', params: { id: lastCall.id } });
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={s.openText}>{t.openBtn}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={s.noVisitHeroBtn}
                onPress={() => startVisit('room')}
                activeOpacity={0.85}
              >
                <Text style={s.noVisitHeroEmoji}>🏥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.noVisitHeroTitle}>{t.inPersonCta}</Text>
                  <Text style={s.noVisitHeroSub}>{t.noVisits}</Text>
                </View>
                <Text style={s.noVisitHeroArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick actions: Try Demo + History */}
          <Text style={s.quickActionsLabel}>{t.quickActionsLabel}</Text>
          <View style={s.quickRow}>
            <TouchableOpacity
              style={s.quickCard}
              onPress={() => { hapticLight(); loadDemo(); }}
              activeOpacity={0.85}
            >
              <View style={[s.quickIcon, { backgroundColor: C.warmTint }]}>
                <Text style={s.quickIconEmoji}>✨</Text>
              </View>
              <Text style={s.quickTitle}>{t.tryDemoTitle}</Text>
              <Text style={s.quickBody}>{t.tryDemoBody}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickCard}
              onPress={() => { hapticLight(); router.push('/dashboard'); }}
              activeOpacity={0.85}
            >
              <View style={[s.quickIcon, { backgroundColor: C.listenTint }]}>
                <Text style={s.quickIconEmoji}>📊</Text>
              </View>
              <Text style={s.quickTitle}>{t.historyTitle}</Text>
              <Text style={s.quickBody}>{t.historyBody}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={s.howToBtn}
            onPress={() => { hapticLight(); router.push('/tutorial'); }}
            activeOpacity={0.85}
          >
            <Text style={s.howToText}>{t.howToUse}</Text>
          </TouchableOpacity>

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
  scrollContent: { paddingHorizontal: 18, paddingBottom: 110, flexGrow: 1 },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 4 },
  logoMark: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  logoEmoji: { fontSize: 24 },
  wordmark: { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  privacy: { fontSize: 16, fontWeight: '800', color: C.listen, marginTop: 2 },

  hero: { paddingTop: 18, paddingBottom: 14 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 10 },
  kicker: { fontSize: 16, fontWeight: '900', color: C.warm, letterSpacing: 0.4, textTransform: 'uppercase' },
  poweredPill: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1, borderColor: C.line,
    backgroundColor: C.surface,
  },
  poweredText: { fontSize: 14, fontWeight: '900', color: C.inkMute, letterSpacing: 0.6 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '900', color: C.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 17, lineHeight: 24, color: C.inkSoft, marginTop: 10, fontWeight: '500' },

  // Differentiation strip
  diffStrip: {
    marginBottom: 18, marginTop: 4,
    backgroundColor: C.surface,
    borderRadius: 22,
    borderWidth: 1, borderColor: C.line,
    padding: 16,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  diffStripTitle: {
    fontSize: 16, fontWeight: '900', color: C.inkMute,
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12,
  },
  diffList: { gap: 14 },
  diffItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  diffIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  diffIconEmoji: { fontSize: 24 },
  diffItemTitle: { fontSize: 18, fontWeight: '900', color: C.ink, marginBottom: 4 },
  diffItemBody: { fontSize: 16, lineHeight: 22, color: C.inkSoft, fontWeight: '600' },

  // Quick actions row
  quickActionsLabel: {
    fontSize: 16, fontWeight: '900', color: C.inkMute,
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginTop: 18, marginBottom: 10, paddingHorizontal: 4,
  },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1, padding: 14,
    backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.line,
    gap: 8,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  quickIconEmoji: { fontSize: 24 },
  quickTitle: { fontSize: 17, fontWeight: '900', color: C.ink, lineHeight: 21 },
  quickBody: { fontSize: 16, lineHeight: 22, color: C.inkSoft, fontWeight: '600' },

  modeGrid: { gap: 12 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 22, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, padding: 16,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  modeCardPrimary: {
    flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
    padding: 20, gap: 4,
    backgroundColor: C.primary, borderColor: C.primary,
    shadowColor: C.primary, shadowOpacity: 0.22, shadowRadius: 18, elevation: 6,
  },
  modeIconPrimary: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  modeIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.warmTint,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modeEmoji: { fontSize: 26 },
  modeTitlePrimary: { fontSize: 24, lineHeight: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  modeBodyPrimary: { fontSize: 16, lineHeight: 22, color: '#EAF4FF', fontWeight: '600', marginTop: 4, marginBottom: 12 },
  modePillPrimary: {
    borderRadius: 999, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  modePillPrimaryText: { fontSize: 16, color: C.primaryStrong, fontWeight: '900' },
  modeTitle: { fontSize: 18, lineHeight: 22, fontWeight: '800', color: C.ink },
  modeBody: { fontSize: 16, lineHeight: 22, color: C.inkSoft, fontWeight: '500', marginTop: 4 },
  modeArrow: { fontSize: 26, color: C.warm, fontWeight: '800' },

  lastCard: {
    marginTop: 18, backgroundColor: C.surface,
    borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 16,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  lastHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  lastLabel: { fontSize: 18, fontWeight: '800', color: C.ink },
  lastDate: { fontSize: 16, color: C.inkSoft, fontWeight: '600', marginTop: 2 },
  lastIcon: { fontSize: 26 },
  lastSummary: { fontSize: 16, lineHeight: 24, color: C.ink, fontWeight: '500' },
  lastActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  
  noVisitHeroBtn: {
    marginTop: 12, borderRadius: 16,
    backgroundColor: C.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  noVisitHeroEmoji: { fontSize: 28 },
  noVisitHeroTitle: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  noVisitHeroSub: { fontSize: 14, color: '#EAF4FF', fontWeight: '600', marginTop: 2 },
  noVisitHeroArrow: { fontSize: 24, color: '#FFF', fontWeight: '900' },

  listenButton: {
    flex: 1, borderRadius: 14, backgroundColor: C.warmTint,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    minHeight: 56,
  },
  listenText: { fontSize: 16, fontWeight: '800', color: C.warm },
  listenButtonActive: { backgroundColor: C.warm },
  listenTextActive: { color: '#FFFFFF' },
  openButton: {
    minWidth: 80, borderRadius: 14, backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
    minHeight: 56,
  },
  openText: { fontSize: 16, fontWeight: '800', color: C.primaryStrong },
  howToBtn: {
    marginTop: 16, alignSelf: 'center',
    borderRadius: 999, borderWidth: 1, borderColor: C.primaryTint,
    backgroundColor: C.surface,
    paddingHorizontal: 22, paddingVertical: 14,
    minHeight: 56, alignItems: 'center', justifyContent: 'center',
  },
  howToText: { fontSize: 16, fontWeight: '900', color: C.primary, letterSpacing: 0.1 },
  disclaimer: { marginTop: 16, fontSize: 16, lineHeight: 22, color: C.inkSoft, textAlign: 'center', fontWeight: '600', paddingHorizontal: 12 },
});
