import * as ExpoSpeech from 'expo-speech';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { loadCalls, saveCall } from '../services/storage';
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
  inkSoft: '#555960',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
};

function getLastSummary(call: CallRecord | null) {
  if (!call?.summary) return 'Después de su visita, aquí aparecerá un resumen sencillo para usted y su familia.';
  return call.summary.simpleExplanation || call.summary.rawText || 'Resumen listo para revisar.';
}

export default function HomeScreen() {
  const router = useRouter();
  const [lastCall, setLastCall] = useState<CallRecord | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadCalls()
        .then(calls => setLastCall(calls[0] ?? null))
        .catch(console.error);
    }, [])
  );

  function startVisit() {
    hapticMedium();
    router.push('/call');
  }

  function playLastSummary() {
    hapticLight();
    const text = getLastSummary(lastCall);
    ExpoSpeech.stop();
    ExpoSpeech.speak(text, { language: 'es-MX', rate: 0.88 });
  }

  async function loadDemo() {
    hapticSuccess();
    const demo = createDemoCall();
    await saveCall(demo);
    setLastCall(demo);
    router.push({ pathname: '/summary', params: { id: demo.id } });
  }

  function handleLogoTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 700);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      Alert.alert('Modo demo', 'Cargar una visita médica de ejemplo para la presentación?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cargar demo', onPress: loadDemo },
      ]);
    }
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.logoRow} onPress={handleLogoTap} activeOpacity={0.9}>
          <View style={s.logoMark}>
            <Text style={s.logoEmoji}>🩺</Text>
          </View>
          <View>
            <Text style={s.wordmark}>MedLingua</Text>
            <Text style={s.privacy}>🔒 Conversación privada</Text>
          </View>
        </TouchableOpacity>

        <View style={s.hero}>
          <Text style={s.kicker}>Para su visita médica</Text>
          <Text style={s.title}>Entienda a su doctor con calma.</Text>
          <Text style={s.subtitle}>
            Toque el botón grande y empiece. No tiene que escribir nada.
          </Text>
        </View>

        <TouchableOpacity style={s.giantButton} onPress={startVisit} activeOpacity={0.86}>
          <Text style={s.giantIcon}>🎙</Text>
          <Text style={s.giantText}>Iniciar visita médica</Text>
          <Text style={s.giantSub}>Doctor en inglés · Paciente en español</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.phoneModeLink}
          onPress={() => {
            hapticLight();
            router.push('/dial');
          }}
          activeOpacity={0.85}
        >
          <Text style={s.phoneModeText}>🔊 Estoy en una llamada por teléfono</Text>
        </TouchableOpacity>

        <View style={s.lastCard}>
          <View style={s.lastHeader}>
            <View>
              <Text style={s.lastLabel}>Última visita</Text>
              <Text style={s.lastDate}>{lastCall ? formatTimestamp(lastCall.startedAt) : 'Todavía no hay visitas'}</Text>
            </View>
            <Text style={s.lastIcon}>📋</Text>
          </View>

          <Text style={s.lastSummary}>{getLastSummary(lastCall)}</Text>

          {lastCall ? (
            <View style={s.lastActions}>
              <TouchableOpacity style={s.listenButton} onPress={playLastSummary} activeOpacity={0.85}>
                <Text style={s.listenText}>🔊 Escuchar resumen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.openButton}
                onPress={() => {
                  hapticLight();
                  router.push({ pathname: '/summary', params: { id: lastCall.id } });
                }}
                activeOpacity={0.85}
              >
                <Text style={s.openText}>Ver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.noVisitHint}>
              <Text style={s.noVisitHintText}>Su resumen aparecerá aquí al terminar una visita.</Text>
            </View>
          )}
        </View>

        <Text style={s.disclaimer}>
          MedLingua ayuda con traducción. Siempre confirme medicinas, dosis y fechas con su doctor.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, paddingHorizontal: 20 },
  logoRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6 },
  logoMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: C.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 28 },
  wordmark: { fontSize: 24, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  privacy: { fontSize: 16, fontWeight: '800', color: C.listen, marginTop: 2 },
  hero: { paddingTop: 26, paddingBottom: 24 },
  kicker: { fontSize: 17, fontWeight: '900', color: C.warm, marginBottom: 8 },
  title: { fontSize: 39, lineHeight: 45, fontWeight: '900', color: C.ink, letterSpacing: -0.7 },
  subtitle: { fontSize: 20, lineHeight: 29, color: C.inkSoft, marginTop: 14, fontWeight: '600' },
  giantButton: {
    minHeight: 178,
    borderRadius: 34,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 8,
  },
  giantIcon: { fontSize: 44, marginBottom: 8 },
  giantText: { fontSize: 28, lineHeight: 33, fontWeight: '900', color: '#fff', textAlign: 'center' },
  giantSub: { fontSize: 17, color: '#EAF4FF', fontWeight: '800', marginTop: 8, textAlign: 'center' },
  phoneModeLink: {
    minHeight: 60,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  phoneModeText: { fontSize: 17, lineHeight: 23, color: C.primaryStrong, fontWeight: '900', textAlign: 'center' },
  lastCard: {
    marginTop: 24,
    backgroundColor: C.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.line,
    padding: 20,
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  lastHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  lastLabel: { fontSize: 20, fontWeight: '900', color: C.ink },
  lastDate: { fontSize: 16, color: C.inkSoft, fontWeight: '700', marginTop: 3 },
  lastIcon: { fontSize: 30 },
  lastSummary: { fontSize: 20, lineHeight: 30, color: C.ink, fontWeight: '600' },
  lastActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  noVisitHint: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: C.surfaceSunk,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  noVisitHintText: { fontSize: 16, lineHeight: 22, color: C.inkSoft, textAlign: 'center', fontWeight: '800' },
  listenButton: {
    flex: 1,
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: C.warmTint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  listenText: { fontSize: 17, fontWeight: '900', color: C.warm },
  openButton: {
    minWidth: 72,
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: C.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openText: { fontSize: 17, fontWeight: '900', color: C.primaryStrong },
  disclaimer: { marginTop: 'auto', marginBottom: 18, fontSize: 16, lineHeight: 22, color: C.inkSoft, textAlign: 'center', fontWeight: '700' },
});
