import { describe, expect, it } from 'vitest';
import type { AiInsight } from '../../src/lib/schema';
import { mergeInsights } from './mergeInsights';

const basePartial: AiInsight = {
  document: { language: 'pl', type: 'umowa', title: null, date: null },
  summary: 'Część dokumentu.',
  keyPoints: ['a', 'b', 'c'],
  entities: { organizations: ['ACME sp. z o.o.'], people: ['Jan Kowalski'] },
  amounts: [{ value: 100, currency: 'PLN', context: 'opłata' }],
  dates: [{ date: '2026-01-01', context: 'start' }],
  keywords: ['CRM'],
  warnings: [],
};

const overview = { summary: 'Całość dokumentu.', keyPoints: ['x', 'y', 'z'] };

describe('mergeInsights', () => {
  it('usuwa duplikaty niezależnie od wielkości liter', () => {
    const second: AiInsight = {
      ...basePartial,
      entities: { organizations: ['acme sp. z o.o.', 'Beta S.A.'], people: ['Jan Kowalski'] },
      amounts: [
        { value: 100, currency: 'PLN', context: 'Opłata' },
        { value: 100, currency: 'EUR', context: 'opłata' },
      ],
      keywords: ['crm', 'SLA'],
    };

    const merged = mergeInsights([basePartial, second], overview);

    expect(merged.entities.organizations).toEqual(['ACME sp. z o.o.', 'Beta S.A.']);
    expect(merged.entities.people).toEqual(['Jan Kowalski']);
    expect(merged.amounts.map((amount) => amount.currency)).toEqual(['PLN', 'EUR']);
    expect(merged.keywords).toEqual(['CRM', 'SLA']);
  });

  it('bierze podsumowanie z przeglądu całości i pierwszy znany tytuł', () => {
    const second: AiInsight = {
      ...basePartial,
      document: { ...basePartial.document, title: 'Umowa ramowa' },
    };

    const merged = mergeInsights([basePartial, second], overview);

    expect(merged.summary).toBe(overview.summary);
    expect(merged.keyPoints).toEqual(overview.keyPoints);
    expect(merged.document.title).toBe('Umowa ramowa');
    expect(merged.document.date).toBeNull();
  });
});
