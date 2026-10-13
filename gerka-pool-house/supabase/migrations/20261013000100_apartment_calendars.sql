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
