import * as ExpoSpeech from 'expo-speech';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import AskAI from '../components/AskAI';
import BrandLoader from '../components/BrandLoader';
import DisclaimerBanner from '../components/DisclaimerBanner';
import DrugInteractions from '../components/DrugInteractions';
import LanguagePill from '../components/LanguagePill';
import TranscriptMessage from '../components/TranscriptMessage';
import UrgentWarnings from '../components/UrgentWarnings';
import { useLanguage } from '../hooks/useLanguage';
import { checkDrugInteractions, generateCallSummary } from '../services/claude';
import { shareCallSummary } from '../services/share';
import { deleteCall, loadCalls, updateCall } from '../services/storage';
import { getTTSRate, type AppLanguage } from '../services/preferences';
import type { CallRecord, CallSummary, DrugInteraction } from '../types';
import { formatDuration, formatTimestamp } from '../utils/format';
import { hapticLight, hapticMedium, hapticWarning } from '../utils/haptics';

const L = {
  es: {
    home: 'Inicio',
    headerTitle: 'Resumen',
    visitTitle: 'Su visita médica',
    duration: 'Duración',
    partsTranslated: 'partes traducidas',
    creatingSummary: 'Creando resumen en palabras sencillas...',
    summaryError: 'No pudimos crear el resumen. Revise su internet y vuelva a intentar.',
    listen: '🔊 Escuchar',
    stopListening: '⏹ Detener',
    share: 'Enviar a familia',
    showDoctor: '👨‍⚕️ Mostrar al doctor',
    preparing: 'Preparando...',
    sendError: 'No se pudo enviar',
    inShort: 'En pocas palabras',
    nothing: 'No se mencionó.',
    meds: 'Medicinas',
    noMeds: 'No se mencionaron medicinas.',
    nextVisit: 'Próxima visita',
    noNextVisit: 'No se mencionó una próxima visita.',
    doAtHome: 'Qué hacer en casa',
    whenToCall: 'Cuándo llamar al doctor',
    fullTranscript: 'Conversación completa',
    medsLabel: 'Medicinas',
    homeLabel: 'Qué hacer en casa',
    delete: 'Eliminar',
    deleteTitle: '¿Eliminar esta visita?',
    deleteBody: 'Se borrará esta visita y su resumen para siempre. No se puede deshacer.',
    deleteCancel: 'Cancelar',
    deleteConfirm: 'Eliminar',
  },
  en: {
    home: 'Home',
    headerTitle: 'Summary',
    visitTitle: 'Your doctor visit',
    duration: 'Duration',
    partsTranslated: 'parts translated',
    creatingSummary: 'Creating a plain-language summary...',
    summaryError: 'We could not create the summary. Check your internet and try again.',
    listen: '🔊 Listen',
    stopListening: '⏹ Stop',
    share: 'Send to family',
    showDoctor: '👨‍⚕️ Show to doctor',
    preparing: 'Preparing...',
    sendError: 'Could not send',
    inShort: 'In short',
    nothing: 'Not mentioned.',
    meds: 'Medications',
    noMeds: 'No medications mentioned.',
    nextVisit: 'Next visit',
    noNextVisit: 'No follow-up visit mentioned.',
    doAtHome: 'What to do at home',
    whenToCall: 'When to call the doctor',
    fullTranscript: 'Full conversation',
    medsLabel: 'Medications',
    homeLabel: 'What to do at home',
    delete: 'Delete',
    deleteTitle: 'Delete this visit?',
    deleteBody: 'This visit and its summary will be erased permanently. This cannot be undone.',
    deleteCancel: 'Cancel',
    deleteConfirm: 'Delete',
  },
};

