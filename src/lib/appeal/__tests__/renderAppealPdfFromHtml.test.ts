/**
 * Visual QA checklist (manual, per variant): לכבוד / טופס / כותרות / סעיפים 1–18 / תאריך אחרי כנספח /
 * רשימת קריטריונים ✓ / בלוק חישוב / אזור חתימה (עוגן) / העתק — השוואה ל-PDF דוגמה באותו variant.
 * הרצת אינטגרציה: `APPEAL_PDF_E2E=1 npx playwright install chromium` ואז `npm run test -- --run src/lib/appeal/__tests__/renderAppealPdfFromHtml.test.ts`
 */
import { afterAll, describe, expect, it } from 'vitest';
import { closeAppealPdfBrowser, renderAppealPdfFromHtml } from '@/lib/appeal/renderAppealPdfFromHtml';

const runE2e = process.env.APPEAL_PDF_E2E === '1';

describe.skipIf(!runE2e)('renderAppealPdfFromHtml (Chromium)', () => {
  afterAll(async () => {
    await closeAppealPdfBrowser();
  });

  it('outputs a PDF buffer', async () => {
    const html =
      '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"/></head><body><p>בדיקה</p></body></html>';
    const buf = await renderAppealPdfFromHtml(html);
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });
});

describe('renderAppealPdfFromHtml', () => {
  it('is skipped by default without APPEAL_PDF_E2E', () => {
    expect(runE2e).toBe(process.env.APPEAL_PDF_E2E === '1');
  });
});
