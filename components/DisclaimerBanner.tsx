import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const animatedStyle = {
    opacity: opacity,
    transform: [{ translateY: translateY }],
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={40} tint="dark" style={styles.toast}>
        <Text style={styles.text}>
          <Text style={{fontSize: 16}}>⚠️</Text>  <Text style={styles.bold}>Translation aid only.</Text> Not medical advice.
        </Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 100,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: 'rgba(255, 204, 0, 0.15)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.4)',
    overflow: 'hidden',
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#FFD60A',
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  bold: {
    fontWeight: '800',
  },
  dismissBtn: {
    marginLeft: 12,
    padding: 4,
    backgroundColor: 'rgba(255,204,0,0.1)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '800',
  },
});
