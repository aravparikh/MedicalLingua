import * as ExpoSpeech from 'expo-speech';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import { translateToEnglish, translateToSpanish } from '../services/claude';
import { saveCall } from '../services/storage';
import { transcribeAudio } from '../services/whisper';
import type { CallRecord, TranscriptEntry } from '../types';
import { CHUNK_DURATION_MS, startRecording, stopRecording } from '../utils/audio';
import { generateId } from '../utils/format';

// ── Design tokens ────────────────────────────────────────────
const C = {
  bg: '#F4F1EB',
  bgDeep: '#ECE7DC',
  surface: '#FFFFFF',
  surfaceSunk: '#FAF7F1',
  line: '#E5DFD2',
  lineSoft: '#EFEBE0',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkSoft: '#555960',
  inkMute: '#8A8E96',
  inkFaint: '#B5B3AB',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmStrong: '#8E5028',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

// ── Language toggle ──────────────────────────────────────────
function LanguageToggle({ direction, onSwap }: { direction: 'patient' | 'doctor'; onSwap: () => void }) {
  const isPatient = direction === 'patient';
  return (
    <View style={styles.langToggle}>
      <View style={[styles.langChip, { backgroundColor: isPatient ? C.warm : C.primary }]}>
        <Text style={styles.langChipName}>{isPatient ? 'Español' : 'English'}</Text>
        <Text style={styles.langChipCode}>{isPatient ? 'ES' : 'EN'}</Text>
      </View>
      <TouchableOpacity style={styles.langArrow} onPress={onSwap} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ fontSize: 20, color: C.inkMute }}>⇄</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.langChip, styles.langChipTo]} onPress={onSwap}>
        <Text style={[styles.langChipName, { color: C.ink }]}>{isPatient ? 'English' : 'Español'}</Text>
        <Text style={[styles.langChipCode, { color: C.inkMute }]}>{isPatient ? 'EN' : 'ES'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Animated listening orb ───────────────────────────────────
function WaveBar({ delay, color }: { delay: number; color: string }) {
  const h = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(h, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(h, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);
  return <Animated.View style={[styles.waveBar, { backgroundColor: color, transform: [{ scaleY: h }] }]} />;
}

function ListeningView({ direction }: { direction: 'patient' | 'doctor' }) {
  const isPatient = direction === 'patient';
  const orbColor = isPatient ? C.warm : C.primary;
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    rings.forEach((r, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.parallel([
            Animated.timing(r, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    });
  }, []);

  return (
    <View style={styles.listenCard}>
      <View style={styles.orbWrap}>
        {rings.map((r, i) => (
          <Animated.View key={i} style={[styles.orbRing, {
            backgroundColor: isPatient ? 'rgba(182,106,62,0.12)' : 'rgba(15,91,168,0.1)',
            transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
            opacity: r.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.8, 0] }),
          }]} />
        ))}
        <View style={[styles.orb, { backgroundColor: orbColor, shadowColor: orbColor }]}>
          <Text style={{ fontSize: 34 }}>🎙</Text>
        </View>
      </View>
      <Text style={styles.listenTitle}>{isPatient ? 'Te escucho…' : 'Listening…'}</Text>
      <Text style={styles.listenSub}>
        {isPatient ? 'Hable cuando esté listo. Hablo despacio y con claridad.' : "Speak naturally. I'll translate to Spanish."}
      </Text>
      <View style={styles.waveform}>
        {[0, 80, 160, 240, 320, 400, 480].map((d, i) => <WaveBar key={i} delay={d} color={orbColor} />)}
      </View>
    </View>
  );
}

function IdleView({ direction }: { direction: 'patient' | 'doctor' }) {
  const isPatient = direction === 'patient';
  const orbColor = isPatient ? C.warm : C.primary;
  return (
    <View style={styles.listenCard}>
      <View style={[styles.orb, { backgroundColor: orbColor, shadowColor: orbColor, opacity: 0.8 }]}>
        <Text style={{ fontSize: 34 }}>🎙</Text>
      </View>
      <Text style={styles.listenTitle}>{isPatient ? 'Listo para escuchar' : 'Ready to listen'}</Text>
      <Text style={styles.listenSub}>
        {isPatient ? 'Toque el botón de abajo y dígame lo que siente.' : 'Tap the button below and speak clearly.'}
      </Text>
    </View>
  );
}

