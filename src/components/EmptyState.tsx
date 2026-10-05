export function EmptyState() {
  return (
    <section className="empty-state" aria-labelledby="flow-title">
      <h2 id="flow-title" className="section-title">
        Jak to działa
      </h2>
      <ol className="flow">
        <li>
          <strong>Wgraj PDF</strong>
          <span>umowę, fakturę, ofertę lub raport</span>
        </li>
        <li>
          <strong>Odczyt tekstu</strong>
          <span>w przeglądarce, ze skanami przez OCR</span>
        </li>
        <li>
          <strong>Analiza AI</strong>
          <span>podsumowanie i uporządkowane dane</span>
        </li>
        <li>
          <strong>Wynik</strong>
          <span>podgląd i pobranie pliku JSON</span>
        </li>
      </ol>
    </section>
  );
}
