/** Limity wspólne dla frontendu i backendu. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Maksymalna długość tekstu wysyłanego do analizy (ok. 150–200 stron). */
export const MAX_TEXT_CHARS = 400_000;

/**
 * Powyżej tej długości tekst jest dzielony na fragmenty analizowane osobno.
 * Duże fragmenty (ok. 40 tys. tokenów) ograniczają liczbę równoległych wywołań AI do maks. 3,
 * co mieści się w darmowym limicie zapytań na minutę.
 */
export const CHUNK_CHARS = 150_000;
