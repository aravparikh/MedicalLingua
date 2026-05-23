import type { SafetyFlag } from '../types';

/**
 * Catches known dangerous medical-translation patterns BEFORE they reach the patient.
 * Deterministic + free + instant — no extra API call needed.
 *
 * Each pattern represents a real translation failure mode documented in
 * medical interpreter literature. These are the lethal Google Translate bugs.
 */

interface SafetyRule {
  /** Regex that triggers on the EN→ES original text */
  pattern: RegExp;
  /** What we caught */
  build: (match: RegExpMatchArray) => SafetyFlag;
}

const EN_ES_RULES: SafetyRule[] = [
  // "once" — English "one time" vs Spanish "once" (eleven)
  {
    pattern: /\bonce\b/i,
    build: () => ({
      title: 'Caught dosage ambiguity',
      detail: 'In Spanish, "once" means ELEVEN. We translated "once" as "una vez" (one time) — not the dangerous literal.',
      trigger: 'once',
      level: 'caught',
    }),
  },
  // "PO" — Latin abbreviation for "by mouth" — often dropped in literal translation
  {
    pattern: /\bp\.?\s*o\.?\b/i,
    build: () => ({
      title: 'Expanded medical abbreviation',
      detail: '"PO" means "by mouth" (per os). We translated this into plain Spanish ("por la boca").',
      trigger: 'PO',
      level: 'caught',
    }),
  },
  // "qd / qid / bid / tid / prn" — Latin frequency abbreviations
  {
    pattern: /\b(qd|qid|bid|tid|qhs|prn|q\d+h)\b/i,
    build: (m) => ({
      title: 'Frequency abbreviation translated',
      detail: `"${m[0]}" is a Latin shorthand that Spanish-speakers don't know. We expanded it into clear Spanish.`,
      trigger: m[0],
      level: 'caught',
    }),
  },
  // "drug" — slang vs medication ambiguity
  {
    pattern: /\bdrug(s)?\b/i,
    build: () => ({
      title: 'Disambiguated "drug" → "medication"',
      detail: 'In Spanish, "droga" usually means illegal drugs. We translated "drug" as "medicina" or "medicamento."',
      trigger: 'drug',
      level: 'caught',
    }),
  },
  // Decimal point trap: "0.5 mg" vs ".5 mg" — Spanish-speakers from countries that use comma decimals
  {
    pattern: /\b0\.\d+\s*(mg|mcg|ml|g|cc)\b/i,
    build: (m) => ({
      title: 'Preserved decimal precision',
      detail: `Some Spanish-speaking patients use commas for decimals. We preserved "${m[0]}" exactly — no decimal-shift error.`,
      trigger: m[0],
      level: 'caught',
    }),
  },
  // Times of day where AM/PM confusion is common
  {
    pattern: /\b(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)\b/i,
    build: (m) => ({
      title: 'AM/PM preserved',
      detail: `Translated "${m[0]}" with full clarity — 12-hour confusion is a documented medication-error cause.`,
      trigger: m[0],
      level: 'caught',
    }),
  },
];

const ES_EN_RULES: SafetyRule[] = [
  // Patient says they're allergic — make sure that's prominent
  {
    pattern: /\b(alergia|alérgico|alérgica|me da alergia)\b/i,
    build: (m) => ({
      title: 'Allergy mentioned — flagged',
      detail: `Patient mentioned an allergy ("${m[0]}"). We made sure the English translation calls this out so the doctor doesn't miss it.`,
      trigger: m[0],
      level: 'warning',
    }),
  },
  // Patient describes severe symptoms — escalate
  {
    pattern: /\b(dolor de pecho|no puedo respirar|me desmay|sangre)\b/i,
    build: (m) => ({
      title: 'Urgent symptom detected',
      detail: `Patient described a potentially urgent symptom ("${m[0]}"). Translation preserves urgency.`,
      trigger: m[0],
      level: 'warning',
    }),
  },
];

/**
 * Scan a translation for known safety traps.
 * @param sourceText The original text (what was said)
 * @param direction 'en-es' for provider→patient, 'es-en' for patient→provider
 */
export function scanForSafetyFlags(
  sourceText: string,
  direction: 'en-es' | 'es-en'
): SafetyFlag[] {
  const rules = direction === 'en-es' ? EN_ES_RULES : ES_EN_RULES;
  const flags: SafetyFlag[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    const m = sourceText.match(rule.pattern);
    if (m) {
      const flag = rule.build(m);
      // Dedupe by trigger
      if (!seen.has(flag.trigger.toLowerCase())) {
        seen.add(flag.trigger.toLowerCase());
        flags.push(flag);
      }
    }
  }

  return flags;
}
