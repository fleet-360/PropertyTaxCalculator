import fs from 'fs';
import PDFDocument from 'pdfkit';
import { peelLeadingWhitespaceIndent } from './appealLetterTextLayout';
import {
  APPEAL_MAX_LINE_INDENT_PT,
  APPEAL_PAGE_MARGIN_PT,
  APPEAL_SIGNATURE_LINE_LENGTH_PT,
  appealFooterBaselines,
  appealTextFlowBottomMarginPt,
} from './appealPdfLayout';
import { getAppealHebrewBoldFontPath, getAppealHebrewFontPath } from './hebrewFontPath';
import { logicalToVisualRtlForPdf } from './logicalToVisualRtlForPdf';
import { ensurePdfKitAppealFontLayoutPatch } from './patchPdfKitAppealFontLayout';

/** Truthy `features` → single fontkit pass per line; combined with patch + BiDi for digits/Latin. */
const PDF_HEBREW_LINE_FEATURES: [] = [];

/** 100% K — explicit device RGB so viewers don’t tone-map to gray. */
const APPEAL_INK: [number, number, number] = [0, 0, 0];

const APPEAL_BODY_FONT_SIZE_PT = 12.5;
/** Main document title lines (e.g. כתב השגה / ובקשה למתן הנחות) — matches typical Word template emphasis. */
const APPEAL_DOC_TITLE_FONT_SIZE_PT = 14;
const APPEAL_FOOTER_LABEL_FONT_SIZE_PT = 11.5;
const APPEAL_BODY_LINE_GAP_PT = 2.5;
const APPEAL_SIGNATURE_RULE_WIDTH_PT = 1;
/** Extra left offset narrows the RTL text box → visual indent from the right margin. */
const APPEAL_NUMBERED_INDENT_PT = 26;
const APPEAL_CHECKLIST_INDENT_PT = 34;
/** Numbered heading vs long numbered clause: only short lines use bold (full line). */
const APPEAL_NUMBERED_BOLD_MAX_CHARS = 88;

const SIGNATURE_PLACEHOLDER_TEXT = 'הדבק חתימה';
const SIG_ANCHOR_PREFIX = 'SIG_ANCHOR:';

function appealLineLayout(trimmed: string): {
  font: 'Hebrew' | 'HebrewBold';
  size: number;
  indentPt: number;
} {
  if (!trimmed) {
    return { font: 'Hebrew', size: APPEAL_BODY_FONT_SIZE_PT, indentPt: 0 };
  }

  if (/^כתב השגה על\b/.test(trimmed)) {
    return { font: 'HebrewBold', size: APPEAL_DOC_TITLE_FONT_SIZE_PT, indentPt: 0 };
  }
  if (/^ובקשה למתן הנחות/.test(trimmed) || /^ובקשה למתן\b/.test(trimmed)) {
    return { font: 'HebrewBold', size: APPEAL_DOC_TITLE_FONT_SIZE_PT, indentPt: 0 };
  }

  if (
    trimmed === 'תיאור הנכס' ||
    /^תיאור הנכס\s/.test(trimmed) ||
    /^מהות ההשגה[:：]?\s*/.test(trimmed) ||
    /^העתק(ים)?\b/.test(trimmed) ||
    trimmed.startsWith('לכבוד')
  ) {
    return { font: 'HebrewBold', size: APPEAL_BODY_FONT_SIZE_PT, indentPt: 0 };
  }

  if (/^\d+\.\s/.test(trimmed)) {
    const useBold = trimmed.length <= APPEAL_NUMBERED_BOLD_MAX_CHARS;
    return {
      font: useBold ? 'HebrewBold' : 'Hebrew',
      size: APPEAL_BODY_FONT_SIZE_PT,
      indentPt: APPEAL_NUMBERED_INDENT_PT,
    };
  }

  if (/^[oOο•]\s/.test(trimmed)) {
    return { font: 'Hebrew', size: APPEAL_BODY_FONT_SIZE_PT, indentPt: APPEAL_CHECKLIST_INDENT_PT };
  }

  return { font: 'Hebrew', size: APPEAL_BODY_FONT_SIZE_PT, indentPt: 0 };
}

/**
 * Render Hebrew appeal letter as PDF (right-aligned). Footer is anchored to the bottom margin so the
 * signature image sits between the label and the rule line (see `applySignatureToPdf`).
 */
