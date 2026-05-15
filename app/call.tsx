import * as ExpoSpeech from 'expo-speech';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    Audio.requestPermissionsAsync();
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
      Alert.alert('Transcription error', err.message || String(err));
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
        Alert.alert('Recording error', err.message);
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
      Alert.alert('Recording error', err.message);
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
      Alert.alert('Transcription error', err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEndCall() {
    if (isListening) await handleStopListening();
    if (isSpeaking) await finishPatientRecording();

    if (transcript.length === 0) {
      Alert.alert('No transcript', 'End the session anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End', style: 'destructive', onPress: () => router.replace('/home') },
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
      Alert.alert('Re-translation failed', err.message || String(err));
    }
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        <DisclaimerBanner />

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
              <Text style={s.emptyTitle}>Ready to translate</Text>
              <Text style={s.emptySub}>
                Tap <Text style={s.emptyBold}>Provider</Text> when the doctor speaks English.{'\n'}
                Tap <Text style={s.emptyBoldWarm}>Patient</Text> when the patient speaks Spanish.
              </Text>

              {/* Stats row for judges / demo */}
              <View style={s.statsRow}>
                {[
                  { n: '25M', label: 'Americans with LEP' },
                  { n: '$150', label: 'per hour interpreter' },
                  { n: '~2s', label: 'translation delay' },
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
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 16, paddingHorizontal: 12, paddingBottom: 24, flexGrow: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.primaryTint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.inkMute, textAlign: 'center', lineHeight: 22 },
  emptyBold: { fontWeight: '800', color: C.primary },
  emptyBoldWarm: { fontWeight: '800', color: '#B66A3E' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  statTile: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.line,
    padding: 12, alignItems: 'center', gap: 3,
  },
  statNum: { fontSize: 18, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.inkMute, textAlign: 'center', letterSpacing: 0.3 },
});
