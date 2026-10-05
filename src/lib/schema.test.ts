import { describe, expect, it } from 'vitest';
import { MAX_TEXT_CHARS } from './limits';
import { aiInsightSchema, analyzeRequestSchema, insightSchema, type Insight } from './schema';

const validInsight: Insight = {
  document: {
    fileName: 'umowa.pdf',
    pages: 4,
    language: 'pl',
    type: 'umowa',
    title: 'Umowa serwisowa',
    date: '2026-09-01',
  },
  summary: 'Umowa określa zasady serwisu. Obowiązuje 12 miesięcy. Wynagrodzenie płatne co miesiąc.',
  keyPoints: ['Okres umowy 12 mies.', 'Wynagrodzenie 12 500 PLN', 'SLA 99,5%'],
  entities: { organizations: ['Przykład sp. z o.o.'], people: [] },
  amounts: [{ value: 12500, currency: 'PLN', context: 'wynagrodzenie' }],
  dates: [{ date: '2026-10-01', context: 'termin płatności' }],
  keywords: ['serwis', 'SLA'],
  warnings: [],
};

const withDocument = (patch: Partial<Insight['document']>) => ({
  ...validInsight,
  document: { ...validInsight.document, ...patch },
});

describe('insightSchema', () => {
  it('akceptuje poprawny wynik', () => {
    expect(insightSchema.safeParse(validInsight).success).toBe(true);
  });

  it('akceptuje null i puste listy przy braku informacji', () => {
    const result = insightSchema.safeParse({
      ...withDocument({ title: null, date: null }),
      amounts: [],
      dates: [],
      keywords: [],
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['nieznany typ dokumentu', withDocument({ type: 'list' as never })],
    ['kod języka spoza ISO 639-1', withDocument({ language: 'pol' })],
    ['datę w formacie polskim', withDocument({ date: '01.09.2026' })],
    ['nieistniejącą datę', withDocument({ date: '2026-02-30' })],
    ['zerową liczbę stron', withDocument({ pages: 0 })],
  ])('odrzuca %s', (_, insight) => {
    expect(insightSchema.safeParse(insight).success).toBe(false);
  });

  it('odrzuca walutę spoza ISO 4217', () => {
    const insight = {
      ...validInsight,
      amounts: [{ value: 10, currency: 'zł', context: 'opłata' }],
    };
    expect(insightSchema.safeParse(insight).success).toBe(false);
  });

  it('odrzuca kwotę zapisaną jako tekst', () => {
    const insight = {
      ...validInsight,
      amounts: [{ value: '12 500', currency: 'PLN', context: 'x' }],
    };
    expect(insightSchema.safeParse(insight).success).toBe(false);
  });

  it.each([
    ['mniej niż 3', ['a', 'b']],
    ['więcej niż 7', ['1', '2', '3', '4', '5', '6', '7', '8']],
  ])('odrzuca keyPoints: %s pozycje', (_, keyPoints) => {
    expect(insightSchema.safeParse({ ...validInsight, keyPoints }).success).toBe(false);
  });

  it('odrzuca brak wymaganego pola', () => {
    const withoutSummary: Partial<Insight> = { ...validInsight };
    delete withoutSummary.summary;
    expect(insightSchema.safeParse(withoutSummary).success).toBe(false);
  });

  it('odrzuca puste podsumowanie', () => {
    expect(insightSchema.safeParse({ ...validInsight, summary: '   ' }).success).toBe(false);
  });
});

describe('aiInsightSchema', () => {
  it('nie wymaga od modelu nazwy pliku ani liczby stron', () => {
    const { language, type, title, date } = validInsight.document;
    const document = { language, type, title, date };
    expect(aiInsightSchema.safeParse({ ...validInsight, document }).success).toBe(true);
  });
});

describe('analyzeRequestSchema', () => {
  it('odrzuca pusty tekst', () => {
    const request = { fileName: 'a.pdf', pages: 1, text: ' ' };
    expect(analyzeRequestSchema.safeParse(request).success).toBe(false);
  });

  it('odrzuca zbyt długi tekst', () => {
    const request = { fileName: 'a.pdf', pages: 1, text: 'a'.repeat(MAX_TEXT_CHARS + 1) };
    expect(analyzeRequestSchema.safeParse(request).success).toBe(false);
  });
});
