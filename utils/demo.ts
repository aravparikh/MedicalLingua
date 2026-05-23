import type { CallRecord } from '../types';
import { generateId } from './format';

export function createDemoCall(lang: 'es' | 'en' = 'es'): CallRecord {
  const startedAt = Date.now() - 8 * 60 * 1000;

  if (lang === 'en') {
    return {
      id: generateId(),
      startedAt,
      endedAt: Date.now(),
      transcript: [
        {
          id: generateId(),
          role: 'provider',
          originalText: 'Your blood pressure is high today. This is called hypertension.',
          translatedText: 'Su presión está alta hoy. Esto se llama presión alta.',
          timestamp: startedAt + 30 * 1000,
        },
        {
          id: generateId(),
          role: 'patient',
          originalText: '¿Eso significa que mi corazón está mal?',
          translatedText: 'Does that mean something is wrong with my heart?',
          timestamp: startedAt + 75 * 1000,
        },
        {
          id: generateId(),
          role: 'provider',
          originalText: 'Not necessarily. We will start lisinopril 10 mg once daily and check again in two weeks.',
          translatedText: 'No necesariamente. Vamos a empezar lisinopril 10 mg una vez al día y revisar de nuevo en dos semanas.',
          timestamp: startedAt + 120 * 1000,
          safetyFlags: [
            {
              title: 'Caught dosage ambiguity',
              detail: 'In Spanish, "once" means ELEVEN. We translated "once" as "una vez" (one time) — not the dangerous literal.',
              trigger: 'once',
              level: 'caught',
            },
          ],
        },
        {
          id: generateId(),
          role: 'provider',
          originalText: 'Call us right away if you have chest pain, trouble breathing, or fainting.',
          translatedText: 'Llámenos de inmediato si tiene dolor en el pecho, dificultad para respirar o si se desmaya.',
          timestamp: startedAt + 180 * 1000,
        },
      ],
      summary: {
        appointmentTime: 'In 2 weeks to recheck blood pressure.',
        medications: [{ name: 'lisinopril', dose: '10 mg once daily' }],
        followUpInstructions: [
          'Take lisinopril 10 mg once daily.',
          'Check your blood pressure at home if you have a monitor.',
          'Bring your blood pressure numbers to the next visit.',
        ],
        keyNumbers: [],
        rawText: 'The doctor said your blood pressure is high. This means blood is pushing too hard inside your blood vessels, which can strain your heart over time.',
        nextVisit: 'In 2 weeks to recheck blood pressure.',
        homeInstructions: [
          'Take lisinopril 10 mg once daily.',
          'If you can, measure your blood pressure at home.',
          'Bring your blood pressure numbers to your next appointment.',
        ],
        whenToCallDoctor: [
          'Chest pain.',
          'Trouble breathing.',
          'Fainting or severe dizziness.',
        ],
        simpleExplanation: 'High blood pressure means blood is pushing too hard. The medication helps bring that pressure down to protect your heart.',
        urgentWarnings: [
          { title: 'Chest pain', action: 'Call 911 immediately', severity: 'critical' },
          { title: 'Trouble breathing', action: 'Call 911 immediately', severity: 'critical' },
          { title: 'Fainting or severe dizziness', action: 'Call your doctor right away', severity: 'high' },
        ],
        lang: 'en',
      },
    };
  }

  // Spanish (default)
  return {
    id: generateId(),
    startedAt,
    endedAt: Date.now(),
    transcript: [
      {
        id: generateId(),
        role: 'provider',
        originalText: 'Your blood pressure is high today. This is called hypertension.',
        translatedText: 'Su presión está alta hoy. Esto se llama presión alta.',
        timestamp: startedAt + 30 * 1000,
      },
      {
        id: generateId(),
        role: 'patient',
        originalText: '¿Eso significa que mi corazón está mal?',
        translatedText: 'Does that mean something is wrong with my heart?',
        timestamp: startedAt + 75 * 1000,
      },
      {
        id: generateId(),
        role: 'provider',
        originalText: 'Not necessarily. We will start lisinopril 10 mg once daily and check again in two weeks.',
        translatedText: 'No necesariamente. Vamos a empezar lisinopril 10 mg una vez al día y revisar de nuevo en dos semanas.',
        timestamp: startedAt + 120 * 1000,
        safetyFlags: [
          {
            title: 'Detectamos error de dosis',
            detail: 'En español, "once" significa ONCE (11). Tradujimos "once" como "una vez" — no el literal peligroso.',
            trigger: 'once',
            level: 'caught',
          },
        ],
      },
      {
        id: generateId(),
        role: 'provider',
        originalText: 'Call us right away if you have chest pain, trouble breathing, or fainting.',
        translatedText: 'Llámenos de inmediato si tiene dolor en el pecho, dificultad para respirar o si se desmaya.',
        timestamp: startedAt + 180 * 1000,
      },
    ],
    summary: {
      appointmentTime: 'En 2 semanas para revisar la presión.',
      medications: [{ name: 'lisinopril', dose: '10 mg una vez al día' }],
      followUpInstructions: [
        'Tome lisinopril 10 mg una vez al día.',
        'Revise su presión en casa si tiene un medidor.',
        'Lleve sus números de presión a la próxima visita.',
      ],
      keyNumbers: [],
      rawText: 'El doctor dijo que su presión está alta. Esto significa que la sangre empuja con mucha fuerza dentro de sus venas y puede cansar al corazón con el tiempo.',
      nextVisit: 'En 2 semanas para revisar la presión.',
      homeInstructions: [
        'Tome lisinopril 10 mg una vez al día.',
        'Si puede, mida su presión en casa.',
        'Traiga sus números de presión a la próxima cita.',
      ],
      whenToCallDoctor: [
        'Dolor en el pecho.',
        'Dificultad para respirar.',
        'Desmayo o mareo fuerte.',
      ],
      simpleExplanation: 'Presión alta significa que la sangre empuja demasiado fuerte. La medicina ayuda a bajar esa presión para proteger su corazón.',
      urgentWarnings: [
        { title: 'Dolor en el pecho', action: 'Llame al 911 de inmediato', severity: 'critical' },
        { title: 'Dificultad para respirar', action: 'Llame al 911 de inmediato', severity: 'critical' },
        { title: 'Desmayo o mareo fuerte', action: 'Llame a su doctor enseguida', severity: 'high' },
      ],
      lang: 'es',
    },
  };
}
