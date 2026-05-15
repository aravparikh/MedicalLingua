import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  onClearChat: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

export default function CallPanel({
  isListening, isSpeaking, isMuted, isSpeaker,
  callStartedAt, dialedNumber, callStatus,
  onClearChat, onEndCall, onToggleMute, onToggleSpeaker,
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
        <TouchableOpacity onPress={onClearChat} style={s.ghostBtn}>
          <Text style={s.ghostBtnText}>Clear</Text>
        </TouchableOpacity>

        <View style={s.timerPill}>
          <View style={[s.liveDot, isActive && s.liveDotActive]} />
          <Text style={[s.timerText, isActive && s.timerTextActive]}>{duration}</Text>
        </View>

        <TouchableOpacity onPress={onEndCall} style={s.endBtn}>
          <Text style={s.endBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Dialed number / status */}
      {dialedNumber ? (
        <View style={s.numberRow}>
          <Text style={s.numberText}>{fmt(dialedNumber)}</Text>
          {callStatus === 'connecting' && <Text style={s.statusChip}>Connecting…</Text>}
          {callStatus === 'connected' && <Text style={[s.statusChip, s.statusConnected]}>● Connected</Text>}
          {callStatus === 'failed' && <Text style={[s.statusChip, s.statusFailed]}>Call failed</Text>}
        </View>
      ) : null}

      {/* Avatars */}
      <View style={s.avatarsRow}>
        <View style={s.avatarWrap}>
          <View style={[s.avatarRing, isListening && !isMuted && s.ringBlue]}>
            <View style={s.avatar}><Text style={{ fontSize: 22 }}>👨‍⚕️</Text></View>
          </View>
          <Text style={s.avatarName}>Provider</Text>
          <Text style={[s.avatarStatus, isListening && !isMuted && s.statusBlue, isMuted && s.statusMuted]}>
            {isMuted ? 'Muted' : isListening ? 'Listening…' : 'Standby'}
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
          <Text style={s.avatarName}>Patient</Text>
          <Text style={[s.avatarStatus, isSpeaking && s.statusWarm]}>
            {isSpeaking ? 'Speaking…' : 'Standby'}
          </Text>
        </View>
      </View>

      {/* Mute + Speaker */}
      <View style={s.controlsRow}>
        <TouchableOpacity style={[s.ctrlBtn, isMuted && s.ctrlBtnAlert]} onPress={onToggleMute} activeOpacity={0.7}>
          <Text style={s.ctrlIcon}>{isMuted ? '🔇' : '🎙'}</Text>
          <Text style={[s.ctrlLabel, isMuted && { color: C.alert }]}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.ctrlBtn, isSpeaker && s.ctrlBtnBlue]} onPress={onToggleSpeaker} activeOpacity={0.7}>
          <Text style={s.ctrlIcon}>{isSpeaker ? '🔊' : '🔈'}</Text>
          <Text style={[s.ctrlLabel, isSpeaker && { color: C.primary }]}>{isSpeaker ? 'Speaker On' : 'Speaker'}</Text>
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
  ghostBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.line },
  ghostBtnText: { fontSize: 13, color: C.inkMute, fontWeight: '600' },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bg, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.inkFaint },
  liveDotActive: { backgroundColor: '#22C55E' },
  timerText: { fontSize: 15, fontWeight: '700', color: C.inkMute, fontVariant: ['tabular-nums'] },
  timerTextActive: { color: C.ink },
  endBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10, backgroundColor: C.alertTint, borderWidth: 1, borderColor: '#F0A9A3' },
  endBtnText: { fontSize: 13, fontWeight: '800', color: C.alert },

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
  avatarName: { fontSize: 12, fontWeight: '700', color: C.ink2, marginBottom: 2 },
  avatarStatus: { fontSize: 10, color: C.inkFaint, fontWeight: '600' },
  statusBlue: { color: C.primary },
  statusWarm: { color: C.warm },
  statusMuted: { color: C.alert },

  dots: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.lineSoft },
  dotActive: { backgroundColor: C.primary },

  controlsRow: { flexDirection: 'row', gap: 10 },
  ctrlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  ctrlBtnAlert: { borderColor: '#F0A9A3', backgroundColor: C.alertTint },
  ctrlBtnBlue: { borderColor: C.primaryTint, backgroundColor: C.primaryTint },
  ctrlIcon: { fontSize: 16 },
  ctrlLabel: { fontSize: 12, fontWeight: '700', color: C.inkMute },
});
