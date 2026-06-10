/**
 * Whisper API wrapper — speech-to-text via OpenAI.
 *
 * Set EXPO_PUBLIC_OPENAI_API_KEY in your .env file before calling.
 * Expo exposes EXPO_PUBLIC_* vars to the JS bundle at build time.
 */

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';
const MODEL = 'whisper-1';

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'EXPO_PUBLIC_OPENAI_API_KEY is not set. Add it to your .env file.'
    );
  }
  return key;
}

export interface TranscribeOptions {
  /** Known proper names to bias recognition toward (patient, doctor, family). */
  hints?: string[];
  /** Recent transcript text in the SAME language as this audio, for spelling/term consistency. */
  priorContext?: string;
}

/**
 * Builds Whisper's `prompt`. Whisper biases its output toward the spelling and
 * vocabulary present in this prompt, so feeding it the names and recent context
 * is the single most effective way to stop it from mangling proper nouns.
 * Whisper only honors ~224 tokens of prompt, so we keep it tight.
 */
function buildPrompt(opts?: TranscribeOptions): string {
  const parts: string[] = ['Medical interpreter conversation between a doctor and patient.'];
  const hints = (opts?.hints ?? []).filter(Boolean);
  if (hints.length) {
    // Listing the names primes Whisper to spell them this exact way.
    parts.push(`Names mentioned: ${hints.slice(0, 12).join(', ')}.`);
  }
  if (opts?.priorContext?.trim()) {
    // Last bit of prior speech keeps spelling/terminology consistent chunk-to-chunk.
    parts.push(opts.priorContext.trim().slice(-220));
  }
  return parts.join(' ');
}

/**
 * Transcribes an audio file URI to text.
 * @param uri   Local file URI returned by Expo AV (e.g. file:///...)
 * @param language  'en' for provider audio, 'es' for patient audio
 * @param opts  Optional name hints + prior context to bias recognition (esp. names).
 */
export async function transcribeAudio(
  uri: string,
  language: 'en' | 'es',
  opts?: TranscribeOptions
): Promise<string> {
  const apiKey = getApiKey();

  // Determine MIME type — Expo AV records m4a on iOS, webm on Android
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
  const mimeMap: Record<string, string> = {
    m4a: 'audio/m4a',
    webm: 'audio/webm',
    mp4: 'audio/mp4',
    wav: 'audio/wav',
  };
  const mimeType = mimeMap[ext] ?? 'audio/m4a';

  const body = new FormData();
  body.append('file', {
    uri,
    name: `audio.${ext}`,
    type: mimeType,
  } as unknown as Blob);
  body.append('model', MODEL);
  body.append('language', language);
  body.append('response_format', 'text');
  body.append('temperature', '0');
  body.append('prompt', buildPrompt(opts));

  const response = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API error ${response.status}: ${err}`);
  }

  const text = await response.text();
  return text.trim();
}
