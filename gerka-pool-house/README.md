# Gerka Pool House

Produkcyjna aplikacja React + Vite + TypeScript dla obiektu Gerka Pool House.
Strona publiczna, panel administratora, treści, galerie i rezerwacje są
zintegrowane z Supabase, a wiadomości transakcyjne obsługuje Resend przez
funkcję Vercel.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Zmienne środowiskowe należy utworzyć na podstawie `.env.example`. Plik
`.env.local` nie jest śledzony przez Git.

## Kontrola jakości

```bash
npm run check
npm audit
npx vercel build --yes
```

`npm run check` uruchamia TypeScript strict mode, ESLint i produkcyjny build.

## Wdrożenie

1. Skonfiguruj zmienne z `.env.example` w Vercel dla Production i Preview.
2. Uruchom skrypty z katalogu `docs` oraz migrację
   `supabase/migrations/20260624000100_harden_admin_rls.sql` w Supabase SQL
   Editor.
3. Zweryfikuj domenę wysyłkową w Resend.
4. Wdróż gałąź `main` przez integrację GitHub z Vercel.

Główna domena kanoniczna: `https://www.gerkapoolhouse.pl`.

## Dokumentacja

- [Audyt produkcyjny](docs/performance-audit-2026-06-24.md)
- [Bezpieczeństwo Supabase](docs/supabase-security.md)
- [Rezerwacje Supabase](docs/supabase-reservations.md)
- [Treści strony Supabase](docs/supabase-site-content.md)
- [Storage Supabase](docs/supabase-storage.md)
- [Integracja e-mail](docs/email-integrations.md)
