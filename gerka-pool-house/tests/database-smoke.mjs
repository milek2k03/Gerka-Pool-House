import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH ? pathToFileURL(process.env.PGLITE_MODULE_PATH).href : '@electric-sql/pglite')
const db = new PGlite()
try {
  const setup = await readFile('supabase/complete-setup.sql', 'utf8')
  const siteTable = setup.match(/create table if not exists public\.site_content \([\s\S]*?\n\);/)[0]
  const reservationTable = setup.match(/create table if not exists public\.reservation_requests \([\s\S]*?\n\);/)[0]
  await db.exec(`create role anon; create role authenticated; ${siteTable} ${reservationTable}`)
  await db.exec(`insert into public.reservation_requests
    (id,reservation_number,full_name,email,phone,guests,check_in,check_out,nights,rooms_used,nightly_price,estimated_total,status)
    values ('00000000-0000-4000-8000-000000000001','LEGACY','Test','test@example.com','123456789',2,'2099-06-10','2099-06-14',4,1,1000,4000,'accepted');`)
  const apartments = await readFile('supabase/migrations/20261013000100_apartment_calendars.sql', 'utf8')
  const manual = await readFile('supabase/migrations/20261013000200_guard_manual_availability.sql', 'utf8')
  await db.exec(apartments)
  await db.exec(manual)
  assert.equal((await db.query(`select apartment from public.reservation_requests where reservation_number='LEGACY'`)).rows[0].apartment, 'ground')
  const add = async (apartment, from, to, status = 'accepted') => {
    const id = crypto.randomUUID()
    await db.query(`insert into public.reservation_requests
      (id,reservation_number,full_name,email,phone,guests,check_in,check_out,nights,rooms_used,nightly_price,estimated_total,status,apartment)
      values ($1,$2,'Test','test@example.com','123456789',2,$3,$4,$4::date-$3::date,$5,1000,2000,$6,$7)`,
      [id, id, from, to, apartment === 'both' ? 2 : 1, status, apartment])
    return id
  }
  await add('upper', '2099-06-10', '2099-06-14')
  await assert.rejects(add('ground', '2099-06-12', '2099-06-15'), (error) => error.code === '23P01')
  await assert.rejects(add('both', '2099-06-10', '2099-06-14'), (error) => error.code === '23P01')
  await add('ground', '2099-06-14', '2099-06-16')
  const block = (apartment, from = '2099-06-20', to = '2099-06-22') =>
    ({ availability: [{ id: 'manual', apartment, from, to, status: 'unavailable' }] })
  await assert.rejects(db.query(`insert into public.site_content(id,content) values('main',$1)`, [block('ground','2099-06-11','2099-06-12')]), (error) => error.code === '23P01')
  await db.query(`insert into public.site_content(id,content) values('main',$1)`, [block('upper')])
  const pending = await add('upper','2099-06-20','2099-06-22','pending')
  await assert.rejects(db.query(`update public.reservation_requests set status='accepted' where id=$1`, [pending]), (error) => error.code === '23P01')
  await add('ground','2099-06-20','2099-06-22')
  await assert.rejects(add('both','2099-06-20','2099-06-22'), (error) => error.code === '23P01')
  await assert.rejects(db.query(`update public.site_content set content=$1 where id='main'`, [block('ground')]), (error) => error.code === '23P01')
  assert.equal((await db.query(`select content from public.site_content where id='main'`)).rows[0].content.availability[0].apartment,'upper')
  await db.query(`update public.site_content set content=$1 where id='main'`, [{ availability: [] }])
  await db.query(`update public.reservation_requests set status='accepted' where id=$1`, [pending])
  await db.exec(`update public.reservation_requests set status='cancelled' where reservation_number='LEGACY'`)
  await add('ground','2099-06-10','2099-06-14')
  await assert.rejects(db.query(`update public.reservation_requests set rooms_used=2 where id=$1`, [pending]), (error) => error.code === '23514')
  await db.exec(apartments)
  await db.exec(manual)
  // Minimal Supabase platform fixtures let the complete policy setup run in real PostgreSQL.
  await db.exec(`
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text);
    insert into auth.users values ('00000000-0000-4000-8000-000000000010','gerkapoolhouse@gmail.com');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key,name text,bucket_id text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,update,delete on storage.objects to anon,authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    create publication supabase_realtime;
  `)
  await db.exec(setup)
  await db.exec(`set role anon`)
  await assert.rejects(db.query(`select full_name from public.reservation_requests`), (error) => error.code === '42501')
  assert.ok((await db.query(`select id,check_in,check_out,status,apartment from public.reservation_requests`)).rows.every((row) => row.status === 'accepted'))
  await assert.rejects(db.query(`update public.site_content set content='{}' where id='main'`), (error) => error.code === '42501')
  const publicInquiry = await add('ground','2099-07-01','2099-07-03','pending')
  await assert.rejects(add('ground','2099-07-10','2099-07-12','accepted'), (error) => error.code === '42501')
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000020',false); set role authenticated;`)
  assert.equal((await db.query(`select full_name from public.reservation_requests`)).rows.length, 0)
  assert.equal((await db.query(`update public.reservation_requests set status='accepted' where id=$1 returning id`, [publicInquiry])).rows.length, 0)
  assert.equal((await db.query(`update public.site_content set content='{}' where id='main' returning id`)).rows.length, 0)
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000010',false); set role authenticated;`)
  assert.ok((await db.query(`select full_name from public.reservation_requests`)).rows.length > 0)
  assert.equal((await db.query(`update public.reservation_requests set status='accepted' where id=$1 returning id`, [publicInquiry])).rows.length, 1)
  await assert.rejects(db.query(`update public.reservation_requests set full_name='Changed' where id=$1`, [publicInquiry]), (error) => error.code === '42501')
  await db.exec(`reset role`)
  console.log('PostgreSQL checks passed: both migrations, full setup, legacy rows, independent calendars, overlap and manual-block guards, cancellation, repeatability, anonymous privacy and admin membership policies.')
} finally { await db.close() }