export async function renderAppealLetterPdf(hebrewBody: string): Promise<Buffer> {
  const fontPath = getAppealHebrewFontPath();
  const boldFontPath = getAppealHebrewBoldFontPath();
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Hebrew font not found at ${fontPath}`);
  }
  if (!fs.existsSync(boldFontPath)) {
    throw new Error(`Hebrew bold font not found at ${boldFontPath}`);
  }

  ensurePdfKitAppealFontLayoutPatch();

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const m = APPEAL_PAGE_MARGIN_PT;
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: m,
        left: m,
        right: m,
        bottom: appealTextFlowBottomMarginPt(),
      },
      autoFirstPage: true,
    });

    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.registerFont('Hebrew', fontPath);
    doc.registerFont('HebrewBold', boldFontPath);
    const textWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageH = doc.page.height;

    const { lineBaselineY, labelBaselineY } = appealFooterBaselines(pageH, APPEAL_PAGE_MARGIN_PT);

    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top;
    doc.fillColor(APPEAL_INK);
    doc.strokeColor(APPEAL_INK);
    doc.opacity(1);
    doc.font('Hebrew').fontSize(APPEAL_BODY_FONT_SIZE_PT);

    // Track the page index that PDFKit is currently writing to.
    let currentPageIndex = 0;
    doc.on('pageAdded', () => {
      currentPageIndex += 1;
    });

    // If the body includes "הדבק חתימה", capture the exact position so apply-signature can draw there.
    // We remove the placeholder line from the rendered text.
    let signatureAnchor:
      | { pageIndex: number; xRight: number; yFromTop: number }
      | undefined;

    // One PDF row per `\n` in the source so blank lines and paragraph gaps match the template.
    const lines = hebrewBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    for (const rawLine of lines) {
      if (!rawLine.trim()) {
        doc.font('Hebrew').fontSize(APPEAL_BODY_FONT_SIZE_PT);
        doc.moveDown(1);
        continue;
      }

      const { indentPt: tabSpaceIndent, rest } = peelLeadingWhitespaceIndent(rawLine);
      const trimmed = rest.trim();
      if (trimmed === SIGNATURE_PLACEHOLDER_TEXT && !signatureAnchor) {
        signatureAnchor = {
          pageIndex: currentPageIndex,
          xRight: doc.page.width - doc.page.margins.right,
          yFromTop: doc.y,
        };
        continue;
      }

      const layout = appealLineLayout(trimmed);
      const indentPt = Math.min(
        APPEAL_MAX_LINE_INDENT_PT,
        Math.max(tabSpaceIndent, layout.indentPt),
      );
      const visualLine = logicalToVisualRtlForPdf(rest.trim());
      const x = doc.page.margins.left + indentPt;
      const w = textWidth - indentPt;
      doc.font(layout.font).fontSize(layout.size);
      doc.text(visualLine, x, doc.y, {
        width: w,
        align: 'right',
        lineGap: APPEAL_BODY_LINE_GAP_PT,
        features: PDF_HEBREW_LINE_FEATURES,
      });
    }

    if (signatureAnchor) {
      // Store the anchor in PDF metadata for applySignatureToPdfBuffer (pdf-lib can read Subject).
      // This avoids parsing text positions from the PDF content stream.
      doc.info.Subject = `${SIG_ANCHOR_PREFIX}${signatureAnchor.pageIndex},${signatureAnchor.xRight.toFixed(
        2,
      )},${signatureAnchor.yFromTop.toFixed(2)}`;
    }

    const pageRange = doc.bufferedPageRange();
    doc.switchToPage(pageRange.start + pageRange.count - 1);
    doc.x = doc.page.margins.left;

    // If the template contains an explicit signature placeholder ("הדבק חתימה"), we place the
    // signature image there and do NOT add the fixed footer signature block.
    if (!signatureAnchor) {
      doc.font('Hebrew').fontSize(APPEAL_FOOTER_LABEL_FONT_SIZE_PT);
      doc.fillColor(APPEAL_INK);
      doc.text(logicalToVisualRtlForPdf('חתימת המגיש:'), doc.page.margins.left, labelBaselineY, {
        width: textWidth,
        align: 'right',
        features: PDF_HEBREW_LINE_FEATURES,
      });

      const lineRightX = doc.page.margins.left + textWidth;
      const lineLeftX = lineRightX - APPEAL_SIGNATURE_LINE_LENGTH_PT;
      doc.save();
      doc.strokeColor(APPEAL_INK);
      doc.lineWidth(APPEAL_SIGNATURE_RULE_WIDTH_PT);
      doc.moveTo(lineLeftX, lineBaselineY).lineTo(lineRightX, lineBaselineY).stroke();
      doc.restore();
    } else {
      // Keep lint happy: these are computed above for footer geometry.
      void lineBaselineY;
      void labelBaselineY;
    }

    doc.end();
  });
}
