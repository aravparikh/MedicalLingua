import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateCallSummary } from '../services/claude';
import { loadCalls } from '../services/storage';
import type { CallRecord, CallSummary } from '../types';
import { formatDuration, formatTimestamp } from '../utils/format';
import { hapticLight } from '../utils/haptics';

const C = {
  bg: '#0E1116',
  surface: '#171B22',
  surfaceSunk: '#11141A',
  line: '#2A2F38',
  ink: '#F5F2EC',
  inkSoft: '#B8BCC6',
  inkMute: '#8A8E96',
  primary: '#7BAEE3',
  primaryStrong: '#A8C9EE',
  primaryTint: '#1E3552',
  warm: '#E9AC7E',
  warmTint: '#3A2A1E',
  alert: '#E08B7F',
  alertTint: '#3A1F1B',
  listen: '#7FCBA5',
  listenTint: '#1F3A2A',
};

export default function DoctorView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [call, setCall] = useState<CallRecord | null>(null);
  const [englishSummary, setEnglishSummary] = useState<CallSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const calls = await loadCalls();
        const found = calls.find(c => c.id === id) ?? null;
        if (cancelled) return;
        setCall(found);
        if (!found) {
          setLoading(false);
          return;
        }
        // If stored summary is already English, use it; otherwise generate English version
        if (found.summary && found.summary.lang === 'en') {
          setEnglishSummary(found.summary);
        } else {
          const enSummary = await generateCallSummary(found.transcript, 'en');
          if (!cancelled) setEnglishSummary(enSummary);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Deep link the doctor can scan with their phone to mirror this view
  const deepLink = id ? `medlingua://visit/${id}` : 'medlingua://visit';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&color=0F5BA8&bgcolor=FFFFFF&data=${encodeURIComponent(deepLink)}`;

  if (!call || loading) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={s.center}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={s.loadingText}>Preparing for the doctor…</Text>
        </SafeAreaView>
      </View>
    );
  }

  const summary = englishSummary;

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.exitBtn}
            onPress={() => { hapticLight(); router.back(); }}
            activeOpacity={0.7}
          >
            <Text style={s.exitText}>← Back to patient view</Text>
          </TouchableOpacity>
          <View style={s.modeChip}>
            <Text style={s.modeChipText}>👨‍⚕️ DOCTOR MODE</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.kicker}>FOR THE PROVIDER</Text>
          <Text style={s.title}>Patient visit summary</Text>
          <Text style={s.metaLine}>
            {formatTimestamp(call.startedAt, 'en')}
            {call.endedAt ? `  ·  ${formatDuration(call.startedAt, call.endedAt, 'en')}` : ''}
          </Text>

          {summary?.urgentWarnings && summary.urgentWarnings.length > 0 && (
            <View style={s.alertCard}>
              <Text style={s.alertHeader}>🚨 Patient was told to watch for</Text>
              {summary.urgentWarnings.map((w, i) => (
                <View key={i} style={s.alertRow}>
                  <Text style={s.alertBullet}>•</Text>
                  <Text style={s.alertText}>
                    <Text style={s.alertTextBold}>{w.title}</Text>
                    {'  →  '}{w.action}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Section title="In short">
            <Text style={s.sectionBody}>
              {summary?.simpleExplanation || summary?.rawText || 'No summary available.'}
            </Text>
            {summary?.simpleExplanation && summary?.rawText ? (
              <Text style={s.sectionExtra}>{summary.rawText}</Text>
            ) : null}
          </Section>

          <Section title="Medications">
            {summary?.medications && summary.medications.length > 0 ? (
              summary.medications.map((m, i) => (
                <View key={i} style={s.medRow}>
                  <Text style={s.medName}>{m.name}</Text>
                  <Text style={s.medDose}>{m.dose}</Text>
                </View>
              ))
            ) : (
              <Text style={s.emptyText}>None mentioned</Text>
            )}
          </Section>

          <Section title="Next visit">
            <Text style={s.sectionBody}>
              {summary?.nextVisit || summary?.appointmentTime || 'No follow-up mentioned'}
            </Text>
          </Section>

          <Section title="Home instructions">
            {(summary?.homeInstructions?.length ? summary.homeInstructions : summary?.followUpInstructions ?? []).map((inst, i) => (
              <Text key={i} style={s.bullet}>•  {inst}</Text>
            ))}
            {((summary?.homeInstructions?.length ?? 0) + (summary?.followUpInstructions?.length ?? 0)) === 0 && (
              <Text style={s.emptyText}>None mentioned</Text>
            )}
          </Section>

          <Section title="When to call the doctor">
            {(summary?.whenToCallDoctor ?? []).map((w, i) => (
              <Text key={i} style={s.bullet}>•  {w}</Text>
            ))}
            {(summary?.whenToCallDoctor?.length ?? 0) === 0 && (
              <Text style={s.emptyText}>None mentioned</Text>
            )}
          </Section>

          <View style={s.qrCard}>
            <Text style={s.qrKicker}>SCAN TO COPY TO YOUR PHONE</Text>
            <View style={s.qrFrame}>
              <Image source={{ uri: qrUrl }} style={s.qrImg} />
            </View>
            <Text style={s.qrCaption}>
              MedLingua link · Opens this summary on your device
            </Text>
          </View>

          <Text style={s.footer}>
            Generated by MedLingua · AI medical interpreter for LEP patients{'\n'}
            Always verify medication names and doses against your records.
          </Text>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15, color: C.inkSoft, fontWeight: '600' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 10,
  },
  exitBtn: { paddingVertical: 8, paddingHorizontal: 6 },
  exitText: { fontSize: 14, color: C.primaryStrong, fontWeight: '700' },
  modeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: C.primaryTint, borderWidth: 1, borderColor: '#3A5A86',
  },
  modeChipText: { fontSize: 11, fontWeight: '900', color: C.primaryStrong, letterSpacing: 0.8 },

  content: { paddingHorizontal: 22, paddingBottom: 40 },
  kicker: {
    fontSize: 12, fontWeight: '900', color: C.warm,
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8, marginBottom: 6,
  },
  title: { fontSize: 32, fontWeight: '900', color: C.ink, letterSpacing: -0.6, lineHeight: 36 },
  metaLine: { fontSize: 14, color: C.inkMute, fontWeight: '600', marginTop: 6, marginBottom: 22 },

  alertCard: {
    backgroundColor: C.alertTint,
    borderRadius: 18,
    borderLeftWidth: 4, borderLeftColor: C.alert,
    padding: 16,
    marginBottom: 18,
  },
  alertHeader: { fontSize: 15, fontWeight: '900', color: C.alert, marginBottom: 8 },
  alertRow: { flexDirection: 'row', gap: 8, marginVertical: 2 },
  alertBullet: { color: C.alert, fontWeight: '900', fontSize: 16 },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20, color: C.ink, fontWeight: '600' },
  alertTextBold: { fontWeight: '900', color: C.ink },

  section: {
    paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.line,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '900', color: C.inkMute,
    letterSpacing: 1.0, textTransform: 'uppercase', marginBottom: 8,
  },
  sectionBody: { fontSize: 17, lineHeight: 25, color: C.ink, fontWeight: '600' },
  sectionExtra: { fontSize: 14, lineHeight: 21, color: C.inkSoft, marginTop: 8, fontWeight: '500' },

  medRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surfaceSunk,
    borderRadius: 12, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: C.line,
  },
  medName: { fontSize: 16, fontWeight: '900', color: C.ink, fontVariant: ['tabular-nums'] },
  medDose: { fontSize: 14, fontWeight: '700', color: C.warm },

  bullet: { fontSize: 15, lineHeight: 22, color: C.ink, fontWeight: '600', marginVertical: 2 },
  emptyText: { fontSize: 14, color: C.inkMute, fontStyle: 'italic', fontWeight: '500' },

  qrCard: {
    marginTop: 22,
    backgroundColor: C.surface,
    borderRadius: 22,
    borderWidth: 1, borderColor: C.line,
    padding: 20, alignItems: 'center', gap: 10,
  },
  qrKicker: { fontSize: 11, fontWeight: '900', color: C.inkMute, letterSpacing: 1.0, textTransform: 'uppercase' },
  qrFrame: {
    width: 220, height: 220, borderRadius: 18,
    backgroundColor: '#FFFFFF', padding: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  qrImg: { width: 200, height: 200 },
  qrCaption: { fontSize: 12, color: C.inkMute, textAlign: 'center', fontWeight: '600' },

  footer: {
    fontSize: 11, color: C.inkMute, textAlign: 'center',
    marginTop: 22, lineHeight: 16, fontWeight: '500',
  },
});
