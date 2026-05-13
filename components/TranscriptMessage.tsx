import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import type { TranscriptEntry } from '../types';

const C = {
  surface: '#FFFFFF',
  line: '#E5DFD2',
  lineSoft: '#EFEBE0',
  ink: '#1A1B1F',
  ink2: '#2E3138',
  inkSoft: '#555960',
  inkMute: '#8A8E96',
  primary: '#0F5BA8',
  primaryStrong: '#0A4682',
  primaryTint: '#DCEAF6',
  warm: '#B66A3E',
  warmStrong: '#8E5028',
  warmTint: '#F3E2D2',
};

interface Props {
  entry: TranscriptEntry;
  onEdit?: (id: string, newSpoken: string) => void;
}

export default function TranscriptMessage({ entry, onEdit }: Props) {
  const isProvider = entry.role === 'provider';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.originalText);

  useEffect(() => { setDraft(entry.originalText); }, [entry.originalText]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  function commitEdit() {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== entry.originalText) onEdit?.(entry.id, t);
  }

  const accentColor = isProvider ? C.primary : C.warm;
  const accentTint  = isProvider ? C.primaryTint : C.warmTint;
  const tagColor    = isProvider ? C.primaryStrong : C.warmStrong;

  return (
    <Animated.View style={[
      styles.container,
      isProvider ? styles.containerRight : styles.containerLeft,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <View style={styles.bubble}>

        <View style={styles.tagRow}>
          <View style={[styles.tagDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.tagText, { color: tagColor }]}>
            {isProvider ? 'You said (EN)' : 'They said (ES)'}
          </Text>
        </View>

        {/* Main translated text */}
        <Text style={styles.translatedText}>{entry.translatedText}</Text>

        <View style={styles.divider} />

        {/* Original — editable for patient entries */}
        <View style={styles.originalSection}>
          <View style={styles.originalLabelRow}>
            <Text style={styles.originalLabel}>
              {isProvider ? 'EN original' : 'ES original'}
            </Text>
            {!isProvider && onEdit && !editing && (
              <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
                <Text style={[styles.editIcon, { color: accentColor }]}>✏️  Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View>
              <TextInput
                style={[styles.editInput, { borderColor: accentColor, backgroundColor: accentTint }]}
                value={draft}
                onChangeText={setDraft}
                multiline
                autoFocus
                onBlur={commitEdit}
                selectionColor={accentColor}
              />
              <TouchableOpacity style={[styles.retranslateBtn, { backgroundColor: accentColor }]} onPress={commitEdit}>
                <Text style={styles.retranslateBtnText}>Re-translate ↑</Text>
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
  container: { marginVertical: 6, marginHorizontal: 16, flexDirection: 'row' },
  containerRight: { justifyContent: 'flex-end' },
  containerLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '88%',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  translatedText: { paddingHorizontal: 16, paddingBottom: 12, fontSize: 17, fontWeight: '600', color: C.ink, lineHeight: 24 },
  divider: { height: 1, backgroundColor: C.lineSoft, marginHorizontal: 16 },
  originalSection: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  originalLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  originalLabel: { fontSize: 10, fontWeight: '800', color: C.inkMute, textTransform: 'uppercase', letterSpacing: 0.5 },
  editIcon: { fontSize: 12, fontWeight: '700' },
  originalText: { fontSize: 14, fontStyle: 'italic', color: C.inkSoft, lineHeight: 20 },
  editInput: { fontSize: 15, fontWeight: '500', color: C.ink, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, marginBottom: 8 },
  retranslateBtn: { alignSelf: 'flex-end', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  retranslateBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
