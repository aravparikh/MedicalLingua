import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hapticLight, hapticWarning } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  line: '#E5DFD2',
  lineSoft: '#EFEBE0',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkMute: '#8A8E96',
  inkFaint: '#B5B3AB',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
  alert: '#B5443A',
  alertTint: '#F4DDD8',
};

interface Props {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isSpeaker: boolean;
  callStartedAt: number;
  dialedNumber?: string;
  callStatus?: 'idle' | 'connecting' | 'connected' | 'failed';
  onShowHelp: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

export default function CallPanel({
  isListening, isSpeaking, isMuted, isSpeaker,
  callStartedAt, dialedNumber, callStatus,
  onShowHelp, onEndCall, onToggleMute, onToggleSpeaker,
}: Props) {
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    const t = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartedAt) / 1000);
      setDuration(`${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, [callStartedAt]);

  const fmt = (n: string) => {
    const d = n.replace(/\D/g, '');
    const m = d.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!m) return n;
    if (m[3]) return `(${m[1]}) ${m[2]}-${m[3]}`;
    if (m[2]) return `(${m[1]}) ${m[2]}`;
    return `(${m[1]}`;
  };

  const isActive = isListening || isSpeaking;

  return (
    <View style={s.wrap}>
      {/* Top bar */}
      <View style={s.topRow}>
        <TouchableOpacity
          onPress={() => {
            hapticLight();
            onShowHelp();
          }}
          style={s.ghostBtn}
        >
          <Text style={s.ghostBtnText}>Ayuda</Text>
        </TouchableOpacity>

        <View style={s.timerPill}>
          <View style={[s.liveDot, isActive && s.liveDotActive]} />
          <Text style={[s.timerText, isActive && s.timerTextActive]}>{duration}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            hapticWarning();
            onEndCall();
          }}
          style={s.endBtn}
        >
          <Text style={s.endBtnText}>Terminar</Text>
        </TouchableOpacity>
      </View>

      {/* Dialed number / status */}
      {dialedNumber ? (
        <View style={s.numberRow}>
          <Text style={s.numberText}>{fmt(dialedNumber)}</Text>
          {callStatus === 'connecting' && <Text style={s.statusChip}>Conectando...</Text>}
          {callStatus === 'connected' && <Text style={[s.statusChip, s.statusConnected]}>● Conectado</Text>}
          {callStatus === 'failed' && <Text style={[s.statusChip, s.statusFailed]}>Falló</Text>}
        </View>
      ) : null}

      {/* Avatars */}
      <View style={s.avatarsRow}>
        <View style={s.avatarWrap}>
          <View style={[s.avatarRing, isListening && !isMuted && s.ringBlue]}>
            <View style={s.avatar}><Text style={{ fontSize: 22 }}>👨‍⚕️</Text></View>
          </View>
          <Text style={s.avatarName}>Doctor</Text>
          <Text style={[s.avatarStatus, isListening && !isMuted && s.statusBlue, isMuted && s.statusMuted]}>
            {isMuted ? 'Silencio' : isListening ? 'Escuchando...' : 'Listo'}
          </Text>
        </View>

        <View style={s.dots}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[s.dot, isActive && !isMuted && s.dotActive]} />
          ))}
        </View>

        <View style={s.avatarWrap}>
          <View style={[s.avatarRing, isSpeaking && s.ringWarm]}>
            <View style={s.avatar}><Text style={{ fontSize: 22 }}>🧑🏽</Text></View>
          </View>
          <Text style={s.avatarName}>Usted</Text>
          <Text style={[s.avatarStatus, isSpeaking && s.statusWarm]}>
            {isSpeaking ? 'Hablando...' : 'Listo'}
          </Text>
        </View>
      </View>

      {/* Mute + Speaker */}
      <View style={s.controlsRow}>
        <TouchableOpacity
          style={[s.ctrlBtn, isMuted && s.ctrlBtnAlert]}
          onPress={() => {
            hapticLight();
            onToggleMute();
          }}
          activeOpacity={0.7}
        >
          <Text style={s.ctrlIcon}>{isMuted ? '🔇' : '🎙'}</Text>
          <Text style={[s.ctrlLabel, isMuted && { color: C.alert }]}>{isMuted ? 'Activar micrófono' : 'Silenciar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.ctrlBtn, isSpeaker && s.ctrlBtnBlue]}
          onPress={() => {
            hapticLight();
            onToggleSpeaker();
          }}
          activeOpacity={0.7}
        >
          <Text style={s.ctrlIcon}>{isSpeaker ? '🔊' : '🔈'}</Text>
          <Text style={[s.ctrlLabel, isSpeaker && { color: C.primary }]}>{isSpeaker ? 'Altavoz activo' : 'Altavoz'}</Text>
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
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  ghostBtn: { minHeight: 44, minWidth: 66, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontSize: 16, color: C.ink2, fontWeight: '800' },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bg, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.inkFaint },
  liveDotActive: { backgroundColor: '#22C55E' },
  timerText: { fontSize: 17, fontWeight: '800', color: C.inkMute, fontVariant: ['tabular-nums'] },
  timerTextActive: { color: C.ink },
  endBtn: { minHeight: 44, minWidth: 84, borderRadius: 12, backgroundColor: C.alertTint, borderWidth: 1, borderColor: '#F0A9A3', alignItems: 'center', justifyContent: 'center' },
  endBtnText: { fontSize: 16, fontWeight: '900', color: C.alert },

  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
  numberText: { fontSize: 15, fontWeight: '600', color: C.ink2 },
  statusChip: { fontSize: 11, fontWeight: '700', color: C.inkMute, backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusConnected: { color: '#15803D', backgroundColor: '#DCFCE7' },
  statusFailed: { color: C.alert, backgroundColor: C.alertTint },

  avatarsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 10 },
  avatarWrap: { alignItems: 'center', width: 90 },
  avatarRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: C.line, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  ringBlue: { borderColor: C.primary, backgroundColor: C.primaryTint },
  ringWarm: { borderColor: C.warm, backgroundColor: C.warmTint },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  avatarName: { fontSize: 16, fontWeight: '900', color: C.ink2, marginBottom: 2 },
  avatarStatus: { fontSize: 14, color: C.inkFaint, fontWeight: '800' },
  statusBlue: { color: C.primary },
  statusWarm: { color: C.warm },
  statusMuted: { color: C.alert },

  dots: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.lineSoft },
  dotActive: { backgroundColor: C.primary },

  controlsRow: { flexDirection: 'row', gap: 10 },
  ctrlBtn: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  ctrlBtnAlert: { borderColor: '#F0A9A3', backgroundColor: C.alertTint },
  ctrlBtnBlue: { borderColor: C.primaryTint, backgroundColor: C.primaryTint },
  ctrlIcon: { fontSize: 16 },
  ctrlLabel: { fontSize: 15, fontWeight: '900', color: C.ink2, textAlign: 'center' },
});
