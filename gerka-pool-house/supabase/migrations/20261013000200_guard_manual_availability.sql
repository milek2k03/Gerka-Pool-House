-- Serialize calendar changes and prevent manual blocks from conflicting with accepted stays.
create or replace function public.guard_reservation_availability()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'accepted' then
    perform pg_catalog.pg_advisory_xact_lock(726431903);
    if exists (
      select 1 from public.site_content s,
        pg_catalog.jsonb_array_elements(coalesce(s.content->'availability', '[]'::jsonb)) r
      where s.id = 'main'
        and r->>'status' in ('booked', 'unavailable')
        and coalesce(r->>'apartment', 'both') in ('both', new.apartment)
        and (r->>'from')::date < new.check_out and (r->>'to')::date > new.check_in
    ) or (new.apartment = 'both' and exists (
      select 1 from public.site_content s,
        pg_catalog.jsonb_array_elements(coalesce(s.content->'availability', '[]'::jsonb)) r
      where s.id = 'main' and r->>'status' in ('booked', 'unavailable')
        and (r->>'from')::date < new.check_out and (r->>'to')::date > new.check_in
    )) then
      raise exception 'Selected apartment is manually blocked for these dates' using errcode = '23P01';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.guard_manual_availability()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(726431903);
  if exists (
    select 1 from public.reservation_requests b,
      pg_catalog.jsonb_array_elements(coalesce(new.content->'availability', '[]'::jsonb)) r
    where b.status = 'accepted' and r->>'status' in ('booked', 'unavailable')
      and (coalesce(r->>'apartment', 'both') = 'both' or b.apartment = 'both' or r->>'apartment' = b.apartment)
      and (r->>'from')::date < b.check_out and (r->>'to')::date > b.check_in
  ) then
    raise exception 'Manual block conflicts with an accepted reservation' using errcode = '23P01';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_reservation_availability() from public;
revoke all on function public.guard_manual_availability() from public;
drop trigger if exists reservation_requests_availability_guard on public.reservation_requests;
create trigger reservation_requests_availability_guard
before insert or update of status, check_in, check_out, apartment on public.reservation_requests
for each row execute function public.guard_reservation_availability();
drop trigger if exists site_content_availability_guard on public.site_content;
create trigger site_content_availability_guard before insert or update on public.site_content
for each row execute function public.guard_manual_availability();
