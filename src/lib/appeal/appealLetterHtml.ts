import fs from 'fs';
import type { NormalizedAppealLetter } from './mergeAppealLetterDocument';
import { getAppealHebrewBoldFontPath, getAppealHebrewFontPath } from './hebrewFontPath';
import { APPEAL_PAGE_MARGIN_PT } from './appealPdfLayout';

export function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** תווית או ערך בטופס — מודגש (כמו בדוגמת מכתב ההשגה) */
function metaStrong(s: string): string {
  return `<strong class="appeal-meta-strong">${escapeHtmlText(s)}</strong>`;
}

function paragraphsFromText(text: string, opts?: { bold?: boolean }): string {
  const parts = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return parts
    .map((p) => {
      const esc = escapeHtmlText(p);
      const inner = opts?.bold ? `<strong class="appeal-strong">${esc}</strong>` : esc;
      return `<p class="appeal-body-p">${inner}</p>`;
    })
    .join('');
}

function headingBlockHtml(level: 1 | 2 | 3, text: string): string {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => escapeHtmlText(l));
  let inner: string;
  if (level === 1 && lines.length > 1) {
    const [first, ...rest] = lines;
    inner = `${first}<br />${rest.map((l) => `<span class="appeal-doc-h1-subline">${l}</span>`).join('<br />')}`;
  } else {
    inner = lines.join('<br />');
  }
  return `<h${level} class="appeal-doc-heading appeal-doc-h${level}">${inner}</h${level}>`;
}

function buildFixedLetterFrontMatter(doc: NormalizedAppealLetter): string {
  const h = doc.header;
  const addressLine = `${h.addressLine} גוש ${h.block} חלקה ${h.parcel} תת חלקה ${h.subParcel}`;
  const propertyDetails = `נכס מס': ${h.propertyNumber}`;

  const titlesBlock =
    doc.titleLine1.trim() || doc.titleLine2.trim()
      ? `<div class="appeal-doc-main-titles" role="presentation">
    <p class="appeal-doc-main-title-line appeal-doc-main-title-primary">${metaStrong(doc.titleLine1)}</p>
    <p class="appeal-doc-main-title-line appeal-doc-main-title-secondary">${metaStrong(doc.titleLine2)}</p>
  </div>`
      : '';

  return `<div class="letter-addressee">
    <p class="letter-addressee-line">${metaStrong('מנהל הארנונה')}</p>
    <p class="letter-addressee-line">${metaStrong(`עיריית ${h.cityDisplay}`)}</p>
  </div>
  <table class="appeal-meta-table" role="presentation">
    <tr><td class="appeal-meta-label">${metaStrong('שם המשיג/ים:')}</td><td class="appeal-meta-value">${metaStrong(h.fullName)}</td></tr>
    <tr><td class="appeal-meta-label">${metaStrong('תעודת זהות/ח.פ.:')}</td><td class="appeal-meta-value">${metaStrong(h.idNumber)}</td></tr>
    <tr><td class="appeal-meta-label">${metaStrong('פרטי הנכס:')}</td><td class="appeal-meta-value">${metaStrong(propertyDetails)}</td></tr>
    <tr><td class="appeal-meta-label">${metaStrong('כתובת הנכס:')}</td><td class="appeal-meta-value">${metaStrong(addressLine)}</td></tr>
  </table>
  <p class="appeal-hence-line">${metaStrong('(להלן – "הנכס")')}</p>
  <p class="appeal-meta-inline">${metaStrong('מהות ההשגה:')} ${metaStrong(h.appealNature)}</p>
  <p class="appeal-meta-inline appeal-meta-filing-line">${metaStrong('הגשה לשנים:')} ${metaStrong(h.filingYearsLine)}</p>
  ${titlesBlock}`;
}

let cachedFontFaceCss: string | null = null;

