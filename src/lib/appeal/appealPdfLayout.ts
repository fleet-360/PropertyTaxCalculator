/** Must match `margin` passed to PDFDocument in `renderAppealPdf`. */
export const APPEAL_PAGE_MARGIN_PT = 56;

/** Distance from max content Y to baseline of the underscore line. */
export const APPEAL_LINE_ABOVE_BOTTOM_MARGIN_PT = 24;

/** Space reserved: label + gap for signature image (between label and line). */
export const APPEAL_LABEL_AND_SIGNATURE_SLOT_PT = 56;

/** Gap between end of body text and the “חתימת המגיש” baseline. */
export const APPEAL_GAP_BODY_TO_LABEL_PT = 8;

/** Gap between bottom of signature image area and underscore baseline (PDFKit top coordinates). */
export const APPEAL_SIGNATURE_GAP_ABOVE_LINE_PT = 8;

export function appealFooterBaselines(pageHeightPt: number, marginBottomPt: number) {
  const maxY = pageHeightPt - marginBottomPt;
  const lineBaselineY = maxY - APPEAL_LINE_ABOVE_BOTTOM_MARGIN_PT;
  const labelBaselineY = lineBaselineY - APPEAL_LABEL_AND_SIGNATURE_SLOT_PT;
  const bodyContentBottomY = labelBaselineY - APPEAL_GAP_BODY_TO_LABEL_PT;
  return { maxY, lineBaselineY, labelBaselineY, bodyContentBottomY };
}

/**
 * pdf-lib `drawImage` y for the image’s lower-left corner (PDF origin bottom-left).
 * `lineBaselineFromTopPt` must match PDFKit underscore baseline (distance from top of page).
 */
export function signatureImagePdfLibY(pageHeightPt: number, lineBaselineFromTopPt: number): number {
  const imageBottomFromTopPt = lineBaselineFromTopPt - APPEAL_SIGNATURE_GAP_ABOVE_LINE_PT;
  return pageHeightPt - imageBottomFromTopPt;
}
