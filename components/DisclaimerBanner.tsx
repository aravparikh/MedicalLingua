import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hapticLight } from '../utils/haptics';
import { Theme as C, Shadows } from '../constants/theme';

type Lang = 'es' | 'en';

const L = {
  es: {
    bold: 'Ayuda de traducción.',
    text: 'Confirme medicinas, dosis y fechas con su doctor.',
  },
  en: {
    bold: 'Translation aid only.',
    text: 'Always confirm medications, doses, and dates with your doctor.',
  },
};

interface Props {
  lang?: Lang;
}

export default function DisclaimerBanner({ lang = 'es' }: Props) {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const t = L[lang];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    hapticLight();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ translateY }] }]}>
      <View style={s.banner}>
        <Text style={s.icon}>ℹ️</Text>
        <Text style={s.text}>
          <Text style={s.bold}>{t.bold}{'  '}</Text>{t.text}
        </Text>
        <TouchableOpacity onPress={dismiss} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    ...Shadows.glass,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 16, color: C.ink2, lineHeight: 22, fontWeight: '700' },
  bold: { fontWeight: '800' },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surfaceSolid,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 16, fontWeight: '800', color: C.inkMute },
});
