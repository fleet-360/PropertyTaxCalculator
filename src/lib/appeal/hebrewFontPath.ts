import path from 'path';

const DAVID_LIBRE_REGULAR = 'DavidLibre-Regular.ttf';
const DAVID_LIBRE_BOLD = 'DavidLibre-Bold.ttf';

/**
 * David Libre (SIL OFL) — metrically compatible open-source revival of classic “David” used in
 * Israeli formal documents. Hebrew + Latin for punctuation and digits in appeal PDFs.
 * File: `src/lib/appeal/fonts/DavidLibre-Regular.ttf` (from Google Fonts ofl/davidlibre).
 */
export function getAppealHebrewFontPath(): string {
  return path.join(process.cwd(), 'src', 'lib', 'appeal', 'fonts', DAVID_LIBRE_REGULAR);
}

/** Bold for headings; pair with Regular for body (`src/lib/appeal/fonts/DavidLibre-Bold.ttf`). */
export function getAppealHebrewBoldFontPath(): string {
  return path.join(process.cwd(), 'src', 'lib', 'appeal', 'fonts', DAVID_LIBRE_BOLD);
}
