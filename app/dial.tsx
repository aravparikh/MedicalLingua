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
import { hapticLight, hapticMedium } from '../utils/haptics';

const C = {
  bg: '#F4F1EB',
  surface: '#FFFFFF',
  line: '#E5DFD2',
  ink: '#1A1B1F',
  inkSoft: '#555960',
  primary: '#0F5BA8',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
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

  function startInPerson() {
    hapticMedium();
    router.push('/call');
  }

  function startPhoneVisit() {
    hapticMedium();
    router.push({ pathname: '/call', params: { number } });
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              router.back();
            }}
            style={s.backBtn}
          >
            <Text style={s.backText}>Atrás</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Visita médica</Text>
          <View style={{ width: 72 }} />
        </View>

        <View style={s.body}>
          <View style={s.primaryCard}>
            <View style={s.primaryIconWrap}>
              <Text style={{ fontSize: 40 }}>🩺</Text>
            </View>
            <Text style={s.primaryLabel}>Estoy con mi doctor</Text>
            <Text style={s.primarySub}>
              Use esto en la sala médica. Toque cuando hable el doctor y cuando hable usted.
            </Text>
            <TouchableOpacity style={s.primaryBtn} onPress={startInPerson} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Empezar ahora</Text>
            </TouchableOpacity>
          </View>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>si está en una llamada</Text>
            <View style={s.dividerLine} />
          </View>

          <Text style={s.phoneHelp}>
            Llame con la app Teléfono, ponga altavoz y regrese a MedLingua. Este número solo se guarda como etiqueta.
          </Text>

          <Text style={[s.numberText, !number && s.numberPlaceholder]}>
            {number ? fmt(number) : '(___) ___-____'}
          </Text>

          <View style={s.pad}>
            {ROWS.map((row, i) => (
              <View key={i} style={s.padRow}>
                {row.map(digit => (
                  <TouchableOpacity
                    key={digit}
                    style={s.padBtn}
                    onPress={() => {
                      hapticLight();
                      if (number.length < 14) setNumber(p => p + digit);
                    }}
                    activeOpacity={0.72}
                  >
                    <Text style={s.padNum}>{digit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <View style={s.padRow}>
              <View style={{ width: 72, height: 72 }} />
              <TouchableOpacity
                style={[s.callBtn, !number && s.callBtnDisabled]}
                onPress={startPhoneVisit}
                disabled={!number}
                activeOpacity={0.8}
              >
                <Text style={s.callText}>Usar</Text>
              </TouchableOpacity>
              <View style={s.deleteSlot}>
                {number.length > 0 && (
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => {
                      hapticLight();
                      setNumber(p => p.slice(0, -1));
                    }}
                    onLongPress={() => setNumber('')}
                  >
                    <Text style={s.deleteText}>⌫</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, minHeight: 62 },
  backBtn: { minWidth: 72, minHeight: 60, justifyContent: 'center' },
  backText: { fontSize: 18, color: C.primary, fontWeight: '900' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.ink },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  primaryCard: {
    backgroundColor: C.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: C.line,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryIconWrap: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: C.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryLabel: { fontSize: 26, fontWeight: '900', color: C.ink, marginBottom: 8, textAlign: 'center' },
  primarySub: { fontSize: 18, color: C.inkSoft, textAlign: 'center', lineHeight: 26, marginBottom: 22, fontWeight: '600' },
  primaryBtn: { minHeight: 66, borderRadius: 99, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  primaryBtnText: { fontSize: 21, fontWeight: '900', color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { fontSize: 16, fontWeight: '900', color: C.warm },
  phoneHelp: { fontSize: 17, lineHeight: 24, color: C.inkSoft, textAlign: 'center', fontWeight: '700', marginBottom: 14 },
  numberText: { fontSize: 34, fontWeight: '700', color: C.ink, textAlign: 'center', letterSpacing: 1.3, marginBottom: 16 },
  numberPlaceholder: { color: C.inkSoft },
  pad: { gap: 8 },
  padRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  padBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padNum: { fontSize: 30, color: C.ink, fontWeight: '700' },
  callBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.listen, alignItems: 'center', justifyContent: 'center' },
  callBtnDisabled: { backgroundColor: '#B5B3AB' },
  callText: { fontSize: 18, color: '#fff', fontWeight: '900' },
  deleteSlot: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { minWidth: 60, minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 28, color: C.inkSoft, fontWeight: '900' },
});
