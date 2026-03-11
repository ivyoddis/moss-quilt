-- Creates storage bucket + uploads table + RLS policies for anonymous usage.
-- Note: Requires elevated privileges when applying migrations.

-- 1) Public storage bucket: moss-quilt
insert into storage.buckets (id, name, public)
values ('moss-quilt', 'moss-quilt', true)
on conflict (id) do update set public = true;

-- 2) Uploads table
create table if not exists public.uploads (
  id bigserial primary key,
  piece_id text not null,
  photo_url text not null,
  location_description text,
  city_state text,
  created_at timestamptz not null default now()
);

alter table public.uploads enable row level security;

-- Anonymous inserts + public reads on uploads table
drop policy if exists "public read uploads" on public.uploads;
create policy "public read uploads"
on public.uploads
for select
to anon, authenticated
using (true);

drop policy if exists "anon insert uploads" on public.uploads;
create policy "anon insert uploads"
on public.uploads
for insert
to anon, authenticated
with check (true);

-- 3) Storage policies for public reads + anon uploads in bucket moss-quilt
-- Public read objects in bucket
drop policy if exists "public read moss-quilt objects" on storage.objects;
create policy "public read moss-quilt objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'moss-quilt');

-- Allow anon to upload new objects into bucket
drop policy if exists "anon insert moss-quilt objects" on storage.objects;
create policy "anon insert moss-quilt objects"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'moss-quilt');

