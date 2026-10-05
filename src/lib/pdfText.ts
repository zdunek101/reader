import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';
// Vite dołącza worker jako osobny plik z poprawnym prefiksem `base` (wymóg GitHub Pages).
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { recognizePagesText } from './pageOcr';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Strona z mniejszą liczbą znaków traktowana jest jako skan bez warstwy tekstowej. */
const MIN_PAGE_TEXT_CHARS = 20;
/** OCR działa w przeglądarce (ok. 3–5 s na stronę), więc ograniczamy liczbę stron. */
const MAX_OCR_PAGES = 5;

export interface PdfText {
  pages: number;
  text: string;
  ocrPages: number[];
  unreadablePages: number[];
}

export class PdfReadError extends Error {}

/**
 * Wyciąga tekst z warstwy tekstowej PDF; strony-skany (do MAX_OCR_PAGES) rozpoznaje przez OCR.
 * `onOcrStart` pozwala pokazać użytkownikowi dodatkowy krok.
 */
export async function extractPdfText(file: File, onOcrStart: () => void): Promise<PdfText> {
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const pdf = await openPdf(loadingTask);
    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      pageTexts.push(await readPageText(pdf, pageNumber));
    }

    const scannedPages = pageNumbersWhere(pageTexts, (text) => text.length < MIN_PAGE_TEXT_CHARS);
    const ocrPages = scannedPages.slice(0, MAX_OCR_PAGES);
    if (ocrPages.length > 0) {
      onOcrStart();
      const pages = await Promise.all(ocrPages.map((pageNumber) => pdf.getPage(pageNumber)));
      const recognized = await recognizePagesText(pages);
      ocrPages.forEach((pageNumber, index) => {
        pageTexts[pageNumber - 1] = recognized[index] ?? '';
      });
    }

    const text = pageTexts
      .map((pageText, index) => `[Strona ${index + 1}]\n${pageText}`)
      .join('\n\n');
    return {
      pages: pdf.numPages,
      text,
      ocrPages,
      unreadablePages: pageNumbersWhere(pageTexts, (pageText) => pageText.length === 0),
    };
  } finally {
    await loadingTask.destroy();
  }
}

/** Ostrzeżenia dla użytkownika o stronach odczytanych przez OCR lub nieczytelnych. */
export function describeExtractionIssues({ ocrPages, unreadablePages }: PdfText): string[] {
  const warnings: string[] = [];
  if (ocrPages.length > 0) {
    warnings.push(
      `Strony ${ocrPages.join(', ')} to skany odczytane przez OCR — tekst może zawierać błędy rozpoznawania.`,
    );
  }
  if (unreadablePages.length > 0) {
    warnings.push(`Nie udało się odczytać tekstu ze stron: ${unreadablePages.join(', ')}.`);
  }
  return warnings;
}

async function openPdf(loadingTask: PDFDocumentLoadingTask): Promise<PDFDocumentProxy> {
  try {
    return await loadingTask.promise;
  } catch (error) {
    const isPasswordProtected = error instanceof Error && error.name === 'PasswordException';
    throw new PdfReadError(
      isPasswordProtected
        ? 'Plik PDF jest zabezpieczony hasłem. Zdejmij zabezpieczenie i spróbuj ponownie.'
        : 'Nie udało się odczytać pliku PDF — plik może być uszkodzony.',
    );
  }
}

async function readPageText(pdf: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  // pdf.js zwraca spacje jako osobne elementy, a polskie znaki często jako osobne glify —
  // łączymy bez separatora, żeby nie rozbijać słów („Zamawiaj ą cy”).
  return content.items
    .filter(isTextItem)
    .map((item) => item.str + (item.hasEOL ? '\n' : ''))
    .join('')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item;
}

function pageNumbersWhere(pageTexts: string[], predicate: (text: string) => boolean): number[] {
  return pageTexts.flatMap((text, index) => (predicate(text) ? [index + 1] : []));
}
