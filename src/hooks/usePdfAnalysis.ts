import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, requestInsight } from '../api/insightApi';
import { validatePdfFile } from '../lib/fileValidation';
import { MAX_TEXT_CHARS } from '../lib/limits';
import { describeExtractionIssues, extractPdfText, PdfReadError } from '../lib/pdfText';
import type { Insight } from '../lib/schema';

export type AnalysisStep = 'reading' | 'ocr' | 'analyzing';

type AnalysisState =
  | { status: 'idle' }
  | { status: 'processing'; fileName: string; step: AnalysisStep; withOcr: boolean }
  | { status: 'error'; message: string; canRetry: boolean }
  // `shownAt` odróżnia kolejne wyświetlenia wyniku, żeby widok zaczynał od czystego stanu.
  | { status: 'success'; insight: Insight; shownAt: number };

/** Przepływ: walidacja pliku → odczyt tekstu (z OCR) → analiza AI → wynik. */
export function usePdfAnalysis(onAnalyzed: (insight: Insight) => void) {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });
  const lastFileRef = useRef<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const analyze = useCallback(
    async (file: File) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      lastFileRef.current = file;

      const validationError = await validatePdfFile(file);
      if (controller.signal.aborted) return;
      if (validationError) {
        setState({ status: 'error', message: validationError, canRetry: false });
        return;
      }

      let withOcr = false;
      const setStep = (step: AnalysisStep) => {
        if (controller.signal.aborted) return;
        withOcr ||= step === 'ocr';
        setState({ status: 'processing', fileName: file.name, step, withOcr });
      };

      try {
        setStep('reading');
        const pdfText = await extractPdfText(file, () => setStep('ocr'));
        if (pdfText.unreadablePages.length === pdfText.pages) {
          throw new PdfReadError('W pliku nie znaleziono tekstu do analizy.');
        }
        if (pdfText.text.length > MAX_TEXT_CHARS) {
          throw new PdfReadError(
            'Dokument jest zbyt długi do analizy. Można przeanalizować maksymalnie ok. 150 stron tekstu.',
          );
        }

        setStep('analyzing');
        const { pages, text } = pdfText;
        const insight = await requestInsight(
          { fileName: file.name, pages, text },
          controller.signal,
        );
        if (controller.signal.aborted) return;

        const result = {
          ...insight,
          warnings: [...insight.warnings, ...describeExtractionIssues(pdfText)],
        };
        setState({ status: 'success', insight: result, shownAt: Date.now() });
        onAnalyzed(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        const isKnownError = error instanceof ApiError || error instanceof PdfReadError;
        setState({
          status: 'error',
          message: isKnownError ? error.message : 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
          // Ponowienie nie pomoże przy wadzie pliku ani przy odrzuconej treści żądania.
          canRetry: error instanceof ApiError ? error.retryable : !(error instanceof PdfReadError),
        });
      }
    },
    [onAnalyzed],
  );

  const retry = useCallback(() => {
    if (lastFileRef.current) void analyze(lastFileRef.current);
  }, [analyze]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({ status: 'idle' });
  }, []);

  const showInsight = useCallback((insight: Insight) => {
    abortControllerRef.current?.abort();
    setState({ status: 'success', insight, shownAt: Date.now() });
  }, []);

  return { state, analyze, retry, reset, showInsight };
}
