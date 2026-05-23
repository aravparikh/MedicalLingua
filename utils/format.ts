export function formatTimestamp(ms: number, lang: 'en' | 'es' = 'en'): string {
  return new Date(ms).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(startMs: number, endMs: number, lang: 'en' | 'es' = 'en'): string {
  const totalSec = Math.round((endMs - startMs) / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return lang === 'es' ? `${min}m ${sec}s` : `${min}m ${sec}s`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
