# Audyt produkcyjny - 24 czerwca 2026

## Zakres

Audyt objął frontend React, funkcje Vercel, integrację Supabase, multimedia,
SEO, dostępność, zależności npm i konfigurację produkcyjną. Wygląd, treści,
funkcjonalności oraz oryginalne pliki zdjęć i filmów zostały zachowane.

## Najważniejsze znalezione problemy

- pierwszy ekran czekał na React, zdalną treść i pełny arkusz CSS;
- publiczna strona mogła ładować pełny klient Supabase mimo prostych odczytów;
- sekcje znajdujące się poniżej Hero konkurowały o transfer z obrazem LCP;
- po wejściu mogły przez chwilę pojawiać się lokalne, starsze obrazy;
- obrazy z Supabase nie miały kompletnego responsywnego `srcset`;
- filmy w galerii mogły pobierać dane wcześniej niż było to potrzebne;
- Google Fonts tworzyły dodatkowe połączenia i blokowały tekst;
- główny bundle zawierał ciężką bibliotekę tylko do scalania klas CSS;
- angielskie tłumaczenia i analityka były ładowane zbyt wcześnie;
- część elementów galerii i lightboxa wymagała poprawy obsługi klawiatury;
- endpoint diagnostyczny ujawniał stan konfiguracji poczty;
- endpoint e-mail nie miał pełnej walidacji originu, danych i limitu żądań;
- zasady RLS przyznawały uprawnienia każdemu użytkownikowi `authenticated`;
- publiczna polityka rezerwacji wymagała ograniczenia wyłącznie do `anon`;
- brakowało indeksów pod najczęstsze zapytania rezerwacyjne;
- domena kanoniczna i pliki SEO nie były wszędzie ujednolicone.

## Wykonane optymalizacje

### Ładowanie aplikacji

- dodano lekki, statyczny pierwszy kadr Hero przed startem Reacta;
- dodano minimalny critical CSS dla pierwszego kadru;
- krytyczny obraz Hero jest preloadowany osobno dla mobile i desktop;
- aktualne zdjęcie Hero jest rozwiązywane przez cacheowany endpoint Vercela;
- endpoint przekazuje wskazówkę `Link preload` dla docelowego obrazu;
- treść Supabase zaczyna pobierać się już podczas parsowania dokumentu;
- ten sam Promise jest ponownie wykorzystywany przez warstwę React;
- sekcje poniżej Hero są ładowane po zasobach pierwszego ekranu lub od razu po
  interakcji użytkownika;
- panel admina, strony prawne i strona 404 pozostają osobnymi chunkami;
- angielski pakiet tłumaczeń ładuje się dopiero po wybraniu języka EN;
- GA4/GTM uruchamia się po krytycznym renderze;
- usunięto `tailwind-merge` z pierwszego ekranu, zachowując wynikowe klasy UI.

### Obrazy i multimedia

- oryginały w Supabase i repozytorium nie są modyfikowane;
- obrazy Supabase korzystają z responsywnych pochodnych WebP;
- pochodne zachowują wysoką jakość (`quality=82`);
- przeglądarka dobiera szerokość obrazu do miejsca jego wyświetlenia;
- obrazy galerii mają lazy loading i stabilne proporcje;
- lightbox pobiera tylko aktywny materiał;
- filmy w kafelkach używają `preload="none"`, a w lightboxie `metadata`;
- logo aplikacji zostało zapisane jako WebP;
- plik grafiki społecznościowej zmniejszono z około 361 KB do około 55 KB;
- usunięto zduplikowane pliki Open Graph.

### JavaScript i renderowanie

- publiczne odczyty treści i dostępności korzystają z lekkiego REST API;
- SDK Supabase ładuje się dynamicznie dopiero dla logowania i panelu admina;
- ograniczono realtime do panelu administratora;
- strona publiczna odświeża dane po powrocie do karty i okresowo, bez stałego
  połączenia WebSocket;
- galeria i kalendarz używają memoizacji tam, gdzie ogranicza ona kosztowne
  przeliczenia;
- usunięto nieużywany kod i zależności;
- zaktualizowano zależności oraz wyeliminowano podatności `npm audit`.

### Dostępność

- uzupełniono nazwy dostępne przycisków i kontrolek;
- lightbox ma rolę dialogu, pułapkę fokusu, obsługę Escape i strzałek;
- po zamknięciu lightboxa fokus wraca do elementu otwierającego;
- dodano obsługę gestów przesuwania na urządzeniach dotykowych;
- elementy dekoracyjne nie są odczytywane przez czytniki ekranu;
- zachowano widoczne stany focus i obsługę `prefers-reduced-motion`;
- kalendarz przekazuje czytnikowi nazwę daty oraz jej status;
- semantyczne sekcje, nagłówki, tabele i formularze zostały zachowane.

