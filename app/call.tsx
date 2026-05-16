import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  type AppStateStatus,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import CallControls from '../components/CallControls';
import CallPanel from '../components/CallPanel';
import DisclaimerBanner from '../components/DisclaimerBanner';
import TranscriptMessage from '../components/TranscriptMessage';
import { translateToEnglish, translateToSpanish } from '../services/claude';
import { saveCall } from '../services/storage';
import { transcribeAudio } from '../services/whisper';
import type { CallRecord, TranscriptEntry } from '../types';
import { CHUNK_DURATION_MS, startRecording, stopRecording } from '../utils/audio';
import { generateId } from '../utils/format';
import { hapticWarning } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkMute: '#8A8E96',
  inkFaint: '#B5B3AB',
  primary: '#0F5BA8',
  primaryTint: '#DCEAF6',
};

export default function CallScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { number } = useLocalSearchParams<{ number?: string }>();

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callStartedAt] = useState(() => Date.now());

  const recordingRef = useRef<Audio.Recording | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  useEffect(() => {
    Audio.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    async function handleAppState(nextState: AppStateStatus) {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAtRef.current = Date.now();
        if (isListeningRef.current) await handleStopListening();
        if (isSpeakingRef.current) await finishPatientRecording();
        return;
      }

      if (nextState === 'active' && backgroundedAtRef.current) {
        const awayForMs = Date.now() - backgroundedAtRef.current;
        backgroundedAtRef.current = null;
        if (awayForMs >= 60_000 && transcriptRef.current.length > 0) {
          hapticWarning();
          setTranscript([]);
          Alert.alert(
            'Conversación borrada',
            'Por seguridad, borramos la conversación abierta porque la app estuvo cerrada más de 1 minuto.'
          );
        }
      }
    }

    const sub = AppState.addEventListener('change', state => {
      handleAppState(state).catch(console.error);
    });
    return () => sub.remove();
  }, []);

  const appendEntry = useCallback((entry: TranscriptEntry) => {
    setTranscript(prev => [...prev, entry]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  async function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    if (next && isListening) await handleStopListening();
  }

  async function toggleSpeaker() {
    const next = !isSpeaker;
    setIsSpeaker(next);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: !next,
      playsInSilentModeIOS: true,
    });
  }

  async function processProviderChunk(uri: string) {
    try {
      const englishText = await transcribeAudio(uri, 'en');
      if (!englishText.trim()) return;
      const spanishText = await translateToSpanish(englishText);
      appendEntry({
        id: generateId(), role: 'provider',
        originalText: englishText, translatedText: spanishText,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      Alert.alert('Error de traducción', err.message || String(err));
    }
  }

  async function startChunkedListening() {
    if (isMuted) return;
    setIsListening(true);
    isListeningRef.current = true;

    async function recordChunk() {
      if (!isListeningRef.current) return;
      try {
        const rec = await startRecording();
        recordingRef.current = rec;
        chunkTimerRef.current = setTimeout(async () => {
          if (!recordingRef.current) return;
          setIsProcessing(true);
          const uri = await stopRecording(recordingRef.current);
          recordingRef.current = null;
          await processProviderChunk(uri);
          setIsProcessing(false);
          if (isListeningRef.current) recordChunk();
        }, CHUNK_DURATION_MS);
      } catch (err: any) {
        setIsListening(false);
        isListeningRef.current = false;
        Alert.alert('Error del micrófono', err.message);
      }
    }
    recordChunk();
  }

  async function handleStopListening() {
    setIsListening(false);
    isListeningRef.current = false;
    if (chunkTimerRef.current) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null; }
    if (recordingRef.current) {
      setIsProcessing(true);
      try {
        const uri = await stopRecording(recordingRef.current);
        recordingRef.current = null;
        await processProviderChunk(uri);
      } catch { } finally { setIsProcessing(false); }
    }
  }

  async function handleSpeakSpanish() {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const rec = await startRecording();
      recordingRef.current = rec;
      (rec as any)._doneTimer = setTimeout(() => finishPatientRecording(), 30000);
    } catch (err: any) {
      setIsSpeaking(false);
      Alert.alert('Error del micrófono', err.message);
    }
  }

  async function finishPatientRecording() {
    if (!recordingRef.current) return;
    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsSpeaking(false);
    setIsProcessing(true);
    if ((rec as any)._doneTimer) clearTimeout((rec as any)._doneTimer);
    try {
      const uri = await stopRecording(rec);
      const spanishText = await transcribeAudio(uri, 'es');
      if (!spanishText.trim()) { setIsProcessing(false); return; }
      const englishText = await translateToEnglish(spanishText);
      appendEntry({
        id: generateId(), role: 'patient',
        originalText: spanishText, translatedText: englishText,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      Alert.alert('Error de traducción', err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEndCall() {
    if (isListening) await handleStopListening();
    if (isSpeaking) await finishPatientRecording();

    if (transcript.length === 0) {
      Alert.alert('No hay conversación', '¿Terminar la visita de todos modos?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Terminar', style: 'destructive', onPress: () => router.replace('/home') },
      ]);
      return;
    }

    const callRecord: CallRecord = {
      id: generateId(), startedAt: callStartedAt,
      endedAt: Date.now(), transcript, summary: null,
    };
    try {
      await saveCall(callRecord);
      router.replace({ pathname: '/summary', params: { id: callRecord.id } });
    } catch { router.replace('/home'); }
  }

  async function handleEditEntry(id: string, newSpanish: string) {
    try {
      const newEnglish = await translateToEnglish(newSpanish);
      setTranscript(prev => prev.map(e =>
        e.id === id ? { ...e, originalText: newSpanish, translatedText: newEnglish } : e
      ));
    } catch (err: any) {
      Alert.alert('No se pudo traducir de nuevo', err.message || String(err));
    }
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        <DisclaimerBanner />

        <View style={s.privacyBadge}>
          <Text style={s.privacyText}>🔒 Conversación privada</Text>
        </View>

        <CallPanel
          isListening={isListening}
          isSpeaking={isSpeaking}
          callStartedAt={callStartedAt}
          dialedNumber={number || ''}
          isMuted={isMuted}
          isSpeaker={isSpeaker}
          onClearChat={() => setTranscript([])}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
        />

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {transcript.length === 0 && (
            <View style={s.empty}>
              <View style={s.emptyIconWrap}>
                <Text style={{ fontSize: 32 }}>🌐</Text>
              </View>
              <Text style={s.emptyTitle}>Lista para traducir</Text>
              <Text style={s.emptySub}>
                Toque <Text style={s.emptyBold}>El doctor habla</Text> cuando hable el doctor en inglés.{'\n'}
                Toque <Text style={s.emptyBoldWarm}>Yo hablo</Text> cuando usted responda en español.
              </Text>

              <View style={s.statsRow}>
                {[
                  { n: '1', label: 'Doctor habla' },
                  { n: '2', label: 'Usted habla' },
                  { n: '3', label: 'Reciba resumen' },
                ].map(({ n, label }) => (
                  <View key={label} style={s.statTile}>
                    <Text style={s.statNum}>{n}</Text>
                    <Text style={s.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {transcript.map(entry => (
            <TranscriptMessage
              key={entry.id}
              entry={entry}
              onEdit={entry.role === 'patient' ? handleEditEntry : undefined}
            />
          ))}
        </ScrollView>

        <CallControls
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          onStartListening={startChunkedListening}
          onStopListening={handleStopListening}
          onSpeakSpanish={isSpeaking ? finishPatientRecording : handleSpeakSpanish}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  privacyBadge: {
    alignSelf: 'center',
    backgroundColor: '#DCEAE2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2F8F7333',
  },
  privacyText: { fontSize: 16, color: '#2F8F73', fontWeight: '900' },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 16, paddingHorizontal: 12, paddingBottom: 24, flexGrow: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 25, fontWeight: '900', color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 18, color: C.ink2, textAlign: 'center', lineHeight: 27, fontWeight: '600' },
  emptyBold: { fontWeight: '800', color: C.primary },
  emptyBoldWarm: { fontWeight: '800', color: '#B66A3E' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  statTile: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.line,
    padding: 12, alignItems: 'center', gap: 3,
  },
  statNum: { fontSize: 18, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: 14, fontWeight: '800', color: C.ink2, textAlign: 'center', letterSpacing: 0.1 },
});
