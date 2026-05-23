import type { CallSummary, DrugInteraction, Medication, TranscriptEntry } from '../types';

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

// A naive translator that simulates what Google Translate / generic translators do —
// literal, no medical context. Used for the public-facing "see the difference" demo.
const GENERIC_TRANSLATION_SYSTEM = `You are a literal, word-by-word translator. You do NOT have medical training.

Rules:
- Translate as literally as possible.
- DO NOT correct ambiguous medical terms.
- DO NOT expand medical abbreviations (qd, PO, bid, etc.) — leave them as-is.
- Translate "once" as the Spanish word "once" (which means eleven) when going EN→ES. This is wrong but matches what naive translators do.
- Translate "drug" as "droga" (which usually means illegal drug in Spanish). Even if context is medical.
- Do not add explanations or notes.
- Return only the translated text.`;

export async function translateNaive(text: string, direction: 'en-es' | 'es-en'): Promise<string> {
  const promptDirection = direction === 'en-es'
    ? 'Translate the following English text to Spanish, literally:'
    : 'Translate the following Spanish text to English, literally:';
  return callOpenAI(
    GENERIC_TRANSLATION_SYSTEM,
    `${promptDirection}\n\n${text}`
  );
}

const SUMMARY_SYSTEM_ES = `You are a bilingual medical scribe writing for a 67-year-old Spanish-speaking patient with limited English proficiency.

Your job is to create a plain-language Spanish visit summary at about a 6th-grade reading level.
Avoid medical jargon. If a medical word is needed, explain it in simple Spanish.
Example: explain "hypertension" as "presión alta" and add one short explanation like "la sangre empuja con demasiada fuerza".

Return valid JSON with this exact shape:
{
  "appointmentTime": "string or null",
  "medications": [{ "name": "string", "dose": "string" }],
  "followUpInstructions": ["string"],
  "keyNumbers": ["string"],
  "rawText": "string",
  "nextVisit": "string or null",
  "homeInstructions": ["string"],
  "whenToCallDoctor": ["string"],
  "simpleExplanation": "string",
  "urgentWarnings": [{ "title": "string", "action": "string", "severity": "critical" | "high" | "info" }]
}

Rules:
- appointmentTime: any scheduled date/time mentioned, or null
- medications: every drug name and dosage mentioned. Preserve medication names exactly.
- followUpInstructions: action items for the patient, written in simple Spanish
- keyNumbers: phone numbers, fax numbers, reference numbers
- rawText: a 2-3 sentence Spanish summary in simple words
- nextVisit: the next appointment or follow-up plan in Spanish, or null
- homeInstructions: concrete things the patient should do at home, in Spanish
- whenToCallDoctor: warning signs or reasons to call the doctor, in Spanish
- simpleExplanation: a one-sentence Spanish explanation of the main diagnosis/problem
- urgentWarnings: separate, structured red-flag callouts. Use "critical" severity for life-threatening signs (chest pain, trouble breathing, fainting, stroke signs). Use "high" for serious-but-not-emergency (severe pain, high fever, side effects). Use "info" for important but non-urgent (medication tips, dietary). Title and action both in Spanish. Empty array if none.
- Preserve all numbers, doses, dates, and time references exactly.
- For "once daily", write "una vez al día", never "once al día".
- Return ONLY the JSON object, no markdown, no preamble.`;