import { Theme as C, Shadows } from '../constants/theme';
function safeList(items: string[] | undefined, fallback: string) {
  return items?.length ? items : [fallback];
}

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lang, toggle } = useLanguage();
  const t = L[lang];

  const [call, setCall] = useState<CallRecord | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<DrugInteraction[] | null>(null);
  const [interactionsLoading, setInteractionsLoading] = useState(false);

  // Stop TTS on navigation away
  useFocusEffect(
    useCallback(() => {
      return () => {
        ExpoSpeech.stop();
        setIsSpeaking(false);
      };
    }, [])
  );

  useEffect(() => {
    if (!id) return;
    loadCalls()
      .then(calls => {
        const found = calls.find(c => c.id === id) ?? null;
        setCall(found);
        if (found && (!found.summary || (found.summary.lang && found.summary.lang !== lang))) {
          fetchSummary(found);
        }
      })
      .catch(e => setError(String(e)));
  }, [id, lang]);

  // Run drug-interaction check whenever the summary's medications change
  useEffect(() => {
    if (!call?.summary || !call.summary.medications || call.summary.medications.length === 0) {
      setInteractions([]);
      return;
    }
    // Only run if summary matches current language to avoid redundant calls
    if (call.summary.lang && call.summary.lang !== lang) return;

    let cancelled = false;
    setInteractionsLoading(true);
    setInteractions(null);
    checkDrugInteractions(call.summary.medications, lang)
      .then(result => {
        if (!cancelled) setInteractions(result);
      })
      .catch(() => {
        if (!cancelled) setInteractions([]);
      })
      .finally(() => {
        if (!cancelled) setInteractionsLoading(false);
      });

    return () => { cancelled = true; };
  }, [call?.summary?.medications, lang, call?.summary?.lang]);

  async function fetchSummary(record: CallRecord) {
    setIsSummarizing(true);
    try {
      const summary = await Promise.race([
        generateCallSummary(record.transcript, lang),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000))
      ]);
      const updated = { ...record, summary };
      setCall(updated);
      await updateCall(updated);
    } catch {
      setError(t.summaryError);
    } finally {
      setIsSummarizing(false);
    }
  }

  async function handleShare() {
    if (!call?.summary) return;
    hapticMedium();
    setIsSharing(true);
    try {
      await shareCallSummary(call, lang);
    } catch (err: any) {
      Alert.alert(t.sendError, err.message || String(err));
    } finally {
      setIsSharing(false);
    }
  }

  function handleDelete() {
    if (!call) return;
    hapticWarning();
    Alert.alert(t.deleteTitle, t.deleteBody, [
      { text: t.deleteCancel, style: 'cancel' },
      {
        text: t.deleteConfirm,
        style: 'destructive',
        onPress: async () => {
          try {
            ExpoSpeech.stop();
            await deleteCall(call.id);
            router.replace('/home');
          } catch (err: any) {
            Alert.alert(t.sendError, err.message || String(err));
          }
        },
      },
    ]);
  }

  async function speakSummary() {
    if (!call?.summary) return;
    hapticLight();
    if (isSpeaking) {
      ExpoSpeech.stop();
      setIsSpeaking(false);
      return;
    }
    const sum = call.summary;
    const text = [
      sum.rawText,
      sum.simpleExplanation,
      `${t.medsLabel}: ${sum.medications.map(m => `${m.name}, ${m.dose}`).join('. ') || t.noMeds}`,
      `${t.homeLabel}: ${safeList(sum.homeInstructions?.length ? sum.homeInstructions : sum.followUpInstructions, t.nothing).join('. ')}`,
    ].filter(Boolean).join('. ');
    setIsSpeaking(true);
    const rate = await getTTSRate();
    ExpoSpeech.speak(text, {
      language: lang === 'es' ? 'es-MX' : 'en-US',
      rate,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  if (!call) {
    return (
      <SafeAreaView style={s.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <BrandLoader size="lg" label={t.creatingSummary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <DisclaimerBanner lang={lang} />

      <View style={s.header}>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            router.replace('/home');
          }}
          style={s.backBtn}
        >
          <Text style={s.backText}>← {t.home}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.headerTitle}</Text>
        <LanguagePill lang={lang} onToggle={toggle} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.metaCard}>
          <Text style={s.metaTitle}>{t.visitTitle}</Text>
          <Text style={s.metaDate}>{formatTimestamp(call.startedAt, lang)}</Text>
          {call.endedAt && <Text style={s.metaLine}>{t.duration}: {formatDuration(call.startedAt, call.endedAt, lang)}</Text>}
          <Text style={s.metaLine}>{call.transcript.length} {t.partsTranslated}</Text>
        </View>

        {isSummarizing && (
          <View style={s.loadingCard}>
            <BrandLoader size="md" label={t.creatingSummary} />
          </View>
        )}

        {error && (
          <View style={s.errorCard}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {call.summary && !isSummarizing && (!call.summary.lang || call.summary.lang === lang) && (
          <>
            <View style={s.actionsRow}>
              <TouchableOpacity
                style={[s.listenBtn, isSpeaking && s.listenBtnActive]}
                onPress={speakSummary}
                activeOpacity={0.85}
              >
                <Text style={[s.listenText, isSpeaking && s.listenTextActive]}>
                  {isSpeaking ? t.stopListening : t.listen}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85} disabled={isSharing}>
                <Text style={s.shareText}>{isSharing ? t.preparing : t.share}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.doctorBtn}
              onPress={() => {
                hapticMedium();
                router.push({ pathname: '/doctor', params: { id: call.id } });
              }}
              activeOpacity={0.85}
            >
              <Text style={s.doctorBtnText}>{t.showDoctor}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Text style={s.deleteBtnText}>🗑  {t.delete}</Text>
            </TouchableOpacity>

            {call.summary.urgentWarnings && call.summary.urgentWarnings.length > 0 && (
              <UrgentWarnings warnings={call.summary.urgentWarnings} lang={lang} />
            )}

            {call.summary.medications && call.summary.medications.length > 0 && (
              <DrugInteractions
                loading={interactionsLoading}
                interactions={interactions}
                lang={lang}
              />
            )}

            <SummaryCards summary={call.summary} lang={lang} />

            <View style={{ marginTop: 16 }}>
              <AskAI call={call} lang={lang} />
            </View>
          </>
        )}

        <Text style={s.transcriptTitle}>{t.fullTranscript}</Text>
        {call.transcript.map(entry => (
          <TranscriptMessage key={entry.id} entry={entry} lang={lang} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCards({ summary, lang }: { summary: CallSummary; lang: AppLanguage }) {
  const t = L[lang];
  const instructions = summary.homeInstructions?.length ? summary.homeInstructions : summary.followUpInstructions;

  return (
    <View style={s.stack}>
      <InfoCard emoji="🩺" title={t.inShort} tint={C.primaryTint}>
        <Text style={s.bigText}>{summary.rawText || summary.simpleExplanation || t.nothing}</Text>
        {summary.simpleExplanation ? <Text style={s.explainText}>{summary.simpleExplanation}</Text> : null}
      </InfoCard>

      {summary.medications && summary.medications.length > 0 && (
        <InfoCard emoji="💊" title={t.meds} tint={C.warmTint}>
          {summary.medications.map((med, index) => (
            <View key={`${med.name}-${index}`} style={s.medRow}>
              <Text style={s.medName}>{med.name}</Text>
              <Text style={s.medDose}>{med.dose}</Text>
            </View>
          ))}
        </InfoCard>
      )}

      <InfoCard emoji="📅" title={t.nextVisit} tint={C.primaryTint}>
        <Text style={s.bigText}>{summary.nextVisit || summary.appointmentTime || t.noNextVisit}</Text>
      </InfoCard>

      <InfoCard emoji="✅" title={t.doAtHome} tint={C.listenTint}>
        {safeList(instructions, t.nothing).map((item, index) => (
          <Text key={index} style={s.bullet}>• {item}</Text>
        ))}
      </InfoCard>

      <InfoCard emoji="⚠️" title={t.whenToCall} tint={C.alertTint}>
        {safeList(summary.whenToCallDoctor, t.nothing).map((item, index) => (
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
  loadingCard: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceSunk, borderRadius: 20, padding: 24, marginBottom: 14, gap: 10 },
  errorCard: { backgroundColor: C.alertTint, borderRadius: 18, padding: 14, marginBottom: 14 },
  errorText: { fontSize: 16, color: C.alert, lineHeight: 22, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  listenBtn: { flex: 1, minHeight: 60, borderRadius: 18, backgroundColor: C.warmTint, alignItems: 'center', justifyContent: 'center' },
  listenBtnActive: { backgroundColor: C.warm },
  listenText: { fontSize: 18, fontWeight: '900', color: C.warm },
  listenTextActive: { color: '#FFFFFF' },
  shareBtn: { flex: 1.2, minHeight: 60, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  shareText: { fontSize: 17, fontWeight: '900', color: '#fff', textAlign: 'center' },
  doctorBtn: {
    minHeight: 60, borderRadius: 18,
    backgroundColor: '#0E1116',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#0E1116', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  doctorBtnText: { fontSize: 16, fontWeight: '900', color: '#F5F2EC', letterSpacing: 0.2 },
  deleteBtn: {
    minHeight: 48, borderRadius: 14,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#E2887C',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  deleteBtnText: { fontSize: 14, fontWeight: '800', color: '#DC2626', letterSpacing: 0.2 },
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
