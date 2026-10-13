# Audyt projektu - 2026-10-13

Zmieniono i sprawdzono kod lokalny. Nie wdrazano aplikacji ani migracji na produkcje.
Nie wysylano prawdziwych maili ani nie tworzono rezerwacji w rzeczywistej bazie.

## Naprawy

- Zapis konfiguracji porownuje wersje rekordu i wykonuje warunkowa aktualizacje.
  Stary formularz nie nadpisuje nowszego zapisu. Konflikt pozostawia poprawki w edytorze.
- Odczyty w tle nie nadpisuja wyniku zakonczonego zapisu. Wstepne pobranie ustawien
  otrzymuje wersje bezposrednio z kolumny `updated_at`.
- Przed wyslaniem zapytania formularz ponownie pobiera ustawienia i dostepnosc.
  Zmiana ceny wymaga przejrzenia nowego podsumowania i ponownego wyslania.
- Wspolne limity frontend/serwer: 90 nocy, 30 gosci, 160 znakow nazwiska, 40 znakow
  telefonu. Poprawna data nie moze wskazywac nieistniejacego dnia miesiaca.
- Walidowane sa pojemnosci, ceny, godziny, kontakty, branding, canonical, reczne
  blokady oraz unikalnosc i warunki kodow rabatowych. Bledy sa opisane w panelu.
- Kwoty zachowuja grosze. Rabaty procentowe sa liczone do grosza. Cena bazowa
  w mailu i eksporcie jest oznaczona jako cena przed rabatem.
- Automatyczna promocja tygodniowa dotyczy tez obu apartamentow, zgodnie z decyzja
  uzytkownika. Nie podwyzsza ceny, gdy stawka promocyjna bylaby drozsza od bazowej.
- Opisy standardowe reaguja na wylaczenie pietra. Starsze tresci migruja do wersji 28.
- Daty dzis/jutro sa wyznaczane dla Europe/Warsaw. Widok odswieza sie po zmianie dnia.
- Dostep do panelu sprawdza czlonkostwo administratora, a nie tylko obecnosc sesji.
- API maili sprawdza liczbe nocy i przypisanie apartamentu; HTML jest escapowany.
  Osobne klucze idempotencji wiadomosci ograniczaja duplikaty przy ponowieniu.
- CSV chroni przed wykonywaniem formul wpisanych w dane goscia.
- Migracja `20261013000200_guard_manual_availability.sql` chroni po stronie bazy
  przed konfliktem recznych blokad i zaakceptowanych rezerwacji.
- Aktualizowano zaleznosci z poprawkami bezpieczenstwa. Sharp jest zaleznoscia
  produkcyjna, poniewaz uzywaja go funkcje serwerowe. Zaktualizowano lockfile.

## Weryfikacja

- `npm run check`: TypeScript, ESLint, 32 testy i kompilacja.
- `npm audit --json`: 0 znanych podatnosci we wszystkich zaleznosciach.
- `tests/browser-smoke.mjs`: Chromium, desktop i mobile, PL/EN, rezerwacja obu
  apartamentow, cena promocyjna, zmiana ceny przed wyslaniem, logowanie, uprawnienia,
  zapis i konflikt dwoch kart, oba kalendarze, reczna blokada, galeria i powrot zdjecia
  po blednym adresie. Brak bledow JavaScript strony i przewijania poziomego na mobile.
- `tests/database-smoke.mjs`: izolowany PostgreSQL (PGlite), obie migracje kalendarzy
  oraz kompletny setup z minimalnymi odpowiednikami struktur Supabase. Sprawdzono
  konflikty apartamentow i blokad, anulowanie, migracje starszych wpisow, ponowne
  uruchomienie SQL oraz polityki dostepu dla anon, zwyklego konta i administratora.
- Zaktualizowany Sharp wykonuje testowany pipeline resize/composite/JPEG.

Testy przegladarkowe i bazodanowe wymagaja narzedzi zewnetrznych; sciezki modulow
mozna przekazac jako `PLAYWRIGHT_MODULE_PATH` i `PGLITE_MODULE_PATH`. Nie dodano
ich do zaleznosci aplikacji. Browser wymaga lokalnego Vite z fikcyjnymi zmiennymi:
`VITE_SUPABASE_URL=https://test-project.supabase.co`, `VITE_SUPABASE_ANON_KEY=test-public-key`,
`VITE_RESERVATION_EMAIL_ENDPOINT=/api/reservation-email`. Test przechwytuje uslugi.

## Produkcja

Przed wdrozeniem nalezy zastosowac obie migracje kalendarzy w kolejnosci numerow.
Druga migracja nie zmienia starych danych; dodaje sprawdzanie konfliktow przy zapisie.
W starej bazie nakladajace sie zaakceptowane rezerwacje moga wymagac uporzadkowania
przed pierwsza migracja. Następnie nalezy sprawdzic realne logowanie, Storage oraz
konfiguracje Resend i domeny nadawcy. Nie testowano prawdziwych kont ani dostarczalnosci
maili. Test PGlite ma jedno polaczenie, wiec nie odtwarza produkcyjnego obciazenia
wielu polaczen; testy konfliktu wersji obejmuja osobno wyscig w aplikacji i dwie karty.

W wykonanych kontrolach brak niezalatanych bledow. Nie jest to gwarancja braku
wszystkich mozliwych bledow w dowolnym srodowisku produkcyjnym.
