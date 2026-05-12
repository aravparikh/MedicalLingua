import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { TranscriptEntry } from '../types';

export default function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
  const isProvider = entry.role === 'provider';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        isProvider ? styles.containerProvider : styles.containerPatient,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.bubble, isProvider ? styles.bubbleProvider : styles.bubblePatient]}>
        {/* The Translated Text (Main Focus) */}
        <Text style={styles.translatedText}>{entry.translatedText}</Text>
        
        {/* Original Spoken Text (Smaller) */}
        <View style={styles.originalContainer}>
          <Text style={styles.originalLabel}>{isProvider ? 'You said (EN)' : 'They said (ES)'}</Text>
          <Text style={styles.originalText}>{entry.originalText}</Text>
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
  containerProvider: {
    justifyContent: 'flex-end',
  },
  containerPatient: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
  },
  bubbleProvider: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderColor: 'rgba(10, 132, 255, 0.3)',
    borderBottomRightRadius: 6,
  },
  bubblePatient: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: 'rgba(48, 209, 88, 0.3)',
    borderBottomLeftRadius: 6,
  },
  translatedText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  originalContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
  },
  originalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  originalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