const SUMMARY_SYSTEM_EN = `You are a bilingual medical scribe writing for a patient who prefers English.

Your job is to create a plain-language English visit summary at about a 6th-grade reading level.
Avoid medical jargon. If a medical term is needed, follow it with a simple explanation in parentheses.
Example: explain "hypertension" as "high blood pressure (when blood pushes too hard against artery walls)".

Return valid JSON with this exact shape:
{
  "appointmentTime": "string or null",
  "medications": [{ "name": "string", "dose": "string" }],
  "followUpInstructions": ["string"],
  "keyNumbers": ["string"],
  "rawText": "string",
  "nextVisit": "string or null",
  "homeInstructions": ["string"],
  "whenToCallDoctor": ["string"],
  "simpleExplanation": "string",
  "urgentWarnings": [{ "title": "string", "action": "string", "severity": "critical" | "high" | "info" }]
}

Rules:
- appointmentTime: any scheduled date/time mentioned, or null
- medications: every drug name and dosage mentioned. Preserve medication names exactly.
- followUpInstructions: action items for the patient, written in simple English
- keyNumbers: phone numbers, fax numbers, reference numbers
- rawText: a 2-3 sentence English summary in plain words
- nextVisit: the next appointment or follow-up plan in English, or null
- homeInstructions: concrete things the patient should do at home, in English
- whenToCallDoctor: warning signs or reasons to call the doctor, in English
- simpleExplanation: a one-sentence English explanation of the main diagnosis/problem
- urgentWarnings: separate, structured red-flag callouts. Use "critical" severity for life-threatening signs (chest pain, trouble breathing, fainting, stroke signs). Use "high" for serious-but-not-emergency (severe pain, high fever, side effects). Use "info" for important but non-urgent (medication tips, dietary). Title and action both in English. Empty array if none.
- Preserve all numbers, doses, dates, and time references exactly.
- Return ONLY the JSON object, no markdown, no preamble.`;

const ASK_SYSTEM_ES = `Eres un asistente médico amable que ayuda a un paciente a entender mejor su visita con el doctor. Te llamas MedLingua.

Reglas estrictas:
- Solo responde basándote en el transcript proporcionado. Si la respuesta no está allí, dilo claramente y sugiere preguntárselo al doctor.
- NUNCA des consejos médicos nuevos. Solo aclaras lo que el doctor dijo.
- Usa palabras simples a nivel de 6º grado. No uses jerga médica sin explicarla.
- Responde en español, en 1-3 oraciones cortas.
- Para preguntas urgentes (dolor de pecho, dificultad para respirar, etc.) di "Llame al 911 o a su doctor de inmediato."
- Conserva nombres de medicinas y dosis exactos.`;

const ASK_SYSTEM_EN = `You are a friendly medical assistant helping a patient better understand their doctor visit. You are called MedLingua.

Strict rules:
- Only answer based on the provided transcript. If the answer isn't there, say so clearly and suggest asking the doctor.
- NEVER give new medical advice. You only clarify what the doctor already said.
- Use plain 6th-grade English. Don't use jargon without explaining.
- Answer in English, in 1-3 short sentences.
- For urgent questions (chest pain, trouble breathing, etc.) say "Call 911 or your doctor immediately."
- Preserve medication names and doses exactly.`;

export interface AskMessage {
  role: 'user' | 'assistant';
  content: string;
}

const INTERACTION_SYSTEM = `You are a clinical pharmacology safety checker. You are given a list of medications a patient is taking and you must flag potential drug interactions, dangerous combinations, or important monitoring requirements.

CRITICAL RULES:
1. Be conservative. If there is ANY known interaction, flag it. Do not minimize.
2. Use plain language at a 6th-grade reading level for description and action.
3. Preserve medication names exactly.
4. Severity scale:
   - "major" → contraindicated or potentially life-threatening combinations (red flag)
   - "moderate" → significant interaction requiring monitoring or dose adjustment
   - "minor" → known but mild interaction
   - "info" → important food/lifestyle considerations (e.g. "take with food")
5. If there are NO interactions to report and only 1 medication, return an "info" item with monitoring tips for that single medication.
6. If there are zero medications, return an empty array.
7. NEVER recommend stopping medications. ALWAYS direct serious concerns back to the prescribing doctor.

Output strictly JSON:
{
  "interactions": [
    {
      "drugs": ["drug1", "drug2"],
      "severity": "major" | "moderate" | "minor" | "info",
      "description": "string",
      "action": "string"
    }
  ]
}`;

