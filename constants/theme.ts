/**
 * MedLingua design system — "Warm Clinical"
 * ------------------------------------------------------------------
 * Single source of truth for color, type, spacing, radii, elevation,
 * and component recipes. Light + dark token sets share one shape
 * (`ColorTokens`) so screens can stay mode-agnostic.
 *
 * Direction: calm and trustworthy without the generic teal-on-white
 * hospital look. Indigo-blue primary with warm clay accent, warm-tinted
 * neutrals, generous type sizes — built for stressed or older patients
 * reading translated text at arm's length in bright clinic light.
 * All text tokens meet WCAG AA on their intended background.
 *
 * Back-compat: `Theme`, `Radius`, `Spacing`, `Shadows`, `Gradients`
 * keep their original keys — existing screens importing `Theme as C`
 * continue to work untouched. New code should prefer `useTheme()` from
 * components/ui/Screen.tsx (mode-aware) or `Colors.light` / `Colors.dark`.
 */

import { TextStyle, ViewStyle } from 'react-native';

// ────────────────────────────────────────────────────────────────────
// COLOR
// ────────────────────────────────────────────────────────────────────

export interface ColorTokens {
  // Backgrounds
  bg: string;           // app canvas
  bgDeep: string;       // deeper canvas band (headers, wells)
  surface: string;      // card / sheet
  surfaceSolid: string; // alias where opacity matters
  surfaceSunk: string;  // sunken panels: inputs, empty states

  // Hairlines
  line: string;
  lineSoft: string;

  // Text (AA on `surface` unless noted)
  ink: string;       // headings, key copy
  ink2: string;      // secondary headings
  inkSoft: string;   // body
  inkMute: string;   // labels — 4.5:1 minimum
  inkFaint: string;  // DECORATIVE ONLY — dots, chevrons

  // Primary — trustworthy indigo-blue
  primary: string;
  primaryStrong: string;
  primaryTint: string;
  onPrimary: string;

  // Warm — human accent (patient voice, friendly CTAs)
  warm: string;
  warmStrong: string;
  warmTint: string;

  // Listen — mic / active-listening teal
  listen: string;
  listenStrong: string;
  listenTint: string;

  // Alert
  alert: string;
  alertStrong: string;
  alertTint: string;

  // Success (distinct from listen for confirmations)
  success: string;
  successTint: string;
}

const light: ColorTokens = {
  bg: '#F7F6F3',          // warm paper — not hospital white
  bgDeep: '#EFEDE8',
  surface: '#FFFFFF',
  surfaceSolid: '#FFFFFF',
  surfaceSunk: '#F1EFEA',

  line: '#E6E3DC',
  lineSoft: '#EFEDE7',

  ink: '#1A1C23',         // near-black, slight warm undertone — 15.8:1
  ink2: '#2E3140',
  inkSoft: '#4A4E5F',     // ~7.9:1
  inkMute: '#6A6E80',     // 4.9:1 (AA)
  inkFaint: '#A3A6B3',    // decorative only

  primary: '#3D5AF1',     // indigo-blue — warmer than teal, still medical-trustworthy
  primaryStrong: '#2A44D4',
  primaryTint: '#E9EDFE',
  onPrimary: '#FFFFFF',

  warm: '#B4501E',        // warm clay — 4.6:1 on white
  warmStrong: '#8F3E15',
  warmTint: '#FAEADF',

  listen: '#0E8C7F',      // muted teal reserved for the mic, not the whole app
  listenStrong: '#0B6E64',
  listenTint: '#DCF2EF',

  alert: '#D03035',
  alertStrong: '#A92327',
  alertTint: '#FBE4E4',

  success: '#2E7D4F',
  successTint: '#DFF0E6',
};

const dark: ColorTokens = {
  bg: '#15161B',          // warm charcoal, not pure black
  bgDeep: '#0F1014',
  surface: '#1E2027',
  surfaceSolid: '#1E2027',
  surfaceSunk: '#181A20',

  line: '#2E313B',
  lineSoft: '#262932',

  ink: '#F2F1ED',         // warm off-white — 14.9:1 on surface
  ink2: '#D8D7D2',
  inkSoft: '#B4B4B3',     // ~7.6:1
  inkMute: '#8C8E99',     // 4.7:1 (AA)
  inkFaint: '#5C5F6B',    // decorative only

  primary: '#7B90FF',     // lifted for dark — 6.4:1 on surface
  primaryStrong: '#5C74F5',
  primaryTint: '#262C49',
  onPrimary: '#10122B',

  warm: '#E8915C',        // 6.5:1 on surface
  warmStrong: '#D4763B',
  warmTint: '#3A2A1E',

  listen: '#3BBFAE',
  listenStrong: '#2AA294',
  listenTint: '#15332F',

  alert: '#F07A7C',
  alertStrong: '#E25558',
  alertTint: '#3B2122',

  success: '#5FBE88',
  successTint: '#1C3326',
};

