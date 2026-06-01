import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity } from 'react-native';
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
    safetyVerified: '🛡️ Seguridad verificada',
    caughtError: 'Detectamos un error peligroso',
    warningLabel: 'Atención',
  },
  en: {
    doctorOriginalEn: 'Doctor original (EN)',
    doctorTranslatedEs: 'Spanish translation',
    youSaidEs: 'Patient original (ES)',
    youSaidTranslatedEn: 'English translation',
    retranslate: 'Re-translate',
    safetyVerified: '🛡️ Safety verified',
    caughtError: 'We caught a dangerous error',
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
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  // For patient entries:
  //   originalText = what they said in Spanish
  //   translatedText = English translation shown to doctor
  // For provider entries:
  //   originalText = what they said in English
  //   translatedText = Spanish translation played to patient

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
                  <Text style={[styles.safetyTitle, isCaught ? styles.safetyTitleCaught : styles.safetyTitleWarning]}>
                    {isCaught ? `🛡️  ${flag.title}` : `⚠️  ${flag.title}`}
                  </Text>
                  <Text style={[styles.safetyDetail, isCaught ? styles.safetyDetailCaught : styles.safetyDetailWarning]}>
                    {flag.detail}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.safetyVerifiedRow}>
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
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.editIcon}>✏️</Text>
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
  containerProvider: { justifyContent: 'flex-end' },
  containerPatient: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '90%',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    ...Shadows.glass,
  },
  bubbleProvider: {
    backgroundColor: C.primaryTint,
    borderColor: C.primary,
    borderBottomRightRadius: 6,
  },
  bubblePatient: {
    backgroundColor: C.listenTint,
    borderColor: C.listen,
    borderBottomLeftRadius: 6,
  },
  safetyVerifiedRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47, 143, 115, 0.12)',
    borderWidth: 1, borderColor: 'rgba(47, 143, 115, 0.35)',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  safetyVerifiedText: {
    fontSize: 16, fontWeight: '900', color: '#0F766E', letterSpacing: 0.3,
  },
  safetyStack: { gap: 8, marginBottom: 12 },
  safetyChip: {
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  safetyCaught: {
    backgroundColor: '#FCEBE7', borderColor: '#E2887C',
  },
  safetyWarning: {
    backgroundColor: '#FFF7DC', borderColor: '#E5CD7A',
  },
  safetyTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.2, marginBottom: 4 },
  safetyTitleCaught: { color: '#DC2626' },
  safetyTitleWarning: { color: '#7A5E15' },
  safetyDetail: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  safetyDetailCaught: { color: '#DC2626' },
  safetyDetailWarning: { color: '#7A5E15' },
  translatedText: {
    fontSize: 22,
    color: C.ink,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  originalContainer: {
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 10,
  },
  originalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  originalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: C.inkMute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  editIcon: { fontSize: 18 },
  originalText: {
    fontSize: 16,
    color: C.ink2,
    fontStyle: 'italic',
    lineHeight: 23,
    textTransform: 'none',
  },
  editInputWrap: { gap: 8 },
  editInput: {
    fontSize: 16,
    color: C.ink,
    fontStyle: 'italic',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surfaceSolid,
    minHeight: 60,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.4)',
  },
  doneBtnText: {
    color: '#0D9488',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