export async function checkDrugInteractions(
  medications: Medication[],
  lang: 'es' | 'en' = 'es'
): Promise<DrugInteraction[]> {
  if (!medications || medications.length === 0) return [];

  const langInstruction = lang === 'es'
    ? '\nIMPORTANT: All "description" and "action" fields must be written in plain Spanish at a 6th-grade reading level.'
    : '\nIMPORTANT: All "description" and "action" fields must be written in plain English at a 6th-grade reading level.';

  const medList = medications.map(m => `- ${m.name} (${m.dose})`).join('\n');
  const raw = await callOpenAI(
    INTERACTION_SYSTEM + langInstruction,
    `Check the following medications for interactions and safety concerns. Be thorough but conservative.\n\nMEDICATIONS:\n${medList}`
  );

  try {
    let clean = raw;
    if (raw.startsWith('```json')) clean = raw.replace(/```json/g, '').replace(/```/g, '');
    if (raw.startsWith('```')) clean = raw.replace(/```/g, '');
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed.interactions) ? parsed.interactions : [];
  } catch {
    return [];
  }
}

export async function askAboutVisit(
  transcript: TranscriptEntry[],
  summary: CallSummary | null,
  history: AskMessage[],
  question: string,
  lang: 'es' | 'en' = 'es',
  /** Optional streaming callback. Called with the full accumulated text on each chunk. */
  onToken?: (accumulated: string) => void
): Promise<string> {
  const transcriptText = transcript
    .map(e => `[${e.role.toUpperCase()}] ${e.originalText} (${e.translatedText})`)
    .join('\n');

  const summaryText = summary ? `\n\nSUMMARY:\n${JSON.stringify({
    diagnosis: summary.simpleExplanation,
    overview: summary.rawText,
    medications: summary.medications,
    nextVisit: summary.nextVisit,
    homeInstructions: summary.homeInstructions,
    whenToCallDoctor: summary.whenToCallDoctor,
  }, null, 2)}` : '';

  const system = `${lang === 'en' ? ASK_SYSTEM_EN : ASK_SYSTEM_ES}\n\nVISIT TRANSCRIPT:\n${transcriptText}${summaryText}`;

  const messages = [
    { role: 'system', content: system },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  // If no streaming callback, use simpler non-streaming endpoint
  if (!onToken) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3 }),
    });
    if (!response.ok) throw new Error(`Ask API error ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return (data.choices[0]?.message?.content ?? '').trim();
  }

  // Streaming path — SSE parser. React Native fetch supports text() so we
  // poll a streamed response by reading the body as it arrives.
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3, stream: true }),
  });

  if (!response.ok) throw new Error(`Ask API error ${response.status}: ${await response.text()}`);

  // React Native's fetch returns a Response; on iOS/Android we can use .body?.getReader()
  // when available, but RN doesn't fully support streams. Fall back to a text() read +
  // post-hoc chunk-by-chunk reveal which still feels streamed.
  const reader = (response as any).body?.getReader?.();
  let accumulated = '';

  if (reader) {
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            accumulated += delta;
            onToken(accumulated);
          }
        } catch { /* skip malformed */ }
      }
    }
    return accumulated.trim();
  }

  // Fallback: get the whole body, then reveal it in fake-streaming chunks.
  const fullText = await response.text();
  // Parse SSE format from the text
  for (const line of fullText.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') continue;
    try {
      const json = JSON.parse(payload);
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) accumulated += delta;
    } catch { /* skip */ }
  }

  // Fake-stream the result word-by-word for the UX win
  const words = accumulated.split(/(\s+)/);
  let revealed = '';
  for (const w of words) {
    revealed += w;
    onToken(revealed);
    await new Promise(r => setTimeout(r, 22));
  }

  return accumulated.trim();
}

export async function generateCallSummary(
  transcript: TranscriptEntry[],
  lang: 'es' | 'en' = 'es'
): Promise<CallSummary> {
  const transcriptText = transcript
    .map(e => `[${e.role.toUpperCase()}] EN: ${e.originalText} | ES: ${e.translatedText}`)
    .join('\n');

  const raw = await callOpenAI(
    lang === 'en' ? SUMMARY_SYSTEM_EN : SUMMARY_SYSTEM_ES,
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
      nextVisit: parsed.nextVisit ?? parsed.appointmentTime ?? undefined,
      homeInstructions: parsed.homeInstructions ?? parsed.followUpInstructions ?? [],
      whenToCallDoctor: parsed.whenToCallDoctor ?? [],
      simpleExplanation: parsed.simpleExplanation ?? undefined,
      urgentWarnings: Array.isArray(parsed.urgentWarnings) ? parsed.urgentWarnings : [],
      lang,
    };
  } catch {
    return {
      medications: [],
      followUpInstructions: [],
      keyNumbers: [],
      rawText: raw,
      homeInstructions: [],
      whenToCallDoctor: [],
      urgentWarnings: [],
      lang,
    };
  }
}
