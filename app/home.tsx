import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { deleteCall, loadCalls } from '../services/storage';
import type { CallRecord } from '../types';
import { formatDuration, formatTimestamp } from '../utils/format';

type Language = 'en' | 'es';

const LABELS = {
  en: {
    tag: 'AI MEDICAL INTERPRETER',
    title: 'MedLingua',
    subtitle: 'Real-time EN ↔ ES translation\nfor healthcare conversations.',
    visits: 'Consultations',
    summaries: 'AI Notes',
    accuracy: 'Accuracy',
    recent: 'Recent Consultations',
    newCall: 'New Consultation',
    emptyTitle: 'No consultations yet',
    emptySub: 'Tap below to start your first translated medical consultation.',
    ready: 'Notes Ready',
    noTranscript: 'No transcript',
  },
  es: {
    tag: 'INTÉRPRETE MÉDICO IA',
    title: 'MedLingua',
    subtitle: 'Traducción EN ↔ ES en tiempo real\npara conversaciones de salud.',
    visits: 'Consultas',
    summaries: 'Notas IA',
    accuracy: 'Precisión',
    recent: 'Consultas Recientes',
    newCall: 'Nueva Consulta',
    emptyTitle: 'Sin consultas aún',
    emptySub: 'Toque abajo para iniciar su primera consulta médica traducida.',
    ready: 'Notas Listas',
    noTranscript: 'Sin transcripción',
  },
};

// Sonar ring component — expands outward and fades like a ping
function SonarRing({ delay, color }: { delay: number; color: string }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animate = () => {
      scale.setValue(0.3);
      opacity.setValue(0.7);
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ]).start(() => animate());
    };
    const t = setTimeout(animate, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={[
        styles.sonarRing,
        { borderColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [lang, setLang] = useState<Language>('en');
  const t = LABELS[lang];

  // Deep ocean orb drifts
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;

  // Button press
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const drift = (val: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: dur, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: dur, useNativeDriver: true }),
        ])
      ).start();
    drift(orb1, 20000);
    drift(orb2, 27000);
    drift(orb3, 16000);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCalls().then(setCalls).catch(console.error);
    }, [])
  );

  function pressIn() {
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  }
  function pressOut() {
    Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }

  function handleDeleteCall(id: string) {
    Alert.alert(
      lang === 'en' ? 'Delete Session' : 'Eliminar Sesión',
      lang === 'en' ? 'Permanently delete this dive log?' : '¿Eliminar este registro?',
      [
        { text: lang === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: lang === 'en' ? 'Delete' : 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteCall(id);
            setCalls(prev => prev.filter(c => c.id !== id));
          },
        },
      ]
    );
  }

  function renderCall({ item }: { item: CallRecord }) {
    const snippet = item.transcript[0]?.originalText?.slice(0, 55) ?? t.noTranscript;
    const duration = item.endedAt ? formatDuration(item.startedAt, item.endedAt) : '—';
    const exchanges = item.transcript.length;

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/summary', params: { id: item.id } })}
        onLongPress={() => handleDeleteCall(item.id)}
        activeOpacity={0.75}
        style={styles.cardOuter}
      >
        <BlurView intensity={40} tint="dark" style={styles.card}>
          {/* Sonar accent bar */}
          <View style={styles.cardAccent} />

          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={styles.cardDate}>{formatTimestamp(item.startedAt)}</Text>
              <View style={styles.cardBadgeRow}>
                {item.summary && (
                  <View style={styles.notesBadge}>
                    <View style={styles.notesDot} />
                    <Text style={styles.notesBadgeText}>{t.ready}</Text>
                  </View>
                )}
                <Text style={styles.cardDuration}>{duration}</Text>
              </View>
            </View>

            <Text style={styles.cardSnippet} numberOfLines={1}>"{snippet}"</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.cardExchanges}>
                {exchanges} exchange{exchanges !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.cardArrow}>›</Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  }

  const summaryCount = calls.filter(c => c.summary).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Deep ocean ambient orbs ── */}
      <Animated.View style={[styles.orb1, {
        transform: [
          { translateX: orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) },
          { translateY: orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }) },
        ],
      }]} />
      <Animated.View style={[styles.orb2, {
        transform: [
          { translateX: orb2.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
          { translateY: orb3.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) },
        ],
      }]} />
      <Animated.View style={[styles.orb3, {
        transform: [
          { translateX: orb3.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
          { translateY: orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) },
        ],
      }]} />

      {/* Global frosted glass over the ocean */}
      <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safe}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <BlurView intensity={30} tint="dark" style={styles.tagPill}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>{t.tag}</Text>
          </BlurView>
          <TouchableOpacity
            onPress={() => setLang(l => l === 'en' ? 'es' : 'en')}
            activeOpacity={0.7}
          >
            <BlurView intensity={30} tint="dark" style={styles.langPill}>
              <Text style={[styles.langOpt, lang === 'en' && styles.langOptActive]}>EN</Text>
              <View style={styles.langSep} />
              <Text style={[styles.langOpt, lang === 'es' && styles.langOptActive]}>ES</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* ── Sonar hero ── */}
        <View style={styles.hero}>
          <View style={styles.sonarWrap}>
            <SonarRing delay={0}    color="rgba(0, 212, 255, 0.5)" />
            <SonarRing delay={900}  color="rgba(0, 212, 255, 0.35)" />
            <SonarRing delay={1800} color="rgba(0, 212, 255, 0.2)" />
            <BlurView intensity={50} tint="dark" style={styles.sonarCore}>
              <Text style={styles.sonarEmoji}>🩺</Text>
            </BlurView>
          </View>
          <Text style={styles.heroTitle}>{t.title}</Text>
          <Text style={styles.heroSub}>{t.subtitle}</Text>
        </View>

        {/* ── Stat tiles ── */}
        <View style={styles.statsRow}>
          {[
            { label: t.visits,    value: calls.length,    accent: false },
            { label: t.summaries, value: summaryCount,    accent: false },
            { label: t.accuracy,  value: '98%',           accent: true  },
          ].map(({ label, value, accent }) => (
            <BlurView key={label} intensity={35} tint="dark"
              style={[styles.statTile, accent && styles.statTileAccent]}>
              <Text style={[styles.statNum, accent && styles.statNumAccent]}>{value}</Text>
              <Text style={styles.statLbl}>{label}</Text>
            </BlurView>
          ))}
        </View>

        {/* ── Recent sessions ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.recent}</Text>
          {calls.length > 0 && (
            <Text style={styles.sectionHint}>Hold to delete</Text>
          )}
        </View>

        <FlatList
          data={calls}
          keyExtractor={item => item.id}
          renderItem={renderCall}
          contentContainerStyle={calls.length === 0 ? styles.emptyWrap : styles.listWrap}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>◎</Text>
              <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
              <Text style={styles.emptySub}>{t.emptySub}</Text>
            </View>
          }
        />

        {/* ── CTA ── */}
        <View style={styles.ctaWrap}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              onPress={() => router.push('/call')}
              onPressIn={pressIn}
              onPressOut={pressOut}
              activeOpacity={1}
            >
              <BlurView intensity={55} tint="dark" style={styles.ctaInner}>
                <View style={styles.ctaIconWrap}>
                  <Text style={styles.ctaIcon}>▾</Text>
                </View>
                <Text style={styles.ctaText}>{t.newCall}</Text>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </SafeAreaView>
    </View>
  );
}

