import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

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
  isListening,
  isSpeaking,
  isMuted,
  isSpeaker,
  callStartedAt,
  dialedNumber,
  callStatus,
  onClearChat,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
}: Props) {
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartedAt) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setDuration(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStartedAt]);

  const formatNumber = (num: string) => {
    const d = num.replace(/\D/g, '');
    if (!d) return null;
    const m = d.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!m) return num;
    if (m[3]) return `(${m[1]}) ${m[2]}-${m[3]}`;
    if (m[2]) return `(${m[1]}) ${m[2]}`;
    return `(${m[1]}`;
  };

  const displayNumber = formatNumber(dialedNumber ?? '');

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={60} tint="dark" style={styles.container}>

        {/* Top row: Clear | timer | End Call */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onClearChat} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>

          <View style={styles.liveBadge}>
            <View style={[styles.redDot, (isListening || isSpeaking) && styles.dotActive]} />
            <Text style={styles.liveText}>{duration}</Text>
          </View>

          <TouchableOpacity onPress={onEndCall} style={styles.endButton}>
            <Text style={styles.endText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Dialed number + call status */}
        {displayNumber && (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.dialedNumber}>{displayNumber}</Text>
            {callStatus === 'connecting' && (
              <Text style={styles.callStatusText}>Connecting…</Text>
            )}
            {callStatus === 'failed' && (
              <Text style={[styles.callStatusText, { color: '#FF6B6B' }]}>Call failed</Text>
            )}
          </View>
        )}

        {/* Avatars row */}
        <View style={styles.avatarsRow}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarRing, isListening && !isMuted && styles.ringActiveProvider]}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
              </View>
            </View>
            <Text style={styles.avatarLabel}>Provider (EN)</Text>
            <Text style={[
              styles.statusLabel,
              isListening && !isMuted && styles.statusActive,
              isMuted && styles.statusMuted,
            ]}>
              {isMuted ? 'Muted' : isListening ? 'Listening…' : 'Standby'}
            </Text>
          </View>

          <View style={styles.connectionLine}>
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[styles.lineDot, (isListening || isSpeaking) && !isMuted && styles.lineDotActive]}
              />
            ))}
          </View>

          <View style={styles.avatarContainer}>
            <View style={[styles.avatarRing, isSpeaking && styles.ringActivePatient]}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>🧑🏽‍🦱</Text>
              </View>
            </View>
            <Text style={styles.avatarLabel}>Patient (ES)</Text>
            <Text style={[styles.statusLabel, isSpeaking && styles.statusPatient]}>
              {isSpeaking ? 'Speaking…' : 'Standby'}
            </Text>
          </View>
        </View>

        {/* In-call controls: Mute | Speaker */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={onToggleMute}
            activeOpacity={0.7}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎙'}</Text>
            <Text style={[styles.controlLabel, isMuted && styles.controlLabelActive]}>
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.controlBtnSpeaker]}
            onPress={onToggleSpeaker}
            activeOpacity={0.7}
          >
            <Text style={styles.controlIcon}>{isSpeaker ? '🔊' : '🔈'}</Text>
            <Text style={[styles.controlLabel, isSpeaker && styles.controlLabelSpeaker]}>
              {isSpeaker ? 'Speaker On' : 'Speaker'}
            </Text>
          </TouchableOpacity>
        </View>

      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    zIndex: 10,
  },
  container: {
    borderRadius: 28,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(20, 20, 30, 0.4)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    minWidth: 72,
    justifyContent: 'center',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FF453A',
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  liveText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  clearText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: 'rgba(255,69,58,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.4)',
  },
  endText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '800',
  },
  dialedNumber: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  callStatusText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    width: 100,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ringActiveProvider: {
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(10,132,255,0.2)',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  ringActivePatient: {
    borderColor: '#30D158',
    backgroundColor: 'rgba(48,209,88,0.2)',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  avatarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EBEBF5',
    letterSpacing: 0.2,
  },
  statusLabel: {
    fontSize: 10,
    color: 'rgba(235,235,245,0.35)',
    marginTop: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusActive: { color: '#0A84FF' },
  statusMuted: { color: '#FF453A' },
  statusPatient: { color: '#30D158' },
  connectionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lineDotActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  // In-call controls row
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,69,58,0.2)',
    borderColor: 'rgba(255,69,58,0.5)',
  },
  controlBtnSpeaker: {
    backgroundColor: 'rgba(10,132,255,0.2)',
    borderColor: 'rgba(10,132,255,0.5)',
  },
  controlIcon: { fontSize: 20 },
  controlLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlLabelActive: { color: '#FF453A' },
  controlLabelSpeaker: { color: '#0A84FF' },
});