export const Colors = { light, dark };
export type ThemeMode = keyof typeof Colors;

// ────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ────────────────────────────────────────────────────────────────────
/**
 * System font with heavy weights for a distinctive-but-native feel.
 * `translation` tier is deliberately oversized: it's the one piece of
 * text a stressed patient must read instantly.
 */
export const Type = {
  display:     { fontSize: 34, lineHeight: 40, fontWeight: '900' as const, letterSpacing: -0.6 },
  title:       { fontSize: 26, lineHeight: 32, fontWeight: '900' as const, letterSpacing: -0.4 },
  heading:     { fontSize: 20, lineHeight: 26, fontWeight: '800' as const, letterSpacing: -0.2 },
  // Extra-large tier for translated output
  translation: { fontSize: 28, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.2 },
  bodyLarge:   { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  body:        { fontSize: 16, lineHeight: 23, fontWeight: '500' as const },
  label:       { fontSize: 14, lineHeight: 19, fontWeight: '700' as const, letterSpacing: 0.1 },
  caption:     { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, letterSpacing: 0.2 },
  overline:    { fontSize: 12, lineHeight: 16, fontWeight: '800' as const, letterSpacing: 1.0, textTransform: 'uppercase' as const },
} satisfies Record<string, TextStyle>;

// ────────────────────────────────────────────────────────────────────
// SPACING / RADII
// ────────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  // legacy aliases kept for existing screens (old scale was 4/8/12/16/22/28)
  xxl: 28,
};

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  pill: 999,
};

// ────────────────────────────────────────────────────────────────────
// ELEVATION
// ────────────────────────────────────────────────────────────────────

export const Shadows = {
  // Subtle resting elevation for standard cards.
  glass: {
    shadowColor: '#23252E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  // Lighter lift for chips / inline tiles.
  soft: {
    shadowColor: '#23252E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Pronounced lift for floating elements (FAB, modals, active mic).
  lifted: {
    shadowColor: '#23252E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  // Colored glow under the primary CTA — the "premium" signature.
  glowPrimary: {
    shadowColor: '#3D5AF1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  glowWarm: {
    shadowColor: '#B4501E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
  glowListen: {
    shadowColor: '#0E8C7F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 22,
    elevation: 8,
  },
};

/** Gradient tuples (expo-linear-gradient not installed — use as manual layers or install later). */
export const Gradients = {
  primary: ['#4C68F5', '#2A44D4'] as const,
  hero: ['#EDEFFE', '#F7F6F3'] as const,
  teal: ['#19A795', '#0E8C7F'] as const,
};

// ────────────────────────────────────────────────────────────────────
// COMPONENT RECIPES
// ────────────────────────────────────────────────────────────────────
/**
 * Style factories keyed by mode. Use directly in StyleSheet.create or
 * via the base components in components/ui/.
 */
export const Recipes = (c: ColorTokens) => ({
  buttonPrimary: {
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: Radius.md,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Shadows.glowPrimary,
  } satisfies ViewStyle,

  buttonSecondary: {
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: Radius.md,
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...Shadows.soft,
  } satisfies ViewStyle,

  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.line,
    padding: Spacing.md,
    ...Shadows.glass,
  } satisfies ViewStyle,

  listRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.lineSoft,
  } satisfies ViewStyle,

  input: {
    minHeight: 56,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceSunk,
    borderWidth: 1.5,
    borderColor: c.line,
    paddingHorizontal: Spacing.md,
    fontSize: Type.body.fontSize,
    color: c.ink,
  } satisfies TextStyle,

  inputFocused: {
    borderColor: c.primary,
    backgroundColor: c.surface,
  } satisfies ViewStyle,

  /** Mic button states — 88pt target, generous for older hands. */
  micIdle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.glowPrimary,
  } satisfies ViewStyle,

  micListening: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: c.listen,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.glowListen,
  } satisfies ViewStyle,

  micProcessing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: c.surfaceSunk,
    borderWidth: 2, borderColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.soft,
  } satisfies ViewStyle,
});

// ────────────────────────────────────────────────────────────────────
// LEGACY EXPORT — existing screens import `Theme as C`
// ────────────────────────────────────────────────────────────────────
/** @deprecated for new code — use Colors.light / Colors.dark or useTheme(). */
export const Theme = light;
