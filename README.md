# PDF Insight

Aplikacja webowa, która wczytuje plik PDF, tworzy jego krótkie podsumowanie i zamienia treść w uporządkowane dane JSON.

**Demo:** https://zdunek101.github.io/reader/

![Zrzut ekranu PDF Insight](docs/screenshot.jpg)

## Funkcje

| ID   | Wymaganie         | Realizacja                                                                                |
| ---- | ----------------- | ----------------------------------------------------------------------------------------- |
| F-01 | Wgrywanie PDF     | drag & drop i wybór pliku; walidacja sygnatury `%PDF-` i rozmiaru (maks. 10 MB)           |
| F-02 | Odczyt tekstu     | `pdfjs-dist` w przeglądarce, z numerami stron (`[Page N]`)                                |
| F-03 | Podsumowanie      | 3–5 zdań w języku dokumentu, tylko fakty z tekstu                                         |
| F-04 | Dane strukturalne | schemat Zod walidowany na backendzie i ponownie na frontendzie przed wyświetleniem        |
| F-05 | Widok i eksport   | czytelne sekcje, zakładka z podglądem JSON, pobranie `.json`, kopiowanie                  |
| F-06 | Stany interfejsu  | stan pusty, postęp z krokami, błąd z „Spróbuj ponownie”, anulowanie                       |
| F-07 | Publiczne demo    | GitHub Pages, deploy przez GitHub Actions                                                 |
| F-08 | Długie dokumenty  | podział na fragmenty po 150 tys. znaków (maks. 3) → analiza równoległa → scalenie wyników |
| F-09 | Historia analiz   | 10 ostatnich wyników w `localStorage`, walidowanych przy odczycie                         |
| F-10 | OCR               | strony bez warstwy tekstowej rozpoznawane przez `tesseract.js` (pol + eng)                |

## Architektura

```
Przeglądarka (React, GitHub Pages)          Cloudflare Worker                 Google Gemini
┌─────────────────────────────────┐        ┌──────────────────────────┐      ┌─────────────┐
│ walidacja pliku                 │  JSON  │ CORS (tylko domena demo) │      │             │
│ pdf.js → tekst, tesseract → OCR │ ─────► │ limit żądań IP i globalny│ ───► │ Flash (free)│
│ walidacja wyniku (Zod), widok   │ ◄───── │ limit rozmiaru, Zod      │ ◄─── │             │
│ historia w localStorage         │        │ klucz API w sekretach    │      │             │
└─────────────────────────────────┘        └──────────────────────────┘      └─────────────┘
```

```
src/
  api/          klient HTTP backendu (insightApi.ts)
  components/   komponenty widoku
  hooks/        usePdfAnalysis — maszyna stanów przepływu
  lib/          schemat danych, odczyt PDF, OCR, formatowanie, historia, eksport
worker/src/     backend: routing i bezpieczeństwo, wywołanie Gemini, prompty, dzielenie i scalanie
```

### Najważniejsze decyzje

- **Tekst wyciągany w przeglądarce, nie na serwerze.** Do backendu trafia tylko tekst (zwykle kilkadziesiąt KB zamiast kilku MB pliku). Worker na darmowym planie ma limit czasu CPU, a parsowanie PDF i OCR wymagają dużo obliczeń.
- **Jeden schemat jako źródło prawdy.** `src/lib/schema.ts` waliduje dane na frontendzie i w workerze. Z tego samego schematu generowany jest JSON Schema przekazywany modelowi w promptcie (`z.toJSONSchema`), więc opis formatu nie może się rozjechać z walidacją.
- **Ponowna próba z informacją o błędzie.** Gdy odpowiedź modelu nie przejdzie walidacji, worker ponawia zapytanie raz i dołącza listę błędów Zod. Jeśli druga próba też się nie powiedzie, zwraca komunikat błędu.
- **Nazwę pliku i liczbę stron uzupełnia backend.** Model generuje tylko pola, których nie da się ustalić deterministycznie (`aiInsightSchema`).
- **Dodatkowe pole `warnings`** (schemat pozwala dodawać pola). Trafiają tu informacje o wykrytej próbie prompt injection, o stronach odczytanych przez OCR i o stronach nieczytelnych.
- **Gemini Flash przez Google AI Studio.** Darmowy limit nie wymaga karty płatniczej, więc nie ma ryzyka kosztów. Duże okno kontekstu pozwala przeanalizować typowy dokument jednym wywołaniem.
- **Bez routera.** Aplikacja ma jeden widok, więc problem z odświeżaniem podstron na GitHub Pages nie występuje.
- **Instrukcje dla modelu po angielsku, wartości w języku dokumentu.** Opisy schematu i teksty promptu są po angielsku i nie sugerują języka odpowiedzi. Prompt systemowy każe najpierw ustalić język dokumentu i w nim pisać wszystkie wartości.
- **Zapasowy model.** Przy przeciążeniu (503) lub wyczerpaniu limitu (429) worker próbuje kolejnego modelu z `GEMINI_MODELS`.
- **Build legacy pdf.js.** Nowoczesny build pdf.js 6 korzysta z najnowszych API przeglądarek. Wersja legacy działa też na starszych Safari i Chrome.
- **Interfejs.** Jeden, jasny motyw niezależnie od ustawień systemu (spójny wygląd dla każdego użytkownika). Własna paleta „mineral jade” (chłodne szarości, nefrytowy akcent) z kontrastem tekstu min. 4,5:1. Informacja o wysyłce do AI stoi przy strefie wgrywania, a fokus przechodzi na nowy panel po zmianie widoku.

