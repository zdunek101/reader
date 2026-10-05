import { useState, type KeyboardEvent } from 'react';
import { downloadInsightJson, insightToJson } from '../lib/insightExport';
import type { Insight } from '../lib/schema';
import { InsightDetails } from './InsightDetails';

const TABS = [
  { id: 'details', label: 'Wyniki' },
  { id: 'json', label: 'JSON' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface InsightViewProps {
  insight: Insight;
  onReset: () => void;
}

export function InsightView({ insight, onReset }: InsightViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [copyStatus, setCopyStatus] = useState('');

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(insightToJson(insight));
      setCopyStatus('Skopiowano JSON do schowka.');
    } catch {
      setCopyStatus('Nie udało się skopiować — użyj przycisku „Pobierz JSON”.');
    }
  };

  // Strzałki przełączają zakładki (wzorzec WAI-ARIA Tabs).
  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const nextTab = activeTab === 'details' ? 'json' : 'details';
    setActiveTab(nextTab);
    document.getElementById(`tab-${nextTab}`)?.focus();
  };

  return (
    <section className="panel" aria-labelledby="result-title">
      <header className="result-header">
        <h2 id="result-title" className="panel__title">
          Wynik: <span className="file-name">{insight.document.fileName}</span>
        </h2>
        <div className="actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => downloadInsightJson(insight)}
          >
            Pobierz JSON
          </button>
          <button type="button" className="button" onClick={copyJson}>
            Kopiuj JSON
          </button>
          <button type="button" className="button" onClick={onReset}>
            Analizuj inny plik
          </button>
        </div>
      </header>
      <p className="visually-hidden" aria-live="polite">
        {copyStatus}
      </p>

      <div role="tablist" aria-label="Widok wyniku" className="tabs" onKeyDown={handleTabKeyDown}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            tabIndex={activeTab === id ? 0 : -1}
            className="tabs__tab"
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'details' ? (
          <InsightDetails insight={insight} />
        ) : (
          <pre className="json-preview" tabIndex={0}>
            <code>{insightToJson(insight)}</code>
          </pre>
        )}
      </div>
    </section>
  );
}
