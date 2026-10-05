import type { AiInsight } from '../../src/lib/schema';

type Overview = Pick<AiInsight, 'summary' | 'keyPoints'>;

/** Łączy wyniki analizy fragmentów w jeden wynik; podsumowanie całości pochodzi z osobnego wywołania AI. */
export function mergeInsights(partials: AiInsight[], overview: Overview): AiInsight {
  const [first] = partials;
  if (!first) throw new Error('Brak wyników do połączenia');

  const all = <T>(select: (insight: AiInsight) => T[]) => partials.flatMap(select);
  const firstKnown = <T>(select: (insight: AiInsight) => T | null) =>
    partials.map(select).find((value) => value !== null) ?? null;

  return {
    document: {
      language: first.document.language,
      type: first.document.type,
      title: firstKnown((insight) => insight.document.title),
      date: firstKnown((insight) => insight.document.date),
    },
    ...overview,
    entities: {
      organizations: uniqueBy(
        all((insight) => insight.entities.organizations),
        normalize,
      ),
      people: uniqueBy(
        all((insight) => insight.entities.people),
        normalize,
      ),
    },
    amounts: uniqueBy(
      all((insight) => insight.amounts),
      ({ value, currency, context }) => `${value}|${currency}|${normalize(context)}`,
    ),
    dates: uniqueBy(
      all((insight) => insight.dates),
      ({ date, context }) => `${date}|${normalize(context)}`,
    ),
    keywords: uniqueBy(
      all((insight) => insight.keywords),
      normalize,
    ),
    warnings: uniqueBy(
      all((insight) => insight.warnings),
      normalize,
    ),
  };
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase();
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const itemKey = key(item);
    if (seen.has(itemKey)) return false;
    seen.add(itemKey);
    return true;
  });
}