// ── Deep sea palette ──
const CYAN  = 'rgba(0, 212, 255, 1)';
const CYAND = 'rgba(0, 212, 255, 0.25)';
const GREEN = 'rgba(0, 255, 160, 0.8)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#010A12' },
  safe: { flex: 1 },

  // ── Orbs — deep bioluminescent ──
  orb1: {
    position: 'absolute', top: '-10%', left: '-20%',
    width: 500, height: 500, borderRadius: 250,
    backgroundColor: 'rgba(0, 100, 160, 0.35)',
  },
  orb2: {
    position: 'absolute', top: '35%', right: '-25%',
    width: 480, height: 480, borderRadius: 240,
    backgroundColor: 'rgba(0, 60, 120, 0.3)',
  },
  orb3: {
    position: 'absolute', bottom: '-8%', left: '5%',
    width: 420, height: 420, borderRadius: 210,
    backgroundColor: 'rgba(0, 150, 130, 0.18)',
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
    overflow: 'hidden',
  },
  tagDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: CYAN,
    shadowColor: CYAN, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 5,
  },
  tagText: {
    fontSize: 10, fontWeight: '800',
    color: 'rgba(0, 212, 255, 0.85)',
    letterSpacing: 1.5,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    gap: 8,
  },
  langOpt: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.25)' },
  langOptActive: { color: GREEN },
  langSep: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.1)' },

  // ── Sonar hero ──
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  sonarWrap: {
    width: 140, height: 140,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  sonarRing: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1.5,
  },
  sonarCore: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
    overflow: 'hidden',
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },
  sonarEmoji: { fontSize: 32 },
  heroTitle: {
    fontSize: 44, fontWeight: '900',
    color: '#FFFFFF', letterSpacing: -1.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', lineHeight: 21,
    paddingHorizontal: 44,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 22,
  },
  statTile: {
    flex: 1, alignItems: 'center',
    paddingVertical: 15, borderRadius: 20,
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
  },
  statTileAccent: { borderColor: 'rgba(0, 255, 160, 0.25)' },
  statNum: {
    fontSize: 26, fontWeight: '800',
    color: '#FFF', letterSpacing: -0.5, marginBottom: 4,
  },
  statNumAccent: { color: GREEN },
  statLbl: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(0, 212, 255, 0.5)',
    textTransform: 'uppercase', letterSpacing: 1.2,
  },

  // ── Section ──
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700',
    color: 'rgba(0, 212, 255, 0.7)',
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '500',
  },

  listWrap: { paddingHorizontal: 16, paddingBottom: 120 },
  emptyWrap: { flex: 1, paddingHorizontal: 16 },

  // ── Card ──
  cardOuter: { marginBottom: 10, borderRadius: 20, overflow: 'hidden' },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 3,
    backgroundColor: 'rgba(0, 212, 255, 0.6)',
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 6,
  },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  cardDate: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  cardBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0, 255, 160, 0.1)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(0, 255, 160, 0.25)',
  },
  notesDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: GREEN,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 3,
  },
  notesBadgeText: { fontSize: 10, color: GREEN, fontWeight: '700' },
  cardDuration: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: '600' },
  cardSnippet: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic', lineHeight: 19, marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardExchanges: { fontSize: 11, color: 'rgba(0, 212, 255, 0.35)', fontWeight: '600' },
  cardArrow: { fontSize: 18, color: 'rgba(0, 212, 255, 0.3)', fontWeight: '300' },

  // ── Empty ──
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20 },
  emptyIcon: { fontSize: 40, color: 'rgba(0, 212, 255, 0.3)', marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  emptySub: {
    fontSize: 13, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 30,
  },

  // ── CTA ──
  ctaWrap: {
    position: 'absolute', bottom: 34, left: 16, right: 16,
    shadowColor: CYAN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 24,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.45)',
    borderRadius: 26,
    overflow: 'hidden',
    gap: 14,
  },
  ctaIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  ctaIcon: { fontSize: 14, color: CYAN, fontWeight: '700' },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },
});
