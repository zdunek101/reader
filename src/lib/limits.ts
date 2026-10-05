/** Limity wspólne dla frontendu i backendu. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Maksymalna długość tekstu wysyłanego do analizy (ok. 150–200 stron). */
export const MAX_TEXT_CHARS = 400_000;

/** Powyżej tej długości tekst jest dzielony na fragmenty analizowane osobno. */
export const CHUNK_CHARS = 60_000;
