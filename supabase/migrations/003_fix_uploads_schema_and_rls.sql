-- Ensure uploads schema + RLS allow anonymous inserts/selects/updates.

-- Columns required by the app:
-- id, piece_id, photo_url, location_description, city_state, created_at

alter table if exists public.uploads
  add column if not exists location_description text,
  add column if not exists city_state text;

alter table public.uploads enable row level security;

-- Drop any older policies (names may differ across environments)
do $$
declare
  pol record;
begin
  for pol in
    select polname
    from pg_policies
    where schemaname = 'public' and tablename = 'uploads'
  loop
    execute format('drop policy if exists %I on public.uploads', pol.polname);
  end loop;
end $$;

-- Public read + anon insert/update
create policy "public read uploads"
on public.uploads
for select
to anon, authenticated
using (true);

create policy "anon insert uploads"
on public.uploads
for insert
to anon, authenticated
with check (true);

create policy "anon update uploads"
on public.uploads
for update
to anon, authenticated
using (true)
with check (true);

