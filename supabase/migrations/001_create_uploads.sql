-- Moss Quilt: uploads table for photo metadata
-- Run this in Supabase SQL Editor if you don't use Supabase CLI migrations.
-- Storage bucket 'moss-quilt' must exist (create in Dashboard > Storage if needed).

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null,
  photo_url text not null,
  location text,
  date date,
  time time,
  song text,
  created_at timestamptz default now()
);

-- Allow anonymous read/insert for public uploads (adjust RLS as needed for your auth)
alter table public.uploads enable row level security;

create policy "Allow public read"
  on public.uploads for select
  using (true);

create policy "Allow public insert"
  on public.uploads for insert
  with check (true);

-- Optional: prevent duplicate uploads per piece (one photo per piece forever)
create unique index if not exists uploads_piece_id_key on public.uploads (piece_id);
