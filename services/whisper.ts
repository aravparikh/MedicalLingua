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

/**
 * Transcribes an audio file URI to text.
 * @param uri   Local file URI returned by Expo AV (e.g. file:///...)
 * @param language  'en' for provider audio, 'es' for patient audio
 */
export async function transcribeAudio(
  uri: string,
  language: 'en' | 'es'
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
  body.append('prompt', 'Medical conversation transcript. Do not invent speech. Ignore silence.');

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
