import fs from 'fs';
import PDFDocument from 'pdfkit';
import {
  APPEAL_PAGE_MARGIN_PT,
  APPEAL_SIGNATURE_LINE_LENGTH_PT,
  appealFooterBaselines,
} from './appealPdfLayout';
import { getAppealHebrewFontPath } from './hebrewFontPath';
import { logicalToVisualRtlForPdf } from './logicalToVisualRtlForPdf';
import { ensurePdfKitAppealFontLayoutPatch } from './patchPdfKitAppealFontLayout';

/** Truthy `features` → single fontkit pass per line; combined with patch + BiDi for digits/Latin. */
const PDF_HEBREW_LINE_FEATURES: [] = [];

/**
 * Render Hebrew appeal letter as PDF (right-aligned). Footer is anchored to the bottom margin so the
 * signature image sits between the label and the rule line (see `applySignatureToPdf`).
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

    const lineRightX = APPEAL_PAGE_MARGIN_PT + textWidth;
    const lineLeftX = lineRightX - APPEAL_SIGNATURE_LINE_LENGTH_PT;
    doc.save();
    doc.strokeColor('#000000');
    doc.lineWidth(0.75);
    doc.moveTo(lineLeftX, lineBaselineY).lineTo(lineRightX, lineBaselineY).stroke();
    doc.restore();

    doc.end();
  });
}
