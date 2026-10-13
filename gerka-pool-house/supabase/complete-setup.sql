-- Gerka Pool House - kompletna konfiguracja Supabase
-- Przed uruchomieniem utworz użytkownika gerkapoolhouse@gmail.com
-- w Supabase > Authentication > Users.

create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.site_content replica identity full;

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
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  check (check_out > check_in)
);

alter table public.reservation_requests enable row level security;
alter table public.reservation_requests replica identity full;

create index if not exists reservation_requests_status_idx
on public.reservation_requests (status);

create index if not exists reservation_requests_dates_idx
on public.reservation_requests (check_in, check_out);

create index if not exists reservation_requests_created_at_idx
on public.reservation_requests (created_at desc);

create index if not exists reservation_requests_accepted_dates_idx
on public.reservation_requests (check_in, check_out)
where status = 'accepted';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservation_requests_nights_match_dates'
      and conrelid = 'public.reservation_requests'::regclass
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_nights_match_dates
      check (nights = check_out - check_in) not valid;
  end if;
end $$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'gerka-media',
  'gerka-media',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('gerkapoolhouse@gmail.com')
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update on table public.site_content to authenticated;

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
) on table public.reservation_requests to anon, authenticated;

grant select (id, check_in, check_out, status)
on table public.reservation_requests to anon;

grant select on table public.reservation_requests to authenticated;
grant update (status, updated_at)
on table public.reservation_requests to authenticated;

drop policy if exists "Admins can read their membership"
on public.admin_users;

create policy "Admins can read their membership"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can read site content"
on public.site_content;
drop policy if exists "Authenticated admins can create site content"
on public.site_content;
drop policy if exists "Authenticated admins can update site content"
on public.site_content;

create policy "Public can read site content"
on public.site_content
for select
to anon, authenticated
using (id = 'main');

create policy "Authenticated admins can create site content"
on public.site_content
for insert
to authenticated
with check (id = 'main' and public.is_admin());

create policy "Authenticated admins can update site content"
on public.site_content
for update
to authenticated
using (id = 'main' and public.is_admin())
with check (id = 'main' and public.is_admin());

drop policy if exists "Anyone can create pending reservation inquiries"
on public.reservation_requests;
drop policy if exists "Public can read accepted availability"
on public.reservation_requests;
drop policy if exists "Authenticated admins can read reservations"
on public.reservation_requests;
drop policy if exists "Authenticated admins can update reservations"
on public.reservation_requests;

create policy "Anyone can create pending reservation inquiries"
on public.reservation_requests
for insert
to anon, authenticated
with check (status = 'pending');

create policy "Public can read accepted availability"
on public.reservation_requests
for select
to anon
using (status = 'accepted');

create policy "Authenticated admins can read reservations"
on public.reservation_requests
for select
to authenticated
using (public.is_admin());

create policy "Authenticated admins can update reservations"
on public.reservation_requests
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and status in ('pending', 'accepted', 'rejected', 'cancelled')
);

drop policy if exists "Public read for gallery media"
on storage.objects;
drop policy if exists "Authenticated upload for gallery media"
on storage.objects;
drop policy if exists "Authenticated update for gallery media"
on storage.objects;
drop policy if exists "Authenticated delete for gallery media"
on storage.objects;

create policy "Public read for gallery media"
on storage.objects
for select
to public
using (bucket_id = 'gerka-media');

create policy "Authenticated upload for gallery media"
on storage.objects
for insert
to authenticated
with check (
  public.is_admin()
  and bucket_id = 'gerka-media'
  and (storage.foldername(name))[1] = 'gallery'
);

create policy "Authenticated update for gallery media"
on storage.objects
for update
to authenticated
using (public.is_admin() and bucket_id = 'gerka-media')
with check (public.is_admin() and bucket_id = 'gerka-media');

create policy "Authenticated delete for gallery media"
on storage.objects
for delete
to authenticated
using (public.is_admin() and bucket_id = 'gerka-media');

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


-- Separate availability for the ground floor, upstairs and both apartments.
alter table public.reservation_requests
  add column if not exists apartment text;

-- Legacy inquiries selected apartments from rooms_used.
update public.reservation_requests
set apartment = case when rooms_used > 1 then 'both' else 'ground' end
where apartment is null;

alter table public.reservation_requests
  alter column apartment set default 'ground',
  alter column apartment set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reservation_requests_apartment_valid'
    and conrelid = 'public.reservation_requests'::regclass) then
    alter table public.reservation_requests add constraint reservation_requests_apartment_valid
      check (apartment in ('ground', 'upper', 'both'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reservation_requests_apartment_rooms_match'
    and conrelid = 'public.reservation_requests'::regclass) then
    alter table public.reservation_requests add constraint reservation_requests_apartment_rooms_match
      check (rooms_used = case when apartment = 'both' then 2 else 1 end);
  end if;
end $$;

grant insert (apartment) on public.reservation_requests to anon, authenticated;
grant select (apartment) on public.reservation_requests to anon;

-- Apartment intervals: ground [1,2), upper [2,3), both [1,3).
-- Enforced atomically, including concurrent admin acceptances.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reservation_requests_no_apartment_overlap'
    and conrelid = 'public.reservation_requests'::regclass) then
    alter table public.reservation_requests
      add constraint reservation_requests_no_apartment_overlap
  exclude using gist (
    int4range(
      case when apartment = 'upper' then 2 else 1 end,
      case when apartment = 'ground' then 2 else 3 end,
      '[)'
    ) with &&,
    daterange(check_in, check_out, '[)') with &&
  ) where (status = 'accepted');
  end if;
end $$;
