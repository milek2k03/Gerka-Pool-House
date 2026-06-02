# Supabase Storage dla galerii

Aplikacja wysyla pliki z panelu `/admin` do bucketu:

```env
VITE_SUPABASE_MEDIA_BUCKET=gerka-media
```

Bucket musi byc publiczny, bo galeria wyswietla media po publicznym URL.

## SQL do Supabase

Wklej w `Supabase > SQL Editor`:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
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

drop policy if exists "Public read for gallery media"
on storage.objects;

create policy "Public read for gallery media"
on storage.objects
for select
to public
using (bucket_id = 'gerka-media');

drop policy if exists "Authenticated upload for gallery media"
on storage.objects;

create policy "Authenticated upload for gallery media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gerka-media'
  and (storage.foldername(name))[1] = 'gallery'
);

drop policy if exists "Authenticated update for gallery media"
on storage.objects;

create policy "Authenticated update for gallery media"
on storage.objects
for update
to authenticated
using (bucket_id = 'gerka-media')
with check (bucket_id = 'gerka-media');

drop policy if exists "Authenticated delete for gallery media"
on storage.objects;

create policy "Authenticated delete for gallery media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'gerka-media');
```

Po zmianie zmiennych `.env.local` uruchom ponownie serwer developerski.
