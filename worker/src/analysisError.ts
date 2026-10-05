const ERROR_DETAILS = {
  FORBIDDEN_ORIGIN: { status: 403, message: 'Żądanie z niedozwolonej domeny.' },
  NOT_FOUND: { status: 404, message: 'Nie znaleziono zasobu.' },
  PAYLOAD_TOO_LARGE: { status: 413, message: 'Dokument jest zbyt duży do analizy.' },
  BAD_REQUEST: { status: 400, message: 'Nieprawidłowe dane żądania.' },
  RATE_LIMITED: {
    status: 429,
    message: 'Zbyt wiele analiz w krótkim czasie. Odczekaj minutę i spróbuj ponownie.',
  },
  AI_QUOTA_EXCEEDED: {
    status: 429,
    message: 'Wyczerpano chwilowo darmowy limit usługi AI. Spróbuj ponownie za minutę.',
  },
  AI_UNAVAILABLE: {
    status: 502,
    message: 'Usługa AI nie odpowiada. Spróbuj ponownie za chwilę.',
  },
  INVALID_AI_RESPONSE: {
    status: 502,
    message: 'AI zwróciło wynik niezgodny ze schematem (także po ponownej próbie).',
  },
  INTERNAL: { status: 500, message: 'Wystąpił nieoczekiwany błąd serwera.' },
} as const;

export type AnalysisErrorCode = keyof typeof ERROR_DETAILS;

/** Błąd z kodem i komunikatem po polsku, przekazywany do frontendu. */
export class AnalysisError extends Error {
  readonly status: number;

  constructor(readonly code: AnalysisErrorCode) {
    super(ERROR_DETAILS[code].message);
    this.status = ERROR_DETAILS[code].status;
  }
}
