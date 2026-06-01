import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TranscriptEntry } from '../types';
import { Theme as C, Shadows } from '../constants/theme';

type Lang = 'es' | 'en';

const L = {
  es: {
    doctorOriginalEn: 'Original del doctor (EN)',
    doctorTranslatedEs: 'Traducción al español',
    youSaidEs: 'Lo que usted dijo (ES)',
    youSaidTranslatedEn: 'Traducción al inglés',
    retranslate: 'Re-traducir',
    safetyVerified: 'Seguridad verificada',
    warningLabel: 'Atención',
  },
  en: {
    doctorOriginalEn: 'Doctor original (EN)',
    doctorTranslatedEs: 'Spanish translation',
    youSaidEs: 'Patient original (ES)',
    youSaidTranslatedEn: 'English translation',
    retranslate: 'Re-translate',
    safetyVerified: 'Safety verified',
    warningLabel: 'Heads up',
  },
};

interface Props {
  entry: TranscriptEntry;
  lang?: Lang;
  onEdit?: (id: string, newSpanish: string) => void;
}

export default function TranscriptMessage({ entry, lang = 'es', onEdit }: Props) {
  const isProvider = entry.role === 'provider';
  const t = L[lang];

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.originalText);

  useEffect(() => {
    setDraft(entry.originalText);
  }, [entry.originalText]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  function commitEdit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== entry.originalText) {
      onEdit?.(entry.id, trimmed);
    }
  }

  // Figure out which text is in Spanish vs English
  const spanishText = isProvider ? entry.translatedText : entry.originalText;
  const englishText = isProvider ? entry.originalText : entry.translatedText;

  // The user's preferred language is the BIG (prominent) text
  const bigText = lang === 'es' ? spanishText : englishText;
  const smallText = lang === 'es' ? englishText : spanishText;
  const smallLabel = isProvider
    ? (lang === 'es' ? t.doctorOriginalEn : t.doctorTranslatedEs)
    : (lang === 'es' ? t.youSaidTranslatedEn : t.youSaidEs);

  // Edit is only allowed on patient entries, and only edits the Spanish original
  const canEdit = !isProvider && !!onEdit;
  // Whether the small text is currently showing the Spanish original (editable)
  const smallIsEditable = canEdit && smallText === entry.originalText;

  return (
    <Animated.View
      style={[
        styles.container,
        isProvider ? styles.containerProvider : styles.containerPatient,
        { opacity: fadeAnim },
      ]}
    >
      <View style={[styles.bubble, isProvider ? styles.bubbleProvider : styles.bubblePatient]}>
        {/* Safety guardrail chip — only shows if AI caught/flagged something */}
        {entry.safetyFlags && entry.safetyFlags.length > 0 ? (
          <View style={styles.safetyStack}>
            {entry.safetyFlags.map((flag, i) => {
              const isCaught = flag.level === 'caught';
              return (
                <View
                  key={i}
                  style={[styles.safetyChip, isCaught ? styles.safetyCaught : styles.safetyWarning]}
                >
                  <View style={styles.safetyTitleRow}>
                    <Ionicons
                      name={isCaught ? 'shield-checkmark' : 'warning-outline'}
                      size={18}
                      color={isCaught ? C.alert : '#B91C1C'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.safetyTitle, isCaught ? styles.safetyTitleCaught : styles.safetyTitleWarning]}>
                      {flag.title}
                    </Text>
                  </View>
                  <Text style={[styles.safetyDetail, isCaught ? styles.safetyDetailCaught : styles.safetyDetailWarning]}>
                    {flag.detail}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.safetyVerifiedRow}>
            <Ionicons name="shield-checkmark" size={14} color="#0F766E" style={{ marginRight: 4 }} />
            <Text style={styles.safetyVerifiedText}>{t.safetyVerified}</Text>
          </View>
        )}

        {/* Main text in user's preferred language */}
        <Text style={styles.translatedText}>{bigText}</Text>

        {/* Counterpart text — editable for patient Spanish originals */}
        <View style={styles.originalContainer}>
          <View style={styles.originalLabelRow}>
            <Text style={styles.originalLabel}>{smallLabel}</Text>
            {smallIsEditable && !editing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={16} color={C.warm} />
              </TouchableOpacity>
            )}
          </View>

          {editing && smallIsEditable ? (
            <View style={styles.editInputWrap}>
              <TextInput
                style={styles.editInput}
                value={draft}
                onChangeText={setDraft}
                multiline
                autoFocus
                onSubmitEditing={commitEdit}
                blurOnSubmit
                onBlur={commitEdit}
                placeholderTextColor="#667085"
              />
              <TouchableOpacity style={styles.doneBtn} onPress={commitEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.doneBtnText}>{t.retranslate}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.originalText}>{smallText}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
  },
  containerProvider: { justifyContent: 'flex-start' }, // Doctor: aligned left
  containerPatient: { justifyContent: 'flex-end' },   // Patient (user): aligned right
  
  bubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    ...Shadows.glass,
  },
  bubbleProvider: {
    backgroundColor: C.primaryTint, // doctor blue tint
    borderColor: C.primary,
    borderBottomLeftRadius: 4, // tail on left
  },
  bubblePatient: {
    backgroundColor: C.warmTint, // patient orange tint (matching mic colors)
    borderColor: C.warm,
    borderBottomRightRadius: 4, // tail on right
  },
  
  safetyVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47, 143, 115, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(47, 143, 115, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  safetyVerifiedText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 0.2,
  },
  
  safetyStack: { gap: 6, marginBottom: 10 },
  safetyChip: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  safetyCaught: {
    backgroundColor: '#FCEBE7',
    borderColor: '#E2887C',
  },
  safetyWarning: {
    backgroundColor: '#FFF7DC',
    borderColor: '#E5CD7A',
  },
  safetyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  safetyTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.2 },
  safetyTitleCaught: { color: C.alert },
  safetyTitleWarning: { color: '#B91C1C' },
  safetyDetail: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  safetyDetailCaught: { color: C.alert },
  safetyDetailWarning: { color: '#B91C1C' },
  
  translatedText: {
    fontSize: 18,
    color: C.ink,
    fontWeight: '700',
    lineHeight: 25,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  originalContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
  },
  originalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  originalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.inkMute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originalText: {
    fontSize: 14,
    color: C.inkSoft,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  editInputWrap: { gap: 8 },
  editInput: {
    fontSize: 14,
    color: C.ink,
    fontStyle: 'italic',
    lineHeight: 18,
    borderWidth: 1,
    borderColor: C.warm,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.surfaceSolid,
    minHeight: 50,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    backgroundColor: C.warmTint,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.warm,
  },
  doneBtnText: {
    color: C.warm,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
