/**
 * MedLingua design system — Light Clinical Premium
 * ------------------------------------------------------------------
 * Direction: Apple Health + Notion cleanliness + Duolingo friendliness.
 * Built for 65+ Spanish-speaking patients with low vision, used in
 * bright clinic lighting. Every text token below meets WCAG AA on its
 * intended background. Single source of truth — every screen imports
 * `Theme as C` so changing a value here re-skins the whole app.
 */

export const Theme = {
  // ── Backgrounds ────────────────────────────────────────────────
  bg: '#F6F8FC',          // cool, clean off-white app canvas
  bgDeep: '#EEF2F8',      // slightly deeper canvas band
  surface: '#FFFFFF',     // primary card / sheet surface
  surfaceSolid: '#FFFFFF', // alias for places that need an opaque fill
  surfaceSunk: '#EFF3F9', // sunken panels: inputs, empty states, wells

  // ── Hairlines / dividers ───────────────────────────────────────
  line: '#E2E8F1',        // standard cool border
  lineSoft: '#EDF1F8',    // softer inner divider

  // ── Text (all AA on white unless noted) ────────────────────────
  ink: '#0F1729',         // near-black, blue undertone — 16:1 on white
  ink2: '#283449',        // dark slate — secondary headings
  inkSoft: '#475067',     // body copy — ~8:1
  inkMute: '#667085',     // muted labels — 4.6:1 (AA)
  inkFaint: '#98A2B3',    // DECORATIVE ONLY (dots, chevrons) — not body text

  // ── Primary: trustworthy medical blue ──────────────────────────
  primary: '#2563EB',
  primaryStrong: '#1D4ED8',
  primaryTint: '#E6EDFF',  // soft blue chip/fill on white

  // ── Warm: human accent (patient voice, friendly CTAs) ──────────
  warm: '#C2410C',         // deep warm orange — 4.7:1 on white
  warmStrong: '#9A3412',
  warmTint: '#FBE9DC',

  // ── Listen/safe: clinical teal-green ───────────────────────────
  listen: '#0D9488',       // teal-600 — vivid, premium, AA for bold text
  listenStrong: '#0F766E',
  listenTint: '#D5F3EF',

  // ── Alert: clean medical red ───────────────────────────────────
  alert: '#DC2626',
  alertStrong: '#B91C1C',
  alertTint: '#FDE4E4',
};

/** Corner radius scale — consistent rounding across the app. */
export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  pill: 999,
};

/** Spacing scale (4pt grid) for airy, consistent layout. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
};

/**
 * Soft, premium shadows. Cool slate base (#1E293B) so elevation reads
 * clean on the cool-white canvas rather than muddy grey.
 * `glass` / `glowPrimary` keys are kept for backwards-compat with
 * existing screens; new code can use the richer set below.
 */
export const Shadows = {
  // Subtle resting elevation for standard cards.
  glass: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  // Lighter lift for chips / inline tiles.
  soft: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  // Pronounced lift for floating elements (FAB, modals).
  lifted: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  // Colored glow under the primary CTA — the "premium" signature.
  glowPrimary: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  glowWarm: {
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 7,
  },
};

/** Gradient tuples for hero surfaces (use with expo-linear-gradient or manual layering). */
export const Gradients = {
  primary: ['#2F6BF0', '#1D4ED8'] as const,
  hero: ['#EAF1FF', '#F6F8FC'] as const,
  teal: ['#12B3A6', '#0D9488'] as const,
};
