import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { deleteCall, loadCalls } from '../services/storage';
import type { CallRecord } from '../types';
import { formatDuration, formatTimestamp } from '../utils/format';

const C = {
  bg: '#F4F1EB',
  bgDeep: '#ECE7DC',
  surface: '#FFFFFF',
  surfaceSunk: '#FAF7F1',
  line: '#E5DFD2',
  lineSoft: '#EFEBE0',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkSoft: '#555960',
  inkMute: '#8A8E96',
  inkFaint: '#B5B3AB',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmStrong: '#8E5028',
  warmTint: '#F3E2D2',
  listen: '#2F8F73',
  listenTint: '#DCEAE2',
};

export default function HomeScreen() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadCalls().then(setCalls).catch(console.error);
    }, [])
  );

  function handleDelete(id: string) {
    deleteCall(id).then(() => setCalls(prev => prev.filter(c => c.id !== id)));
  }

  function renderCall({ item }: { item: CallRecord }) {
    const patientSnippet = item.transcript.find(e => e.role === 'patient')?.originalText?.slice(0, 60) ?? 'No transcript';
    const duration = item.endedAt ? formatDuration(item.startedAt, item.endedAt) : '—';
    const exchanges = item.transcript.length;

    return (
      <TouchableOpacity
        style={styles.session}
        onPress={() => router.push({ pathname: '/summary', params: { id: item.id } })}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.sessionTop}>
          <View style={styles.sessionAvatar}>
            <Text style={styles.sessionAvatarText}>🩺</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionDate}>{formatTimestamp(item.startedAt)}</Text>
            <Text style={styles.sessionMeta}>{duration} · {exchanges} exchange{exchanges !== 1 ? 's' : ''}</Text>
          </View>
          {item.summary && (
            <View style={styles.notesTag}>
              <Text style={styles.notesTagText}>Notes ready</Text>
            </View>
          )}
        </View>
        {patientSnippet && (
          <Text style={styles.sessionSnippet} numberOfLines={2}>
            <Text style={styles.sessionSnippetEs}>"{patientSnippet}"</Text>
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>

        {/* App bar */}
        <View style={styles.appbar}>
          <View style={{ width: 44 }} />
          <Text style={styles.wordmark}>MedLingua</Text>
          <View style={{ width: 44 }} />
        </View>

        <FlatList
          data={calls}
          keyExtractor={item => item.id}
          renderItem={renderCall}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* Hero */}
              <View style={styles.hero}>
                <Text style={styles.heroGreet}>Good morning, Maria</Text>
                <Text style={styles.heroTitle}>Estás lista para{'\n'}tu cita.</Text>
                <Text style={styles.heroSub}>
                  Tap below to start translating between you and your doctor — live, both ways.
                </Text>
              </View>

              {/* Quick actions */}
              <View style={styles.quickList}>
                <TouchableOpacity style={[styles.quickRow, styles.quickRowFirst]} onPress={() => router.push('/dial')} activeOpacity={0.8}>
                  <View style={[styles.quickIcon, { backgroundColor: C.listenTint }]}>
                    <Text style={{ fontSize: 20 }}>📞</Text>
                  </View>
                  <View style={styles.quickText}>
                    <Text style={styles.quickTitle}>Start translation</Text>
                    <Text style={styles.quickSub}>Call your doctor · live EN ↔ ES</Text>
                  </View>
                  <Text style={styles.quickChev}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickRow} onPress={() => router.push('/dashboard')} activeOpacity={0.8}>
                  <View style={[styles.quickIcon, { backgroundColor: C.warmTint }]}>
                    <Text style={{ fontSize: 20 }}>💊</Text>
                  </View>
                  <View style={styles.quickText}>
                    <Text style={styles.quickTitle}>My medications</Text>
                    <Text style={styles.quickSub}>Dashboard from your visit history</Text>
                  </View>
                  <Text style={styles.quickChev}>›</Text>
                </TouchableOpacity>
              </View>

              {/* Section header */}
              {calls.length > 0 && (
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Recent visits</Text>
                  <Text style={styles.sectionHint}>Hold to delete</Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◎</Text>
              <Text style={styles.emptyTitle}>No consultations yet</Text>
              <Text style={styles.emptySub}>Tap above to start your first translated medical consultation.</Text>
            </View>
          }
        />

        {/* Big CTA */}
        <View style={styles.dock}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/dial')}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 22 }}>🎙</Text>
            <Text style={styles.ctaText}>New Consultation</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 52 },
  wordmark: { fontStyle: 'italic', fontSize: 22, color: C.ink, letterSpacing: -0.3, fontWeight: '400' },

  listContent: { paddingBottom: 24 },

  hero: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 20 },
  heroGreet: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.inkMute },
  heroTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.7, lineHeight: 36, color: C.ink, marginTop: 6, marginBottom: 10 },
  heroSub: { fontSize: 15, lineHeight: 22, color: C.inkSoft },

  quickList: { marginHorizontal: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 24, overflow: 'hidden', shadowColor: '#1E2850', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderTopWidth: 1, borderTopColor: C.lineSoft },
  quickRowFirst: { borderTopWidth: 0 },
  quickIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 16, fontWeight: '600', color: C.ink, letterSpacing: -0.1 },
  quickSub: { fontSize: 13, color: C.inkMute, marginTop: 1 },
  quickChev: { fontSize: 20, color: C.inkFaint },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.inkMute },
  sectionHint: { fontSize: 12, color: C.inkFaint },

  session: { marginHorizontal: 16, marginBottom: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 16, shadowColor: '#1E2850', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sessionAvatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sessionAvatarText: { fontSize: 20 },
  sessionDate: { fontSize: 14, fontWeight: '600', color: C.ink, letterSpacing: -0.1 },
  sessionMeta: { fontSize: 12, color: C.inkMute, marginTop: 2 },
  notesTag: { backgroundColor: C.listenTint, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  notesTagText: { fontSize: 11, fontWeight: '700', color: C.listen, letterSpacing: 0.2 },
  sessionSnippet: { fontSize: 14, lineHeight: 20, color: C.inkSoft },
  sessionSnippetEs: { fontStyle: 'italic', color: C.warmStrong },

  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 40, gap: 10 },
  emptyIcon: { fontSize: 36, color: C.inkFaint },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.ink, textAlign: 'center' },
  emptySub: { fontSize: 14, color: C.inkMute, textAlign: 'center', lineHeight: 20 },

  dock: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.lineSoft, backgroundColor: C.bg },
  cta: { borderRadius: 999, minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.primary, shadowColor: C.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.1 },
});
