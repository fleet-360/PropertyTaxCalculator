/** Page margins (pt) — must match `@page` margin in `appealLetterHtml` and Playwright PDF. */
export const APPEAL_PAGE_MARGIN_PT = 56;

/** ~Word default tab stop (pt) — leading `\\t` on a line maps to this indent step. */
export const APPEAL_TAB_STOP_PT = 28;

/** Approximate indent per leading space when models use spaces instead of tabs (body ~12.5pt). */
export const APPEAL_LEADING_SPACE_INDENT_PT = 2.4;

export const APPEAL_MAX_LINE_INDENT_PT = 160;

/** Default A4 height in pt (HTML/Playwright PDF). */
export const APPEAL_A4_HEIGHT_PT = 841.89;

/** A4 width in pt (matches Chromium `page.pdf` / pdf-lib default). */
export const APPEAL_A4_WIDTH_PT = 595.28;

/** CSS px per PDF pt (browser convention for screen/print CSS). */
export const APPEAL_CSS_PX_PER_PDF_PT = 96 / 72;

/** Full A4 page height in CSS px (matches `@page size: A4` with Playwright). */
export const APPEAL_A4_PAGE_HEIGHT_CSS_PX = APPEAL_A4_HEIGHT_PT * APPEAL_CSS_PX_PER_PDF_PT;

/** `@page` margin in CSS px — must match {@link APPEAL_PAGE_MARGIN_PT}. */
export function appealPageMarginCssPx(): number {
  return APPEAL_PAGE_MARGIN_PT * APPEAL_CSS_PX_PER_PDF_PT;
}

/**
 * Vertical flow height per printed page (px): A4 minus top/bottom `@page` margins.
 * Used with `getBoundingClientRect` document Y to map the signature anchor to the correct PDF page and Y.
 */
export function appealA4ContentHeightCssPx(): number {
  return APPEAL_A4_PAGE_HEIGHT_CSS_PX - 2 * appealPageMarginCssPx();
}

/** Printable content width (px), inside `@page` left/right margins — לפריסה כמו ב-PDF. */
export function appealA4ContentWidthCssPx(): number {
  return (APPEAL_A4_WIDTH_PT - 2 * APPEAL_PAGE_MARGIN_PT) * APPEAL_CSS_PX_PER_PDF_PT;
}

/**
 * Bottom page margin so flowing body text stops above the signature block (same geometry as
 * `appealFooterBaselines` with top/left/right = APPEAL_PAGE_MARGIN_PT).
 */
export function appealTextFlowBottomMarginPt(pageHeightPt: number = APPEAL_A4_HEIGHT_PT): number {
  const { bodyContentBottomY } = appealFooterBaselines(pageHeightPt, APPEAL_PAGE_MARGIN_PT);
  return Math.ceil(pageHeightPt - bodyContentBottomY) + 2;
}

/**
 * Fixed footer block (top-down pt from page top — used by apply-signature fallback):
 * 1. Body text ends above `bodyContentBottomY`.
 * 2. “חתימת המגיש:” at `labelBaselineY`.
 * 3. Signature image in [signatureSlotTopY, signatureImageBottomY].
 * 4. Horizontal rule at `lineBaselineY` (below the signature).
 * All distances are anchored from the page’s inner bottom (`pageHeight - marginBottom`).
 */
export const APPEAL_FOOTER_LINE_FROM_INNER_BOTTOM_PT = 28;

/** Space between rule and bottom edge of signature image. */
export const APPEAL_FOOTER_SIGNATURE_TO_LINE_GAP_PT = 10;

/** Max height for the signature bitmap in the reserved slot. */
export const APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT = 56;

/** Gap between label text box bottom and top of signature slot. */
export const APPEAL_FOOTER_LABEL_TO_SIGNATURE_GAP_PT = 12;

/** Line box for “חתימת המגיש:” (~11pt font + descenders). */
export const APPEAL_FOOTER_LABEL_LINE_HEIGHT_PT = 16;

/** Gap between end of body and top of footer block (label). */
export const APPEAL_GAP_BODY_TO_LABEL_PT = 12;

/** Right-aligned rule length (pt). */
export const APPEAL_SIGNATURE_LINE_LENGTH_PT = 120;

export interface AppealFooterGeometry {
  innerBottomY: number;
  lineBaselineY: number;
  signatureImageBottomY: number;
  signatureSlotTopY: number;
  labelBaselineY: number;
  bodyContentBottomY: number;
}

export function appealFooterBaselines(
  pageHeightPt: number,
  marginBottomPt: number,
): AppealFooterGeometry {
  const innerBottomY = pageHeightPt - marginBottomPt;
  const lineBaselineY = innerBottomY - APPEAL_FOOTER_LINE_FROM_INNER_BOTTOM_PT;
  const signatureImageBottomY = lineBaselineY - APPEAL_FOOTER_SIGNATURE_TO_LINE_GAP_PT;
  const signatureSlotTopY = signatureImageBottomY - APPEAL_FOOTER_SIGNATURE_MAX_HEIGHT_PT;
  const labelBaselineY =
    signatureSlotTopY -
    APPEAL_FOOTER_LABEL_TO_SIGNATURE_GAP_PT -
    APPEAL_FOOTER_LABEL_LINE_HEIGHT_PT;
  const bodyContentBottomY = labelBaselineY - APPEAL_GAP_BODY_TO_LABEL_PT;

  return {
    innerBottomY,
    lineBaselineY,
    signatureImageBottomY,
    signatureSlotTopY,
    labelBaselineY,
    bodyContentBottomY,
  };
}

/**
 * pdf-lib `drawImage` y for the image’s lower-left corner (PDF origin bottom-left).
 * `imageBottomFromTopPt` = distance from top of page to bottom edge of image.
 */
export function signatureImagePdfLibY(pageHeightPt: number, imageBottomFromTopPt: number): number {
  return pageHeightPt - imageBottomFromTopPt;
}
