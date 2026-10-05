import { z } from 'zod';
import { insightSchema, type Insight } from './schema';

const STORAGE_KEY = 'pdf-insight:history';
const MAX_ENTRIES = 10;

const historyEntrySchema = z.object({
  id: z.string(),
  analyzedAt: z.number(),
  insight: insightSchema,
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

/** Wczytuje historię z localStorage; uszkodzone lub niezgodne ze schematem wpisy są pomijane. */
export function loadHistory(): HistoryEntry[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((entry) => {
      const parsed = historyEntrySchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

export function addToHistory(history: HistoryEntry[], insight: Insight): HistoryEntry[] {
  const entry = { id: crypto.randomUUID(), analyzedAt: Date.now(), insight };
  return saveHistory([entry, ...history].slice(0, MAX_ENTRIES));
}

export function removeFromHistory(history: HistoryEntry[], id: string): HistoryEntry[] {
  return saveHistory(history.filter((entry) => entry.id !== id));
}

function saveHistory(history: HistoryEntry[]): HistoryEntry[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Brak dostępu do localStorage (np. tryb prywatny) — historia działa tylko w tej sesji.
  }
  return history;
}