// ── Utterance card ───────────────────────────────────────────
function UtteranceCard({
  direction, spoken, translation, onEdit,
}: {
  direction: 'patient' | 'doctor';
  spoken: string;
  translation: string;
  onEdit: (newSpoken: string) => void;
}) {
  const isPatient = direction === 'patient';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(spoken);
  useEffect(() => { setDraft(spoken); }, [spoken]);

  function commit() {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== spoken) onEdit(t);
  }

  return (
    <View style={styles.utteranceWrap}>
      <View style={styles.utteranceCard}>
        <View style={styles.utteranceTagRow}>
          <View style={[styles.utteranceDot, { backgroundColor: isPatient ? C.warm : C.primary }]} />
          <Text style={[styles.utteranceTagText, { color: isPatient ? C.warmStrong : C.primaryStrong }]}>
            {isPatient ? 'Usted dijo' : 'You said'}
          </Text>
        </View>

        {editing ? (
          <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
            <TextInput
              style={styles.editInput}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              onBlur={commit}
              selectionColor={C.primary}
            />
            <TouchableOpacity style={styles.retranslateBtn} onPress={commit}>
              <Text style={styles.retranslateBtnText}>Re-translate ↑</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.utteranceSpoken}>{spoken}</Text>
        )}

        <View style={styles.utteranceDivider} />

        <Text style={styles.utteranceTxTag}>
          🌐  {isPatient ? 'Se traduce al inglés' : 'Translates to Spanish'}
        </Text>
        <Text style={styles.utteranceTranslated}>{translation}</Text>

        <View style={styles.utteranceEditRow}>
          <TouchableOpacity
            style={[styles.editBtn, editing && { backgroundColor: C.primaryTint }]}
            onPress={() => setEditing(e => !e)}
          >
            <Text style={styles.editBtnText}>
              ✏️  {editing ? 'Done' : (isPatient ? 'Toque para editar' : 'Tap to edit')}
            </Text>
          </TouchableOpacity>
          <View style={styles.confidencePill}>
            <Text style={styles.confidenceText}>✓ Verified</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── History strip ────────────────────────────────────────────
