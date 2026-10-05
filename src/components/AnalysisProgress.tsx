import { useAutoFocus } from '../hooks/useAutoFocus';
import type { AnalysisStep } from '../hooks/usePdfAnalysis';

const STEPS: { id: AnalysisStep; label: string }[] = [
  { id: 'reading', label: 'Odczyt tekstu z PDF' },
  { id: 'ocr', label: 'Rozpoznawanie skanów (OCR)' },
  { id: 'analyzing', label: 'Analiza AI: podsumowanie i dane' },
];

const STATUS_LABELS = { done: 'Gotowe', active: 'W toku', pending: 'Czeka' } as const;

interface AnalysisProgressProps {
  fileName: string;
  step: AnalysisStep;
  withOcr: boolean;
  onCancel: () => void;
}

export function AnalysisProgress({ fileName, step, withOcr, onCancel }: AnalysisProgressProps) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();
  const visibleSteps = STEPS.filter(({ id }) => withOcr || id !== 'ocr');
  const currentIndex = visibleSteps.findIndex(({ id }) => id === step);

  return (
    <section className="panel" aria-busy="true" aria-labelledby="progress-title">
      <p className="label">
        Etap {currentIndex + 1} z {visibleSteps.length}
      </p>
      <h2 ref={titleRef} tabIndex={-1} id="progress-title" className="panel__title">
        Analizuję: <span className="file-name">{fileName}</span>
      </h2>
      <progress
        className="progress-bar"
        value={currentIndex + 0.5}
        max={visibleSteps.length}
        aria-label="Postęp analizy"
      />
      <ol className="progress-steps" aria-live="polite">
        {visibleSteps.map(({ id, label }, index) => {
          const status =
            index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'pending';
          return (
            <li key={id} className={`progress-steps__item progress-steps__item--${status}`}>
              <span className="progress-steps__marker" aria-hidden="true" />
              <span className="progress-steps__label">{label}</span>
              <span className="progress-steps__status">{STATUS_LABELS[status]}</span>
            </li>
          );
        })}
      </ol>
      <p className="panel__hint">
        Zwykle trwa to kilkanaście sekund; skany rozpoznawane przez OCR — dłużej.
      </p>
      <button type="button" className="button" onClick={onCancel}>
        Anuluj
      </button>
    </section>
  );
}
