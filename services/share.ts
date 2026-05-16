import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import type { CallRecord } from '../types';
import { formatTimestamp } from '../utils/format';

function bulletList(items: string[]) {
  return items.length ? items.map(item => `• ${item}`).join('\n') : '• No se mencionó.';
}

export function buildSpanishSummaryText(call: CallRecord): string {
  const summary = call.summary;
  if (!summary) return 'No hay resumen disponible todavía.';

  const medications = summary.medications.length
    ? summary.medications.map(m => `• ${m.name}: ${m.dose}`).join('\n')
    : '• No se mencionaron medicinas.';

  return [
    'Resumen de visita médica',
    formatTimestamp(call.startedAt),
    '',
    'En pocas palabras:',
    summary.rawText || summary.simpleExplanation || 'No hay resumen disponible.',
    '',
    '💊 Medicinas',
    medications,
    '',
    '📅 Próxima visita',
    summary.nextVisit || summary.appointmentTime || 'No se mencionó.',
    '',
    '✅ Qué hacer en casa',
    bulletList(summary.homeInstructions?.length ? summary.homeInstructions : summary.followUpInstructions),
    '',
    '⚠️ Cuándo llamar al doctor',
    bulletList(summary.whenToCallDoctor ?? []),
    '',
    'Generado por MedLingua. Confirme información importante con su doctor.',
  ].join('\n');
}

export async function shareCallSummary(call: CallRecord): Promise<void> {
  const text = buildSpanishSummaryText(call);

  if (!(await Sharing.isAvailableAsync())) {
    await Share.share({ message: text });
    return;
  }

  const html = `
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; padding: 28px; color: #1A1B1F;">
        <div style="font-size: 13px; color: #0F5BA8; font-weight: 700;">MedLingua</div>
        <h1 style="font-size: 28px; margin: 6px 0 4px;">Resumen de visita médica</h1>
        <div style="font-size: 15px; color: #555960; margin-bottom: 24px;">${formatTimestamp(call.startedAt)}</div>
        <pre style="white-space: pre-wrap; font-size: 18px; line-height: 1.45; font-family: inherit;">${text}</pre>
      </body>
    </html>
  `;
  const file = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Enviar resumen a familia',
  });
}
