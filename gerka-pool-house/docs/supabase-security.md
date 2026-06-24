# Supabase - zabezpieczenie dostepu administratora

Domyslne zasady oparte tylko na roli `authenticated` pozwalaja kazdemu
zalogowanemu uzytkownikowi korzystac z uprawnien administratora. Migracja:

`supabase/migrations/20260624000100_harden_admin_rls.sql`

tworzy jawna liste administratorow i ogranicza do niej:

- zapis tresci strony,
- odczyt i zmiane zapytan rezerwacyjnych,
- dodawanie, podmiane i usuwanie mediow.

## Wdrozenie

1. Otworz `Supabase > SQL Editor`.
2. Wklej cala zawartosc migracji.
3. Upewnij sie, ze w `Authentication > Users` istnieje konto
   `gerkapoolhouse@gmail.com`.
4. Uruchom zapytanie.
5. Wyloguj sie i zaloguj ponownie do `/admin`.

Kolejnego administratora dodasz poleceniem:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('nowy-admin@example.com')
on conflict (user_id) do nothing;
```

Usuniecie uprawnien:

```sql
delete from public.admin_users
where user_id = (
  select id
  from auth.users
  where lower(email) = lower('nowy-admin@example.com')
);
```
