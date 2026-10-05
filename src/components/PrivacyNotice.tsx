export function PrivacyNotice() {
  return (
    <aside className="privacy-notice" aria-labelledby="privacy-title">
      <p id="privacy-title" className="label">
        Zanim wgrasz plik
      </p>
      <p>
        Tekst odczytany z pliku jest wysyłany przez nasz serwer do zewnętrznego API AI (Google
        Gemini) w celu analizy. Serwer niczego nie zapisuje, ale w darmowym planie Google może
        wykorzystywać przesłane treści — <strong>nie wgrywaj dokumentów poufnych</strong>. Historia
        analiz jest przechowywana wyłącznie w Twojej przeglądarce.
      </p>
    </aside>
  );
}
