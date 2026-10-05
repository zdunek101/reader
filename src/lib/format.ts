import type { Insight } from './schema';

export const DOCUMENT_TYPE_LABELS: Record<Insight['document']['type'], string> = {
  faktura: 'Faktura',
  umowa: 'Umowa',
  oferta: 'Oferta',
  raport: 'Raport',
  inne: 'Inny dokument',
};

const languageNames = new Intl.DisplayNames(['pl'], { type: 'language' });
const dateFormatter = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeZone: 'UTC' });
const dateTimeFormatter = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const megabytesFormatter = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${megabytesFormatter.format(bytes / 1024 / 1024)} MB`;
}

export function formatLanguage(code: string): string {
  return languageNames.of(code) ?? code;
}

/** Formatuje datę ISO (RRRR-MM-DD) bez przesunięcia strefy czasowej. */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

export function formatDateTime(timestamp: number): string {
  return dateTimeFormatter.format(timestamp);
}

export function formatAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toLocaleString('pl-PL')} ${currency}`;
  }
}
