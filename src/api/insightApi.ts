import { z } from 'zod';
import { ANALYSIS_TIMEOUT_MS } from '../lib/limits';
import { insightSchema, type AnalyzeRequest, type Insight } from '../lib/schema';

const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT_MS = ANALYSIS_TIMEOUT_MS + 5_000;

const errorResponseSchema = z.object({ error: z.object({ message: z.string() }) });

/** Błąd komunikacji z backendem; `retryable` mówi, czy ponowienie może pomóc. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message);
  }
}

/** Wysyła tekst dokumentu do backendu i zwraca wynik zwalidowany schematem. */
export async function requestInsight(
  request: AnalyzeRequest,
  signal: AbortSignal,
): Promise<Insight> {
  if (!API_URL) {
    throw new ApiError('Aplikacja nie ma skonfigurowanego adresu API (VITE_API_URL).', false);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';
    throw new ApiError(
      isTimeout
        ? 'Analiza trwała zbyt długo. Spróbuj ponownie.'
        : 'Brak połączenia z serwerem analizy. Sprawdź internet i spróbuj ponownie.',
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const serverError = errorResponseSchema.safeParse(body);
    // Błędy 4xx (poza limitem 429) wynikają z treści żądania, więc ponowienie nic nie zmieni.
    const retryable = response.status === 429 || response.status >= 500;
    throw new ApiError(
      serverError.success ? serverError.data.error.message : `Błąd serwera (${response.status}).`,
      retryable,
    );
  }

  const insight = insightSchema.safeParse(body);
  if (!insight.success) {
    throw new ApiError('Wynik analizy ma nieprawidłowy format. Spróbuj ponownie.');
  }
  return insight.data;
}
