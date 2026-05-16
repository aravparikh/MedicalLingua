import * as ExpoSpeech from 'expo-speech';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DisclaimerBanner from '../components/DisclaimerBanner';
import TranscriptMessage from '../components/TranscriptMessage';
import { generateCallSummary } from '../services/claude';
import { shareCallSummary } from '../services/share';
import { loadCalls, updateCall } from '../services/storage';
import type { CallRecord, CallSummary } from '../types';
import { formatDuration, formatTimestamp } from '../utils/format';
import { hapticLight, hapticMedium } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  surfaceSunk: '#FAF7F1',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  inkSoft: '#555960',
  primary: '#0F5BA8',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
  alert: '#B5443A',
  alertTint: '#F4DDD8',
};

function safeList(items?: string[]) {
  return items?.length ? items : ['No se mencionó.'];
}

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [call, setCall] = useState<CallRecord | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadCalls()
      .then(calls => {
        const found = calls.find(c => c.id === id) ?? null;
        setCall(found);
        if (found && !found.summary) fetchSummary(found);
      })
      .catch(e => setError(String(e)));
  }, [id]);

  async function fetchSummary(record: CallRecord) {
    setIsSummarizing(true);
    try {
      const summary = await generateCallSummary(record.transcript);
      const updated = { ...record, summary };
      setCall(updated);
      await updateCall(updated);
    } catch {
      setError('No pudimos crear el resumen. Revise internet o la llave de API.');
    } finally {
      setIsSummarizing(false);
    }
  }

  async function handleShare() {
    if (!call?.summary) return;
    hapticMedium();
    setIsSharing(true);
    try {
      await shareCallSummary(call);
    } catch (err: any) {
      Alert.alert('No se pudo enviar', err.message || String(err));
    } finally {
      setIsSharing(false);
    }
  }

  function speakSummary() {
    if (!call?.summary) return;
    hapticLight();
    const s = call.summary;
    const text = [
      s.rawText,
      s.simpleExplanation,
      `Medicinas: ${s.medications.map(m => `${m.name}, ${m.dose}`).join('. ') || 'No se mencionaron.'}`,
      `Qué hacer en casa: ${safeList(s.homeInstructions?.length ? s.homeInstructions : s.followUpInstructions).join('. ')}`,
    ].filter(Boolean).join('. ');
    ExpoSpeech.stop();
    ExpoSpeech.speak(text, { language: 'es-MX', rate: 0.86 });
  }

  if (!call) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator style={{ marginTop: 40 }} color={C.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <DisclaimerBanner />

      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            router.replace('/home');
          }}
          style={s.backBtn}
        >
          <Text style={s.backText}>Inicio</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Resumen</Text>
        <View style={{ width: 76 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.metaCard}>
          <Text style={s.metaTitle}>Su visita médica</Text>
          <Text style={s.metaDate}>{formatTimestamp(call.startedAt)}</Text>
          {call.endedAt && <Text style={s.metaLine}>Duración: {formatDuration(call.startedAt, call.endedAt)}</Text>}
          <Text style={s.metaLine}>{call.transcript.length} partes traducidas</Text>
        </View>

        {isSummarizing && (
          <View style={s.loadingCard}>
            <ActivityIndicator color={C.primary} />
            <Text style={s.loadingText}>Creando resumen en palabras sencillas...</Text>
          </View>
        )}

        {error && (
          <View style={s.errorCard}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {call.summary && (
          <>
            <View style={s.actionsRow}>
              <TouchableOpacity style={s.listenBtn} onPress={speakSummary} activeOpacity={0.85}>
                <Text style={s.listenText}>🔊 Escuchar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85} disabled={isSharing}>
                <Text style={s.shareText}>{isSharing ? 'Preparando...' : 'Enviar a familia'}</Text>
              </TouchableOpacity>
            </View>

            <SummaryCards summary={call.summary} />
          </>
        )}

        <Text style={s.transcriptTitle}>Conversación completa</Text>
        {call.transcript.map(entry => (
          <TranscriptMessage key={entry.id} entry={entry} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCards({ summary }: { summary: CallSummary }) {
  const instructions = summary.homeInstructions?.length ? summary.homeInstructions : summary.followUpInstructions;

  return (
    <View style={s.stack}>
      <InfoCard emoji="🩺" title="En pocas palabras" tint={C.primaryTint}>
        <Text style={s.bigText}>{summary.rawText || summary.simpleExplanation || 'No se mencionó.'}</Text>
        {summary.simpleExplanation ? <Text style={s.explainText}>{summary.simpleExplanation}</Text> : null}
      </InfoCard>

      <InfoCard emoji="💊" title="Medicinas" tint={C.warmTint}>
        {summary.medications.length ? (
          summary.medications.map((med, index) => (
            <View key={`${med.name}-${index}`} style={s.medRow}>
              <Text style={s.medName}>{med.name}</Text>
              <Text style={s.medDose}>{med.dose}</Text>
            </View>
          ))
        ) : (
          <Text style={s.bigText}>No se mencionaron medicinas.</Text>
        )}
      </InfoCard>

      <InfoCard emoji="📅" title="Próxima visita" tint={C.primaryTint}>
        <Text style={s.bigText}>{summary.nextVisit || summary.appointmentTime || 'No se mencionó una próxima visita.'}</Text>
      </InfoCard>

      <InfoCard emoji="✅" title="Qué hacer en casa" tint={C.listenTint}>
        {safeList(instructions).map((item, index) => (
          <Text key={index} style={s.bullet}>• {item}</Text>
        ))}
      </InfoCard>

      <InfoCard emoji="⚠️" title="Cuándo llamar al doctor" tint={C.alertTint}>
        {safeList(summary.whenToCallDoctor).map((item, index) => (
          <Text key={index} style={s.bullet}>• {item}</Text>
        ))}
      </InfoCard>
    </View>
  );
}

function InfoCard({ emoji, title, tint, children }: { emoji: string; title: string; tint: string; children: React.ReactNode }) {
  return (
    <View style={s.infoCard}>
      <View style={[s.infoIcon, { backgroundColor: tint }]}>
        <Text style={s.infoEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, minHeight: 62 },
  backBtn: { minWidth: 76, minHeight: 60, justifyContent: 'center' },
  backText: { fontSize: 18, color: C.primary, fontWeight: '900' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.ink },
  content: { padding: 16, paddingBottom: 40 },
  metaCard: { backgroundColor: C.surface, borderRadius: 24, borderWidth: 1, borderColor: C.line, padding: 18, marginBottom: 14 },
  metaTitle: { fontSize: 24, fontWeight: '900', color: C.ink, marginBottom: 6 },
  metaDate: { fontSize: 18, fontWeight: '800', color: C.inkSoft, marginBottom: 4 },
  metaLine: { fontSize: 16, fontWeight: '700', color: C.inkSoft, marginTop: 2 },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surfaceSunk, borderRadius: 20, padding: 16, marginBottom: 14 },
  loadingText: { flex: 1, fontSize: 17, lineHeight: 23, color: C.inkSoft, fontWeight: '800' },
  errorCard: { backgroundColor: C.alertTint, borderRadius: 18, padding: 14, marginBottom: 14 },
  errorText: { fontSize: 16, color: C.alert, lineHeight: 22, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  listenBtn: { flex: 1, minHeight: 60, borderRadius: 18, backgroundColor: C.warmTint, alignItems: 'center', justifyContent: 'center' },
  listenText: { fontSize: 18, fontWeight: '900', color: C.warm },
  shareBtn: { flex: 1.2, minHeight: 60, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  shareText: { fontSize: 17, fontWeight: '900', color: '#fff', textAlign: 'center' },
  stack: { gap: 12 },
  infoCard: { flexDirection: 'row', gap: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 24, padding: 18 },
  infoIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoEmoji: { fontSize: 28 },
  infoTitle: { fontSize: 21, fontWeight: '900', color: C.ink, marginBottom: 8 },
  bigText: { fontSize: 19, lineHeight: 28, color: C.ink, fontWeight: '700' },
  explainText: { fontSize: 17, lineHeight: 25, color: C.inkSoft, fontWeight: '700', marginTop: 10 },
  medRow: { backgroundColor: C.surfaceSunk, borderRadius: 16, padding: 12, marginBottom: 8 },
  medName: { fontSize: 20, fontWeight: '900', color: C.ink },
  medDose: { fontSize: 18, lineHeight: 25, fontWeight: '800', color: C.warm, marginTop: 2 },
  bullet: { fontSize: 18, lineHeight: 27, color: C.ink, fontWeight: '700', marginBottom: 6 },
  transcriptTitle: { fontSize: 20, fontWeight: '900', color: C.ink, marginTop: 24, marginBottom: 8 },
});
