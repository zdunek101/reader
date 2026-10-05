export function PrivacyNotice() {
  return (
    <p className="privacy-notice">
      <strong>Prywatność:</strong> tekst odczytany z pliku jest wysyłany przez nasz serwer do
      zewnętrznego API AI (Google Gemini) w celu analizy. Serwer niczego nie zapisuje, ale w
      darmowym planie Google może wykorzystywać przesłane treści — nie wgrywaj dokumentów poufnych.
      Historia analiz jest przechowywana wyłącznie w Twojej przeglądarce.
    </p>
  );
}
