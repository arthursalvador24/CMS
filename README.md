# Simple CMS

A small CMS for one company website. The admin signs in, edits the company details, logo, About, Mission, Vision, the homepage carousel and blog posts, and picks one of three website templates. The public site shows that content in the chosen template.

- **Templates:** Meridian (light, corporate), Folio (warm, editorial), Onyx (dark, bold). Each lives in its own folder under `templates/`.
- **Blog editor:** fonts, sizes, bold, italic, underline, strikethrough, headings, text color, highlight, alignment, lists, quotes, links and images. Post HTML is sanitized on save and on read.
- **Stack:** Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS v4, TypeScript, Tiptap v3, Supabase (Postgres, Auth, Storage).

## Setup

1. Install: `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase dashboard > Project Settings > API Keys.
   - `SUPABASE_SECRET_KEY`: server-only, used only by `npm run admin:create`. Never commit it.
   - `CMS_DEMO_ADMIN_EMAIL` / `CMS_DEMO_ADMIN_PASSWORD`: optional, used by screenshots and end-to-end tests.
3. Database: apply the SQL files in `supabase/migrations/` in order (schema, sample content, hardening). They create the tables, row-level security, the `cms-media` image bucket and the "Kestrel & Vale" sample content.
4. Sample images: `npm run seed:media` (signs in as the demo admin and uploads the photos and logo).
5. Create your admin login: `npm run admin:create -- you@example.com` (prints a password once, or pass `--password=...`).
6. Run: `npm run dev` and open http://localhost:3220. The admin is at http://localhost:3220/admin.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3220 |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright; uses the demo admin and restores the sample content afterwards) |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run shot -- <route> [--admin] [--w=1440,390]` | Screenshots of a page into `.shots/` |
| `npm run admin:create -- <email>` | Create or promote an admin |
| `npm run seed:media` | Upload the sample images |

## Project map

- `app/(site)`: public pages (`/`, `/blog`, `/blog/[slug]`), rendered with the active template.
- `app/admin`: sign-in and the admin panel (dashboard, company, about and mission, carousel, blog, template).
- `app/preview/[template]`: admin-only previews of any template with live content.
- `app/dev/[template]`: fixture pages for template work (404 in production).
- `templates/<name>`: one folder per template; no shared components between them.
- `lib/cms`: types, cached public reads, admin reads, server actions, upload and sanitize helpers.
- `components/admin`, `components/editor`: admin UI and the rich-text editor.
- `proxy.ts`: first gate for `/admin` and `/preview` (pages and actions re-check admin access).
- `docs/PLAN.md`: the build plan. `docs/CONTRACTS.md`: how the pieces fit. `docs/SOURCES.md`: image credits.

## Before going live

- Supabase Auth: turn off "Allow new users to sign up", turn on leaked-password protection, and set a minimum password length.
- Create your real admin with `npm run admin:create`, then delete the demo admin user.
- Replace the sample "Kestrel & Vale" content with the real company's details, images and posts.
- Uploads are capped at 4 MB to fit serverless request limits (Vercel's is about 4.5 MB).
