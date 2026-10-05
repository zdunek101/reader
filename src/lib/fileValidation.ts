import { formatFileSize } from './format';
import { MAX_FILE_BYTES } from './limits';

const PDF_SIGNATURE = '%PDF-';

/** Zwraca komunikat błędu albo `null`, gdy plik nadaje się do analizy. */
export async function validatePdfFile(file: File): Promise<string | null> {
  if (file.size === 0) return 'Wybrany plik jest pusty.';
  if (file.size > MAX_FILE_BYTES) {
    return `Plik ma ${formatFileSize(file.size)}. Maksymalny rozmiar to ${formatFileSize(MAX_FILE_BYTES)}.`;
  }

  // Sprawdzamy sygnaturę pliku, a nie tylko rozszerzenie czy typ MIME.
  const header = new Uint8Array(await file.slice(0, PDF_SIGNATURE.length).arrayBuffer());
  if (String.fromCharCode(...header) !== PDF_SIGNATURE) {
    return 'Wybrany plik nie jest dokumentem PDF.';
  }
  return null;
}
