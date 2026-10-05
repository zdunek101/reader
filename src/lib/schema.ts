import { z } from 'zod';
import { MAX_TEXT_CHARS } from './limits';

export const DOCUMENT_TYPES = ['faktura', 'umowa', 'oferta', 'raport', 'inne'] as const;

const nonEmptyText = z.string().trim().min(1);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data musi mieć format RRRR-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Nieistniejąca data kalendarzowa')
  .describe('Data ISO 8601 (RRRR-MM-DD)');

const documentSchema = z.object({
  fileName: nonEmptyText,
  pages: z.number().int().positive(),
  language: z
    .string()
    .regex(/^[a-z]{2}$/, 'Kod języka ISO 639-1')
    .describe('Główny język dokumentu, kod ISO 639-1, np. "pl"'),
  type: z.enum(DOCUMENT_TYPES).describe('Rodzaj dokumentu; "inne", gdy żaden nie pasuje'),
  title: nonEmptyText.nullable().describe('Tytuł dokumentu lub null'),
  date: isoDate.nullable().describe('Data sporządzenia/zawarcia dokumentu lub null'),
});

/** Schemat wyniku analizy (sekcja 04 briefu) rozszerzony o pole `warnings`. */
export const insightSchema = z.object({
  document: documentSchema,
  summary: nonEmptyText.describe('Podsumowanie: 3–5 zdań w języku dokumentu, tylko fakty z tekstu'),
  keyPoints: z.array(nonEmptyText).min(3).max(7).describe('3–7 najważniejszych punktów'),
  entities: z.object({
    organizations: z.array(nonEmptyText).describe('Nazwy organizacji występujących w dokumencie'),
    people: z.array(nonEmptyText).describe('Imiona i nazwiska osób występujących w dokumencie'),
  }),
  amounts: z.array(
    z.object({
      value: z.number().finite().describe('Kwota jako liczba, np. 12500.00'),
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/, 'Kod waluty ISO 4217')
        .describe('Kod waluty ISO 4217, np. "PLN"'),
      context: nonEmptyText.describe('Czego dotyczy kwota'),
    }),
  ),
  dates: z.array(
    z.object({
      date: isoDate,
      context: nonEmptyText.describe('Czego dotyczy data'),
    }),
  ),
  keywords: z.array(nonEmptyText).describe('Słowa kluczowe'),
  warnings: z
    .array(nonEmptyText)
    .describe(
      'Ostrzeżenia dla czytelnika, np. o wykrytych w treści poleceniach dla AI (zignorowanych) lub nieczytelnych fragmentach',
    ),
});

/** Część wyniku generowana przez model — nazwę pliku i liczbę stron uzupełnia backend. */
export const aiInsightSchema = insightSchema.extend({
  document: documentSchema.omit({ fileName: true, pages: true }),
});

/** Treść żądania frontend → backend. */
export const analyzeRequestSchema = z.object({
  fileName: nonEmptyText.max(255),
  pages: z.number().int().positive().max(5000),
  text: nonEmptyText.max(MAX_TEXT_CHARS),
});

export type Insight = z.infer<typeof insightSchema>;
export type AiInsight = z.infer<typeof aiInsightSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
