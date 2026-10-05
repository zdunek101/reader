export function PrivacyNotice() {
  return (
    <aside className="privacy-notice" aria-labelledby="privacy-title">
      <p id="privacy-title" className="label">
        Zanim wgrasz plik
      </p>
      <p>
        Tekst odczytany z pliku trafia przez nasz serwer do zewnętrznej usługi AI (Google Gemini),
        która go analizuje. Serwer niczego nie zapisuje, ale w darmowym planie Google może
        wykorzystywać przesłane treści, dlatego <strong>nie wgrywaj poufnych dokumentów</strong>.
        Historia analiz zostaje wyłącznie w Twojej przeglądarce.
      </p>
    </aside>
  );
}
