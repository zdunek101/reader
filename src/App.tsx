import { useCallback, useState } from 'react';
import { AnalysisProgress } from './components/AnalysisProgress';
import { EmptyState } from './components/EmptyState';
import { ErrorPanel } from './components/ErrorPanel';
import { FileDropzone } from './components/FileDropzone';
import { HistoryList } from './components/HistoryList';
import { InsightView } from './components/InsightView';
import { PrivacyNotice } from './components/PrivacyNotice';
import { usePdfAnalysis } from './hooks/usePdfAnalysis';
import { addToHistory, loadHistory, removeFromHistory } from './lib/analysisHistory';
import type { Insight } from './lib/schema';

export function App() {
  const [history, setHistory] = useState(loadHistory);
  const handleAnalyzed = useCallback(
    (insight: Insight) => setHistory((current) => addToHistory(current, insight)),
    [],
  );
  const { state, analyze, retry, reset, showInsight } = usePdfAnalysis(handleAnalyzed);

  return (
    <div className="layout">
      <header className="site-header">
        <h1 className="brand">
          <span className="brand__mark" aria-hidden="true" />
          PDF Insight
        </h1>
        <p className="lead">
          Wgraj plik PDF, a otrzymasz krótkie podsumowanie i uporządkowane dane do pobrania w
          formacie JSON.
        </p>
      </header>

      <main>
        {state.status === 'idle' && (
          <>
            {/* Informacja o wysyłce do API AI musi być widoczna przed wyborem pliku. */}
            <div className="upload">
              <FileDropzone onFileSelected={analyze} />
              <PrivacyNotice />
            </div>
            <EmptyState />
          </>
        )}
        {state.status === 'processing' && (
          <AnalysisProgress
            fileName={state.fileName}
            step={state.step}
            withOcr={state.withOcr}
            onCancel={reset}
          />
        )}
        {state.status === 'error' && (
          <ErrorPanel
            message={state.message}
            onRetry={state.canRetry ? retry : undefined}
            onReset={reset}
          />
        )}
        {state.status === 'success' && <InsightView insight={state.insight} onReset={reset} />}

        <HistoryList
          entries={history}
          onSelect={(entry) => showInsight(entry.insight)}
          onRemove={(id) => setHistory((current) => removeFromHistory(current, id))}
        />
      </main>
    </div>
  );
}
