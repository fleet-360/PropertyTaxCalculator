import { PDFDocument } from 'pdf-lib';

/**
 * Draw signature PNG on the last page (bottom-right in PDF coordinates).
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
  const lastPage = pages[pages.length - 1]!;
  const { width, height } = lastPage.getSize();

  const maxW = Math.min(200, width * 0.42);
  const aspect = pngImage.height / pngImage.width;
  const imgW = maxW;
  const imgH = maxW * aspect;

  const margin = 48;
  const x = width - margin - imgW;
  const y = margin;

  lastPage.drawImage(pngImage, {
    x,
    y,
    width: imgW,
    height: imgH,
  });

  const out = await pdfDoc.save();
  return Buffer.from(out);
}
