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

    // Basic document structure
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="he"');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toMatch(/<script[^>]*>[\s\S]*Test/);

    // Header & addressee
    expect(html).toContain('date-header');
    expect(html).toContain('תאריך:');
    expect(html).toContain('מנהל הארנונה');
    expect(html).toContain('עיריית עיר');

    // Titles
    expect(html).toContain('main-titles');
    expect(html).toContain('כתב השגה על חיובי ארנונה');
    expect(html).toContain('ובקשה למתן הנחות בארנונה');

    // Meta details table
    expect(html).toContain('תעודת זהות / ח.פ.:');
    expect(html).toContain('כתובת הנכס:');
    expect(html).toContain('מהות ההשגה:');
    expect(html).toContain('הגשה לשנים:');
    expect(html).toContain('meta-table');

    // Ordering: date → addressee → meta table → nature → titles → body
    const sheetStart = html.indexOf('<div class="sheet">');
    expect(sheetStart).toBeGreaterThan(-1);
    const sheet = html.slice(sheetStart);
    const idxDate = sheet.indexOf('date-header');
    const idxAddressee = sheet.indexOf('addressee-block');
    const idxTable = sheet.indexOf('<table class="meta-table"');
    const idxFiling = sheet.indexOf('הגשה לשנים:');
    const idxTitles = sheet.indexOf('<div class="main-titles"');
    const idxIntro = sheet.indexOf('שם המשיג:');
    expect(idxDate).toBeLessThan(idxAddressee);
    expect(idxAddressee).toBeLessThan(idxTable);
    expect(idxTable).toBeLessThan(idxFiling);
    expect(idxFiling).toBeLessThan(idxTitles);
    expect(idxTitles).toBeLessThan(idxIntro);

    // Signature block
    expect(html).toContain('הדבק חתימה');
    const idxAnchor = html.indexOf('id="appeal-signature-anchor"');
    const idxLabel = html.indexOf('הדבק חתימה');
    expect(idxAnchor).toBeGreaterThan(-1);
    expect(idxLabel).toBeGreaterThan(idxAnchor);
    expect(html).toContain('signature-cluster');
    expect(html).toContain('signature-paste-zone');
    expect(html).toContain('signer-name');
    expect(html).toContain('&lt;script&gt;');
    const idxSignerLine = html.indexOf('signer-name');
    expect(html.slice(idxSignerLine)).toContain('&lt;script&gt;');

    // Distribution footer
    expect(html).toContain('ועדת הנחות');
    const idxDistribution = sheet.indexOf('<p class="distribution-line"');
    expect(idxDistribution).toBeGreaterThan(sheet.indexOf('id="appeal-signature-anchor"'));

    // "בכבוד רב" before signature
    expect(html).toContain('בכבוד רב,');
  });
});
