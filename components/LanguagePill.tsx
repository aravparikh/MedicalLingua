import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { AppLanguage } from '../services/preferences';

interface Props {
  lang: AppLanguage;
  onToggle: () => void;
  variant?: 'light' | 'dark';
}

export default function LanguagePill({ lang, onToggle, variant = 'light' }: Props) {
  const isDark = variant === 'dark';
  return (
    <TouchableOpacity
      style={[s.pill, isDark && s.pillDark]}
      onPress={onToggle}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={`Change language to ${lang === 'es' ? 'English' : 'Spanish'}`}
    >
      <Text style={[s.option, lang === 'es' && s.optionActive, isDark && lang !== 'es' && s.optionDark]}>ES</Text>
      <View style={[s.sep, isDark && s.sepDark]} />
      <Text style={[s.option, lang === 'en' && s.optionActive, isDark && lang !== 'en' && s.optionDark]}>EN</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#E5DFD2',
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
    shadowColor: '#1E2850',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pillDark: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)' },
  option: {
    fontSize: 16,
    fontWeight: '800',
    color: '#666A73',
    paddingHorizontal: 10,
    paddingVertical: 6,
    letterSpacing: 0.5,
    overflow: 'hidden',
    borderRadius: 99,
  },
  optionDark: { color: 'rgba(255,255,255,0.55)' },
  optionActive: { color: '#FFFFFF', backgroundColor: '#0F5BA8' },
  sep: { width: 1, height: 14, backgroundColor: '#E5DFD2', marginHorizontal: 2 },
  sepDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
});
