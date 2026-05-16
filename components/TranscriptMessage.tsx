import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import type { TranscriptEntry } from '../types';

interface Props {
  entry: TranscriptEntry;
  onEdit?: (id: string, newSpanish: string) => void;
}

export default function TranscriptMessage({ entry, onEdit }: Props) {
  const isProvider = entry.role === 'provider';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.originalText);

  useEffect(() => {
    setDraft(entry.originalText);
  }, [entry.originalText]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
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

  return (
    <Animated.View
      style={[
        styles.container,
        isProvider ? styles.containerProvider : styles.containerPatient,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.bubble, isProvider ? styles.bubbleProvider : styles.bubblePatient]}>
        {/* Main translated text */}
        <Text style={styles.translatedText}>{entry.translatedText}</Text>

        {/* Original spoken text — editable for patient entries */}
        <View style={styles.originalContainer}>
          <View style={styles.originalLabelRow}>
          <Text style={styles.originalLabel}>
              {isProvider ? 'Original del doctor (EN)' : 'Lo que usted dijo (ES)'}
            </Text>
            {!isProvider && onEdit && !editing && (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
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
                placeholderTextColor="#8A8E96"
              />
              <TouchableOpacity style={styles.doneBtn} onPress={commitEdit}>
                <Text style={styles.doneBtnText}>Re-translate</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.originalText}>{entry.originalText}</Text>
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
  },
  bubbleProvider: {
    backgroundColor: '#DCEAF6',
    borderColor: '#0F5BA855',
    borderBottomRightRadius: 6,
  },
  bubblePatient: {
    backgroundColor: '#DCEAE2',
    borderColor: '#2F8F7355',
    borderBottomLeftRadius: 6,
  },
  translatedText: {
    fontSize: 22,
    color: '#1A1B1F',
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  originalContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 27, 31, 0.12)',
    paddingTop: 10,
  },
  originalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  originalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#555960',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  editIcon: { fontSize: 18 },
  originalText: {
    fontSize: 16,
    color: '#2E3138',
    fontStyle: 'italic',
    lineHeight: 23,
  },
  editInputWrap: { gap: 8 },
  editInput: {
    fontSize: 16,
    color: '#1A1B1F',
    fontStyle: 'italic',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFFAA',
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
    color: '#2F8F73',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
