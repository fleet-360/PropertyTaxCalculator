import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Unicode BiDi visual order for LTR glyph painting. Use with fontkit layout direction `ltr`
 * (see patchPdfKitEmbeddedFontLtrLayout) so digits/emails and Hebrew share one line correctly.
 */
export function logicalToVisualRtlForPdf(text: string): string {
  if (!text) return text;
  const embeddingLevels = bidi.getEmbeddingLevels(text, 'rtl');
  return bidi.getReorderedString(text, embeddingLevels);
}
