import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { UrgentWarning } from '../types';
import { Theme as C, Shadows } from '../constants/theme';

type Lang = 'es' | 'en';

const L = {
  es: {
    title: 'Señales de alarma',
    subtitle: 'Si tiene cualquiera de estos signos, actúe enseguida.',
    sevCritical: 'EMERGENCIA',
    sevHigh: 'IMPORTANTE',
    sevInfo: 'AVISO',
  },
  en: {
    title: 'Warning signs',
    subtitle: 'If you have any of these signs, act right away.',
    sevCritical: 'EMERGENCY',
    sevHigh: 'IMPORTANT',
    sevInfo: 'NOTICE',
  },
};

const PALETTES = {
  critical: {
    bg: 'rgba(226, 136, 124, 0.1)',
    border: 'rgba(226, 136, 124, 0.3)',
    accent: '#FCA5A5',
    chipBg: 'rgba(181, 68, 58, 0.5)',
    chipText: '#FFFFFF',
    icon: '🚨',
  },
  high: {
    bg: 'rgba(226, 176, 124, 0.1)',
    border: 'rgba(226, 176, 124, 0.3)',
    accent: '#FDBA74',
    chipBg: 'rgba(182, 106, 62, 0.5)',
    chipText: '#FFFFFF',
    icon: '⚠️',
  },
  info: {
    bg: 'rgba(168, 197, 229, 0.1)',
    border: 'rgba(168, 197, 229, 0.3)',
    accent: '#93C5FD',
    chipBg: 'rgba(15, 91, 168, 0.5)',
    chipText: '#FFFFFF',
    icon: 'ℹ️',
  },
};

interface Props {
  warnings: UrgentWarning[];
  lang?: Lang;
}

export default function UrgentWarnings({ warnings, lang = 'es' }: Props) {
  const t = L[lang];

  // Pulse animation for the critical badge
  const pulse = useRef(new Animated.Value(1)).current;
  const hasCritical = warnings.some(w => w.severity === 'critical');

  useEffect(() => {
    if (!hasCritical) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasCritical]);

  if (!warnings || warnings.length === 0) return null;

  // Sort by severity: critical → high → info
  const sortOrder: Record<UrgentWarning['severity'], number> = { critical: 0, high: 1, info: 2 };
  const sorted = [...warnings].sort((a, b) => sortOrder[a.severity] - sortOrder[b.severity]);

  const sevLabel = (sev: UrgentWarning['severity']) =>
    sev === 'critical' ? t.sevCritical : sev === 'high' ? t.sevHigh : t.sevInfo;

  return (
    <Animated.View style={[s.outer, hasCritical && { transform: [{ scale: pulse }] }]}>
      <View style={s.headerRow}>
        <Text style={s.headerIcon}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{t.title}</Text>
          <Text style={s.headerSubtitle}>{t.subtitle}</Text>
        </View>
      </View>

      <View style={s.list}>
        {sorted.map((w, i) => {
          const p = PALETTES[w.severity] ?? PALETTES.info;
          return (
            <View
              key={i}
              style={[s.card, { backgroundColor: p.bg, borderColor: p.border }]}
            >
              <View style={[s.severityChip, { backgroundColor: p.chipBg }]}>
                <Text style={[s.severityText, { color: p.chipText }]}>{sevLabel(w.severity)}</Text>
              </View>
              <View style={s.cardBody}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardIcon}>{p.icon}</Text>
                  <Text style={[s.cardTitle, { color: p.accent }]}>{w.title}</Text>
                </View>
                <Text style={[s.cardAction, { color: p.accent }]}>→ {w.action}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  outer: {
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    ...Shadows.glass,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
    backgroundColor: C.surfaceSolid,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  headerIcon: { fontSize: 28 },
  headerTitle: { fontSize: 19, fontWeight: '900', color: C.ink, letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 13, color: C.inkMute, fontWeight: '600', marginTop: 2 },

  list: { padding: 12, gap: 10 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  severityChip: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  severityText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  cardBody: { flex: 1, gap: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardIcon: { fontSize: 16 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  cardAction: { fontSize: 14, fontWeight: '800', lineHeight: 19 },
});
