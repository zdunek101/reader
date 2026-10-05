import type { AnalysisStep } from '../hooks/usePdfAnalysis';

const STEPS: { id: AnalysisStep; label: string }[] = [
  { id: 'reading', label: 'Odczyt tekstu z PDF' },
  { id: 'ocr', label: 'Rozpoznawanie skanów (OCR)' },
  { id: 'analyzing', label: 'Analiza AI: podsumowanie i dane' },
];

interface AnalysisProgressProps {
  fileName: string;
  step: AnalysisStep;
  withOcr: boolean;
  onCancel: () => void;
}

export function AnalysisProgress({ fileName, step, withOcr, onCancel }: AnalysisProgressProps) {
  const visibleSteps = STEPS.filter(({ id }) => withOcr || id !== 'ocr');
  const currentIndex = visibleSteps.findIndex(({ id }) => id === step);

  return (
    <section className="panel" aria-busy="true" aria-labelledby="progress-title">
      <h2 id="progress-title" className="panel__title">
        Analizuję: <span className="file-name">{fileName}</span>
      </h2>
      <ol className="progress-steps" aria-live="polite">
        {visibleSteps.map(({ id, label }, index) => {
          const status =
            index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending';
          return (
            <li key={id} className={`progress-steps__item progress-steps__item--${status}`}>
              {status === 'active' && <span className="spinner" aria-hidden="true" />}
              {label}
              {status === 'active' && <span className="visually-hidden"> — w toku</span>}
            </li>
          );
        })}
      </ol>
      <button type="button" className="button" onClick={onCancel}>
        Anuluj
      </button>
    </section>
  );
}
