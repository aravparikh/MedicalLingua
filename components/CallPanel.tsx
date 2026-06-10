import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight, hapticWarning } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';

type Lang = 'es' | 'en';

const L = {
  es: {
    end: 'Terminar',
    live: 'En vivo',
  },
  en: {
    end: 'End',
    live: 'Live',
  },
};

interface Props {
  isListening: boolean;
  isSpeaking: boolean;
  callStartedAt: number;
  lang?: Lang;
  onShowHelp: () => void;
  onEndCall: () => void;
}

export default function CallPanel({
  isListening, isSpeaking,
  callStartedAt, lang = 'es',
  onShowHelp, onEndCall,
}: Props) {
  const L_ = L[lang];
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    const t = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartedAt) / 1000);
      setDuration(`${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, [callStartedAt]);

  const isActive = isListening || isSpeaking;

  return (
    <View style={s.wrap}>
      <View style={s.topRow}>
        {/* Help Button */}
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            onShowHelp();
          }}
          style={s.helpBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="help-circle-outline" size={24} color={C.ink2} />
        </TouchableOpacity>

        {/* Call Timer / Status */}
        <View style={s.timerPill}>
          <View style={[s.liveDot, isActive && s.liveDotActive]} />
          <Text style={[s.timerText, isActive && s.timerTextActive]}>{duration}</Text>
          <Text style={s.liveLabel}>{L_.live}</Text>
        </View>

        {/* End Call Button */}
        <TouchableOpacity
          onPress={() => {
            hapticWarning();
            onEndCall();
          }}
          style={s.endBtn}
          activeOpacity={0.7}
        >
          <Text style={s.endBtnText}>{L_.end}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Shadows.glass,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.bg,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.lineSoft,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.inkFaint,
  },
  liveDotActive: {
    backgroundColor: '#10B981', // Clean safety teal-green active dot
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.inkMute,
    fontVariant: ['tabular-nums'],
  },
  timerTextActive: {
    color: C.ink,
  },
  liveLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: C.inkMute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  endBtn: {
    minHeight: 40,
    minWidth: 80,
    borderRadius: 12,
    backgroundColor: C.alertTint,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  endBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: C.alert,
  },
});
