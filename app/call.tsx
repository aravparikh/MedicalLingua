import * as ExpoSpeech from 'expo-speech';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import CallControls from '../components/CallControls';
import CallPanel from '../components/CallPanel';
import DisclaimerBanner from '../components/DisclaimerBanner';
import LanguagePill from '../components/LanguagePill';
import PendingBubble from '../components/PendingBubble';
import TranscriptMessage from '../components/TranscriptMessage';
import { useLanguage } from '../hooks/useLanguage';
import { translateToEnglish, translateToSpanish } from '../services/claude';
import { saveCall } from '../services/storage';
import { transcribeAudio } from '../services/whisper';
import type { CallRecord, TranscriptEntry } from '../types';
import { CHUNK_DURATION_MS, startRecording, stopRecording } from '../utils/audio';
import { generateId } from '../utils/format';
import { hapticLight, hapticWarning } from '../utils/haptics';
import { getReadAloudDefault } from '../services/preferences';
import { scanForSafetyFlags } from '../utils/safetyScan';

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

const L = {
  es: {
    privacy: '🔒 Conversación privada',
    phoneModeTitle: '🔊 Use altavoz',
    phoneModeText: 'MedLingua escucha el sonido de la llamada y traduce en esta pantalla.',
    emptyTitle: 'Lista para traducir',
    emptySub1: 'Toque ',
    emptySub2: ' cuando hable el doctor.\nToque ',
    emptySub3: ' cuando usted responda.',
    boldDoctor: 'El doctor habla',
    boldYou: 'Yo hablo',
    step1: 'Doctor habla',
    step2: 'Usted habla',
    step3: 'Reciba resumen',
    translateError: 'Error de traducción',
    micError: 'Error del micrófono',
    retranslateError: 'No se pudo traducir de nuevo',
    noConversation: 'No hay conversación',
    endAnyway: '¿Terminar la visita de todos modos?',
    cancel: 'Cancelar',
    finish: 'Terminar',
    cleared: 'Conversación borrada',
    clearedBody: 'Por seguridad, borramos la conversación abierta porque la app estuvo cerrada más de 1 minuto.',
    home: 'Inicio',
    stillSpeakingTitle: 'Aún está grabando',
    stillSpeakingBody: 'Está hablando o escuchando. ¿Detener y terminar la visita?',
    leaveTitle: '¿Salir de la visita?',
    leaveBody: 'Perderá la conversación si no la guarda.',
    stay: 'Quedarse',
    leave: 'Salir',
    saveAndLeave: 'Guardar y salir',
    helpTitle: 'Cómo usar MedLingua',
    helpPhone: '1. Ponga su llamada en altavoz.\n2. Toque "El doctor habla" cuando hable el doctor.\n3. Toque "Yo hablo" cuando usted responda.\n4. Toque "Terminar" para recibir su resumen.',
    helpRoom: '1. Ponga el teléfono cerca de usted.\n2. Toque "El doctor habla" cuando hable el doctor.\n3. Toque "Yo hablo" cuando usted responda.\n4. Toque "Terminar" para recibir su resumen.',
  },
  en: {
    privacy: '🔒 Private conversation',
    phoneModeTitle: '🔊 Use speakerphone',
    phoneModeText: 'MedLingua listens to your call audio and translates on this screen.',
    emptyTitle: 'Ready to translate',
    emptySub1: 'Tap ',
    emptySub2: ' when the doctor speaks.\nTap ',
    emptySub3: ' when you respond.',
    boldDoctor: 'Doctor speaks',
    boldYou: 'I speak',
    step1: 'Doctor speaks',
    step2: 'You speak',
    step3: 'Get summary',
    translateError: 'Translation error',
    micError: 'Microphone error',
    retranslateError: 'Could not re-translate',
    noConversation: 'No conversation',
    endAnyway: 'End the visit anyway?',
    cancel: 'Cancel',
    finish: 'End',
    cleared: 'Conversation cleared',
    clearedBody: 'For your privacy, we cleared the open conversation because the app was closed for more than 1 minute.',
    home: 'Home',
    stillSpeakingTitle: 'Still recording',
    stillSpeakingBody: 'You\'re speaking or listening. Stop and end the visit?',
    leaveTitle: 'Leave the visit?',
    leaveBody: 'You\'ll lose this conversation if you don\'t save it.',
    stay: 'Stay',
    leave: 'Leave',
    saveAndLeave: 'Save and leave',
    helpTitle: 'How to use MedLingua',
    helpPhone: '1. Put your call on speaker.\n2. Tap "Doctor speaks" when the doctor talks.\n3. Tap "I speak" when you respond.\n4. Tap "End" to get your summary.',
    helpRoom: '1. Place the phone near you.\n2. Tap "Doctor speaks" when the doctor talks.\n3. Tap "I speak" when you respond.\n4. Tap "End" to get your summary.',
  },
};

