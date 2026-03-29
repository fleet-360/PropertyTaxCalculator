import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * PDFKit does not implement the Unicode Bidirectional Algorithm; it paints glyphs in storage order.
 * Reorder to visual order (RTL paragraph level) so Hebrew, punctuation, and embedded numbers read correctly.
 */
export function logicalToVisualRtlForPdf(text: string): string {
  if (!text) return text;
  const embeddingLevels = bidi.getEmbeddingLevels(text, 'rtl');
  return bidi.getReorderedString(text, embeddingLevels);
}
