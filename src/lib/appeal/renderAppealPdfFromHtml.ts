import { PDFDocument } from 'pdf-lib';
import { chromium, type Browser } from 'playwright';
import {
  APPEAL_PAGE_MARGIN_PT,
  appealA4ContentHeightCssPx,
  appealA4ContentWidthCssPx,
} from '@/lib/appeal/appealPdfLayout';

const CSS_PX_TO_PDF_PT = 72 / 96;

let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

/** Must match {@link applySignatureToPdfBuffer} anchor geometry (A4 margins). */
const SIG_ANCHOR_PREFIX = 'SIG_ANCHOR:';

/**
 * Reused Chromium instance per Node process (avoid cold launch on every appeal PDF).
 * Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a system Chrome/Chromium binary if needed (Docker).
 */
async function getChromiumBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  if (!browserLaunchPromise) {
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim() || undefined;
    browserLaunchPromise = chromium.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });
  }
  try {
    browserInstance = await browserLaunchPromise;
    return browserInstance;
  } catch (e) {
    browserLaunchPromise = null;
    browserInstance = null;
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Failed to launch Chromium for appeal PDF. Install browsers with: npx playwright install chromium. (${msg})`,
    );
  }
}

/**
 * Render a complete HTML document (UTF-8, RTL) to a PDF buffer (A4).
 * Embeds `SIG_ANCHOR` on the **last page** for {@link applySignatureToPdfBuffer}: the signature
 * is drawn inside `#appeal-signature-anchor` (signature slot above the underline).
 * Subject format: `pageIndex,xLeftPt,xRightPt,yTopPt,yBottomPt` (x from page left, y from page top).
 * Legacy formats:
 * - `pageIndex,xCenterPt,yTopPt,yBottomPt` (4-tuple) — slot inferred from center
 * - `pageIndex,xRightPt,yFromTopPt` (3-tuple) — top-aligned fallback
 */
export async function renderAppealPdfFromHtml(html: string): Promise<Buffer> {
  const browser = await getChromiumBrowser();
  const page = await browser.newPage();
  try {
    const contentW = Math.max(320, Math.round(appealA4ContentWidthCssPx()));
    await page.setViewportSize({ width: contentW, height: 4000 });

    await page.setContent(html, { waitUntil: 'load', timeout: 45_000 });
    await page.emulateMedia({ media: 'print' });

    let anchorDocPx: { topDoc: number; bottomDoc: number; leftDocX: number; rightDocX: number } | null = null;
    if (html.includes('appeal-signature-anchor')) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const layout = await page.evaluate(() => {
        const anchor = document.getElementById('appeal-signature-anchor');
        if (!anchor) return null;
        const r = anchor.getBoundingClientRect();
        return {
          topDoc: r.top + window.pageYOffset,
          bottomDoc: r.bottom + window.pageYOffset,
          leftDocX: r.left + window.scrollX,
          rightDocX: r.right + window.scrollX,
        };
      });
      if (
        layout != null &&
        Number.isFinite(layout.topDoc) &&
        Number.isFinite(layout.bottomDoc) &&
        Number.isFinite(layout.leftDocX) &&
        Number.isFinite(layout.rightDocX) &&
        layout.bottomDoc > layout.topDoc
      ) {
        anchorDocPx = layout;
      }
    }

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    let buf = Buffer.from(pdf);

    if (anchorDocPx != null) {
      const pdfDoc = await PDFDocument.load(buf);
      const n = pdfDoc.getPageCount();
      if (n > 0) {
        const contentH = appealA4ContentHeightCssPx();
        // Derive pageIndex from document flow height; clamp to PDF page count.
        const pageIndexFromDoc = Math.max(0, Math.floor(anchorDocPx.topDoc / contentH));
        const pageIndex = Math.min(pageIndexFromDoc, n - 1);
        const topOnPagePx = anchorDocPx.topDoc - pageIndex * contentH;
        const bottomOnPagePx = anchorDocPx.bottomDoc - pageIndex * contentH;
        const marginPt = APPEAL_PAGE_MARGIN_PT;
        const yTopPt = marginPt + topOnPagePx * CSS_PX_TO_PDF_PT;
        const yBottomPt = marginPt + bottomOnPagePx * CSS_PX_TO_PDF_PT;
        if (yBottomPt > yTopPt) {
          pdfDoc.setSubject(
            `${SIG_ANCHOR_PREFIX}${pageIndex},${(marginPt + anchorDocPx.leftDocX * CSS_PX_TO_PDF_PT).toFixed(3)},${(marginPt + anchorDocPx.rightDocX * CSS_PX_TO_PDF_PT).toFixed(3)},${yTopPt.toFixed(3)},${yBottomPt.toFixed(3)}`,
          );
          buf = Buffer.from(await pdfDoc.save());
        }
      }
    }

    return buf;
  } finally {
    await page.close();
  }
}

/** Test / graceful shutdown hook */
export async function closeAppealPdfBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    browserLaunchPromise = null;
  }
}
