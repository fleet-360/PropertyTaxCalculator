import fs from 'fs';
import { PassThrough } from 'stream';
import PDFDocument from 'pdfkit';
import { getAppealHebrewFontPath } from './hebrewFontPath';

let patched = false;

type GlyphPosition = Record<string, number> & { advanceWidth?: number };

type LayoutRunResult = {
  glyphs: { advanceWidth: number }[];
  positions: GlyphPosition[];
};

type EmbeddedFontLike = {
  font: {
    layout(
      text: string,
      features?: unknown,
      script?: unknown,
      language?: unknown,
      direction?: 'ltr' | 'rtl',
    ): LayoutRunResult;
  };
  scale: number;
};

/**
 * PDFKit’s EmbeddedFont splits on spaces when `features` is falsy (fixes Hebrew word order per word but breaks line order).
 * When `features` is an array (appeal PDF), we need full-line Unicode order from bidi-js and must not let fontkit RTL-reverse again → pass `direction: 'ltr'`.
 * When `features` is undefined (per-word path), keep default fontkit behavior.
 */
export function ensurePdfKitAppealFontLayoutPatch(): void {
  if (patched) return;
  const fontPath = getAppealHebrewFontPath();
  if (!fs.existsSync(fontPath)) return;

  const sink = new PassThrough();
  sink.resume();

  const probe = new PDFDocument({ autoFirstPage: true, margin: 0 });
  probe.pipe(sink);
  probe.registerFont('_appealLayoutProbe', fontPath);
  probe.font('_appealLayoutProbe');

  const embedded = (probe as unknown as { _font: EmbeddedFontLike })._font;
  const proto = Object.getPrototypeOf(embedded) as EmbeddedFontLike & {
    layoutRun: (text: string, features?: unknown) => LayoutRunResult;
  };

  proto.layoutRun = function layoutRunAppeal(
    this: EmbeddedFontLike,
    text: string,
    features?: unknown,
  ): LayoutRunResult {
    const run = Array.isArray(features)
      ? this.font.layout(text, features, undefined, undefined, 'ltr')
      : this.font.layout(text, features);
    for (let i = 0; i < run.positions.length; i++) {
      const position = run.positions[i];
      for (const key of Object.keys(position)) {
        position[key] *= this.scale;
      }
      position.advanceWidth = run.glyphs[i].advanceWidth * this.scale;
    }
    return run;
  };

  probe.end();
  patched = true;
}
