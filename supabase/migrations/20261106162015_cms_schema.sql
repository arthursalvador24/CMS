-- Simple CMS schema: one site, carousel slides, blog posts, admins, media bucket.

create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Admins: rows are managed with SQL or the secret key, never from the app.
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Lives in the private schema so it is not exposed through the API.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- One row only (id = 1).
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  company_name text not null default '' check (char_length(company_name) <= 120),
  tagline text not null default '' check (char_length(tagline) <= 200),
  email text not null default '' check (char_length(email) <= 200),
  phone text not null default '' check (char_length(phone) <= 60),
  address text not null default '' check (char_length(address) <= 400),
  socials jsonb not null default '{}'::jsonb check (jsonb_typeof(socials) = 'object'),
  logo_path text check (char_length(logo_path) <= 300),
  about text not null default '' check (char_length(about) <= 5000),
  mission text not null default '' check (char_length(mission) <= 2000),
  vision text not null default '' check (char_length(vision) <= 2000),
  active_template text not null default 'meridian'
    check (active_template in ('meridian', 'folio', 'onyx')),
  updated_at timestamptz not null default now()
);

create table public.carousel_slides (
  id uuid primary key default gen_random_uuid(),
  image_path text not null check (char_length(image_path) <= 300),
  heading text not null default '' check (char_length(heading) <= 140),
  caption text not null default '' check (char_length(caption) <= 300),
  cta_label text not null default '' check (char_length(cta_label) <= 40),
  cta_url text not null default '' check (char_length(cta_url) <= 500),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index carousel_slides_order_idx on public.carousel_slides (sort_order);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled post' check (char_length(title) between 1 and 200),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  excerpt text not null default '' check (char_length(excerpt) <= 400),
  cover_image_path text check (char_length(cover_image_path) <= 300),
  content_json jsonb,
  content_html text not null default '' check (char_length(content_html) <= 500000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_status_published_idx on public.posts (status, published_at desc);
create index posts_author_idx on public.posts (author_id);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function private.set_updated_at();
create trigger carousel_slides_updated_at before update on public.carousel_slides
  for each row execute function private.set_updated_at();
create trigger posts_updated_at before update on public.posts
  for each row execute function private.set_updated_at();

-- Row-level security
alter table public.admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.carousel_slides enable row level security;
alter table public.posts enable row level security;

-- admins: a signed-in user can only see their own row (used to check admin status).
create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- site_settings: anyone reads; admins update. No insert/delete (single seeded row).
create policy "site settings public read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site settings admin update" on public.site_settings
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- carousel_slides: anyone reads active slides; admins read and write all.
create policy "slides read" on public.carousel_slides
  for select to anon, authenticated using (is_active or (select private.is_admin()));
create policy "slides admin insert" on public.carousel_slides
  for insert to authenticated with check ((select private.is_admin()));
create policy "slides admin update" on public.carousel_slides
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "slides admin delete" on public.carousel_slides
  for delete to authenticated using ((select private.is_admin()));

-- posts: anyone reads published posts; admins read and write all.
create policy "posts read" on public.posts
  for select to anon, authenticated using (status = 'published' or (select private.is_admin()));
create policy "posts admin insert" on public.posts
  for insert to authenticated with check ((select private.is_admin()));
create policy "posts admin update" on public.posts
  for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "posts admin delete" on public.posts
  for delete to authenticated using ((select private.is_admin()));

-- Media bucket: public URLs for reading; only admins can list, upload, change or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-media', 'cms-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']);

create policy "cms-media admin select" on storage.objects
  for select to authenticated
  using (bucket_id = 'cms-media' and (select private.is_admin()));
create policy "cms-media admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cms-media' and (select private.is_admin()));
create policy "cms-media admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'cms-media' and (select private.is_admin()))
  with check (bucket_id = 'cms-media' and (select private.is_admin()));
create policy "cms-media admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cms-media' and (select private.is_admin()));
