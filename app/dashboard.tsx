import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { loadCalls } from '../services/storage';
import type { CallRecord, Medication } from '../types';
import { formatTimestamp } from '../utils/format';

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
  alert: '#B5443A',
  alertTint: '#F4DDD8',
};

interface MedEntry extends Medication {
  fromDate: number;
  visitId: string;
}

interface ApptEntry {
  time: string;
  fromDate: number;
  visitId: string;
  rawText: string;
}

interface Insight {
  visitId: string;
  date: number;
  instructions: string[];
  keyNumbers: string[];
  rawText: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function EmptyCard({ emoji, message }: { emoji: string; message: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</Text>
      <Text style={styles.emptyCardText}>{message}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState<MedEntry[]>([]);
  const [appts, setAppts] = useState<ApptEntry[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [visitCount, setVisitCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCalls()
        .then((calls: CallRecord[]) => {
          setVisitCount(calls.length);

          // Aggregate medications — dedupe by name (keep most recent)
          const medMap = new Map<string, MedEntry>();
          calls.forEach(c => {
            if (!c.summary?.medications) return;
            c.summary.medications.forEach(m => {
              const key = m.name.toLowerCase();
              if (!medMap.has(key) || c.startedAt > medMap.get(key)!.fromDate) {
                medMap.set(key, { ...m, fromDate: c.startedAt, visitId: c.id });
              }
            });
          });
          setMeds(Array.from(medMap.values()).sort((a, b) => b.fromDate - a.fromDate));

          // Appointments
          const apptList: ApptEntry[] = [];
          calls.forEach(c => {
            if (c.summary?.appointmentTime) {
              apptList.push({
                time: c.summary.appointmentTime,
                fromDate: c.startedAt,
                visitId: c.id,
                rawText: c.summary.rawText ?? '',
              });
            }
          });
          setAppts(apptList.sort((a, b) => b.fromDate - a.fromDate));

          // Insights — follow-up instructions from each visit
          const insightList: Insight[] = calls
            .filter(c => c.summary && (c.summary.followUpInstructions.length > 0 || c.summary.keyNumbers.length > 0))
            .map(c => ({
              visitId: c.id,
              date: c.startedAt,
              instructions: c.summary!.followUpInstructions,
              keyNumbers: c.summary!.keyNumbers,
              rawText: c.summary!.rawText ?? '',
            }))
            .sort((a, b) => b.date - a.date);
          setInsights(insightList);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.primary} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* App bar */}
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.appbarBtn} onPress={() => router.back()}>
            <Text style={{ fontSize: 18, color: C.ink2 }}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.appbarSub}>From {visitCount} visit{visitCount !== 1 ? 's' : ''}</Text>
            <Text style={styles.appbarTitle}>My Health Dashboard</Text>
          </View>
          <View style={styles.appbarBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Visits', value: visitCount, color: C.primary, tint: C.primaryTint },
              { label: 'Medications', value: meds.length, color: C.warm, tint: C.warmTint },
              { label: 'Appointments', value: appts.length, color: C.listen, tint: C.listenTint },
            ].map(({ label, value, color, tint }) => (
              <View key={label} style={[styles.statTile, { backgroundColor: tint, borderColor: color + '33' }]}>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Medications */}
          <Section title="💊 Active Medications">
            {meds.length === 0 ? (
              <EmptyCard emoji="💊" message="No medications found yet. They'll appear here after your first summarized visit." />
            ) : (
              <View style={styles.card}>
                {meds.map((m, i) => (
                  <View key={i} style={[styles.medRow, i > 0 && styles.medRowBorder]}>
                    <View style={styles.medIconWrap}>
                      <Text style={{ fontSize: 18 }}>💊</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{m.name}</Text>
                      <Text style={styles.medDose}>{m.dose}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/summary', params: { id: m.visitId } })}
                      style={styles.medVisitBtn}
                    >
                      <Text style={styles.medVisitBtnText}>Visit ›</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Section>

          {/* Appointments */}
          <Section title="📅 Upcoming Appointments">
            {appts.length === 0 ? (
              <EmptyCard emoji="📅" message="No appointments scheduled yet. They'll show up after a visit where your doctor mentions a follow-up time." />
            ) : (
              <View style={styles.card}>
                {appts.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.apptRow, i > 0 && styles.apptRowBorder]}
                    onPress={() => router.push({ pathname: '/summary', params: { id: a.visitId } })}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.apptDotWrap, { backgroundColor: C.primaryTint }]}>
                      <View style={[styles.apptDot, { backgroundColor: C.primary }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.apptTime}>{a.time}</Text>
                      <Text style={styles.apptFrom}>Scheduled during visit · {formatTimestamp(a.fromDate)}</Text>
                    </View>
                    <Text style={{ color: C.inkFaint, fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Section>

          {/* Follow-up instructions */}
          <Section title="✅ Follow-Up Instructions">
            {insights.length === 0 ? (
              <EmptyCard emoji="✅" message="No instructions yet. Your doctor's follow-up notes will appear here after each visit." />
            ) : (
              insights.map((ins, gi) => (
                <View key={gi} style={[styles.card, gi > 0 && { marginTop: 8 }]}>
                  <TouchableOpacity
                    style={styles.insightHeader}
                    onPress={() => router.push({ pathname: '/summary', params: { id: ins.visitId } })}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.insightDate}>{formatTimestamp(ins.date)}</Text>
                    <Text style={{ color: C.primary, fontSize: 12, fontWeight: '700' }}>View visit ›</Text>
                  </TouchableOpacity>
                  {ins.rawText ? (
                    <Text style={styles.insightOverview}>{ins.rawText}</Text>
                  ) : null}
                  {ins.instructions.map((instr, ii) => (
                    <View key={ii} style={styles.instrRow}>
                      <View style={styles.instrNum}>
                        <Text style={styles.instrNumText}>{ii + 1}</Text>
                      </View>
                      <Text style={styles.instrText}>{instr}</Text>
                    </View>
                  ))}
                  {ins.keyNumbers.map((num, ni) => (
                    <View key={ni} style={styles.keyNumRow}>
                      <Text style={styles.keyNumIcon}>📞</Text>
                      <Text style={styles.keyNumText}>{num}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </Section>

          {visitCount === 0 && (
            <View style={styles.noVisitsCard}>
              <Text style={styles.noVisitsEmoji}>🩺</Text>
              <Text style={styles.noVisitsTitle}>No visits yet</Text>
              <Text style={styles.noVisitsSub}>
                Start a consultation with your doctor. After the call, MedLingua will automatically extract your medications, appointments, and instructions here.
              </Text>
              <TouchableOpacity style={styles.noVisitsCta} onPress={() => router.push('/dial')}>
                <Text style={styles.noVisitsCtaText}>Start a consultation →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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

  content: { paddingHorizontal: 16, paddingTop: 12 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  statTile: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: C.inkMute },

  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: C.inkMute, marginBottom: 10 },

  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 22, overflow: 'hidden', shadowColor: '#1E2850', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },

  emptyCard: { backgroundColor: C.surfaceSunk, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 24, alignItems: 'center' },
  emptyCardText: { fontSize: 14, color: C.inkMute, textAlign: 'center', lineHeight: 20 },

  medRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  medRowBorder: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  medIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.warmTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  medName: { fontSize: 16, fontWeight: '600', color: C.ink, letterSpacing: -0.1 },
  medDose: { fontSize: 13, color: C.inkMute, marginTop: 2 },
  medVisitBtn: { backgroundColor: C.primaryTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  medVisitBtnText: { fontSize: 12, fontWeight: '700', color: C.primaryStrong },

  apptRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  apptRowBorder: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  apptDotWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  apptDot: { width: 10, height: 10, borderRadius: 5 },
  apptTime: { fontSize: 16, fontWeight: '600', color: C.ink, letterSpacing: -0.1 },
  apptFrom: { fontSize: 12, color: C.inkMute, marginTop: 2 },

  insightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  insightDate: { fontSize: 13, fontWeight: '700', color: C.ink },
  insightOverview: { fontSize: 14, color: C.inkSoft, lineHeight: 20, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  instrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  instrNum: { width: 24, height: 24, borderRadius: 8, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  instrNumText: { fontSize: 11, fontWeight: '800', color: C.primaryStrong },
  instrText: { flex: 1, fontSize: 15, color: C.ink2, lineHeight: 22 },
  keyNumRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  keyNumIcon: { fontSize: 16 },
  keyNumText: { fontSize: 15, color: C.primary, fontWeight: '600' },

  noVisitsCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 22, padding: 28, alignItems: 'center', marginTop: 20, gap: 10 },
  noVisitsEmoji: { fontSize: 44 },
  noVisitsTitle: { fontSize: 20, fontWeight: '700', color: C.ink },
  noVisitsSub: { fontSize: 14, color: C.inkSoft, textAlign: 'center', lineHeight: 20 },
  noVisitsCta: { marginTop: 8, backgroundColor: C.primary, borderRadius: 99, paddingHorizontal: 24, paddingVertical: 14 },
  noVisitsCtaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
