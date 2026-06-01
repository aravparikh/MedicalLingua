import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from '../components/BottomNav';
import BrandLoader from '../components/BrandLoader';
import LanguagePill from '../components/LanguagePill';
import { useLanguage } from '../hooks/useLanguage';
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
  inkSoft: '#4A4E54',
  inkMute: '#666A73',
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

type Lang = 'es' | 'en';

const L = {
  es: {
    appbarSub: (n: number) => `De ${n} visita${n !== 1 ? 's' : ''}`,
    appbarTitle: 'Mi salud',
    statsVisits: 'Visitas',
    statsMeds: 'Medicinas',
    statsAppts: 'Citas',
    sectionMeds: '💊 Medicinas activas',
    sectionAppts: '📅 Citas próximas',
    sectionInstructions: '✅ Instrucciones para casa',
    noMeds: 'Todavía no hay medicinas. Aparecerán aquí después de su primera visita con resumen.',
    noAppts: 'Todavía no hay citas. Aparecerán aquí si su doctor menciona una próxima visita.',
    noInstructions: 'Todavía no hay instrucciones. Las notas del doctor aparecerán aquí después de cada visita.',
    visitBtn: 'Visita ›',
    mentionedAt: 'Mencionada en la visita · ',
    seeVisit: 'Ver visita ›',
    noVisitsTitle: 'Todavía no hay visitas',
    noVisitsSub: 'Inicie una visita con su doctor. Después, MedLingua guardará sus medicinas, citas e instrucciones aquí.',
    noVisitsCta: 'Iniciar visita →',
  },
  en: {
    appbarSub: (n: number) => `From ${n} visit${n !== 1 ? 's' : ''}`,
    appbarTitle: 'My Health',
    statsVisits: 'Visits',
    statsMeds: 'Medications',
    statsAppts: 'Appointments',
    sectionMeds: '💊 Active Medications',
    sectionAppts: '📅 Upcoming Appointments',
    sectionInstructions: '✅ Home Instructions',
    noMeds: 'No medications yet. They will appear here after your first visit with a summary.',
    noAppts: 'No appointments yet. They will appear here if your doctor mentions a follow-up visit.',
    noInstructions: 'No instructions yet. Doctor\'s notes will appear here after each visit.',
    visitBtn: 'Visit ›',
    mentionedAt: 'Mentioned in visit · ',
    seeVisit: 'See visit ›',
    noVisitsTitle: 'No visits yet',
    noVisitsSub: 'Start a visit with your doctor. MedLingua will save your medications, appointments, and instructions here.',
    noVisitsCta: 'Start a visit →',
  },
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
  const { lang, toggle } = useLanguage();
  const t = L[lang];

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
          <BrandLoader size="lg" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        <View style={styles.appbar}>
          <View style={{ width: 44 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.appbarSub}>{t.appbarSub(visitCount)}</Text>
            <Text style={styles.appbarTitle}>{t.appbarTitle}</Text>
          </View>
          <LanguagePill lang={lang} onToggle={toggle} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.statsRow}>
            {[
              { label: t.statsVisits, value: visitCount, color: C.primary },
              { label: t.statsMeds, value: meds.length, color: C.warm },
              { label: t.statsAppts, value: appts.length, color: C.listen },
            ].map(({ label, value, color }) => (
              <View key={label} style={[styles.statCard]}>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Section title={t.sectionMeds}>
            {meds.length === 0 ? (
              <EmptyCard emoji="💊" message={t.noMeds} />
            ) : (
              <View style={styles.medsList}>
                {meds.map((m, i) => (
                  <View key={i} style={styles.medRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{m.name}</Text>
                      <Text style={styles.medDose}>{m.dose}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/summary', params: { id: m.visitId } })}
                      style={styles.medVisitBtn}
                    >
                      <Text style={styles.medVisitBtnText}>{t.visitBtn}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section title={t.sectionAppts}>
            {appts.length === 0 ? (
              <EmptyCard emoji="📅" message={t.noAppts} />
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
                      <Text style={styles.apptFrom}>{t.mentionedAt}{formatTimestamp(a.fromDate, lang)}</Text>
                    </View>
                    <Text style={{ color: C.inkMute, fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Section>

          <Section title={t.sectionInstructions}>
            {insights.length === 0 ? (
              <EmptyCard emoji="✅" message={t.noInstructions} />
            ) : (
              insights.map((ins, gi) => (
                <View key={gi} style={[styles.card, gi > 0 && { marginTop: 16 }]}>
                  <TouchableOpacity
                    style={styles.insightHeader}
                    onPress={() => router.push({ pathname: '/summary', params: { id: ins.visitId } })}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.insightDate}>{formatTimestamp(ins.date, lang)}</Text>
                    <Text style={{ color: C.primary, fontSize: 16, fontWeight: '900' }}>{t.seeVisit}</Text>
                  </TouchableOpacity>
                  {ins.rawText ? (
                    <Text style={styles.insightOverview}>{ins.rawText}</Text>
                  ) : null}
                  {ins.instructions.map((instr, ii) => (
                    <View key={ii} style={[styles.instrRow, { padding: 16 }]}>
                      <View style={styles.instrNum}>
                        <Text style={styles.instrNumText}>{ii + 1}</Text>
                      </View>
                      <Text style={styles.instrText}>{instr}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </Section>

          {visitCount === 0 && (
            <View style={styles.noVisitasCard}>
              <Text style={{ fontSize: 44 }}>🩺</Text>
              <Text style={styles.noVisitasTitle}>{t.noVisitsTitle}</Text>
              <Text style={styles.noVisitasSub}>{t.noVisitsSub}</Text>
              <TouchableOpacity style={styles.noVisitasCta} onPress={() => router.push('/dial')}>
                <Text style={styles.noVisitasCtaText}>{t.noVisitsCta}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <BottomNav active="history" lang={lang} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 52 },
  appbarTitle: { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  appbarSub: { fontSize: 16, color: C.inkSoft, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 110 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: C.surface,
    borderRadius: 18, borderWidth: 1, borderColor: C.line,
    padding: 16, gap: 4,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  statValue: { fontSize: 32, fontWeight: '900', color: C.primary, letterSpacing: -1 },
  statLabel: { fontSize: 14, fontWeight: '800', color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 16, fontWeight: '900', color: C.inkMute,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4,
  },

  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 22, overflow: 'hidden', shadowColor: '#1E2850', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },

  emptyCard: {
    backgroundColor: C.surfaceSunk, borderRadius: 16,
    borderWidth: 1, borderColor: C.line, borderStyle: 'dashed',
    padding: 24, alignItems: 'center', justifyContent: 'center',
  },
  emptyCardText: { fontSize: 16, color: C.inkSoft, fontWeight: '600' },

  medsList: { gap: 10, marginBottom: 28 },
  medRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.line,
    padding: 16,
  },
  medName: { fontSize: 18, fontWeight: '900', color: C.ink },
  medDose: { fontSize: 16, color: C.warm, fontWeight: '700', marginTop: 2 },
  medVisitBtn: {
    backgroundColor: C.primaryTint, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, justifyContent: 'center',
  },
  medVisitBtnText: { fontSize: 16, fontWeight: '800', color: C.primaryStrong },

  apptRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  apptRowBorder: { borderTopWidth: 1, borderTopColor: C.lineSoft },
  apptDotWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  apptDot: { width: 10, height: 10, borderRadius: 5 },
  apptTime: { fontSize: 18, fontWeight: '700', color: C.ink },
  apptFrom: { fontSize: 14, color: C.inkSoft, marginTop: 2 },

  insightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  insightDate: { fontSize: 16, fontWeight: '800', color: C.ink },
  insightOverview: { fontSize: 16, color: C.inkSoft, lineHeight: 24, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.lineSoft },
  instrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  instrNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.line,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  instrNumText: { fontSize: 14, fontWeight: '900', color: C.inkSoft },
  instrText: { flex: 1, fontSize: 16, lineHeight: 24, color: C.ink, fontWeight: '600' },

  noVisitasCard: {
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.line,
    padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12,
    marginTop: 40,
  },
  noVisitasTitle: { fontSize: 20, fontWeight: '900', color: C.ink },
  noVisitasSub: { fontSize: 16, color: C.inkSoft, textAlign: 'center', lineHeight: 22, fontWeight: '600' },
  noVisitasCta: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 14, minHeight: 56,
    backgroundColor: C.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center'
  },
  noVisitasCtaText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
