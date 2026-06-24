# Supabase - treści strony i ustawienia panelu

Po utworzeniu tabel uruchom rowniez migracje
`supabase/migrations/20260624000100_harden_admin_rls.sql`. Ogranicza ona zapis
do kont wpisanych w `public.admin_users`.

Uruchom ponizszy SQL w Supabase SQL Editor. Tworzy tabele `site_content`,
w ktorej panel administratora zapisuje:

- tresci PL/EN,
- cennik,
- FAQ,
- atrakcje,
- kontakt,
- SEO,
- galerie: kolejnosc, tytuly, opisy i adresy mediow,
- reczne blokady dostepnosci.

```sql
create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.site_content replica identity full;

revoke all on table public.site_content from anon, authenticated;

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

drop policy if exists "Public can read site content"
on public.site_content;

create policy "Public can read site content"
on public.site_content
for select
to anon, authenticated
using (id = 'main');

drop policy if exists "Authenticated admins can create site content"
on public.site_content;

create policy "Authenticated admins can create site content"
on public.site_content
for insert
to authenticated
with check (id = 'main');

drop policy if exists "Authenticated admins can update site content"
on public.site_content;

create policy "Authenticated admins can update site content"
on public.site_content
for update
to authenticated
using (id = 'main')
with check (id = 'main');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_content'
  ) then
    alter publication supabase_realtime add table public.site_content;
  end if;
end $$;
```

Po uruchomieniu SQL:

1. Wejdz do `/admin`.
2. Kliknij `Zapisz`.
3. Od tej chwili tresci beda zapisane w Supabase i widoczne dla wszystkich uzytkownikow strony.

Opcjonalne wyczyszczenie tresci zapisanych w Supabase:

```sql
delete from public.site_content where id = 'main';
```
