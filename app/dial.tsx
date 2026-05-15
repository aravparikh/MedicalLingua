import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

const ROWS = [
  [{ d: '1', s: '' }, { d: '2', s: 'ABC' }, { d: '3', s: 'DEF' }],
  [{ d: '4', s: 'GHI' }, { d: '5', s: 'JKL' }, { d: '6', s: 'MNO' }],
  [{ d: '7', s: 'PQRS' }, { d: '8', s: 'TUV' }, { d: '9', s: 'WXYZ' }],
  [{ d: '*', s: '' }, { d: '0', s: '+' }, { d: '#', s: '' }],
];

function fmt(n: string) {
  const d = n.replace(/\D/g, '');
  const m = d.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!m) return n;
  if (m[3]) return `(${m[1]}) ${m[2]}-${m[3]}`;
  if (m[2]) return `(${m[1]}) ${m[2]}`;
  if (m[1]) return `(${m[1]}`;
  return '';
}

export default function DialScreen() {
  const router = useRouter();
  const [number, setNumber] = useState('');

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Consultation</Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Primary CTA — In-Person */}
        <View style={s.body}>
          <View style={s.primaryCard}>
            <View style={s.primaryIconWrap}>
              <Text style={{ fontSize: 36 }}>🩺</Text>
            </View>
            <Text style={s.primaryLabel}>In-Person Visit</Text>
            <Text style={s.primarySub}>
              Doctor and patient in the same room.{'\n'}
              MedLingua translates the conversation live.
            </Text>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => router.push('/call')}
              activeOpacity={0.85}
            >
              <Text style={s.primaryBtnText}>Start Session →</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or call a number</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Number display */}
          <Text style={[s.numberText, !number && s.numberPlaceholder]}>
            {number ? fmt(number) : '(___) ___-____'}
          </Text>

          {/* Dialpad */}
          <View style={s.pad}>
            {ROWS.map((row, i) => (
              <View key={i} style={s.padRow}>
                {row.map(btn => (
                  <TouchableOpacity
                    key={btn.d}
                    style={s.padBtn}
                    onPress={() => number.length < 14 && setNumber(p => p + btn.d)}
                    activeOpacity={0.6}
                  >
                    <Text style={s.padNum}>{btn.d}</Text>
                    {btn.s ? <Text style={s.padSub}>{btn.s}</Text> : null}
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Action row */}
            <View style={s.padRow}>
              <View style={{ width: 72, height: 72 }} />
              <TouchableOpacity
                style={[s.callBtn, !number && s.callBtnDisabled]}
                onPress={() => number && router.push({ pathname: '/call', params: { number } })}
                disabled={!number}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 28 }}>📞</Text>
              </TouchableOpacity>
              <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                {number.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setNumber(p => p.slice(0, -1))}
                    onLongPress={() => setNumber('')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={{ fontSize: 24, color: C.inkMute }}>⌫</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    height: 52,
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12,
    width: 70,
  },
  backText: { fontSize: 15, color: C.primary, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.ink2 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },

  primaryCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.line,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryLabel: { fontSize: 20, fontWeight: '700', color: C.ink, marginBottom: 6 },
  primarySub: { fontSize: 14, color: C.inkMute, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 99,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { fontSize: 12, fontWeight: '700', color: C.inkFaint, letterSpacing: 0.5 },

  numberText: { fontSize: 32, fontWeight: '300', color: C.ink, textAlign: 'center', letterSpacing: 2, marginBottom: 16 },
  numberPlaceholder: { color: C.inkFaint },

  pad: { gap: 6 },
  padRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  padBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1E2850', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  padNum: { fontSize: 28, color: C.ink, fontWeight: '300', lineHeight: 34 },
  padSub: { fontSize: 9, color: C.inkMute, fontWeight: '700', letterSpacing: 1.5 },

  callBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.listen,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.listen, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  callBtnDisabled: { backgroundColor: C.inkFaint, shadowOpacity: 0 },
});