export default function CallScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { number, mode } = useLocalSearchParams<{ number?: string; mode?: string }>();
  const isPhoneMode = mode === 'phone';
  const { lang, toggle } = useLanguage();
  const t = L[lang];

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingRole, setPendingRole] = useState<'provider' | 'patient' | null>(null);
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
    // Honor the user's "Read aloud by default" preference
    getReadAloudDefault().then(on => { if (on) setIsSpeaker(true); });
    // Stop any ongoing TTS when leaving the call screen
    return () => { ExpoSpeech.stop(); };
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
          Alert.alert(t.cleared, t.clearedBody);
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

  const isSpeakerRef = useRef(false);
  useEffect(() => { isSpeakerRef.current = isSpeaker; }, [isSpeaker]);

  function toggleSpeaker() {
    const next = !isSpeaker;
    setIsSpeaker(next);
    // If turning off, stop any active TTS
    if (!next) ExpoSpeech.stop();
  }

  // Speak the translated text out loud, only if speaker is on.
  // Provider translation is Spanish (for patient to hear).
  // Patient translation is English (for doctor to hear).
  function speakTranslation(text: string, role: 'provider' | 'patient') {
    if (!isSpeakerRef.current || !text.trim()) return;
    const ttsLang = role === 'provider' ? 'es-MX' : 'en-US';
    ExpoSpeech.stop();
    ExpoSpeech.speak(text, { language: ttsLang, rate: 0.92 });
  }

  // Stop any TTS playback before we start recording — avoids capturing our own voice.
  function stopTTSBeforeRecording() {
    ExpoSpeech.stop();
  }

  async function processProviderChunk(uri: string) {
    setPendingRole('provider');
    try {
      const englishText = await transcribeAudio(uri, 'en');
      if (!englishText.trim()) { setPendingRole(null); return; }
      const spanishText = await translateToSpanish(englishText);
      const safetyFlags = scanForSafetyFlags(englishText, 'en-es');
      appendEntry({
        id: generateId(), role: 'provider',
        originalText: englishText, translatedText: spanishText,
        timestamp: Date.now(),
        safetyFlags,
      });
      // Read the Spanish translation aloud (for patient) if speaker is on
      speakTranslation(spanishText, 'provider');
    } catch (err: any) {
      Alert.alert(t.translateError, err.message || String(err));
    } finally {
      setPendingRole(null);
    }
  }

  async function startChunkedListening() {
    if (isMuted) return;
    stopTTSBeforeRecording();
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
        Alert.alert(t.micError, err.message);
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
    stopTTSBeforeRecording();
    setIsSpeaking(true);
    try {
      const rec = await startRecording();
      recordingRef.current = rec;
      (rec as any)._doneTimer = setTimeout(() => finishPatientRecording(), 30000);
    } catch (err: any) {
      setIsSpeaking(false);
      Alert.alert(t.micError, err.message);
    }
  }

  async function finishPatientRecording() {
    if (!recordingRef.current) return;
    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsSpeaking(false);
    setIsProcessing(true);
    setPendingRole('patient');
    if ((rec as any)._doneTimer) clearTimeout((rec as any)._doneTimer);
    try {
      const uri = await stopRecording(rec);
      const spanishText = await transcribeAudio(uri, 'es');
      if (!spanishText.trim()) { setIsProcessing(false); setPendingRole(null); return; }
      const englishText = await translateToEnglish(spanishText);
      const safetyFlags = scanForSafetyFlags(spanishText, 'es-en');
      appendEntry({
        id: generateId(), role: 'patient',
        originalText: spanishText, translatedText: englishText,
        timestamp: Date.now(),
        safetyFlags,
      });
      // Read the English translation aloud (for doctor) if speaker is on
      speakTranslation(englishText, 'patient');
    } catch (err: any) {
      Alert.alert(t.translateError, err.message);
    } finally {
      setIsProcessing(false);
      setPendingRole(null);
    }
  }

  async function doEndAndSave() {
    if (isListening) await handleStopListening();
    if (isSpeaking) await finishPatientRecording();

    if (transcript.length === 0) {
      router.replace('/home');
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

  function handleEndCall() {
    // If actively listening/speaking, confirm first
    if (isListening || isSpeaking) {
      hapticWarning();
      Alert.alert(t.stillSpeakingTitle, t.stillSpeakingBody, [
        { text: t.cancel, style: 'cancel' },
        { text: t.finish, style: 'destructive', onPress: doEndAndSave },
      ]);
      return;
    }

    // If nothing recorded yet, confirm leaving empty
    if (transcript.length === 0) {
      Alert.alert(t.noConversation, t.endAnyway, [
        { text: t.cancel, style: 'cancel' },
        { text: t.finish, style: 'destructive', onPress: () => router.replace('/home') },
      ]);
      return;
    }

    // Has conversation, not currently speaking — save and go to summary
    doEndAndSave();
  }

  function handleGoHome() {
    hapticLight();
    // Active recording → confirm and stop
    if (isListening || isSpeaking) {
      hapticWarning();
      Alert.alert(t.stillSpeakingTitle, t.stillSpeakingBody, [
        { text: t.cancel, style: 'cancel' },
        { text: t.finish, style: 'destructive', onPress: doEndAndSave },
      ]);
      return;
    }
    // Has conversation → confirm leaving (or save)
    if (transcript.length > 0) {
      Alert.alert(t.leaveTitle, t.leaveBody, [
        { text: t.stay, style: 'cancel' },
        { text: t.saveAndLeave, onPress: doEndAndSave },
        { text: t.leave, style: 'destructive', onPress: () => router.replace('/home') },
      ]);
      return;
    }
    // Nothing to lose, go straight home
    router.replace('/home');
  }

  async function handleEditEntry(id: string, newSpanish: string) {
    try {
      const newEnglish = await translateToEnglish(newSpanish);
      setTranscript(prev => prev.map(e =>
        e.id === id ? { ...e, originalText: newSpanish, translatedText: newEnglish } : e
      ));
    } catch (err: any) {
      Alert.alert(t.retranslateError, err.message || String(err));
    }
  }

  function showCallHelp() {
    Alert.alert(t.helpTitle, isPhoneMode ? t.helpPhone : t.helpRoom);
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        <DisclaimerBanner lang={lang} />

        <View style={s.topRow}>
          <TouchableOpacity onPress={handleGoHome} style={s.homeBtn} activeOpacity={0.7}>
            <Text style={s.homeBtnText}>← {t.home}</Text>
          </TouchableOpacity>
          <View style={s.privacyBadge}>
            <Text style={s.privacyText}>{t.privacy}</Text>
          </View>
          <LanguagePill lang={lang} onToggle={toggle} />
        </View>

        {isPhoneMode && (
          <View style={s.phoneModeCard}>
            <Text style={s.phoneModeTitle}>{t.phoneModeTitle}</Text>
            <Text style={s.phoneModeText}>{t.phoneModeText}</Text>
          </View>
        )}

        <CallPanel
          isListening={isListening}
          isSpeaking={isSpeaking}
          callStartedAt={callStartedAt}
          dialedNumber={number || ''}
          isMuted={isMuted}
          isSpeaker={isSpeaker}
          lang={lang}
          onShowHelp={showCallHelp}
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
              <Text style={s.emptyTitle}>{t.emptyTitle}</Text>
              <Text style={s.emptySub}>
                {t.emptySub1}<Text style={s.emptyBold}>{t.boldDoctor}</Text>{t.emptySub2}<Text style={s.emptyBoldWarm}>{t.boldYou}</Text>{t.emptySub3}
              </Text>

              <View style={s.statsRow}>
                {[
                  { n: '1', label: t.step1 },
                  { n: '2', label: t.step2 },
                  { n: '3', label: t.step3 },
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
              lang={lang}
              onEdit={entry.role === 'patient' ? handleEditEntry : undefined}
            />
          ))}

          {pendingRole && <PendingBubble role={pendingRole} lang={lang} />}
        </ScrollView>

        <CallControls
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          lang={lang}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  homeBtn: {
    minHeight: 36, minWidth: 64,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1, borderColor: C.line,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  homeBtnText: { fontSize: 14, color: C.primary, fontWeight: '900' },
  privacyBadge: {
    backgroundColor: '#DCEAE2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2F8F7333',
  },
  privacyText: { fontSize: 12, color: '#2F8F73', fontWeight: '800' },
  phoneModeCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  phoneModeTitle: { fontSize: 18, color: C.ink, fontWeight: '900', marginBottom: 2 },
  phoneModeText: { fontSize: 16, lineHeight: 22, color: C.ink2, fontWeight: '700' },
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
