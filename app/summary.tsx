import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DisclaimerBanner from '../components/DisclaimerBanner';
import TranscriptMessage from '../components/TranscriptMessage';
import { generateCallSummary } from '../services/claude';
import { loadCalls, updateCall } from '../services/storage';
import type { CallRecord, CallSummary } from '../types';
import { formatDuration, formatTimestamp } from '../utils/format';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [call, setCall] = useState<CallRecord | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadCalls()
      .then((calls) => {
        const found = calls.find((c) => c.id === id) ?? null;
        setCall(found);
        if (found && !found.summary) {
          fetchSummary(found);
        }
      })
      .catch((e) => setError(String(e)));
  }, [id]);

  async function fetchSummary(record: CallRecord) {
    setIsSummarizing(true);
    try {
      const summary = await generateCallSummary(record.transcript);
      const updated = { ...record, summary };
      setCall(updated);
      await updateCall(updated);
    } catch (e) {
      setError('Could not generate summary. Check your API key and connection.');
    } finally {
      setIsSummarizing(false);
    }
  }

  if (!call) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <DisclaimerBanner />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call Summary</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Call meta */}
        <View style={styles.metaCard}>
          <Text style={styles.metaDate}>{formatTimestamp(call.startedAt)}</Text>
          {call.endedAt && (
            <Text style={styles.metaDuration}>
              Duration: {formatDuration(call.startedAt, call.endedAt)}
            </Text>
          )}
          <Text style={styles.metaEntries}>
            {call.transcript.length} exchange{call.transcript.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Summary card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 Extracted Information</Text>
        </View>

        {isSummarizing && (
          <View style={styles.summarizingRow}>
            <ActivityIndicator size="small" color="#1A237E" />
            <Text style={styles.summarizingText}>Generating summary with Claude…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {call.summary && <SummaryCard summary={call.summary} />}

        {/* Full transcript */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💬 Full Transcript</Text>
        </View>

        {call.transcript.map((entry) => (
          <TranscriptMessage key={entry.id} entry={entry} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ summary }: { summary: CallSummary }) {
  return (
    <View style={styles.summaryCard}>
      {summary.rawText ? (
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Overview</Text>
          <Text style={styles.summaryValue}>{summary.rawText}</Text>
        </View>
      ) : null}

      {summary.appointmentTime ? (
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>📅 Appointment</Text>
          <Text style={styles.summaryValue}>{summary.appointmentTime}</Text>
        </View>
      ) : null}

      {summary.medications.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>💊 Medications</Text>
          {summary.medications.map((med, i) => (
            <Text key={i} style={styles.summaryValue}>
              • {med.name} — {med.dose}
            </Text>
          ))}
        </View>
      )}

      {summary.followUpInstructions.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>✅ Follow-Up Instructions</Text>
          {summary.followUpInstructions.map((instr, i) => (
            <Text key={i} style={styles.summaryValue}>
              {i + 1}. {instr}
            </Text>
          ))}
        </View>
      )}

      {summary.keyNumbers.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>📞 Key Numbers</Text>
          {summary.keyNumbers.map((num, i) => (
            <Text key={i} style={styles.summaryValue}>
              • {num}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  backBtn: {
    width: 60,
  },
  backText: {
    fontSize: 14,
    color: '#1A237E',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    paddingBottom: 40,
  },
  metaCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  metaDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  metaDuration: {
    fontSize: 13,
    color: '#666',
  },
  metaEntries: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A237E',
  },
  summarizingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  summarizingText: {
    fontSize: 13,
    color: '#555',
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#B71C1C',
    lineHeight: 18,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    gap: 14,
  },
  summarySection: {
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    color: '#222',
    lineHeight: 20,
  },
});
