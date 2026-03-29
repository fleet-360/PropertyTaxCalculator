import fs from 'fs';
import PDFDocument from 'pdfkit';
import {
  APPEAL_PAGE_MARGIN_PT,
  appealFooterBaselines,
} from './appealPdfLayout';
import { getAppealHebrewFontPath } from './hebrewFontPath';
import { logicalToVisualRtlForPdf } from './logicalToVisualRtlForPdf';
import { ensurePdfKitAppealFontLayoutPatch } from './patchPdfKitAppealFontLayout';

/** Truthy `features` → single fontkit pass per line; combined with patch + BiDi for digits/Latin. */
const PDF_HEBREW_LINE_FEATURES: [] = [];

/**
 * Render Hebrew appeal letter as PDF (right-aligned). Footer is anchored to the bottom margin so the
 * signature image can be placed between the label and the underscore line (see `applySignatureToPdf`).
 */
export async function renderAppealLetterPdf(hebrewBody: string): Promise<Buffer> {
  const fontPath = getAppealHebrewFontPath();
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Hebrew font not found at ${fontPath}`);
  }

  ensurePdfKitAppealFontLayoutPatch();

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: APPEAL_PAGE_MARGIN_PT,
      autoFirstPage: true,
    });

    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.registerFont('Hebrew', fontPath);
    const textWidth = doc.page.width - APPEAL_PAGE_MARGIN_PT * 2;

    const { lineBaselineY, labelBaselineY, bodyContentBottomY } = appealFooterBaselines(
      doc.page.height,
      doc.page.margins.bottom,
    );

    const bodyHeight = Math.max(0, bodyContentBottomY - APPEAL_PAGE_MARGIN_PT);

    doc.x = APPEAL_PAGE_MARGIN_PT;
    doc.y = APPEAL_PAGE_MARGIN_PT;
    doc.fillColor('#000000');
    doc.opacity(1);
    doc.font('Hebrew').fontSize(12);

    const visualBody = logicalToVisualRtlForPdf(hebrewBody);
    doc.text(visualBody, APPEAL_PAGE_MARGIN_PT, APPEAL_PAGE_MARGIN_PT, {
      width: textWidth,
      height: bodyHeight,
      align: 'right',
      features: PDF_HEBREW_LINE_FEATURES,
    });

    const pageRange = doc.bufferedPageRange();
    doc.switchToPage(pageRange.start + pageRange.count - 1);
    doc.x = APPEAL_PAGE_MARGIN_PT;

    doc.fontSize(11);
    doc.text(logicalToVisualRtlForPdf('חתימת המגיש:'), APPEAL_PAGE_MARGIN_PT, labelBaselineY, {
      width: textWidth,
      align: 'right',
      features: PDF_HEBREW_LINE_FEATURES,
    });

    doc.text('__________________________', APPEAL_PAGE_MARGIN_PT, lineBaselineY, {
      width: textWidth,
      align: 'right',
      features: PDF_HEBREW_LINE_FEATURES,
    });

    doc.end();
  });
}
