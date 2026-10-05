import { useAutoFocus } from '../hooks/useAutoFocus';

interface ErrorPanelProps {
  message: string;
  onRetry?: () => void;
  onReset: () => void;
}

export function ErrorPanel({ message, onRetry, onReset }: ErrorPanelProps) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();

  return (
    <section className="panel panel--error" role="alert">
      <p className="label label--error">Błąd</p>
      <h2 ref={titleRef} tabIndex={-1} className="panel__title">
        Nie udało się przeanalizować dokumentu
      </h2>
      <p className="panel__message">{message}</p>
      <div className="actions">
        {onRetry && (
          <button type="button" className="button button--primary" onClick={onRetry}>
            Spróbuj ponownie
          </button>
        )}
        <button type="button" className="button" onClick={onReset}>
          Wybierz inny plik
        </button>
      </div>
    </section>
  );
}
