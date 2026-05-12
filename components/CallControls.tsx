import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  DeviceEventEmitter,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface Props {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeakSpanish: () => void;
}

// Sonar ring that expands outward and fades — one ping
function SonarPing({ color, active }: { color: string; active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      opacity.setValue(0);
      scale.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.2,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1300, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sonarPing,
        { borderColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
}

export default function CallControls({
  isListening,
  isSpeaking,
  isProcessing,
  onStartListening,
  onStopListening,
  onSpeakSpanish,
}: Props) {
  const busy = isProcessing;

  // Mic button reacts to actual audio level
  const micScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening && !isSpeaking) {
      Animated.spring(micScale, { toValue: 1, useNativeDriver: true }).start();
      return;
    }
    const sub = DeviceEventEmitter.addListener('audio_metering', (db: number) => {
      const floor = -40;
      const bounded = Math.max(floor, Math.min(0, db));
      const ratio = 1 - bounded / floor;
      Animated.timing(micScale, {
        toValue: 1 + ratio * 0.08,
        duration: 60,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
    return () => sub.remove();
  }, [isListening, isSpeaking]);

  return (
    <View style={styles.container}>
      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingRow}>
          <ActivityIndicator size="small" color="#00D4FF" />
          <Text style={styles.processingText}>Transcribing & translating…</Text>
        </View>
      )}

      <View style={styles.stack}>
        {/* ── Doctor / Listen button ── */}
        <TouchableOpacity
          style={[styles.btn, busy && styles.btnDisabled]}
          onPress={isListening ? onStopListening : onStartListening}
          disabled={busy || isSpeaking}
          activeOpacity={0.75}
        >
          <BlurView intensity={45} tint="dark" style={[styles.btnGlass, styles.btnDoctor]}>
            {/* Sonar ping layer */}
            <SonarPing color="#00D4FF" active={isListening} />
            <Animated.View style={{ transform: [{ scale: micScale }] }}>
              <Text style={styles.btnIcon}>{isListening ? '⏹' : '🩺'}</Text>
            </Animated.View>
            <View style={styles.btnLabelWrap}>
              <Text style={styles.btnTitle}>
                {isListening ? 'STOP' : 'PROVIDER'}
              </Text>
              <Text style={styles.btnSub}>
                {isListening ? 'Transmitting…' : 'Speak English'}
              </Text>
            </View>
            {isListening && <View style={styles.activeBar} />}
          </BlurView>
        </TouchableOpacity>

        {/* ── Patient / Speak Spanish button ── */}
        <TouchableOpacity
          style={[styles.btn, styles.btnLg, busy && styles.btnDisabled]}
          onPress={onSpeakSpanish}
          disabled={busy || isListening}
          activeOpacity={0.75}
        >
          <BlurView intensity={45} tint="dark" style={[styles.btnGlass, styles.btnPatient]}>
            <SonarPing color="#00FFA0" active={isSpeaking} />
            <Animated.View style={{ transform: [{ scale: micScale }] }}>
              <Text style={styles.btnIcon}>{isSpeaking ? '⏹' : '🗣️'}</Text>
            </Animated.View>
            <View style={styles.btnLabelWrap}>
              <Text style={[styles.btnTitle, { color: isSpeaking ? '#00FFA0' : '#00FFA0' }]}>
                {isSpeaking ? 'DONE' : 'PACIENTE'}
              </Text>
              <Text style={styles.btnSub}>
                {isSpeaking ? 'Receiving…' : 'Hablar Español'}
              </Text>
            </View>
            {isSpeaking && <View style={[styles.activeBar, { backgroundColor: '#00FFA0' }]} />}
          </BlurView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
    paddingTop: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(1, 10, 18, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 255, 0.12)',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 10,
  },
  processingText: {
    fontSize: 13,
    color: '#00D4FF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stack: { gap: 12 },

  btn: { borderRadius: 22, overflow: 'visible' },
  btnLg: {},
  btnDisabled: { opacity: 0.3 },

  btnGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    gap: 16,
  },
  btnDoctor: {
    borderColor: 'rgba(0, 212, 255, 0.3)',
    backgroundColor: 'rgba(0, 212, 255, 0.06)',
  },
  btnPatient: {
    paddingVertical: 26,
    borderColor: 'rgba(0, 255, 160, 0.3)',
    backgroundColor: 'rgba(0, 255, 160, 0.06)',
  },

  // Sonar ping ring — sits behind button content
  sonarPing: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 1.5,
    alignSelf: 'center',
  },

  btnIcon: { fontSize: 32 },
  btnLabelWrap: { flex: 1 },
  btnTitle: {
    fontSize: 16, fontWeight: '900',
    color: '#00D4FF', letterSpacing: 1.5,
    marginBottom: 2,
  },
  btnSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.35)',
    fontWeight: '500', letterSpacing: 0.3,
  },

  // Glowing active indicator bar at bottom of button
  activeBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 2,
    backgroundColor: '#00D4FF',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 8,
  },
});
