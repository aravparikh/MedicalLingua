import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, ViewStyle } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  size?: Size;
  label?: string;
  style?: ViewStyle;
}

const DIMS: Record<Size, { circle: number; dot: number; gap: number; emoji: number; labelGap: number; label: number }> = {
  sm: { circle: 32, dot: 5, gap: 5, emoji: 16, labelGap: 8, label: 16 },
  md: { circle: 52, dot: 7, gap: 6, emoji: 24, labelGap: 12, label: 18 },
  lg: { circle: 72, dot: 9, gap: 8, emoji: 34, labelGap: 14, label: 20 },
};

/**
 * Brand-consistent loader. The stethoscope emoji breathes (1→1.08 scale + opacity),
 * orbited by three dots pulsing 240ms apart. Replaces every raw ActivityIndicator.
 */
export default function BrandLoader({ size = 'md', label, style }: Props) {
  const d = DIMS[size];
  const breathe = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    const dotLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(720 - delay),
        ])
      );

    const a = dotLoop(dot1, 0);
    const b = dotLoop(dot2, 180);
    const c = dotLoop(dot3, 360);
    a.start(); b.start(); c.start();

    return () => { a.stop(); b.stop(); c.stop(); };
  }, []);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const opacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <View style={[s.wrap, style]}>
      <Animated.View
        style={[
          s.circle,
          {
            width: d.circle, height: d.circle, borderRadius: d.circle / 2,
            transform: [{ scale }], opacity,
          },
        ]}
      >
        <Text style={{ fontSize: d.emoji }}>🩺</Text>
      </Animated.View>

      <View style={[s.dots, { gap: d.gap, marginTop: d.gap + 4 }]} pointerEvents="none">
        {[dot1, dot2, dot3].map((v, i) => (
          <Animated.View
            key={i}
            style={[
              s.dot,
              {
                width: d.dot, height: d.dot, borderRadius: d.dot / 2,
                opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
                transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
              },
            ]}
          />
        ))}
      </View>

      {label ? (
        <Text style={[s.label, { fontSize: d.label, marginTop: d.labelGap }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: {
    backgroundColor: '#DCEAF6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F5BA8', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
  },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot: { backgroundColor: '#0F5BA8' },
  label: {
    fontWeight: '800', color: '#555960', letterSpacing: 0.2,
    textAlign: 'center', maxWidth: 240,
  },
});
