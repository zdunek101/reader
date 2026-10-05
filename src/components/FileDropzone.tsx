import { useRef, useState, type DragEvent } from 'react';
import { formatFileSize } from '../lib/format';
import { MAX_FILE_BYTES } from '../lib/limits';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
}

export function FileDropzone({ onFileSelected }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const [file] = event.dataTransfer.files;
    if (file) onFileSelected(file);
  };

  // Przejście kursora nad element potomny też wywołuje dragleave. Ignorujemy je, żeby obramowanie nie migało.
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const target = event.relatedTarget;
    if (!(target instanceof Node && event.currentTarget.contains(target))) setIsDragging(false);
  };

  return (
    <div
      className={`dropzone${isDragging ? ' dropzone--active' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p className="label">Krok 1 · Wgraj dokument</p>
      <p className="dropzone__title">Przeciągnij i upuść plik PDF</p>
      <p className="dropzone__hint">
        lub wybierz go z dysku ·{' '}
        <span className="no-wrap">tylko PDF, maks. {formatFileSize(MAX_FILE_BYTES)}</span>
      </p>
      <button
        type="button"
        className="button button--primary"
        onClick={() => inputRef.current?.click()}
      >
        Wybierz plik PDF
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
