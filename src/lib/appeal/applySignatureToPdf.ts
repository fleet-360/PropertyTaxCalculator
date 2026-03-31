import { PDFDocument, rgb } from 'pdf-lib';
import {
  APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT,
  APPEAL_PAGE_MARGIN_PT,
  appealFooterBaselines,
  signatureImagePdfLibY,
} from './appealPdfLayout';

const SIG_ANCHOR_PREFIX = 'SIG_ANCHOR:';

/**
 * Draw signature PNG on the last page using Subject SIG_ANCHOR or the fixed footer slot
 * (geometry matches `appealPdfLayout` / HTML appeal template).
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

  type ParsedAnchor =
    | { pageIndex: number; xLeft: number; xRight: number; mode: 'slot'; yTop: number; yBottom: number }
    | { pageIndex: number; xCenter: number; mode: 'slot_center'; yTop: number; yBottom: number }
    | { pageIndex: number; xRight: number; mode: 'top'; yFromTop: number };

  const parseAnchor = (): ParsedAnchor | null => {
    if (!anchorRaw) return null;
    const parts = anchorRaw.split(',').map((s) => s.trim());
    const pageIndex = Number(parts[0]);
    const xField = Number(parts[1]);
    if (!Number.isFinite(pageIndex) || !Number.isFinite(xField)) return null;
    if (pageIndex < 0 || pageIndex >= pages.length) return null;

    if (parts.length >= 5) {
      const xRight = Number(parts[2]);
      const yTop = Number(parts[3]);
      const yBottom = Number(parts[4]);
      if (!Number.isFinite(xRight) || xRight <= xField) return null;
      if (!Number.isFinite(yTop) || !Number.isFinite(yBottom) || yBottom <= yTop) return null;
      return { pageIndex, xLeft: xField, xRight, mode: 'slot', yTop, yBottom };
    }
    if (parts.length >= 4) {
      const yTop = Number(parts[2]);
      const yBottom = Number(parts[3]);
      if (!Number.isFinite(yTop) || !Number.isFinite(yBottom) || yBottom <= yTop) return null;
      return { pageIndex, xCenter: xField, mode: 'slot_center', yTop, yBottom };
    }
    if (parts.length >= 3) {
      const yFromTop = Number(parts[2]);
      if (!Number.isFinite(yFromTop)) return null;
      return { pageIndex, xRight: xField, mode: 'top', yFromTop };
    }
    return null;
  };

  const anchor = parseAnchor();

  const targetPage = anchor ? pages[anchor.pageIndex]! : pages[pages.length - 1]!;
  const { width, height } = targetPage.getSize();

  const maxW = Math.min(200, width * 0.42);
  const aspect = pngImage.height / pngImage.width;
  let imgW = maxW;
  let imgH = maxW * aspect;

  const margin = APPEAL_PAGE_MARGIN_PT;
  const slotHeightPt =
    anchor?.mode === 'slot' ? Math.max(4, anchor.yBottom - anchor.yTop) : null;
  const maxHForImage =
    slotHeightPt != null
      ? Math.min(APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT, slotHeightPt)
      : APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT;
  if (imgH > maxHForImage) {
    imgH = maxHForImage;
    imgW = imgH / aspect;
  }

  let x: number;
  if (anchor?.mode === 'slot') {
    const slotW = Math.max(6, anchor.xRight - anchor.xLeft);
    // Prefer fitting inside slot width; preserve aspect.
    if (imgW > slotW) {
      imgW = slotW;
      imgH = imgW * aspect;
      if (imgH > maxHForImage) {
        imgH = maxHForImage;
        imgW = imgH / aspect;
      }
    }
    const cx = anchor.xLeft + slotW / 2 - imgW / 2;
    const minX = margin;
    const maxX = width - margin - imgW;
    x = Math.min(Math.max(cx, minX), maxX);
  } else if (anchor?.mode === 'slot_center') {
    const cx = anchor.xCenter - imgW / 2;
    const minX = margin;
    const maxX = width - margin - imgW;
    x = Math.min(Math.max(cx, minX), maxX);
  } else if (anchor?.mode === 'top') {
    x = anchor.xRight - imgW;
  } else {
    x = width - margin - imgW;
  }

  // Slot mode: top of image aligns with top of the paste zone (#appeal-signature-anchor).
  // Legacy 3-field anchor: top-align to measured Y. No anchor: fixed footer geometry.
  let y: number;
  if (anchor?.mode === 'slot' || anchor?.mode === 'slot_center') {
    y = height - anchor.yTop - imgH;
  } else if (anchor?.mode === 'top') {
    y = height - anchor.yFromTop - imgH;
  } else {
    y = signatureImagePdfLibY(height, appealFooterBaselines(height, margin).signatureImageBottomY);
  }

  // In slot modes, hide the placeholder label ("הדבק חתימה") under the transparent PNG.
  if (anchor?.mode === 'slot' || anchor?.mode === 'slot_center') {
    const rectX =
      anchor.mode === 'slot'
        ? anchor.xLeft
        : Math.max(margin, Math.min(width - margin - 10, x)); // best-effort
    const rectW =
      anchor.mode === 'slot'
        ? Math.max(2, anchor.xRight - anchor.xLeft)
        : Math.max(2, imgW);
    const rectY = height - anchor.yBottom;
    const rectH = Math.max(2, anchor.yBottom - anchor.yTop);
    targetPage.drawRectangle({
      x: rectX,
      y: rectY,
      width: rectW,
      height: rectH,
      color: rgb(1, 1, 1),
      borderColor: rgb(1, 1, 1),
      borderWidth: 0,
      opacity: 1,
    });
  }

  targetPage.drawImage(pngImage, {
    x,
    y,
    width: imgW,
    height: imgH,
  });

  const out = await pdfDoc.save();
  return Buffer.from(out);
}
