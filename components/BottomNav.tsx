import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hapticLight, hapticMedium } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';

export type NavTab = 'home' | 'history' | 'compare' | 'settings';

interface NavItem {
  tab: NavTab;
  emoji: string;
  labelEs: string;
  labelEn: string;
  route: string;
}

const TABS: NavItem[] = [
  { tab: 'home',     emoji: '🏠', labelEs: 'Inicio',    labelEn: 'Home',     route: '/home' },
  { tab: 'history',  emoji: '📋', labelEs: 'Historial', labelEn: 'History',  route: '/dashboard' },
  { tab: 'compare',  emoji: '🔬', labelEs: 'Comparar',  labelEn: 'Compare',  route: '/compare' },
  { tab: 'settings', emoji: '⚙️', labelEs: 'Ajustes',   labelEn: 'Settings', route: '/settings' },
];

interface Props {
  active: NavTab;
  lang?: 'es' | 'en';
}

export default function BottomNav({ active, lang = 'es' }: Props) {
  const router = useRouter();

  function go(item: NavItem) {
    if (item.tab === active) return;
    hapticLight();
    router.push(item.route as any);
  }

  function startCall() {
    hapticMedium();
    router.push('/dial');
  }

  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  return (
    <View style={s.wrapper}>
      <View style={s.bar}>
        {/* Left tabs */}
        <View style={s.tabGroup}>
          {left.map(item => (
            <TabButton
              key={item.tab}
              item={item}
              isActive={item.tab === active}
              lang={lang}
              onPress={() => go(item)}
            />
          ))}
        </View>

        {/* Center FAB */}
        <View style={s.fabWrap}>
          <TouchableOpacity
            style={s.fab}
            onPress={startCall}
            activeOpacity={0.82}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={s.fabEmoji}>🎙️</Text>
          </TouchableOpacity>
          <Text style={s.fabLabel}>{lang === 'es' ? 'Nueva' : 'New'}</Text>
        </View>

        {/* Right tabs */}
        <View style={s.tabGroup}>
          {right.map(item => (
            <TabButton
              key={item.tab}
              item={item}
              isActive={item.tab === active}
              lang={lang}
              onPress={() => go(item)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function TabButton({
  item,
  isActive,
  lang,
  onPress,
}: {
  item: NavItem;
  isActive: boolean;
  lang: 'es' | 'en';
  onPress: () => void;
}) {
  const label = lang === 'es' ? item.labelEs : item.labelEn;
  return (
    <TouchableOpacity
      style={s.tab}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View style={[s.tabIconWrap, isActive && s.tabIconActive]}>
        <Text style={s.tabEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[s.tabLabel, isActive && s.tabLabelActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    borderRadius: 32,
    backgroundColor: C.surfaceSolid,
    borderWidth: 1,
    borderColor: C.line,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...Shadows.glass,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tabGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    minWidth: 56,
    minHeight: 56,
  },
  tabIconWrap: {
    width: 44,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: C.primaryTint,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: C.inkMute,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: C.primary,
    fontWeight: '900',
  },

  // Center FAB
  fabWrap: {
    alignItems: 'center',
    marginHorizontal: 6,
    marginBottom: 2,
    gap: 4,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    borderWidth: 3,
    borderColor: C.bg,
    ...Shadows.glowPrimary,
  },
  fabEmoji: {
    fontSize: 26,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: C.primary,
    letterSpacing: 0.2,
  },
});
