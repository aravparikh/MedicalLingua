import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View style={[s.wrap, { opacity, transform: [{ translateY }] }]}>
      <View style={s.banner}>
        <Text style={s.icon}>⚠️</Text>
        <Text style={s.text}>
          <Text style={s.bold}>Translation aid only.</Text>{'  '}Not a substitute for professional medical advice.
        </Text>
        <TouchableOpacity onPress={dismiss} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F59E0B33',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
  bold: { fontWeight: '800' },
  closeBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(146,64,14,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 10, fontWeight: '800', color: '#92400E' },
});
