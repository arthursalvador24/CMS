-- Uploads: 4 MB, to stay under the ~4.5 MB request limit of serverless hosts.
update storage.buckets set file_size_limit = 4194304 where id = 'cms-media';

-- Defense in depth: table privileges now match what the row-level security policies allow,
-- so a future permissive policy can't open writes by accident.
revoke insert, update, delete, truncate, references, trigger
  on public.site_settings, public.carousel_slides, public.posts, public.admins from anon;
revoke select on public.admins from anon;

-- Signed-in users: admins table is read-only (own row); site_settings is update-only (single row).
revoke insert, update, delete, truncate, references, trigger on public.admins from authenticated;
revoke insert, delete, truncate, references, trigger on public.site_settings from authenticated;
revoke truncate, references, trigger on public.carousel_slides, public.posts from authenticated;
