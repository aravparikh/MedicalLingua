export interface TranscriptEntry {
  id: string;
  role: 'provider' | 'patient';
  /** English text (provider original, or patient translation) */
  originalText: string;
  /** Spanish text (provider translation, or patient original) */
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
}

export interface CallRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  transcript: TranscriptEntry[];
  summary: CallSummary | null;
}
