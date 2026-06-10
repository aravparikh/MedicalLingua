import { useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticLight } from '../utils/haptics';

import { Theme as C, Shadows } from '../constants/theme';

export type NavTab = 'home' | 'history' | 'settings';

interface NavItem {
  tab: NavTab;
  icon: string;
  iconActive: string;
  labelEs: string;
  labelEn: string;
  route: string;
}

const TABS: NavItem[] = [
  { tab: 'home',     icon: 'home-outline',     iconActive: 'home',     labelEs: 'Inicio',    labelEn: 'Home',     route: '/home' },
  { tab: 'history',  icon: 'pulse-outline',    iconActive: 'pulse',    labelEs: 'Mi Salud',  labelEn: 'My Health',route: '/dashboard' },
  { tab: 'settings', icon: 'settings-outline', iconActive: 'settings', labelEs: 'Ajustes',   labelEn: 'Settings', route: '/settings' },
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
    router.replace(item.route as any);
  }

  return (
    <View style={s.wrapper}>
      <View style={s.bar}>
        {TABS.map(item => {
          const isActive = item.tab === active;
          const label = lang === 'es' ? item.labelEs : item.labelEn;
          return (
            <TouchableOpacity
              key={item.tab}
              style={s.tab}
              onPress={() => go(item)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[s.tabIconWrap, isActive && s.tabIconActive]}>
                <Ionicons
                  name={(isActive ? item.iconActive : item.icon) as any}
                  size={24}
                  color={isActive ? C.primary : C.inkMute}
                />
              </View>
              <Text style={[s.tabLabel, isActive && s.tabLabelActive]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    borderRadius: 24,
    backgroundColor: C.surfaceSolid,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...Shadows.glass,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    minWidth: 70,
    minHeight: 56,
    flex: 1,
  },
  tabIconWrap: {
    width: 48,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: C.primaryTint,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.inkMute,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: C.primary,
    fontWeight: '900',
  },
});
