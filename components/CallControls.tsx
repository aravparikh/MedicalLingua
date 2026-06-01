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
import AudioWaveform from './AudioWaveform';
import { hapticMedium } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  inkMute: '#666A73',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmStrong: '#8E5028',
  warmTint: '#F3E2D2',
};

type Lang = 'es' | 'en';

const L = {
  es: {
    translating: 'Traduciendo...',
    doctorSpeaks: 'El doctor habla',
    done: 'Listo',
    listening: 'Escuchando...',
    doctorSub: 'Inglés a español',
    youSpeak: 'Yo hablo',
    recording: 'Grabando...',
    youSub: 'Español a inglés',
  },
  en: {
    translating: 'Translating...',
    doctorSpeaks: 'Doctor speaks',
    done: 'Done',
    listening: 'Listening...',
    doctorSub: 'English → Spanish',
    youSpeak: 'I speak',
    recording: 'Recording...',
    youSub: 'Spanish → English',
  },
};

interface Props {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  lang?: Lang;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeakSpanish: () => void;
}

function PulseRing({ color, active }: { color: string; active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) { opacity.setValue(0); scale.setValue(1); return; }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.0, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 80, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1120, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.pulse, { borderColor: color, transform: [{ scale }], opacity }]}
    />
  );
}

export default function CallControls({ isListening, isSpeaking, isProcessing, lang = 'es', onStartListening, onStopListening, onSpeakSpanish }: Props) {
  const L_ = L[lang];
  const micScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening && !isSpeaking) {
      Animated.spring(micScale, { toValue: 1, useNativeDriver: true }).start();
      return;
    }
    const sub = DeviceEventEmitter.addListener('audio_metering', (db: number) => {
      const ratio = 1 - Math.max(-40, Math.min(0, db)) / -40;
      Animated.timing(micScale, { toValue: 1 + ratio * 0.07, duration: 60, easing: Easing.linear, useNativeDriver: true }).start();
    });
    return () => sub.remove();
  }, [isListening, isSpeaking]);

  const recording = isListening || isSpeaking;

  return (
    <View style={s.wrap}>
      {recording && (
        <View style={s.waveformRow}>
          <AudioWaveform
            active={recording}
            color={isListening ? C.primary : C.warm}
          />
        </View>
      )}

      {isProcessing && (
        <View style={s.processingRow}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={s.processingText}>{L_.translating}</Text>
        </View>
      )}

      <View style={s.row}>
        {/* Provider / Doctor */}
        <TouchableOpacity
          style={[s.btn, s.btnDoctor, isListening && s.btnActive, (isProcessing || isSpeaking) && s.btnDim]}
          onPress={() => {
            hapticMedium();
            if (isListening) onStopListening();
            else onStartListening();
          }}
          disabled={isProcessing || isSpeaking}
          activeOpacity={0.8}
        >
          <PulseRing color={C.primary} active={isListening} />
          <Animated.View style={{ transform: [{ scale: micScale }] }}>
            <Text style={s.btnIcon}>{isListening ? '⏹' : '🩺'}</Text>
          </Animated.View>
          <Text style={[s.btnLabel, { color: C.primary }]}>
            {isListening ? L_.done : L_.doctorSpeaks}
          </Text>
          <Text style={s.btnSub}>{isListening ? L_.listening : L_.doctorSub}</Text>
        </TouchableOpacity>

        {/* Patient */}
        <TouchableOpacity
          style={[s.btn, s.btnPatient, isSpeaking && s.btnActiveWarm, (isProcessing || isListening) && s.btnDim]}
          onPress={() => {
            hapticMedium();
            onSpeakSpanish();
          }}
          disabled={isProcessing || isListening}
          activeOpacity={0.8}
        >
          <PulseRing color={C.warm} active={isSpeaking} />
          <Animated.View style={{ transform: [{ scale: micScale }] }}>
            <Text style={s.btnIcon}>{isSpeaking ? '⏹' : '🗣️'}</Text>
          </Animated.View>
          <Text style={[s.btnLabel, { color: C.warm }]}>
            {isSpeaking ? L_.done : L_.youSpeak}
          </Text>
          <Text style={s.btnSub}>{isSpeaking ? L_.recording : L_.youSub}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: '#E5DFD2',
  },
  waveformRow: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  processingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  processingText: { fontSize: 16, color: C.primary, fontWeight: '800' },

  row: { flexDirection: 'row', gap: 12 },

  btn: {
    flex: 1, borderRadius: 20, padding: 18, minHeight: 126,
    alignItems: 'center', gap: 4,
    borderWidth: 1.5,
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    overflow: 'visible',
  },
  btnDoctor: { backgroundColor: C.surface, borderColor: C.primaryTint },
  btnPatient: { backgroundColor: C.surface, borderColor: C.warmTint },
  btnActive: { backgroundColor: C.primaryTint, borderColor: C.primary },
  btnActiveWarm: { backgroundColor: C.warmTint, borderColor: C.warm },
  btnDim: { opacity: 0.4 },

  pulse: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 1.5,
  },

  btnIcon: { fontSize: 28 },
  btnLabel: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  btnSub: { fontSize: 16, color: C.inkMute, fontWeight: '800', textAlign: 'center' },
});