function HistoryStrip({ history }: { history: TranscriptEntry[] }) {
  if (!history.length) return null;
  return (
    <View style={styles.history}>
      <Text style={styles.historyTitle}>Conversation so far</Text>
      {history.slice(-3).map(h => (
        <View key={h.id} style={[styles.historyBubble, h.role === 'patient' ? styles.historyWarm : styles.historyCool]}>
          {h.role === 'patient' ? (
            <>
              <Text style={{ color: C.warmStrong, fontStyle: 'italic', fontSize: 13, lineHeight: 18 }}>"{h.originalText}"</Text>
              <Text style={{ color: C.inkMute, fontSize: 12, marginTop: 3, lineHeight: 17 }}>{h.translatedText}</Text>
            </>
          ) : (
            <>
              <Text style={{ color: C.ink2, fontSize: 13, lineHeight: 18 }}>{h.originalText}</Text>
              <Text style={{ color: C.inkMute, fontStyle: 'italic', fontSize: 12, marginTop: 3, lineHeight: 17 }}>{h.translatedText}</Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────
type TxState = 'idle' | 'listening' | 'review' | 'playing';

export default function CallScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [direction, setDirection] = useState<'patient' | 'doctor'>('patient');
  const [txState, setTxState] = useState<TxState>('idle');
  const [spoken, setSpoken] = useState('');
  const [translation, setTranslation] = useState('');
  const [history, setHistory] = useState<TranscriptEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callStartedAt] = useState(() => Date.now());

  const recordingRef = useRef<Audio.Recording | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => { Audio.requestPermissionsAsync(); }, []);

  function swap() {
    setDirection(d => d === 'patient' ? 'doctor' : 'patient');
    setTxState('idle');
    setSpoken('');
    setTranslation('');
  }

  async function handlePatientSpeak() {
    setTxState('listening');
    try {
      recordingRef.current = await startRecording();
    } catch (err: any) {
      setTxState('idle');
      Alert.alert('Recording Error', err.message);
    }
  }

  async function handlePatientDone() {
    if (!recordingRef.current) return;
    setIsProcessing(true);
    setTxState('review');
    try {
      const uri = await stopRecording(recordingRef.current);
      recordingRef.current = null;
      const spanishText = await transcribeAudio(uri, 'es');
      if (!spanishText.trim()) { setTxState('idle'); return; }
      const englishText = await translateToEnglish(spanishText);
      setSpoken(spanishText);
      setTranslation(englishText);
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setTxState('idle');
    } finally { setIsProcessing(false); }
  }

  async function handleProviderStart() {
    setTxState('listening');
    isListeningRef.current = true;
    async function chunk() {
      if (!isListeningRef.current) return;
      try {
        recordingRef.current = await startRecording();
        chunkTimerRef.current = setTimeout(async () => {
          if (!recordingRef.current) return;
          setIsProcessing(true);
          const uri = await stopRecording(recordingRef.current);
          recordingRef.current = null;
          const en = await transcribeAudio(uri, 'en');
          if (en.trim()) {
            const es = await translateToSpanish(en);
            setSpoken(en); setTranslation(es); setTxState('review');
          }
          setIsProcessing(false);
          if (isListeningRef.current) chunk();
        }, CHUNK_DURATION_MS);
      } catch { setTxState('idle'); isListeningRef.current = false; }
    }
    chunk();
  }

  async function handleProviderStop() {
    isListeningRef.current = false;
    if (chunkTimerRef.current) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null; }
    if (recordingRef.current) {
      setIsProcessing(true);
      try {
        const uri = await stopRecording(recordingRef.current);
        recordingRef.current = null;
        const en = await transcribeAudio(uri, 'en');
        if (en.trim()) { const es = await translateToSpanish(en); setSpoken(en); setTranslation(es); setTxState('review'); }
        else setTxState('idle');
      } catch { setTxState('idle'); }
      finally { setIsProcessing(false); }
    } else setTxState('idle');
  }

  async function handleEdit(newSpoken: string) {
    setIsProcessing(true);
    setSpoken(newSpoken);
    try {
      const newTx = direction === 'patient'
        ? await translateToEnglish(newSpoken)
        : await translateToSpanish(newSpoken);
      setTranslation(newTx);
    } catch (err: any) {
      Alert.alert('Re-translation failed', err.message);
    } finally { setIsProcessing(false); }
  }

  function handlePlay() {
    setTxState('playing');
    ExpoSpeech.speak(translation, {
      language: direction === 'patient' ? 'en-US' : 'es-ES',
      rate: 0.9,
      onDone: () => {
        setHistory(h => [...h, { id: generateId(), role: direction, originalText: spoken, translatedText: translation, timestamp: Date.now() }]);
        setDirection(d => d === 'patient' ? 'doctor' : 'patient');
        setTxState('idle'); setSpoken(''); setTranslation('');
      },
    });
  }

  async function handleEnd() {
    const full: TranscriptEntry[] = spoken
      ? [...history, { id: generateId(), role: direction, originalText: spoken, translatedText: translation, timestamp: Date.now() }]
      : history;
    if (!full.length) { router.replace('/home'); return; }
    const record: CallRecord = { id: generateId(), startedAt: callStartedAt, endedAt: Date.now(), transcript: full, summary: null };
    try { await saveCall(record); router.replace({ pathname: '/summary', params: { id: record.id } }); }
    catch { router.replace('/home'); }
  }

  const isPatient = direction === 'patient';
  const ctaColor = isPatient ? C.warm : C.primary;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        <View style={styles.appbar}>
          <TouchableOpacity style={styles.appbarBtn} onPress={handleEnd}>
            <Text style={{ fontSize: 18, color: C.ink2 }}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.appbarSub}>In Visit</Text>
            <Text style={styles.appbarTitle}>MedLingua</Text>
          </View>
          <View style={styles.appbarBtn} />
        </View>

        <LanguageToggle direction={direction} onSwap={swap} />

        {isProcessing && (
          <View style={styles.processingRow}>
            <Text style={styles.processingText}>Transcribing &amp; translating…</Text>
          </View>
        )}

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {txState === 'listening' ? (
            <ListeningView direction={direction} />
          ) : txState === 'idle' ? (
            <IdleView direction={direction} />
          ) : (
            <>
              <UtteranceCard direction={direction} spoken={spoken} translation={translation} onEdit={handleEdit} />
              <HistoryStrip history={history} />
            </>
          )}
        </ScrollView>

        <View style={styles.dock}>
          {(txState === 'review' || txState === 'playing') && (
            <>
              <Text style={styles.ctaHelper}>
                {isPatient ? 'El médico escuchará esto en ' : 'The patient will hear this in '}
                <Text style={{ color: C.ink, fontWeight: '700' }}>{isPatient ? 'English' : 'Español'}</Text>
              </Text>
              <TouchableOpacity
                style={[styles.cta, { backgroundColor: ctaColor, shadowColor: ctaColor, opacity: txState === 'playing' ? 0.6 : 1 }]}
                onPress={txState === 'playing' ? undefined : handlePlay}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 22 }}>🔊</Text>
                <Text style={styles.ctaText}>{isPatient ? 'Reproducir para el médico' : 'Play for patient'}</Text>
              </TouchableOpacity>
            </>
          )}
          {txState === 'listening' && (
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: C.listen, shadowColor: C.listen }]}
              onPress={isPatient ? handlePatientDone : handleProviderStop}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 22 }}>⏹</Text>
              <Text style={styles.ctaText}>{isPatient ? 'Toque para detener' : 'Tap to stop'}</Text>
            </TouchableOpacity>
          )}
          {txState === 'idle' && (
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: ctaColor, shadowColor: ctaColor }]}
              onPress={isPatient ? handlePatientSpeak : handleProviderStart}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 22 }}>🎙</Text>
              <Text style={styles.ctaText}>
                {isPatient ? 'Toque y diga lo que siente' : 'Tap and speak to the patient'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 52 },
  appbarBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: C.lineSoft, alignItems: 'center', justifyContent: 'center' },
  appbarSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: C.inkMute },
  appbarTitle: { fontSize: 16, fontWeight: '700', color: C.ink2 },

  langToggle: { marginHorizontal: 16, marginTop: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 5, flexDirection: 'row', alignItems: 'stretch', shadowColor: '#1E2850', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
  langChip: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 15, minHeight: 56 },
  langChipTo: { backgroundColor: C.surfaceSunk },
  langChipName: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1 },
  langChipCode: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },
  langArrow: { width: 40, alignItems: 'center', justifyContent: 'center' },

  processingRow: { alignItems: 'center', paddingVertical: 6 },
  processingText: { fontSize: 12, color: C.primary, fontWeight: '700', letterSpacing: 0.3 },

  listenCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 32, paddingVertical: 24 },
  orbWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  orbRing: { position: 'absolute', width: 110, height: 110, borderRadius: 55 },
  orb: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  listenTitle: { fontSize: 24, fontWeight: '700', color: C.ink, letterSpacing: -0.4, textAlign: 'center' },
  listenSub: { fontSize: 15, color: C.inkSoft, lineHeight: 22, textAlign: 'center' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36 },
  waveBar: { width: 5, height: 36, borderRadius: 3 },

  utteranceWrap: { padding: 16 },
  utteranceCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 28, shadowColor: '#1E2850', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 6, overflow: 'hidden' },
  utteranceTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  utteranceDot: { width: 7, height: 7, borderRadius: 4 },
  utteranceTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  utteranceSpoken: { paddingHorizontal: 18, paddingBottom: 14, fontSize: 22, fontWeight: '700', color: C.ink, letterSpacing: -0.3, lineHeight: 30 },
  utteranceDivider: { height: 1, backgroundColor: C.lineSoft, marginHorizontal: 18 },
  utteranceTxTag: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.inkMute },
  utteranceTranslated: { paddingHorizontal: 18, paddingBottom: 14, fontSize: 18, fontWeight: '500', color: C.ink2, lineHeight: 26 },
  utteranceEditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.lineSoft },
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  editBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },
  confidencePill: { backgroundColor: C.listenTint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  confidenceText: { fontSize: 12, fontWeight: '700', color: C.listen },
  editInput: { fontSize: 18, fontWeight: '600', color: C.ink, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.primaryTint, minHeight: 50, marginBottom: 8 },
  retranslateBtn: { alignSelf: 'flex-end', backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  retranslateBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  history: { paddingHorizontal: 16, paddingBottom: 8 },
  historyTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: C.inkMute, marginBottom: 8 },
  historyBubble: { padding: 12, borderRadius: 16, marginBottom: 6 },
  historyWarm: { backgroundColor: C.warmTint },
  historyCool: { backgroundColor: C.primaryTint },

  dock: { padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.lineSoft, backgroundColor: C.bg, gap: 10 },
  ctaHelper: { fontSize: 13, color: C.inkMute, textAlign: 'center', fontWeight: '500' },
  cta: { borderRadius: 999, minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.1 },
});
