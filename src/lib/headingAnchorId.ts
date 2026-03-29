/**
 * Build a stable `id` for heading anchor links (TOC, in-page hash).
 * Keeps Unicode letters (e.g. Hebrew) and digits; turns spaces/punctuation
 * into single hyphens. Must stay in sync wherever headings get `id` in the DOM.
 */
export function headingPlainTextToAnchorId(plainText: string): string {
  return plainText
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}
