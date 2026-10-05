import type { HistoryEntry } from '../lib/analysisHistory';
import { DOCUMENT_TYPE_LABELS, formatDateTime } from '../lib/format';

interface HistoryListProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
}

export function HistoryList({ entries, onSelect, onRemove }: HistoryListProps) {
  if (entries.length === 0) return null;

  return (
    <section className="history" aria-labelledby="history-title">
      <h2 id="history-title" className="history__title">
        Ostatnie analizy
      </h2>
      <ul className="history__list">
        {entries.map((entry) => {
          const { fileName, type } = entry.insight.document;
          return (
            <li key={entry.id} className="history__item">
              <button type="button" className="history__open" onClick={() => onSelect(entry)}>
                <span className="file-name">{fileName}</span>
                <span className="muted">
                  {DOCUMENT_TYPE_LABELS[type]} · {formatDateTime(entry.analyzedAt)}
                </span>
              </button>
              <button
                type="button"
                className="button button--small"
                aria-label={`Usuń z historii: ${fileName}`}
                onClick={() => onRemove(entry.id)}
              >
                Usuń
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
