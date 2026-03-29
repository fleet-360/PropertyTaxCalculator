import fs from 'fs';
import PDFDocument from 'pdfkit';
import { getAppealHebrewFontPath } from './hebrewFontPath';
import { logicalToVisualRtlForPdf } from './logicalToVisualRtlForPdf';

const PAGE_MARGIN = 56;

/**
 * Render Hebrew appeal letter as PDF (right-aligned text, Hebrew font).
 * Footer lines reserve space; signature image is merged server-side afterward.
 */
export async function renderAppealLetterPdf(hebrewBody: string): Promise<Buffer> {
  const fontPath = getAppealHebrewFontPath();
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Hebrew font not found at ${fontPath}`);
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      autoFirstPage: true,
    });

    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.registerFont('Hebrew', fontPath);
    const textWidth = doc.page.width - PAGE_MARGIN * 2;

    doc.x = PAGE_MARGIN;
    doc.y = PAGE_MARGIN;
    doc.font('Hebrew').fontSize(11).fillColor('#000000');

    const visualBody = logicalToVisualRtlForPdf(hebrewBody);
    doc.text(visualBody, {
      width: textWidth,
      align: 'right',
    });

    doc.moveDown(2);
    doc.fontSize(10);
    doc.text(logicalToVisualRtlForPdf('חתימת המגיש:'), {
      width: textWidth,
      align: 'right',
    });
    doc.moveDown(0.5);
    doc.text('__________________________', {
      width: textWidth,
      align: 'right',
    });

    doc.end();
  });
}
