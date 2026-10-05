import type { PDFPageProxy } from 'pdfjs-dist';

/** Powiększenie renderu strony — wyższa rozdzielczość poprawia jakość OCR. */
const RENDER_SCALE = 2;
const OCR_LANGUAGES = ['pol', 'eng'];

/**
 * Rozpoznaje tekst na stronach-skanach. tesseract.js ładowany jest dynamicznie,
 * dopiero gdy dokument ma strony bez warstwy tekstowej.
 */
export async function recognizePagesText(pages: PDFPageProxy[]): Promise<string[]> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(OCR_LANGUAGES);
  try {
    const texts: string[] = [];
    for (const page of pages) {
      const { data } = await worker.recognize(await renderPage(page));
      texts.push(data.text.trim());
    }
    return texts;
  } finally {
    await worker.terminate();
  }
}

async function renderPage(page: PDFPageProxy): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;
  return canvas;
}
