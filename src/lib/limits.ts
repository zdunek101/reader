/** Limity wspólne dla frontendu i backendu. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Maksymalna długość tekstu wysyłanego do analizy (ok. 150–200 stron). */
export const MAX_TEXT_CHARS = 400_000;

/**
 * Powyżej tej długości tekst jest dzielony na fragmenty analizowane równolegle.
 * Duże fragmenty (ok. 40 tys. tokenów) sprawiają, że typowy dokument mieści się w 1–3 wywołaniach AI.
 */
export const CHUNK_CHARS = 150_000;

/**
 * Wspólny budżet czasu backendu na całą analizę (wszystkie wywołania AI razem).
 * Przeglądarka czeka nieco dłużej, żeby otrzymać komunikat backendu, a nie własny timeout.
 */
export const ANALYSIS_TIMEOUT_MS = 40_000;
