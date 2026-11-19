# Konfiguracja produkcyjna Gerka Pool House

Poniższa kolejność konfiguruje nowy projekt Supabase, panel administratora,
galerię, rezerwacje, wysyłkę e-mail i domenę produkcyjną.

## 1. Supabase Auth

1. Otwórz projekt Supabase.
2. Przejdź do `Authentication` > `Users`.
3. Kliknij `Add user` > `Create new user`.
4. Ustaw:
   - e-mail: `gerkapoolhouse@gmail.com`
   - silne, nowe hasło
   - użytkownik potwierdzony automatycznie
5. Utwórz użytkownika przed uruchomieniem skryptu SQL.

Jeśli administratorem ma być inny adres, zmień
`gerkapoolhouse@gmail.com` w pliku `supabase/complete-setup.sql` przed jego
uruchomieniem.

## 2. Supabase SQL

1. Przejdź do `SQL Editor`.
2. Kliknij `New query`.
3. Wklej całą zawartość pliku `supabase/complete-setup.sql`.
4. Kliknij `Run`.

Skrypt można uruchomić ponownie. Tworzy lub aktualizuje:

- `site_content`,
- `reservation_requests`,
- `admin_users`,
- indeksy i ograniczenia,
- polityki RLS,
- bucket `gerka-media`,
- polityki Storage,
- publikacje Realtime.

Po wykonaniu sprawdź administratora:

```sql
select au.email, adm.created_at
from public.admin_users adm
join auth.users au on au.id = adm.user_id;
```

Wynik powinien zawierać `gerkapoolhouse@gmail.com`.

## 3. Dane Supabase do Vercel

W Supabase otwórz `Project Settings` > `API` lub panel `Connect` i odczytaj:

- Project URL,
- klucz `publishable` albo starszy klucz `anon`.

Nie używaj klucza `service_role` w aplikacji przeglądarkowej.

## 4. Resend

1. Otwórz `Resend` > `Domains` > `gerkapoolhouse.pl`.
2. Dodaj w OVH wszystkie rekordy pokazane przez Resend:
   - DKIM `TXT`,
   - SPF `TXT` dla subdomeny `send`,
   - MX dla subdomeny `send`,
   - opcjonalnie DMARC.
3. Nie usuwaj rekordów MX OVH dla domeny głównej `@`, jeśli poczta OVH ma
   nadal odbierać wiadomości.
4. W Resend kliknij `I've added the records` i zaczekaj na status
   `Verified`.
5. Przejdź do `API Keys`, usuń wcześniej ujawniony klucz i utwórz nowy.

Sekretny klucz Resend wpisuj wyłącznie w Vercel. Nie zapisuj go w Git.

## 5. Zmienne środowiskowe Vercel

W projekcie Vercel przejdź do:
`Settings` > `Environment Variables`.

Dodaj:

| Key | Value |
| --- | --- |
| `VITE_SITE_URL` | `https://www.gerkapoolhouse.pl` |
| `VITE_SUPABASE_URL` | Project URL z nowego Supabase |
| `VITE_SUPABASE_ANON_KEY` | klucz publishable/anon z nowego Supabase |
| `VITE_SUPABASE_MEDIA_BUCKET` | `gerka-media` |
| `VITE_RESERVATION_EMAIL_ENDPOINT` | `/api/reservation-email` |
| `RESEND_API_KEY` | nowy klucz `re_...` z Resend |
| `RESEND_FROM_EMAIL` | `Gerka Pool House <rezerwacje@gerkapoolhouse.pl>` |
| `RESERVATION_OWNER_EMAIL` | `gerkapoolhouse@gmail.com` (w Supabase ustaw również „Adres do powiadomień” w panelu admina) |
| `ALLOWED_ORIGIN` | `https://www.gerkapoolhouse.pl` |

Opcjonalnie:

| Key | Value |
| --- | --- |
| `VITE_GA_MEASUREMENT_ID` | identyfikator GA4, np. `G-...` |
| `VITE_GTM_ID` | identyfikator GTM, np. `GTM-...` |
| `VITE_GOOGLE_SITE_VERIFICATION` | kod weryfikacyjny Search Console |

Zmienne zaczynające się od `VITE_` są publiczne. `RESEND_API_KEY` nie może
mieć prefiksu `VITE_`.

Ustaw zmienne co najmniej dla środowiska `Production`. Po zapisaniu przejdź
do `Deployments` i wykonaj `Redeploy`.

## 6. OVH i domena strony

W `OVH` > domena `gerkapoolhouse.pl` > `Strefa DNS` ustaw rekordy wskazane
aktualnie przez Vercel:

- `A` dla `@` na adres podany przez Vercel,
- `CNAME` dla `www` na host podany przez Vercel.

W Vercel:

- `www.gerkapoolhouse.pl` powinno być domeną produkcyjną,
- `gerkapoolhouse.pl` powinno przekierowywać kodem `308` na
  `www.gerkapoolhouse.pl`.

Po zmianach DNS propagacja może potrwać do 24 godzin.

## 7. Pierwsze uruchomienie

1. Otwórz `https://www.gerkapoolhouse.pl/admin`.
2. Zaloguj się kontem utworzonym w Supabase Auth.
3. Kliknij `Zapisz zmiany`, aby utworzyć rekord treści `main`.
4. Dodaj testowe zdjęcie i sprawdź, czy pojawia się w bucketcie
   `gerka-media/gallery`.
5. Wyślij testowe zapytanie rezerwacyjne z innym adresem klienta.
6. Sprawdź:
   - `Table Editor` > `reservation_requests`,
   - `Resend` > `Logs`,
   - skrzynkę właściciela,
   - skrzynkę klienta.

## 8. Kontrola końcowa

Sprawdź:

- `https://www.gerkapoolhouse.pl`,
- `https://www.gerkapoolhouse.pl/admin`,
- odświeżenie bezpośrednio na `/admin`,
- zapis treści i zdjęć,
- kalendarz zajętych terminów,
- e-mail do właściciela i klienta,
- przekierowanie z domeny bez `www`.