function getFontFaceCss(): string {
  if (cachedFontFaceCss) return cachedFontFaceCss;
  const regPath = getAppealHebrewFontPath();
  const boldPath = getAppealHebrewBoldFontPath();
  if (!fs.existsSync(regPath) || !fs.existsSync(boldPath)) {
    cachedFontFaceCss =
      "body{font-family:'Segoe UI',Arial,sans-serif;}\n.appeal-strong,.appeal-meta-strong{font-weight:bold;}";
    return cachedFontFaceCss;
  }
  const regB64 = fs.readFileSync(regPath).toString('base64');
  const boldB64 = fs.readFileSync(boldPath).toString('base64');
  cachedFontFaceCss = `
@font-face {
  font-family: 'AppealDavid';
  font-style: normal;
  font-weight: 400;
  src: url(data:font/ttf;base64,${regB64}) format('truetype');
}
@font-face {
  font-family: 'AppealDavid';
  font-style: normal;
  font-weight: 700;
  src: url(data:font/ttf;base64,${boldB64}) format('truetype');
}`;
  return cachedFontFaceCss;
}

function marginMm(pt: number): string {
  return `${(pt * 25.4) / 72}mm`;
}

/**
 * מסמך HTML להדפסה/PDF: כותרת מכתב קבועה + טופס מודגש + גוף מ-Gemini.
 */
