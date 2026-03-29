import fs from 'fs';
import PDFDocument from 'pdfkit';
import { getAppealHebrewFontPath } from './hebrewFontPath';

const PAGE_MARGIN = 56;

/** Truthy `features` makes PDFKit lay out each line in one fontkit pass; default code splits on spaces and breaks RTL word order. */
const PDF_HEBREW_LINE_FEATURES: [] = [];

/**
 * Render Hebrew appeal letter as PDF (right-aligned text, Hebrew font).
 * Pass logical-order Unicode from the model. Footer reserves space; signature is merged server-side.
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

    doc.text(hebrewBody, {
      width: textWidth,
      align: 'right',
      features: PDF_HEBREW_LINE_FEATURES,
    });

    doc.moveDown(2);
    doc.fontSize(10);
    doc.text('חתימת המגיש:', {
      width: textWidth,
      align: 'right',
      features: PDF_HEBREW_LINE_FEATURES,
    });
    doc.moveDown(0.5);
    doc.text('__________________________', {
      width: textWidth,
      align: 'right',
      features: PDF_HEBREW_LINE_FEATURES,
    });

    doc.end();
  });
}