### Bezpieczeństwo

- Klucz API istnieje wyłącznie jako sekret Cloudflare (`wrangler secret put`). Nie ma go we frontendzie ani w repozytorium. Pliki `.env*` i `.dev.vars` są w `.gitignore`.
- CORS: worker odpowiada tylko originom z `ALLOWED_ORIGINS` (w produkcji wyłącznie `https://zdunek101.github.io`; `localhost` tylko lokalnie przez `.dev.vars`). Żądania z innych domen i bez nagłówka `Origin` dostają 403.
- Limity: 6 analiz na minutę z jednego IP i 12 na minutę łącznie (Cloudflare Rate Limiting; globalny limit chroni darmowy limit Gemini przed wyczerpaniem z wielu IP), maks. 400 tys. znaków tekstu, kontrola rozmiaru treści żądania, 10 MB na plik po stronie przeglądarki.
- Prompt injection: treść PDF trafia do modelu w znacznikach `<document>` jako niezaufane dane. Znaczniki występujące w samej treści są usuwane. Instrukcja systemowa opisuje kategorie ataków (polecenia dla AI, fałszywe wiadomości systemowe i znaczniki, zmiana roli, żądania podania wartości niepopartych treścią) zamiast konkretnych fraz, zabrania ich wykonywania i każe zgłosić je w `warnings` z miejscem wystąpienia. Sprawdzone na różnych typach ataków, nie tylko na pliku testowym.
- Brak `dangerouslySetInnerHTML` (wymusza to reguła ESLint). Cała treść renderowana jest jako tekst.
- Użytkownik widzi informację, że tekst trafia do zewnętrznego API AI.

## Uruchomienie lokalne

Wymagania: Node.js 22+ i darmowy klucz Gemini z [Google AI Studio](https://aistudio.google.com/apikey) (bez podpinania płatności).

```bash
npm install
cp .env.example .env.local        # VITE_API_URL=http://localhost:8787
printf "GEMINI_API_KEY=twój-klucz\nALLOWED_ORIGINS=http://localhost:5173\n" > .dev.vars
npm run worker:dev                # backend na http://localhost:8787
npm run dev                       # frontend na http://localhost:5173/reader/
```

| Zmienna           | Gdzie                                      | Opis                                                              |
| ----------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `VITE_API_URL`    | `.env.local` / zmienna repozytorium GitHub | adres workera                                                     |
| `GEMINI_API_KEY`  | `.dev.vars` / `wrangler secret`            | klucz Google AI Studio — **sekret**                               |
| `GEMINI_MODELS`   | `wrangler.toml`                            | modele w kolejności użycia; kolejny przy przeciążeniu lub limicie |
| `ALLOWED_ORIGINS` | `wrangler.toml` / `.dev.vars`              | dozwolone originy CORS, rozdzielone przecinkami                   |

Skrypty: `npm run lint`, `npm run format`, `npm test` (Vitest), `npm run build`.

## Wdrożenie

1. **Backend:** `npx wrangler login`, potem `npx wrangler secret put GEMINI_API_KEY`, potem `npm run worker:deploy`. Adres workera ma postać `https://reader-api.<konto>.workers.dev`.
2. **Frontend:** w repozytorium GitHub ustaw _Settings → Secrets and variables → Actions → Variables_ `VITE_API_URL` na adres workera. Następnie w _Settings → Pages → Source_ wybierz „GitHub Actions”. Każdy push na `main` uruchamia kolejno lint, testy, build i deploy.

## Znane ograniczenia

- **OCR** działa w przeglądarce na maks. 5 stronach (ok. 1–3 s na stronę, pierwsze użycie pobiera ok. 10 MB danych językowych). Rozpoznaje tylko polski i angielski. Pieczątki i odręczne podpisy dają szum.
- **Darmowy limit Gemini** ma ograniczoną liczbę zapytań na minutę i na dzień. Po jego wyczerpaniu użytkownik widzi komunikat z prośbą o ponowienie. W darmowym planie Google może wykorzystywać przesyłane treści, dlatego UI ostrzega przed wgrywaniem poufnych dokumentów.
- **Liczba zdań w podsumowaniu** (3–5) jest wymagana w promptcie, ale nie jest walidowana. Skróty typu „sp. z o.o.” uniemożliwiają wiarygodne liczenie zdań.
- **Dokumenty bardzo długie** (powyżej 400 tys. znaków) są odrzucane. Przy podziale na fragmenty podsumowanie całości powstaje ze streszczeń fragmentów.
- **Tabele** trafiają do modelu jako tekst liniowy, bez struktury kolumn.
- **Limit żądań** jest liczony w obrębie lokalizacji Cloudflare, więc jest przybliżony. Nagłówek `Origin` da się podrobić poza przeglądarką; przed nadużyciami chronią limity, a nie CORS.
- **Modele `-latest`** to aliasy Google, które mogą zostać przepięte na nowszą wersję. W zamian nie wygasają razem z konkretną wersją modelu.
