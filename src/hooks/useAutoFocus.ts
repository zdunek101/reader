import { useEffect, useRef } from 'react';

/**
 * Przenosi fokus na element po pojawieniu się panelu (i przy każdej zmianie `trigger`).
 * Przycisk, który wywołał zmianę widoku, znika z DOM. Bez tego użytkownik klawiatury
 * i czytnika ekranu traci kontekst, a wynik otwarty z historii mógłby zostać poza ekranem.
 */
export function useAutoFocus<T extends HTMLElement>(trigger?: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => ref.current?.focus(), [trigger]);
  return ref;
}
