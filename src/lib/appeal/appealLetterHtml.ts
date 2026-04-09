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

/** תווית או ערך בטופס — מודגש */
function metaStrong(s: string): string {
  return `<strong class="meta-strong">${escapeHtmlText(s)}</strong>`;
}

function paragraphsFromText(text: string, opts?: { bold?: boolean }): string {
  const parts = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return parts
    .map((p) => {
      const esc = escapeHtmlText(p);
      const inner = opts?.bold ? `<strong>${esc}</strong>` : esc;
      return `<p class="body-p">${inner}</p>`;
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
    inner = `${first}<br />${rest.map((l) => `<span class="h1-subline">${l}</span>`).join('<br />')}`;
  } else {
    inner = lines.join('<br />');
  }
  const cls = level === 2 ? ' underline' : '';
  return `<h${level} class="doc-h${level}${cls}">${inner}</h${level}>`;
}

function buildFixedLetterFrontMatter(doc: NormalizedAppealLetter): string {
  const h = doc.header;
  const addressLine = `${h.addressLine} גוש ${h.block} חלקה ${h.parcel} תת חלקה ${h.subParcel}`;

  const titlesBlock =
    doc.titleLine1.trim() || doc.titleLine2.trim()
      ? `<div class="main-titles">
    <p class="main-title primary">${metaStrong(doc.titleLine1)}</p>
    <p class="main-title secondary">${metaStrong(doc.titleLine2)}</p>
    <div class="title-rule"></div>
  </div>`
      : '';

  return `<!-- Addressee -->
  <div class="addressee-block">
    <p class="addressee-line">${metaStrong('לכבוד')}</p>
    <p class="addressee-line">${metaStrong('מנהל הארנונה')}</p>
    <p class="addressee-line">${metaStrong(`עיריית ${h.cityDisplay}`)}</p>
  </div>

  <!-- Meta details table -->
  <table class="meta-table">
    <tbody>
      <tr>
        <td class="meta-label">שם המשיג/ים:</td>
        <td class="meta-value">${escapeHtmlText(h.fullName)}</td>
      </tr>
      <tr>
        <td class="meta-label">תעודת זהות / ח.פ.:</td>
        <td class="meta-value">${escapeHtmlText(h.idNumber)}</td>
      </tr>
      <tr>
        <td class="meta-label">נכס מס':</td>
        <td class="meta-value">${escapeHtmlText(h.propertyNumber)}</td>
      </tr>
      <tr>
        <td class="meta-label">מזהה נכס:</td>
        <td class="meta-value">${escapeHtmlText(h.propertyId)}</td>
      </tr>
      <tr>
        <td class="meta-label">כתובת הנכס:</td>
        <td class="meta-value">${escapeHtmlText(addressLine)}</td>
      </tr>
    </tbody>
  </table>

  <p class="hence-line">(להלן – "הנכס")</p>

  <!-- Appeal nature & filing years -->
  <div class="nature-block">
    <p class="nature-line"><span class="nature-label">מהות ההשגה:</span> ${escapeHtmlText(h.appealNature)}</p>
    <p class="nature-line"><span class="nature-label">הגשה לשנים:</span> ${escapeHtmlText(h.filingYearsLine)}</p>
  </div>

  <!-- Document titles -->
  ${titlesBlock}`;
}

let cachedFontFaceCss: string | null = null;

function getFontFaceCss(): string {
  if (cachedFontFaceCss) return cachedFontFaceCss;
  const regPath = getAppealHebrewFontPath();
  const boldPath = getAppealHebrewBoldFontPath();
  if (!fs.existsSync(regPath) || !fs.existsSync(boldPath)) {
    cachedFontFaceCss =
      "body{font-family:'Segoe UI',Arial,sans-serif;}\nstrong{font-weight:bold;}";
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
 * מסמך HTML להדפסה/PDF — עיצוב מכתב רשמי בסגנון Word.
 */
export function buildAppealLetterHtml(doc: NormalizedAppealLetter): string {
  const m = marginMm(APPEAL_PAGE_MARGIN_PT);
  const dateLineEscaped = escapeHtmlText(doc.dateLine);
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
      ? `<p class="signer-name">${escapeHtmlText(signerTrim)}</p>`
      : '';
  const signatureBlock = doc.showSignaturePlaceholder
    ? `<div class="signature-cluster">
      <p class="signature-label">בכבוד רב,</p>
      <div class="signature-paste-zone">
        <p id="appeal-signature-anchor" class="paste-label" aria-hidden="true">${pasteLabel}</p>
      </div>
      <div class="signature-line-rule"></div>
      ${signerLineHtml}
    </div>`
    : '';
  const distributionFooter =
    doc.distributionLine.trim().length > 0
      ? `<p class="distribution-line">${escapeHtmlText(doc.distributionLine.trim())}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <style>
  ${fontCss}

  /* ── Page & Reset ───────────────────────────────────── */
  @page { size: A4; margin: ${m}; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: 'AppealDavid', 'David Libre', 'Segoe UI', serif;
    font-size: 12pt;
    line-height: 1.65;
    color: #000;
    background: #fff;
  }

  /* ── Sheet container ────────────────────────────────── */
  .sheet {
    width: 100%;
    max-width: 100%;
    padding-bottom: 10mm;
  }

  /* ── Date line (top-right) ──────────────────────────── */
  .date-header {
    text-align: left; /* RTL → left = שמאל = end of line visually */
    margin-bottom: 1.2em;
    font-size: 12pt;
  }

  /* ── Addressee block ────────────────────────────────── */
  .addressee-block {
    margin-bottom: 1em;
  }
  .addressee-line {
    margin: 0.05em 0;
    font-size: 12pt;
    line-height: 1.55;
  }

  /* ── Meta strong (bold labels/values) ───────────────── */
  .meta-strong {
    font-weight: 700;
  }

  /* ── Details table ──────────────────────────────────── */
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8em 0;
    border: 1.5pt solid #000;
  }
  .meta-table td {
    padding: 4pt 8pt;
    font-size: 12pt;
    line-height: 1.5;
    border-bottom: 0.75pt solid #999;
    vertical-align: top;
  }
  .meta-table tr:last-child td {
    border-bottom: none;
  }
  .meta-label {
    white-space: nowrap;
    width: 1%;
    font-weight: 700;
    padding-left: 12pt; /* RTL: gap between label & value */
  }
  .meta-value {
    word-break: break-word;
  }

  /* ── "להלן הנכס" ───────────────────────────────────── */
  .hence-line {
    margin: 0.5em 0 0.8em;
    font-size: 11pt;
    font-style: italic;
  }

  /* ── Appeal nature block ────────────────────────────── */
  .nature-block {
    margin: 0 0 1em;
    padding: 6pt 10pt;
    border-right: 3pt solid #000;
  }
  .nature-line {
    margin: 0.15em 0;
    font-size: 12pt;
    line-height: 1.55;
  }
  .nature-label {
    font-weight: 700;
  }

  /* ── Main document titles (centered, underlined) ───── */
  .main-titles {
    text-align: center;
    margin: 1.3em 0 1em;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .main-title {
    margin: 0.1em 0;
    line-height: 1.4;
  }
  .main-title.primary {
    font-size: 16pt;
    letter-spacing: 0.03em;
  }
  .main-title.secondary {
    font-size: 14pt;
    letter-spacing: 0.02em;
  }
  .title-rule {
    width: 65%;
    max-width: 320pt;
    height: 1.5pt;
    background: #000;
    margin: 0.5em auto 0;
  }

  /* ── Body text ──────────────────────────────────────── */
  .body-p {
    margin: 0.35em 0;
    text-align: justify;
    text-indent: 0;
    line-height: 1.65;
  }

  /* ── Section headings ───────────────────────────────── */
  .doc-h1 {
    font-size: 14pt;
    font-weight: 700;
    text-align: center;
    margin: 1.2em 0 0.5em;
    line-height: 1.4;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .doc-h1 .h1-subline {
    display: block;
    font-size: 0.93em;
    margin-top: 0.15em;
  }
  .doc-h2 {
    font-size: 13pt;
    font-weight: 700;
    text-align: right;
    margin: 1em 0 0.4em;
    line-height: 1.45;
    text-decoration: underline;
    text-underline-offset: 3pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .doc-h3 {
    font-size: 12.5pt;
    font-weight: 700;
    text-align: right;
    margin: 0.8em 0 0.35em;
    line-height: 1.45;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* ── Checklist ──────────────────────────────────────── */
  .checklist {
    list-style: none;
    padding: 0;
    margin: 0.6em 0 0.6em 1.6em;
  }
  .checklist li {
    margin: 0.3em 0;
    position: relative;
    padding-inline-start: 1.4em;
    line-height: 1.6;
  }
  .checklist li::before {
    content: '•';
    position: absolute;
    inset-inline-start: 0;
    font-weight: 700;
    font-size: 1.1em;
  }

  /* ── Date line (in body) ────────────────────────────── */
  .date-line {
    margin: 0.65em 0;
    text-align: right;
  }

  /* ── Calculation block (background highlight) ───────── */
  .plain-block.calc-block {
    background: #f7f7f7;
    padding: 8pt 10pt;
    margin: 0.7em 0;
    border: 0.75pt solid #ddd;
    border-right: 3pt solid #333;
  }

  /* ── Signature cluster ──────────────────────────────── */
  .signature-cluster {
    margin-top: 2.5em;
    break-inside: avoid;
    page-break-inside: avoid;
    text-align: right;
    padding-right: 0;
  }
  .signature-label {
    margin: 0 0 0.8em;
    font-size: 12pt;
    font-weight: 400;
  }
  .signature-paste-zone {
    display: inline-block;
    width: 180pt;
    min-height: 48pt;
    text-align: center;
  }
  .paste-label {
    height: 56pt;
    line-height: 56pt;
    text-align: center;
    color: #aaa;
    font-size: 11pt;
  }
  .signature-line-rule {
    width: 180pt;
    height: 0;
    border-bottom: 1pt solid #000;
    margin: 0 0 0.3em;
  }
  .signer-name {
    margin: 0.3em 0 0;
    font-size: 12pt;
    font-weight: 700;
  }

  /* ── Distribution footer ────────────────────────────── */
  .distribution-line {
    margin: 2em 0 0;
    font-size: 11pt;
    line-height: 1.5;
    color: #333;
  }

  </style>
</head>
<body>
  <div class="sheet">
    <!-- Date -->
    <p class="date-header">${dateLineEscaped}</p>

    ${fixedFront}

    <!-- Letter body -->
    ${bodyHtml}

    <!-- Signature -->
    ${signatureBlock}

    <!-- Distribution -->
    ${distributionFooter}
  </div>
</body>
</html>`;
}
