Przed wdrozeniem aktualizacji uruchom rowniez migracje
`supabase/migrations/20261013000200_guard_manual_availability.sql` po migracji
apartamentow. Dodaje zabezpieczenie konfliktow recznych blokad i zaakceptowanych
rezerwacji po stronie bazy. Zostala sprawdzona na izolowanym PostgreSQL.

# Osobne kalendarze apartamentow

Dla istniejacej bazy uruchom w Supabase SQL Editor migracje
`supabase/migrations/20261013000100_apartment_calendars.sql` przed wdrozeniem aplikacji.
Dla nowej bazy `supabase/complete-setup.sql` zawiera juz te zmiany.

Rezerwacje zapisuja pole `apartment`: `ground` (parter), `upper` (pietro)
lub `both` (oba). Zaakceptowana rezerwacja blokuje tylko wybrane apartamenty.
Baza uniemozliwia zatwierdzenie nakladajacych sie rezerwacji tego samego
apartamentu, takze przy jednoczesnej pracy kilku administratorow.
Dzien wyjazdu nie jest blokowany.

Starsze rezerwacje jednego apartamentu sa przypisane do parteru, a rezerwacje
wielu apartamentow do obu. Starsze reczne blokady bez wskazania apartamentu
nadal blokuja oba; w panelu mozna zmienic ich przypisanie.
Pojemnosc pietra wynika z maksymalnej liczby gosci pomniejszonej o pojemnosc parteru.

Migracja zostanie odrzucona, jesli stare zaakceptowane rezerwacje nakladaja sie
na siebie lub `rooms_used` wykracza poza obslugiwane 1-2 apartamenty.
Przed ponownym uruchomieniem popraw takie wpisy.

# Supabase - zapytania rezerwacyjne

Po utworzeniu tabel uruchom rowniez migracje
`supabase/migrations/20260624000100_harden_admin_rls.sql`. Dodaje ona
ograniczenie administratorow, indeks zaakceptowanych terminow i kontrole
zgodnosci liczby nocy z datami.

Uruchom ponizszy SQL w Supabase SQL Editor. Tworzy tabele `reservation_requests`,
wlacza RLS i ustawia zasady:

- kazdy moze wyslac nowe zapytanie ze strony,
- publiczna strona widzi tylko zajete daty zaakceptowanych rezerwacji,
- zalogowany administrator widzi i zmienia wszystkie zapytania.

```sql
create table if not exists public.reservation_requests (
  id uuid primary key,
  reservation_number text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text not null,
  guests integer not null check (guests between 1 and 30),
  check_in date not null,
  check_out date not null,
  nights integer not null check (nights > 0),
  rooms_used integer not null check (rooms_used between 1 and 4),
  nightly_price numeric(10, 2) not null check (nightly_price >= 0),
  estimated_total numeric(10, 2) not null check (estimated_total >= 0),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  check (check_out > check_in)
);

create index if not exists reservation_requests_status_idx
on public.reservation_requests (status);

create index if not exists reservation_requests_dates_idx
on public.reservation_requests (check_in, check_out);

alter table public.reservation_requests enable row level security;
alter table public.reservation_requests replica identity full;

revoke all on table public.reservation_requests from anon, authenticated;

grant insert (
  id,
  reservation_number,
  created_at,
  full_name,
  email,
  phone,
  guests,
  check_in,
  check_out,
  nights,
  rooms_used,
  nightly_price,
  estimated_total,
  message,
  status
) on public.reservation_requests to anon, authenticated;

grant select (id, check_in, check_out, status)
on public.reservation_requests to anon;

grant select, update
on public.reservation_requests to authenticated;

drop policy if exists "Anyone can create pending reservation inquiries"
on public.reservation_requests;

create policy "Anyone can create pending reservation inquiries"
on public.reservation_requests
for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "Public can read accepted availability"
on public.reservation_requests;

create policy "Public can read accepted availability"
on public.reservation_requests
for select
to anon
using (status = 'accepted');

drop policy if exists "Authenticated admins can read reservations"
on public.reservation_requests;

create policy "Authenticated admins can read reservations"
on public.reservation_requests
for select
to authenticated
using (true);

drop policy if exists "Authenticated admins can update reservations"
on public.reservation_requests;

create policy "Authenticated admins can update reservations"
on public.reservation_requests
for update
to authenticated
using (true)
with check (status in ('pending', 'accepted', 'rejected', 'cancelled'));

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reservation_requests'
  ) then
    alter publication supabase_realtime add table public.reservation_requests;
  end if;
end $$;
```

Opcjonalne wyczyszczenie wszystkich zapytan w Supabase:

```sql
truncate table public.reservation_requests;
```
