import { PDFDocument } from 'pdf-lib';
import {
  APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT,
  APPEAL_PAGE_MARGIN_PT,
  appealFooterBaselines,
  signatureImagePdfLibY,
} from './appealPdfLayout';

const SIG_ANCHOR_PREFIX = 'SIG_ANCHOR:';

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
  const subject = pdfDoc.getSubject();
  const anchorRaw =
    typeof subject === 'string' && subject.startsWith(SIG_ANCHOR_PREFIX)
      ? subject.slice(SIG_ANCHOR_PREFIX.length).trim()
      : '';

  const parseAnchor = (): { pageIndex: number; xRight: number; yFromTop: number } | null => {
    if (!anchorRaw) return null;
    const [pageIndexRaw, xRightRaw, yFromTopRaw] = anchorRaw.split(',').map((s) => s.trim());
    const pageIndex = Number(pageIndexRaw);
    const xRight = Number(xRightRaw);
    const yFromTop = Number(yFromTopRaw);
    if (!Number.isFinite(pageIndex) || !Number.isFinite(xRight) || !Number.isFinite(yFromTop)) {
      return null;
    }
    if (pageIndex < 0 || pageIndex >= pages.length) return null;
    return { pageIndex, xRight, yFromTop };
  };

  const anchor = parseAnchor();

  const targetPage = anchor ? pages[anchor.pageIndex]! : pages[pages.length - 1]!;
  const { width, height } = targetPage.getSize();

  const maxW = Math.min(200, width * 0.42);
  const aspect = pngImage.height / pngImage.width;
  let imgW = maxW;
  let imgH = maxW * aspect;
  if (imgH > APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT) {
    imgH = APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT;
    imgW = imgH / aspect;
  }

  const margin = APPEAL_PAGE_MARGIN_PT;
  const x = anchor ? anchor.xRight - imgW : width - margin - imgW;

  // If we have an explicit anchor ("הדבק חתימה"), place the image so its top-left aligns there.
  // Otherwise, fallback to the fixed footer slot.
  const y = anchor
    ? height - anchor.yFromTop - imgH
    : signatureImagePdfLibY(height, appealFooterBaselines(height, margin).signatureImageBottomY);

  targetPage.drawImage(pngImage, {
    x,
    y,
    width: imgW,
    height: imgH,
  });

  const out = await pdfDoc.save();
  return Buffer.from(out);
}
