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
  bgDeep: '#ECE7DC',
  surface: '#FFFFFF',
  line: '#E5DFD2',
  lineSoft: '#EFEBE0',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkSoft: '#555960',
  inkMute: '#8A8E96',
  inkFaint: '#B5B3AB',
  primary: '#0F5BA8',
  primaryTint: '#DCEAF6',
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

const ROWS = [
  [{ n: '1', s: '' },      { n: '2', s: 'ABC' },  { n: '3', s: 'DEF' }],
  [{ n: '4', s: 'GHI' },  { n: '5', s: 'JKL' },  { n: '6', s: 'MNO' }],
  [{ n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' },  { n: '9', s: 'WXYZ' }],
  [{ n: '*', s: '' },      { n: '0', s: '+' },     { n: '#', s: '' }],
];

function fmt(raw: string) {
  const d = raw.replace(/\D/g, '');
  const m = d.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!m) return raw;
  if (m[3]) return `(${m[1]}) ${m[2]}-${m[3]}`;
  if (m[2]?.length) return `(${m[1]}) ${m[2]}`;
  if (m[1]?.length) return `(${m[1]}`;
  return '';
}

export default function DialScreen() {
  const router = useRouter();
  const [number, setNumber] = useState('');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* App bar */}
        <View style={styles.appbar}>
          <TouchableOpacity style={styles.appbarBtn} onPress={() => router.back()}>
            <Text style={{ fontSize: 18, color: C.ink2 }}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.appbarSub}>Step 1 of 2</Text>
            <Text style={styles.appbarTitle}>Call your doctor</Text>
          </View>
          <View style={styles.appbarBtn} />
        </View>

        {/* Number display */}
        <View style={styles.numberArea}>
          <View style={styles.countryRow}>
            <Text style={styles.countryFlag}>🇺🇸</Text>
            <Text style={styles.countryCode}>+1</Text>
          </View>
          <Text style={[styles.numberText, !number && styles.numberPlaceholder]}>
            {number ? fmt(number) : 'Enter number'}
          </Text>
          {number.length > 0 && (
            <Text style={styles.numberHint}>MedLingua will translate the call live ✓</Text>
          )}
        </View>

        {/* Dialpad */}
        <View style={styles.dialpad}>
          {ROWS.map((row, ri) => (
            <View key={ri} style={styles.dialRow}>
              {row.map(btn => (
                <TouchableOpacity
                  key={btn.n}
                  style={styles.dialBtn}
                  onPress={() => number.length < 15 && setNumber(p => p + btn.n)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.dialNum}>{btn.n}</Text>
                  {btn.s ? <Text style={styles.dialSub}>{btn.s}</Text> : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Call + delete row */}
          <View style={styles.dialRow}>
            <View style={{ width: 80 }} />
            <TouchableOpacity
              style={[styles.callBtn, !number && styles.callBtnDisabled]}
              onPress={() => router.push({ pathname: '/call', params: { number: number || '' } })}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 30 }}>📞</Text>
            </TouchableOpacity>
            <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
              {number.length > 0 && (
                <TouchableOpacity
                  onPress={() => setNumber(p => p.slice(0, -1))}
                  onLongPress={() => setNumber('')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.deleteBtn}>⌫</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* In-person skip */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => router.push('/call')}>
            <Text style={styles.skipText}>In-person visit — no call needed →</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 52 },
  appbarBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: C.lineSoft, alignItems: 'center', justifyContent: 'center' },
  appbarSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: C.inkMute },
  appbarTitle: { fontSize: 16, fontWeight: '700', color: C.ink2 },

  numberArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  countryFlag: { fontSize: 18 },
  countryCode: { fontSize: 15, fontWeight: '700', color: C.ink },
  numberText: { fontSize: 42, fontWeight: '300', color: C.ink, letterSpacing: 1.5 },
  numberPlaceholder: { color: C.inkFaint },
  numberHint: { fontSize: 13, color: C.listen, fontWeight: '600', letterSpacing: 0.2 },

  dialpad: { paddingHorizontal: 32, paddingBottom: 24, gap: 14 },
  dialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dialBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', shadowColor: '#1E2850', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  dialNum: { fontSize: 32, fontWeight: '300', color: C.ink, lineHeight: 38 },
  dialSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: C.inkMute, textTransform: 'uppercase' },

  callBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.listen, alignItems: 'center', justifyContent: 'center', shadowColor: C.listen, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 8 },
  callBtnDisabled: { backgroundColor: C.bgDeep, shadowOpacity: 0 },
  deleteBtn: { fontSize: 26, color: C.inkSoft },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, color: C.primary, fontWeight: '600' },
});
