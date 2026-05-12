import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';

export default function DialScreen() {
  const router = useRouter();
  const [number, setNumber] = useState('');

  // Background ambient animation
  const bgAnim1 = useRef(new Animated.Value(0)).current;
  const bgAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim1, { toValue: 1, duration: 15000, useNativeDriver: true }),
        Animated.timing(bgAnim1, { toValue: 0, duration: 15000, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim2, { toValue: 1, duration: 20000, useNativeDriver: true }),
        Animated.timing(bgAnim2, { toValue: 0, duration: 20000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handlePress = (digit: string) => {
    if (number.length < 15) {
      setNumber(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    router.push({ pathname: '/call', params: { number: number || '' } });
  };

  // Format number for display
  const formatDisplayNumber = (num: string) => {
    if (!num) return 'Dial Number';
    let cleaned = ('' + num).replace(/\D/g, '');
    let match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return num;
    
    if (match[3]) return `(${match[1]}) ${match[2]}-${match[3]}`;
    if (match[2]) return `(${match[1]}) ${match[2]}`;
    if (match[1]) return `(${match[1]}`;
    return num;
  };

  const rows = [
    [{ num: '1', letters: '' }, { num: '2', letters: 'A B C' }, { num: '3', letters: 'D E F' }],
    [{ num: '4', letters: 'G H I' }, { num: '5', letters: 'J K L' }, { num: '6', letters: 'M N O' }],
    [{ num: '7', letters: 'P Q R S' }, { num: '8', letters: 'T U V' }, { num: '9', letters: 'W X Y Z' }],
    [{ num: '*', letters: '' }, { num: '0', letters: '+' }, { num: '#', letters: '' }]
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deep Space Glassmorphism Background */}
      <Animated.View style={[styles.orb1, { transform: [{ translateX: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }, { translateY: bgAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateX: bgAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }, { translateY: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }] }]} />
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Number Display Area */}
        <View style={styles.numberDisplayContainer}>
          
          {/* Sexy International Calling Pill */}
          <TouchableOpacity style={styles.countryPicker} activeOpacity={0.7}>
            <Text style={styles.flagEmoji}>🇺🇸</Text>
            <Text style={styles.countryCode}>+1</Text>
            <Text style={styles.dropdownIcon}>▾</Text>
          </TouchableOpacity>

          {/* Number */}
          <Text style={[styles.numberText, !number && styles.numberPlaceholder]}>
            {formatDisplayNumber(number)}
          </Text>

          <TouchableOpacity style={styles.addContactBtn}>
            <Text style={styles.addContactText}>
              {number.length > 0 ? 'Add to patient records' : ' '}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium iOS-style Dialpad */}
        <View style={styles.dialpadContainer}>
          {rows.map((row, i) => (
            <View key={i} style={styles.dialRow}>
              {row.map((btn) => (
                <TouchableOpacity
                  key={btn.num}
                  style={styles.dialButton}
                  onPress={() => handlePress(btn.num)}
                  activeOpacity={0.5}
                >
                  <View style={styles.dialButtonInner}>
                    <Text style={styles.dialNum}>{btn.num}</Text>
                    {btn.letters ? <Text style={styles.dialLetters}>{btn.letters}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Action Row */}
          <View style={styles.actionRow}>
            <View style={styles.actionPlaceholder} />
            
            <TouchableOpacity 
              style={styles.callButton} 
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
            
            <View style={styles.actionPlaceholder}>
              {number.length > 0 && (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} onLongPress={() => setNumber('')}>
                  <Text style={styles.deleteIcon}>⌫</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050A',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orb1: {
    position: 'absolute',
    top: '5%',
    left: '-20%',
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(10, 132, 255, 0.4)',
    filter: 'blur(60px)',
  },
  orb2: {
    position: 'absolute',
    bottom: '15%',
    right: '-20%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(48, 209, 88, 0.3)',
    filter: 'blur(70px)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '400',
  },
  numberDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  flagEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCode: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  dropdownIcon: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  numberText: {
    fontSize: 44,
    fontWeight: '300',
    color: '#FFF',
    letterSpacing: 1.5,
    height: 60,
  },
  numberPlaceholder: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  addContactBtn: {
    marginTop: 12,
    height: 24,
  },
  addContactText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '500',
  },
  dialpadContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 16,
  },
  dialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dialButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialNum: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: '300',
    lineHeight: 42,
  },
  dialLetters: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  actionPlaceholder: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#30D158',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  callButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.2,
  },
  callIcon: {
    fontSize: 38,
  },
  deleteButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
