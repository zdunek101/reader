import { z } from 'zod';
import { insightSchema, type AnalyzeRequest, type Insight } from '../lib/schema';

const API_URL = import.meta.env.VITE_API_URL;
/** Długie dokumenty wymagają kilku wywołań AI, dlatego limit jest wyższy niż 30 s z briefu. */
const REQUEST_TIMEOUT_MS = 90_000;

const errorResponseSchema = z.object({ error: z.object({ message: z.string() }) });

export class ApiError extends Error {}

/** Wysyła tekst dokumentu do backendu i zwraca wynik zwalidowany schematem. */
export async function requestInsight(
  request: AnalyzeRequest,
  signal: AbortSignal,
): Promise<Insight> {
  if (!API_URL) throw new ApiError('Aplikacja nie ma skonfigurowanego adresu API (VITE_API_URL).');

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
    throw new ApiError(
      serverError.success ? serverError.data.error.message : `Błąd serwera (${response.status}).`,
    );
  }

  const insight = insightSchema.safeParse(body);
  if (!insight.success)
    throw new ApiError('Wynik analizy ma nieprawidłowy format. Spróbuj ponownie.');
  return insight.data;
}
