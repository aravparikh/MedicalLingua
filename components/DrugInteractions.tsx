import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import type { DrugInteraction } from '../types';

type Lang = 'es' | 'en';

const L = {
  es: {
    title: 'Verificación de medicinas',
    subtitle: 'IA revisó sus medicinas por interacciones.',
    loading: 'Revisando medicinas...',
    safe: 'Sin interacciones graves detectadas',
    safeSub: 'Continúe tomando sus medicinas como le indicó el doctor.',
    chip: '🛡️ Análisis de seguridad',
    sevMajor: 'GRAVE',
    sevModerate: 'MODERADO',
    sevMinor: 'LEVE',
    sevInfo: 'CONSEJO',
    with: 'con',
  },
  en: {
    title: 'Medication safety check',
    subtitle: 'AI reviewed your medications for interactions.',
    loading: 'Checking medications...',
    safe: 'No major interactions detected',
    safeSub: 'Keep taking your medications as your doctor told you.',
    chip: '🛡️ Safety analysis',
    sevMajor: 'MAJOR',
    sevModerate: 'MODERATE',
    sevMinor: 'MINOR',
    sevInfo: 'TIP',
    with: 'with',
  },
};

const C = {
  surface: '#FFFFFF',
  surfaceSunk: '#FAF7F1',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  inkSoft: '#555960',
  inkMute: '#666A73',
  primary: '#0F5BA8',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

const SEV_PALETTE = {
  major: {
    bg: '#FCEBE7',
    border: '#B5443A',
    accent: '#B5443A',
    chip: '#B5443A',
    icon: '🛑',
  },
  moderate: {
    bg: '#FFF1E1',
    border: '#B66A3E',
    accent: '#8E5028',
    chip: '#B66A3E',
    icon: '⚠️',
  },
  minor: {
    bg: '#F4F1EB',
    border: '#555960',
    accent: '#2E3138',
    chip: '#555960',
    icon: '🟡',
  },
  info: {
    bg: '#E6F0FB',
    border: '#0F5BA8',
    accent: '#0A4682',
    chip: '#0F5BA8',
    icon: 'ℹ️',
  },
};

interface Props {
  loading: boolean;
  interactions: DrugInteraction[] | null;
  lang?: Lang;
}

export default function DrugInteractions({ loading, interactions, lang = 'es' }: Props) {
  const t = L[lang];
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const hasMajor = interactions?.some(i => i.severity === 'major');
  const sortOrder = { major: 0, moderate: 1, minor: 2, info: 3 } as const;
  const sorted = (interactions ?? []).slice().sort((a, b) => sortOrder[a.severity] - sortOrder[b.severity]);

  const sevLabel = (sev: DrugInteraction['severity']) =>
    sev === 'major' ? t.sevMajor : sev === 'moderate' ? t.sevModerate : sev === 'minor' ? t.sevMinor : t.sevInfo;

  return (
    <Animated.View style={[s.wrap, { opacity: fade }, hasMajor && s.wrapAlert]}>
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Text style={s.icon}>🛡️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.titleRow}>
            <Text style={s.title}>{t.title}</Text>
            <View style={s.chip}>
              <Text style={s.chipText}>{t.chip}</Text>
            </View>
          </View>
          <Text style={s.subtitle}>{t.subtitle}</Text>
        </View>
      </View>

      <View style={s.body}>
        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator color={C.primary} />
            <Text style={s.loadingText}>{t.loading}</Text>
          </View>
        )}

        {!loading && interactions && interactions.length === 0 && (
          <View style={[s.card, { backgroundColor: C.listenTint, borderColor: '#A8D4C0' }]}>
            <Text style={s.safeIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: C.listen }]}>{t.safe}</Text>
              <Text style={[s.cardAction, { color: '#256E58' }]}>{t.safeSub}</Text>
            </View>
          </View>
        )}

        {!loading && sorted.map((item, i) => {
          const p = SEV_PALETTE[item.severity] ?? SEV_PALETTE.info;
          return (
            <View
              key={i}
              style={[s.card, { backgroundColor: p.bg, borderColor: p.border }]}
            >
              <View style={s.cardLeft}>
                <Text style={s.cardEmoji}>{p.icon}</Text>
                <View style={[s.severityChip, { backgroundColor: p.chip }]}>
                  <Text style={s.severityText}>{sevLabel(item.severity)}</Text>
                </View>
              </View>
              <View style={s.cardBody}>
                <Text style={[s.cardTitle, { color: p.accent }]}>
                  {item.drugs.join(` ${t.with} `)}
                </Text>
                <Text style={[s.cardDesc, { color: p.accent }]}>{item.description}</Text>
                <Text style={[s.cardAction, { color: p.accent }]}>→ {item.action}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginTop: 12,
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  wrapAlert: {
    shadowColor: '#B5443A',
    shadowOpacity: 0.18,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 16, paddingBottom: 8,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.listenTint,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 26 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  title: { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  chip: {
    backgroundColor: C.listenTint,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#2F8F7333',
  },
  chipText: { fontSize: 12, fontWeight: '900', color: C.listen, letterSpacing: 0.4, textTransform: 'uppercase' },
  subtitle: { fontSize: 16, lineHeight: 22, color: C.inkSoft, fontWeight: '600', marginTop: 4 },

  body: { padding: 12, paddingTop: 4, gap: 10 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  loadingText: { fontSize: 16, color: C.inkSoft, fontWeight: '700' },

  card: {
    flexDirection: 'row',
    borderRadius: 16, borderWidth: 1.5,
    padding: 12, gap: 12,
    alignItems: 'flex-start',
  },
  cardLeft: { alignItems: 'center', gap: 6, width: 56 },
  cardEmoji: { fontSize: 26 },
  severityChip: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  severityText: { fontSize: 12, color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.5 },
  safeIcon: { fontSize: 28, color: C.listen, fontWeight: '900', width: 32, textAlign: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 18, fontWeight: '900', lineHeight: 24 },
  cardDesc: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  cardAction: { fontSize: 16, lineHeight: 22, fontWeight: '800', marginTop: 2 },
});
