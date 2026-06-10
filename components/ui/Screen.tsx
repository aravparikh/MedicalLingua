/**
 * Screen — base wrapper: themed background, safe area, status bar,
 * optional scroll. Also exports `useTheme()`, the one hook every
 * mode-aware component/screen should use for color tokens.
 */
import React, { createContext, useContext } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, ColorTokens, Recipes, Spacing, ThemeMode } from '../../constants/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  c: ColorTokens;
  recipes: ReturnType<typeof Recipes>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Color tokens + component recipes for the active mode. Falls back to
 *  system scheme when used outside a <Screen>/<ThemeProvider>. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  const system = useColorScheme();
  if (ctx) return ctx;
  const mode: ThemeMode = system === 'dark' ? 'dark' : 'light';
  return { mode, c: Colors[mode], recipes: Recipes(Colors[mode]) };
}

export function ThemeProvider({
  mode,
  children,
}: {
  mode?: ThemeMode;
  children: React.ReactNode;
}) {
  const system = useColorScheme();
  const resolved: ThemeMode = mode ?? (system === 'dark' ? 'dark' : 'light');
  const value: ThemeContextValue = {
    mode: resolved,
    c: Colors[resolved],
    recipes: Recipes(Colors[resolved]),
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Horizontal padding (default Spacing.md = 16). */
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Edges to inset; bottom omitted by default so tab bars sit flush. */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
}: ScreenProps) {
  const { mode, c } = useTheme();
  const pad = padded ? { paddingHorizontal: Spacing.md } : null;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }, style]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.root} edges={edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, pad, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.root, pad, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.xl },
});
