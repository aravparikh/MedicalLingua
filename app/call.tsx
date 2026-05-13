import * as ExpoSpeech from 'expo-speech';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar
} from 'react-native';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import CallControls from '../components/CallControls';
import CallPanel from '../components/CallPanel';
import DisclaimerBanner from '../components/DisclaimerBanner';
import TranscriptMessage from '../components/TranscriptMessage';
import { translateToEnglish, translateToSpanish } from '../services/claude';
import { saveCall } from '../services/storage';
import { transcribeAudio } from '../services/whisper';
import { startCall, hangUp, setMuted } from '../services/twilio';
import type { CallRecord, TranscriptEntry } from '../types';
import { CHUNK_DURATION_MS, startRecording, stopRecording } from '../utils/audio';
import { generateId } from '../utils/format';

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

  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);

  // Background animation values
  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const bgAnim2 = useRef(new Animated.Value(0)).current;

  async function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    await setMuted(next);
    if (next && isListening) {
      await handleStopListening();
    }
  }

  async function toggleSpeaker() {
    const next = !isSpeaker;
    setIsSpeaker(next);
    // allowsRecordingIOS: false → audio routes to loudspeaker
    // allowsRecordingIOS: true  → audio routes to earpiece (also required for recording)
    // We set it here for playback routing; startRecording() will restore allowsRecordingIOS:true when needed.
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: !next, // earpiece when speaker is OFF, speaker when speaker is ON
      playsInSilentModeIOS: true,
    });
  }

  // Initiate outbound Twilio call when a phone number is provided
  useEffect(() => {
    if (!number) return;
    setCallStatus('connecting');
    startCall(number)
      .then(call => {
        setCallStatus('connected');
        call.on('disconnected', () => setCallStatus('idle'));
      })
      .catch(err => {
        setCallStatus('failed');
        Alert.alert('Call failed', err.message || String(err));
      });
    return () => { hangUp(); };
  }, []);

  useEffect(() => {
    Audio.requestPermissionsAsync();
    
    // Slow, sexy ambient background movement
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim1, { toValue: 1, duration: 15000, useNativeDriver: true }),
        Animated.timing(bgAnim1, { toValue: 0, duration: 15000, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim2, { toValue: 1, duration: 20000, useNativeDriver: true }),
        Animated.timing(bgAnim2, { toValue: 0, duration: 20000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const appendEntry = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => [...prev, entry]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // --- Audio processing logic hidden for brevity, keeping existing logic intact ---
  async function processProviderChunk(uri: string) {
    try {
      const englishText = await transcribeAudio(uri, 'en');
      if (!englishText.trim()) return;
      const spanishText = await translateToSpanish(englishText);
      appendEntry({ id: generateId(), role: 'provider', originalText: englishText, translatedText: spanishText, timestamp: Date.now() });
    } catch (err: any) {
      Alert.alert('Whisper API Error', err.message || String(err));
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
        Alert.alert('Recording Error', err.message);
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
      } catch (err) {} finally { setIsProcessing(false); }
    }
  }

  async function handleSpeakSpanish() {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const rec = await startRecording();
      recordingRef.current = rec;
      const timer = setTimeout(async () => finishPatientRecording(), 30000);
      (recordingRef.current as any)._doneTimer = timer;
    } catch (err: any) {
      setIsSpeaking(false);
      Alert.alert('Recording Error', err.message);
    }
  }

  async function finishPatientRecording() {
    if (!recordingRef.current) return;
    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsSpeaking(false);
    setIsProcessing(true);
    const timer = (rec as any)._doneTimer;
    if (timer) clearTimeout(timer);
    try {
      const uri = await stopRecording(rec);
      const spanishText = await transcribeAudio(uri, 'es');
      if (!spanishText.trim()) { setIsProcessing(false); return; }
      const englishText = await translateToEnglish(spanishText);
      appendEntry({ id: generateId(), role: 'patient', originalText: spanishText, translatedText: englishText, timestamp: Date.now() });
    } catch (err: any) {
      Alert.alert('Whisper API Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleEndCall() {
    if (isListening) await handleStopListening();
    if (isSpeaking) await finishPatientRecording();
    await hangUp();
    if (transcript.length === 0) {
      Alert.alert('No transcript', 'End the call anyway?', [{ text: 'Cancel', style: 'cancel' }, { text: 'End', style: 'destructive', onPress: () => router.replace('/home') }]);
      return;
    }
    const callRecord: CallRecord = { id: generateId(), startedAt: callStartedAt, endedAt: Date.now(), transcript, summary: null };
    try {
      await saveCall(callRecord);
      router.replace({ pathname: '/summary', params: { id: callRecord.id } });
    } catch (err) { router.replace('/home'); }
  }

  function handlePlayEnglish(englishText: string) {
    ExpoSpeech.speak(englishText, { language: 'en-US', rate: 0.9 });
  }

  async function handleEditEntry(id: string, newSpanish: string) {
    try {
      const newEnglish = await translateToEnglish(newSpanish);
      setTranscript(prev =>
        prev.map(e =>
          e.id === id
            ? { ...e, originalText: newSpanish, translatedText: newEnglish }
            : e
        )
      );
    } catch (err: any) {
      Alert.alert('Re-translation failed', err.message || String(err));
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Absolute Ambient Orbs for Glassmorphism Mesh Gradient */}
      <Animated.View style={[styles.orb1, { transform: [{ translateX: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }, { translateY: bgAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateX: bgAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }, { translateY: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }] }]} />
      
      {/* Full screen blur to create the frosted mesh effect */}
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={{ flex: 1 }}>
        <DisclaimerBanner />

        <CallPanel
          isListening={isListening}
          isSpeaking={isSpeaking}
          callStartedAt={callStartedAt}
          dialedNumber={number || ''}
          callStatus={callStatus}
          isMuted={isMuted}
          isSpeaker={isSpeaker}
          onClearChat={() => setTranscript([])}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {transcript.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Text style={styles.emptyIcon}>✨</Text>
              </View>
              <Text style={styles.emptyText}>
                The AI is standing by.{'\n'}
                Tap <Text style={styles.emptyBold}>Listen</Text> to begin real-time telemedicine transcription.
              </Text>
            </View>
          )}

          {transcript.map((entry) => (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F', // Ultra deep space black
  },
  orb1: {
    position: 'absolute',
    top: '-10%',
    left: '-20%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 122, 255, 0.45)', // Vivid Cyan/Blue
    filter: 'blur(40px)',
  },
  orb2: {
    position: 'absolute',
    bottom: '10%',
    right: '-20%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(52, 199, 89, 0.35)', // Vibrant Emerald Green
    filter: 'blur(50px)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 8,
    paddingBottom: 60,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  emptyBold: {
    fontWeight: '800',
    color: '#fff',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
