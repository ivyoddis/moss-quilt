-- Wipe all uploads so the quilt starts fresh.
-- Run this once. To also clear stored images, empty the storage bucket
-- "moss-quilt" in Supabase Dashboard: Storage > moss-quilt > select all files > Delete.

TRUNCATE TABLE public.uploads RESTART IDENTITY;
