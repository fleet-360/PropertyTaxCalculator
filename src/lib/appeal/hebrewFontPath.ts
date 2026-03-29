import path from 'path';

/**
 * Noto Sans Hebrew (OFL), Google Fonts build — Hebrew + Basic Latin (punctuation, digits).
 * The upstream hinted-only TTF omits comma/period (.notdef in PDF); this file avoids “tofu” squares.
 */
export function getAppealHebrewFontPath(): string {
  return path.join(process.cwd(), 'src', 'lib', 'appeal', 'fonts', 'NotoSansHebrew-Regular.ttf');
}
