import React, { useEffect, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, StyleSheet, View } from 'react-native';

interface Props {
  active: boolean;
  color?: string;
  bars?: number;
}

/**
 * Live waveform that reacts to expo-av's metering events.
 * dB readings are roughly -160 (silent) to 0 (loud).
 * We map -50..0 → 0..1 and render that many bars at varying heights.
 */
export default function AudioWaveform({ active, color = '#2563EB', bars = 24 }: Props) {
  // Each bar gets its own animated height value
  const heights = useRef<Animated.Value[]>(
    Array.from({ length: bars }, () => new Animated.Value(0.15))
  ).current;

  // Sliding buffer of recent amplitudes (one per bar)
  const buffer = useRef<number[]>(Array.from({ length: bars }, () => 0.15)).current;

  // Decay timer for when no event has fired recently
  const decayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Force-update tick so React picks up buffer changes
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active) {
      // Reset to minimal idle state
      for (let i = 0; i < bars; i++) {
        buffer[i] = 0.15;
        Animated.timing(heights[i], {
          toValue: 0.15, duration: 200, useNativeDriver: false,
        }).start();
      }
      return;
    }

    const sub = DeviceEventEmitter.addListener('audio_metering', (db: number) => {
      // Map db (-50..0) → amp (0.1..1.0)
      const clamped = Math.max(-50, Math.min(0, db));
      const amp = 0.1 + ((clamped + 50) / 50) * 0.9;

      // Shift buffer left, append new sample
      buffer.shift();
      buffer.push(amp);

      // Animate each bar to its new buffer value
      for (let i = 0; i < bars; i++) {
        Animated.timing(heights[i], {
          toValue: buffer[i],
          duration: 80,
          useNativeDriver: false,
        }).start();
      }
      setTick(t => t + 1);
    });

    // Gentle idle decay if no metering events fire for a beat
    decayTimerRef.current = setInterval(() => {
      let changed = false;
      for (let i = 0; i < bars; i++) {
        const decayed = Math.max(0.15, buffer[i] * 0.85);
        if (decayed !== buffer[i]) {
          buffer[i] = decayed;
          Animated.timing(heights[i], { toValue: decayed, duration: 120, useNativeDriver: false }).start();
          changed = true;
        }
      }
      if (changed) setTick(t => t + 1);
    }, 200);

    return () => {
      sub.remove();
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, [active]);

  return (
    <View style={s.wrap} pointerEvents="none">
      {heights.map((h, i) => (
        <Animated.View
          key={i}
          style={[
            s.bar,
            {
              backgroundColor: color,
              height: h.interpolate({ inputRange: [0, 1], outputRange: [4, 38] }),
              opacity: h.interpolate({ inputRange: [0.15, 1], outputRange: [0.35, 1] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 42,
    paddingHorizontal: 8,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
});
