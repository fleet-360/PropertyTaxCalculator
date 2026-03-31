import { describe, expect, it } from 'vitest';
import type { AppealUserContext } from '@/lib/appeal/buildAppealUserContext';
import type { AppealLetterGeminiPayload } from '@/lib/appeal/appealLetterPayload';
import { buildAppealLetterHtml, escapeHtmlText } from '@/lib/appeal/appealLetterHtml';
import { mergeAreaCorrectionLetter } from '@/lib/appeal/mergeAppealLetterDocument';

describe('escapeHtmlText', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtmlText('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtmlText('a & b')).toBe('a &amp; b');
    expect(escapeHtmlText('"x"')).toBe('&quot;x&quot;');
  });
});

describe('buildAppealLetterHtml', () => {
  it('produces RTL HTML without raw angle brackets from user name', () => {
    const ctx: AppealUserContext = {
      fullName: 'Test<script>',
      city: { name: 'עיר' },
      property: {
        areaSqm: 10,
        userClaimedCorrectTotalAreaSqm: 8,
        propertyNumber: '1',
        propertyId: '2',
      },
      tax: { bimonthlyPaymentReported: 100, calculationSummary: {} },
      appealNarrativeHints: [],
    };
    const payload: AppealLetterGeminiPayload = {
      schemaVersion: 1,
      variant: 'area_correction',
      clauses: [{ id: 'intro', body: `שם המשיג: ${ctx.fullName}.` }],
    };
    const doc = mergeAreaCorrectionLetter(ctx, payload);
    const html = buildAppealLetterHtml(doc);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="he"');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toMatch(/<script[^>]*>[\s\S]*Test/);
    expect(html).toContain('letter-header-line');
    expect(html).toContain('לכבוד');
    expect(html).toContain('תאריך:');
    const idxLekavod = html.indexOf('letter-lekavod');
    const idxDate = html.indexOf('letter-date-on-line');
    expect(idxLekavod).toBeGreaterThan(-1);
    expect(idxDate).toBeGreaterThan(-1);
    expect(html).toContain('מנהל הארנונה');
    expect(html).toContain('עיריית עיר');
    expect(html).toContain('appeal-doc-main-titles');
    expect(html).toContain('כתב השגה על חיובי ארנונה');
    expect(html).toContain('ובקשה למתן הנחות בארנונה');
    expect(html).toContain('תעודת זהות/ח.פ.:');
    expect(html).toContain('כתובת הנכס:');
    expect(html).toContain('מהות ההשגה:');
    expect(html).toContain('הגשה לשנים:');
    expect(html).toContain('appeal-meta-table');
    const sheetStart = html.indexOf('<div class="sheet">');
    expect(sheetStart).toBeGreaterThan(-1);
    const sheet = html.slice(sheetStart);
    const idxHeader = sheet.indexOf('letter-header-line');
    const idxAddressee = sheet.indexOf('letter-addressee');
    const idxTable = sheet.indexOf('<table class="appeal-meta-table"');
    const idxFiling = sheet.indexOf('הגשה לשנים:');
    const idxTitles = sheet.indexOf('<div class="appeal-doc-main-titles"');
    const idxIntro = sheet.indexOf('שם המשיג:');
    expect(idxHeader).toBeLessThan(idxAddressee);
    expect(idxAddressee).toBeLessThan(idxTable);
    expect(idxTable).toBeLessThan(idxFiling);
    expect(idxFiling).toBeLessThan(idxTitles);
    expect(idxTitles).toBeLessThan(idxIntro);
    expect(html).toContain('הדבק חתימה');
    const idxAnchor = html.indexOf('id="appeal-signature-anchor"');
    const idxLabel = html.indexOf('הדבק חתימה');
    expect(idxAnchor).toBeGreaterThan(-1);
    expect(idxLabel).toBeGreaterThan(idxAnchor);
    expect(html).toContain('appeal-signature-cluster');
    expect(html).toContain('appeal-signature-paste-zone');
    expect(html).toContain('appeal-signer-name-line');
    expect(html).toContain('&lt;script&gt;');
    const idxSignerLine = html.indexOf('appeal-signer-name-line');
    expect(html.slice(idxSignerLine)).toContain('&lt;script&gt;');
    expect(html).toContain('ועדת הנחות');
    const idxDistribution = sheet.indexOf('<p class="appeal-distribution-line"');
    expect(idxDistribution).toBeGreaterThan(sheet.indexOf('id="appeal-signature-anchor"'));
  });
});
