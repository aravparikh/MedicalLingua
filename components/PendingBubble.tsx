import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type Lang = 'es' | 'en';
type Role = 'provider' | 'patient';

const L = {
  es: {
    transcribing: 'Transcribiendo...',
    translating: 'Traduciendo al español...',
    translatingEn: 'Traduciendo al inglés...',
  },
  en: {
    transcribing: 'Transcribing...',
    translating: 'Translating to Spanish...',
    translatingEn: 'Translating to English...',
  },
};

interface Props {
  role: Role;
  lang: Lang;
}

/**
 * Skeleton bubble shown while a chunk is being transcribed + translated.
 * Provides immediate visual feedback so the user knows the AI is working
 * before the final TranscriptMessage replaces it.
 */
export default function PendingBubble({ role, lang }: Props) {
  const t = L[lang];
  const isProvider = role === 'provider';
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(180, [
        ...[dot1, dot2, dot3].map(d =>
          Animated.sequence([
            Animated.timing(d, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(d, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ])
        ),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const label = isProvider ? t.translating : t.translatingEn;

  return (
    <View style={[s.row, isProvider ? s.rowRight : s.rowLeft]}>
      <View style={[s.bubble, isProvider ? s.bubbleProvider : s.bubblePatient]}>
        <View style={s.headerRow}>
          <View style={s.dots}>
            <Animated.View style={[s.dot, isProvider && s.dotBlue, { opacity: dot1 }]} />
            <Animated.View style={[s.dot, isProvider && s.dotBlue, { opacity: dot2 }]} />
            <Animated.View style={[s.dot, isProvider && s.dotBlue, { opacity: dot3 }]} />
          </View>
          <Text style={[s.label, isProvider && s.labelBlue]}>{label}</Text>
        </View>
        <View style={s.skeletonStack}>
          <View style={[s.skelLine, { width: '85%' }]} />
          <View style={[s.skelLine, { width: '65%' }]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { marginVertical: 8, marginHorizontal: 16, flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '90%',
    borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 14,
    borderWidth: 1,
  },
  bubbleProvider: {
    backgroundColor: '#DCEAF666',
    borderColor: '#0F5BA822',
    borderBottomRightRadius: 6,
  },
  bubblePatient: {
    backgroundColor: '#DCEAE266',
    borderColor: '#2F8F7322',
    borderBottomLeftRadius: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2F8F73' },
  dotBlue: { backgroundColor: '#0F5BA8' },
  label: { fontSize: 13, fontWeight: '800', color: '#2F8F73', letterSpacing: 0.2 },
  labelBlue: { color: '#0F5BA8' },
  skeletonStack: { gap: 8 },
  skelLine: {
    height: 14, borderRadius: 7,
    backgroundColor: 'rgba(26,27,31,0.08)',
  },
});
