export interface TranscriptEntry {
  id: string;
  role: 'provider' | 'patient';
  /** Spoken source text: English for provider, Spanish for patient. */
  originalText: string;
  /** Translated text: Spanish for provider, English for patient. */
  translatedText: string;
  timestamp: number;
}

export interface Medication {
  name: string;
  dose: string;
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
}

export interface CallRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  transcript: TranscriptEntry[];
  summary: CallSummary | null;
}
