create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "Admins can read their membership"
on public.admin_users;

create policy "Admins can read their membership"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

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

drop policy if exists "Public can read accepted availability"
on public.reservation_requests;
drop policy if exists "Authenticated admins can read reservations"
on public.reservation_requests;
drop policy if exists "Authenticated admins can update reservations"
on public.reservation_requests;

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

revoke update on table public.reservation_requests from authenticated;
grant update (status, updated_at) on table public.reservation_requests to authenticated;

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
      check (nights = check_out - check_in);
  end if;
end $$;

drop policy if exists "Authenticated upload for gallery media"
on storage.objects;
drop policy if exists "Authenticated update for gallery media"
on storage.objects;
drop policy if exists "Authenticated delete for gallery media"
on storage.objects;

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
