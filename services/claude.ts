import type { CallSummary, TranscriptEntry } from '../types';

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    throw new Error('EXPO_PUBLIC_OPENAI_API_KEY is not set. Add it to your .env file.');
  }
  return key;
}

const MEDICAL_TRANSLATION_SYSTEM = `You are a professional medical interpreter specializing in English–Spanish healthcare communication.

CRITICAL RULES:
1. Preserve medication names exactly as written. Never translate drug names (e.g., metformin stays "metformin").
2. Preserve all numbers, dosages, frequencies, and time references exactly (e.g., "10 mg", "twice daily", "March 15").
3. IMPORTANT AMBIGUITY: "once" in English means ONE TIME. In Spanish "once" means ELEVEN.
   - Always translate "once daily" as "una vez al día" — NEVER "once al día".
   - Always translate "once a week" as "una vez a la semana".
4. Translate idiomatically for natural patient comprehension — not word-for-word.
5. If a term is ambiguous or untranslatable, provide the literal translation followed by a parenthetical note: (nota: ...).
6. Do not add explanations, preamble, or quotes — return only the translated text.`;

async function callOpenAI(system: string, userMessage: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Translation API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return (data.choices[0]?.message?.content ?? '').trim();
}

export async function translateToSpanish(englishText: string): Promise<string> {
  return callOpenAI(
    MEDICAL_TRANSLATION_SYSTEM,
    `Translate the following English medical text to Spanish:\n\n${englishText}`
  );
}

export async function translateToEnglish(spanishText: string): Promise<string> {
  return callOpenAI(
    MEDICAL_TRANSLATION_SYSTEM,
    `Translate the following Spanish medical text to English:\n\n${spanishText}`
  );
}

const SUMMARY_SYSTEM = `You are a medical scribe. Given a bilingual call transcript, extract structured information and return it as valid JSON with this exact shape:
{
  "appointmentTime": "string or null",
  "medications": [{ "name": "string", "dose": "string" }],
  "followUpInstructions": ["string"],
  "keyNumbers": ["string"],
  "rawText": "string"
}

Rules:
- appointmentTime: any scheduled date/time mentioned, or null
- medications: every drug name and dosage mentioned
- followUpInstructions: any action items for the patient
- keyNumbers: phone numbers, fax numbers, reference numbers
- rawText: a 2-3 sentence plain-English plain summary of the call
- Return ONLY the JSON object, no markdown, no preamble.`;

export async function generateCallSummary(
  transcript: TranscriptEntry[]
): Promise<CallSummary> {
  const transcriptText = transcript
    .map(e => `[${e.role.toUpperCase()}] EN: ${e.originalText} | ES: ${e.translatedText}`)
    .join('\n');

  const raw = await callOpenAI(
    SUMMARY_SYSTEM,
    `Extract structured information from this medical call transcript:\n\n${transcriptText}`
  );

  try {
    let cleanJson = raw;
    if (raw.startsWith('\`\`\`json')) {
      cleanJson = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
    }
    const parsed = JSON.parse(cleanJson);
    return {
      appointmentTime: parsed.appointmentTime ?? undefined,
      medications: parsed.medications ?? [],
      followUpInstructions: parsed.followUpInstructions ?? [],
      keyNumbers: parsed.keyNumbers ?? [],
      rawText: parsed.rawText ?? '',
    };
  } catch {
    return {
      medications: [],
      followUpInstructions: [],
      keyNumbers: [],
      rawText: raw,
    };
  }
}