export function buildAppealLetterHtml(doc: NormalizedAppealLetter): string {
  const m = marginMm(APPEAL_PAGE_MARGIN_PT);
  const dateLineEscaped = escapeHtmlText(doc.dateLine);
  const lekavodEscaped = escapeHtmlText('לכבוד');
  const fixedFront = buildFixedLetterFrontMatter(doc);

  const bodyHtml = doc.bodyRows
    .map((row) => {
      switch (row.type) {
        case 'heading':
          return headingBlockHtml(row.level, row.text);
        case 'checklist':
          return `<ul class="checklist">${row.items.map((it) => `<li>${escapeHtmlText(it)}</li>`).join('')}</ul>`;
        case 'date':
          return `<p class="date-line">${escapeHtmlText(row.text)}</p>`;
        case 'plain':
          return `<div class="plain-block${row.emphasis === 'calc' ? ' calc-block' : ''}">${paragraphsFromText(row.text, { bold: row.bold })}</div>`;
        default:
          return '';
      }
    })
    .join('\n');

  const fontCss = getFontFaceCss();

  const pasteLabel = escapeHtmlText('הדבק חתימה');
  const signerTrim = doc.signerNameLine.trim();
  const signerLineHtml =
    signerTrim.length > 0
      ? `<p class="appeal-signer-name-line">${escapeHtmlText(signerTrim)}</p>`
      : '';
  const signatureBlock = doc.showSignaturePlaceholder
    ? `<div class="appeal-signature-cluster" role="presentation">
      <div class="appeal-signature-paste-zone" role="presentation">
        <p id="appeal-signature-anchor" class="appeal-paste-signature-label" aria-hidden="true">${pasteLabel}</p>
      </div>
      ${signerLineHtml}
    </div>`
    : '';
  const distributionFooter =
    doc.distributionLine.trim().length > 0
      ? `<p class="appeal-distribution-line">${escapeHtmlText(doc.distributionLine.trim())}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
  ${fontCss}
  @page { size: A4; margin: ${m}; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'AppealDavid', 'David Libre', 'Segoe UI', sans-serif;
    font-size: 12.5pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
  }
  .sheet {
    padding-bottom: 12mm;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .letter-header-line {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
    width: 100%;
    max-width: 100%;
    margin: 0 0 0.55em;
    box-sizing: border-box;
    font-size: 12.5pt;
  }
  .letter-lekavod {
    font-weight: 700;
    flex: 0 0 auto;
  }
  .letter-date-on-line {
    font-weight: 400;
    white-space: nowrap;
    flex: 0 0 auto;
  }
  .letter-addressee {
    margin: 0 0 0.5em;
  }
  .letter-addressee-line {
    margin: 0.1em 0;
    text-align: right;
  }
  .appeal-meta-strong {
    font-weight: 700;
    font-family: 'AppealDavid', 'David Libre', 'Segoe UI', sans-serif;
  }
  .appeal-meta-filing-line {
    margin-bottom: 0.45em;
  }
  .appeal-doc-main-titles {
    text-align: center;
    width: 100%;
    margin: 0.55em 0 0.75em;
    padding: 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .appeal-doc-main-title-line {
    margin: 0.12em 0;
    padding: 0;
    line-height: 1.35;
  }
  .appeal-doc-main-title-primary {
    font-size: 15pt;
    letter-spacing: 0.02em;
  }
  .appeal-doc-main-title-secondary {
    font-size: 14.5pt;
    letter-spacing: 0.015em;
  }
  .appeal-meta-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.35em 0 0.5em;
  }
  .appeal-meta-table td {
    padding: 0.2em 0.35em;
    vertical-align: top;
    font-size: 12.5pt;
    line-height: 1.45;
  }
  .appeal-meta-label {
    white-space: nowrap;
    width: 1%;
  }
  .appeal-meta-value {
    word-break: break-word;
  }
  .appeal-hence-line {
    margin: 0.35em 0 0.45em;
    text-align: right;
  }
  .appeal-meta-inline {
    margin: 0.25em 0;
    text-align: right;
    line-height: 1.45;
  }
  .appeal-doc-heading {
    font-family: 'AppealDavid', 'David Libre', 'Segoe UI', sans-serif;
    font-weight: 700;
    margin: 0;
    padding: 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .appeal-doc-h1 {
    font-size: 15pt;
    line-height: 1.35;
    text-align: center;
    margin: 0.5em 0 0.35em;
    letter-spacing: 0.01em;
  }
  .appeal-doc-h1 .appeal-doc-h1-subline {
    display: block;
    font-size: 0.96em;
    margin-top: 0.2em;
    letter-spacing: 0.015em;
  }
  .appeal-doc-h2 {
    font-size: 13.5pt;
    line-height: 1.4;
    text-align: right;
    margin: 0.85em 0 0.4em;
  }
  .appeal-doc-h3 {
    font-size: 13pt;
    line-height: 1.4;
    text-align: right;
    margin: 0.7em 0 0.35em;
  }
  .appeal-body-p {
    margin: 0.28em 0;
  }
  .appeal-strong {
    font-weight: 700;
  }
  .plain-block .appeal-body-p { margin: 0.28em 0; }
  .checklist {
    list-style: none;
    padding: 0;
    margin: 0.55em 0 0.55em 1.85em;
  }
  .checklist li {
    margin: 0.28em 0;
    position: relative;
    padding-inline-start: 1.25em;
    line-height: 1.5;
  }
  .checklist li::before {
    content: '✓';
    position: absolute;
    inset-inline-start: 0;
    font-weight: 700;
  }
  .date-line {
    margin: 0.65em 0;
    text-align: right;
    font-weight: 400;
  }
  .plain-block.calc-block {
    background: #f5f5f5;
    padding: 0.55em 0.7em;
    border-radius: 2px;
    margin: 0.55em 0;
    border: 1px solid #e8e8e8;
  }
  .appeal-signature-cluster {
    margin-top: 2.9em;
    break-inside: avoid;
    page-break-inside: avoid;
    text-align: center;
  }
  .appeal-signature-paste-zone {
    margin: 0 auto;
    width: 100%;
    max-width: 140pt;
    min-height: 48pt;
    padding: 0.25em 0 0.35em;
    box-sizing: border-box;
    border-bottom: 1px solid #000;
  }
  .appeal-paste-signature-label {
    margin: 0;
    height: 24pt;
    line-height: 24pt;
    text-align: center;
    font-weight: 400;
  }
  .appeal-signer-name-line {
    margin: 0.5em 0 0;
    text-align: center;
    font-weight: 400;
    font-size: 12.5pt;
    line-height: 1.45;
  }
  .appeal-distribution-line {
    margin: 1.75em 0 0;
    text-align: right;
    font-size: 12.5pt;
    line-height: 1.45;
    font-weight: 400;
  }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="letter-header-line" role="presentation">
      <span class="letter-lekavod">${lekavodEscaped}</span>
      <span class="letter-date-on-line">${dateLineEscaped}</span>
    </div>
    ${fixedFront}
    ${bodyHtml}
    ${signatureBlock}
    ${distributionFooter}
  </div>
</body>
</html>`;
}