### SEO

- ujednolicono adres kanoniczny do `https://www.gerkapoolhouse.pl`;
- poprawiono canonical, hreflang PL/EN i `x-default`;
- zweryfikowano Open Graph, Twitter Cards i obraz 1200 x 630;
- poprawiono `robots.txt` i `sitemap.xml`;
- zachowano LocalBusiness, LodgingBusiness, FAQPage i BreadcrumbList JSON-LD;
- dynamiczne meta tagi są synchronizowane z treścią panelu administratora.

### Backend i bezpieczeństwo

- usunięto publiczny endpoint diagnostyczny konfiguracji e-mail;
- dane e-mail są walidowane przez Zod;
- dodano kontrolę originu, CORS, limit częstotliwości i limity długości pól;
- wartości użytkownika są escapowane przed wstawieniem do HTML wiadomości;
- odpowiedzi endpointu e-mail mają `Cache-Control: no-store`;
- dodano nagłówki HSTS, nosniff, referrer policy i permissions policy;
- przygotowano listę administratorów `admin_users` i funkcję `is_admin()`;
- RLS zapisu treści, odczytu rezerwacji i Storage wymaga członkostwa admina;
- ograniczono aktualizację rezerwacji do kolumn `status` i `updated_at`;
- dodano indeksy `created_at` oraz częściowy indeks zaakceptowanych terminów;
- dodano constraint zgodności liczby nocy z datami pobytu.

## Wyniki

Pomiary są laboratoryjne i zależą od sieci, cache CDN oraz wydajności
urządzenia.

| Pomiar | Przed | Po |
| --- | ---: | ---: |
| Lighthouse mobile Performance | 77 | 85 |
| Mobile FCP | ok. 1,7-3,2 s | ok. 2,4 s |
| Mobile LCP | ok. 6,2 s | ok. 3,9 s |
| Mobile TBT | 30 ms | 20 ms |
| Mobile CLS | 0 | 0,002 |
| Lighthouse desktop | - | 100 / 100 / 100 / 100 |
| Główny JS gzip | ok. 131 KB | ok. 82 KB |
| Wspólny chunk UI/router gzip | ok. 24 KB | ok. 15,5 KB |
| Podatności npm | wykryte w starszym toolchainie | 0 |

Wynik mobilny po wdrożeniu może różnić się od lokalnego. Vercel dostarcza
Brotli/CDN, natomiast zimny start funkcji Hero i cache obrazu wpływają na
pojedyncze pomiary. Należy oceniać medianę minimum trzech testów produkcyjnych.

## Jednorazowe działania po wdrożeniu

1. Uruchomić w Supabase SQL Editor:
   `supabase/migrations/20260624000100_harden_admin_rls.sql`.
2. Sprawdzić, czy konto administratora istnieje w `Authentication > Users`.
3. Ustawić w Vercel `VITE_SITE_URL` i `ALLOWED_ORIGIN` na
   `https://www.gerkapoolhouse.pl`.
4. Po zmianie zmiennych wykonać nowy deployment produkcyjny.
5. Ponownie zmierzyć stronę przez PageSpeed Insights po rozgrzaniu CDN.
6. Obrócić klucz Resend, jeśli był kiedykolwiek pokazany w zrzucie ekranu,
   komunikatorze lub historii terminala.

## Dalsze możliwe usprawnienia

- przenieść tworzenie rezerwacji i wyliczenie ceny do zaufanej funkcji
  serwerowej lub Supabase Edge Function;
- dodać Cloudflare Turnstile oraz trwały rate limit, np. Upstash Redis;
- przy większym ruchu rozważyć statyczne generowanie strony publicznej z
  webhookiem przebudowującym stronę po zapisie w panelu;
- wydzielić krytyczny CSS publicznej strony od rozbudowanych styli panelu;
- monitorować realne Core Web Vitals przez Vercel Analytics lub GA4.

Osiągnięcie stabilnego wyniku 95+ na emulowanym urządzeniu mobilnym może
wymagać prerenderingu/SSR albo statycznego publikowania treści po zmianie w
panelu. Obecna wersja zachowuje dynamiczną administrację i poprawia główny
problem LCP bez obniżania jakości materiałów.
