/** Hebrew long date for appeal letter headers (e.g. 30 במרץ 2026). */
export function formatHebrewAppealDate(d: Date): string {
  try {
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
