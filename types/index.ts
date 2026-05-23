export interface SafetyFlag {
  /** Short headline: "Caught dosage ambiguity" */
  title: string;
  /** What the AI almost mistranslated and the correct interpretation */
  detail: string;
  /** The exact English phrase that triggered the flag */
  trigger: string;
  /** Severity: caught (we corrected it), warning (verify with doctor) */
  level: 'caught' | 'warning';
}

export interface TranscriptEntry {
  id: string;
  role: 'provider' | 'patient';
  /** Spoken source text: English for provider, Spanish for patient. */
  originalText: string;
  /** Translated text: Spanish for provider, English for patient. */
  translatedText: string;
  timestamp: number;
  /** Translation safety flags (the "Google Translate would have killed you" markers) */
  safetyFlags?: SafetyFlag[];
}

export interface Medication {
  name: string;
  dose: string;
}

export interface UrgentWarning {
  /** Short headline, e.g. "Watch for chest pain" */
  title: string;
  /** What action to take, e.g. "Call 911 immediately" */
  action: string;
  /** Severity drives UI color: critical (red), high (orange), info (blue) */
  severity: 'critical' | 'high' | 'info';
}

export interface DrugInteraction {
  /** The two (or more) medications involved */
  drugs: string[];
  /** Severity: major (red), moderate (orange), minor (yellow), none/info (blue) */
  severity: 'major' | 'moderate' | 'minor' | 'info';
  /** Plain-language explanation of the risk */
  description: string;
  /** What the patient should do */
  action: string;
}

export interface CallSummary {
  appointmentTime?: string;
  medications: Medication[];
  followUpInstructions: string[];
  keyNumbers: string[];
  rawText: string;
  nextVisit?: string;
  homeInstructions: string[];
  whenToCallDoctor: string[];
  simpleExplanation?: string;
  /** Structured urgent warnings extracted from the visit (red-flag callouts) */
  urgentWarnings?: UrgentWarning[];
  /** Language the summary content was written in */
  lang?: 'es' | 'en';
}

export interface CallRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  transcript: TranscriptEntry[];
  summary: CallSummary | null;
}
