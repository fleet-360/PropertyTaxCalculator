import { PDFDocument } from 'pdf-lib';
import {
  APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT,
  APPEAL_PAGE_MARGIN_PT,
  appealFooterBaselines,
  signatureImagePdfLibY,
} from './appealPdfLayout';

/**
 * Draw signature PNG on the last page, right-aligned between “חתימת המגיש:” and the rule line
 * (geometry must match `renderAppealPdf`).
 */
export async function applySignatureToPdfBuffer(
  pdfBuffer: Buffer,
  pngBuffer: Buffer,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  const pages = pdfDoc.getPages();
  if (pages.length === 0) {
    throw new Error('PDF has no pages');
  }
  const lastPage = pages[pages.length - 1]!;
  const { width, height } = lastPage.getSize();

  const maxW = Math.min(200, width * 0.42);
  const aspect = pngImage.height / pngImage.width;
  let imgW = maxW;
  let imgH = maxW * aspect;
  if (imgH > APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT) {
    imgH = APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT;
    imgW = imgH / aspect;
  }

  const margin = APPEAL_PAGE_MARGIN_PT;
  const x = width - margin - imgW;

  const { signatureImageBottomY } = appealFooterBaselines(height, margin);
  const y = signatureImagePdfLibY(height, signatureImageBottomY);

  lastPage.drawImage(pngImage, {
    x,
    y,
    width: imgW,
    height: imgH,
  });

  const out = await pdfDoc.save();
  return Buffer.from(out);
}
