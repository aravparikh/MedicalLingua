import React, { useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { hapticLight, hapticMedium } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';

type Lang = 'es' | 'en';
type Role = 'provider' | 'patient';

const L = {
  es: {
    translating: 'Traduciendo...',
    doctorSpeaks: 'El doctor habla',
    doctorSub: 'Inglés a español',
    youSpeak: 'Yo hablo',
    youSub: 'Español a inglés',
    tapToRecord: 'Tocar para hablar',
    listening: 'Escuchando...',
    recording: 'Grabando...',
    tapToStop: 'Detener',
  },
  en: {
    translating: 'Translating...',
    doctorSpeaks: 'Doctor speaks',
    doctorSub: 'English → Spanish',
    youSpeak: 'I speak',
    youSub: 'Spanish → English',
    tapToRecord: 'Tap to speak',
    listening: 'Listening...',
    recording: 'Recording...',
    tapToStop: 'Stop',
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
    if (!active) {
      opacity.setValue(0);
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.2,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.6, duration: 100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
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

export default function CallControls({
  isListening,
  isSpeaking,
  isProcessing,
  lang = 'es',
  onStartListening,
  onStopListening,
  onSpeakSpanish,
}: Props) {
  const L_ = L[lang];
  const [selectedRole, setSelectedRole] = useState<Role>('provider');

  const micScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isListening && !isSpeaking) {
      Animated.spring(micScale, { toValue: 1, useNativeDriver: true }).start();
      return;
    }
    const sub = DeviceEventEmitter.addListener('audio_metering', (db: number) => {
      const ratio = 1 - Math.max(-40, Math.min(0, db)) / -40;
      Animated.timing(micScale, {
        toValue: 1 + ratio * 0.12,
        duration: 70,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
    return () => sub.remove();
  }, [isListening, isSpeaking]);

  const activeRecording = isListening || isSpeaking;
  const activeColor = selectedRole === 'provider' ? C.primary : C.warm;
  const activeTint = selectedRole === 'provider' ? C.primaryTint : C.warmTint;

  function handleMicPress() {
    hapticMedium();
    if (selectedRole === 'provider') {
      if (isListening) onStopListening();
      else onStartListening();
    } else {
      onSpeakSpanish();
    }
  }

  function selectRole(role: Role) {
    if (activeRecording || isProcessing) return; // disable during active states
    hapticLight();
    setSelectedRole(role);
  }

  // Auto-switch mode based on active state (just in case they trigger externally)
  useEffect(() => {
    if (isListening) {
      setSelectedRole('provider');
    } else if (isSpeaking) {
      setSelectedRole('patient');
    }
  }, [isListening, isSpeaking]);

  return (
    <View style={s.wrap}>
      {/* Speaking Mode Selector */}
      <View style={[s.selectorContainer, (activeRecording || isProcessing) && s.disabledSelector]}>
        <TouchableOpacity
          style={[
            s.selectorOption,
            selectedRole === 'provider' && s.selectorOptionActiveProvider,
          ]}
          onPress={() => selectRole('provider')}
          disabled={activeRecording || isProcessing}
          activeOpacity={0.7}
        >
          <Ionicons
            name="people"
            size={18}
            color={selectedRole === 'provider' ? '#FFFFFF' : C.inkMute}
            style={{ marginRight: 6 }}
          />
          <View>
            <Text
              style={[
                s.selectorLabel,
                selectedRole === 'provider' && s.selectorLabelActive,
              ]}
            >
              {L_.doctorSpeaks}
            </Text>
            <Text
              style={[
                s.selectorSub,
                selectedRole === 'provider' && s.selectorSubActiveProvider,
              ]}
            >
              {L_.doctorSub}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.selectorOption,
            selectedRole === 'patient' && s.selectorOptionActivePatient,
          ]}
          onPress={() => selectRole('patient')}
          disabled={activeRecording || isProcessing}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={18}
            color={selectedRole === 'patient' ? '#FFFFFF' : C.inkMute}
            style={{ marginRight: 6 }}
          />
          <View>
            <Text
              style={[
                s.selectorLabel,
                selectedRole === 'patient' && s.selectorLabelActive,
              ]}
            >
              {L_.youSpeak}
            </Text>
            <Text
              style={[
                s.selectorSub,
                selectedRole === 'patient' && s.selectorSubActivePatient,
              ]}
            >
              {L_.youSub}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Mic Button Row */}
      <View style={s.micRow}>
        {isProcessing ? (
          <View style={s.loaderContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loaderText}>{L_.translating}</Text>
          </View>
        ) : (
          <View style={s.micButtonWrapper}>
            {/* Pulsing ring animation */}
            <PulseRing color={activeColor} active={activeRecording} />
            
            <TouchableOpacity
              style={[
                s.micButton,
                { backgroundColor: activeColor },
                activeRecording && s.micButtonActive,
              ]}
              onPress={handleMicPress}
              activeOpacity={0.9}
            >
              <Animated.View style={{ transform: [{ scale: micScale }] }}>
                <Ionicons
                  name={activeRecording ? 'square' : 'mic'}
                  size={36}
                  color="#FFFFFF"
                />
              </Animated.View>
            </TouchableOpacity>

            <Text style={[s.statusText, { color: activeRecording ? activeColor : C.ink2 }]}>
              {isListening ? L_.listening : isSpeaking ? L_.recording : L_.tapToRecord}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.line,
    ...Shadows.glass,
  },
  
  // Selector style
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 20,
  },
  disabledSelector: {
    opacity: 0.65,
  },
  selectorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectorOptionActiveProvider: {
    backgroundColor: C.primary,
    ...Shadows.soft,
  },
  selectorOptionActivePatient: {
    backgroundColor: C.warm,
    ...Shadows.soft,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: C.inkMute,
  },
  selectorLabelActive: {
    color: '#FFFFFF',
  },
  selectorSub: {
    fontSize: 11,
    color: C.inkSoft,
    fontWeight: '600',
    marginTop: 1,
  },
  selectorSubActiveProvider: {
    color: '#EAF4FF',
  },
  selectorSubActivePatient: {
    color: '#FBE9DC',
  },

  // Mic Row
  micRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  micButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  micButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glowPrimary,
  },
  micButtonActive: {
    ...Shadows.lifted,
  },
  pulse: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: 0.2,
  },

  // Loader Row
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 16,
    color: C.primary,
    fontWeight: '800',
  },
});
