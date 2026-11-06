# Contracts for parallel work

Read this before touching code. `docs/PLAN.md` says **what** to build; this file says **how the pieces fit** so several agents can work at once without breaking each other.

## Shared rules

- **One dev server** runs on http://localhost:3220 (started by the orchestrator). Never start, stop or restart another `next dev`, and never run `next build` (it fights the dev server over `.next`). Check your work with `npx tsc --noEmit`, `npx eslint <your files>`, `npm test`, and screenshots.
- **Never run `npm install`.** Everything needed is installed: `@supabase/supabase-js`, `@supabase/ssr`, `zod` (v4), Tiptap v3 (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` [includes Link and Underline], `@tiptap/extension-text-style` [TextStyle, FontFamily, FontSize, Color], `@tiptap/extension-text-align`, `@tiptap/extension-highlight`, `@tiptap/extension-image`), `sanitize-html`, `motion`, `lucide-react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `vitest`, `@playwright/test`. If something is truly missing, say so in your report instead of installing.
- **Never commit or push.** The orchestrator commits after each wave.
- **Only edit files you own** (see Ownership). If you need a change in someone else's file, put it in your report.
- **This is Next.js 16.4.5 with `cacheComponents: true`.** Read `node_modules/next/dist/docs/` before using an API you are unsure of. Key rules:
  - Request-time reads (`cookies()`, the admin session, `searchParams`) must sit inside a `<Suspense>` boundary, or the page sets `export const instant = false`.
  - Public data comes from `lib/cms/read.ts`, which uses `'use cache'` + `cacheTag("cms")`. Server actions call `updateTag(CMS_TAG)` after every successful write.
  - The route guard is `proxy.ts` (not `middleware.ts`).
  - A client-only `page.tsx` needs `export const instant = false`.
- **No em dashes (U+2014) in any visible text.** Rewrite the sentence instead.
- **Screenshots:** `npm run shot -- <route> [--w=1440,390] [--name=x] [--out=.shots/<you>] [--admin] [--reduced]`. Look at the PNGs with your image viewer. Use your own `--out` folder.
- **Demo admin:** `CMS_DEMO_ADMIN_EMAIL` / `CMS_DEMO_ADMIN_PASSWORD` in `.env.local`. Supabase project: CMSDB `ptftqwrzofadosnxzwek`. The Supabase MCP tools work on it. Do not change the schema without saying so in your report.

## Ownership

| Area | Owner |
|---|---|
| `lib/supabase/*`, `lib/cms/{types,read,media,upload,action-result,editor-fonts}.ts`, `lib/auth/require-admin.ts`, `app/layout.tsx`, `app/fonts.ts`, `next.config.ts`, `package.json` | orchestrator (ask, don't edit) |
| `proxy.ts`, `app/admin/login/**`, `lib/auth/actions.ts`, `scripts/admin-create.mjs`, `lib/cms/admin-read.ts`, `lib/cms/actions/{site,slides,template}.ts`, `lib/cms/schemas.ts`, `supabase/migrations/**` | backend agent (steps 3, 4) |
| `components/editor/**`, `lib/cms/sanitize.ts`, `lib/cms/actions/posts.ts`, `lib/cms/admin-posts.ts` | editor agent (step 5) |
| `lib/templates/**`, `lib/cms/fixtures.ts`, `app/(site)/**`, `app/preview/**`, `app/dev/**`, first plain version of `templates/*/**` | template-system agent (step 6) |
| `templates/meridian/**`, `templates/folio/**`, `templates/onyx/**` (after step 6) | one design agent per template (steps 7 to 10) |
| `app/admin/**` except `login`, `components/admin/**` | admin design agent (steps 11 to 13) |
| `tests/unit/**` | whoever owns the code under test (name files after your area) |

## Data

Types: `lib/cms/types.ts`. Public reads: `lib/cms/read.ts` (`getSite`, `getActiveSlides`, `getLatestPosts`, `getPublishedPosts(page, perPage)`, `getPublishedPost(slug)`, `getSiteData`). Image URLs: `mediaUrl(path)` in `lib/cms/media.ts` (bucket `cms-media`, public). Uploads: `uploadImage(supabase, file, folder)` / `removeImage` in `lib/cms/upload.ts` (checks real file bytes, PNG/JPG/WebP, 5 MB, random names; `seed/` files are never deleted). Action results: `ActionResult` in `lib/cms/action-result.ts`.

Admin auth: `lib/auth/require-admin.ts`:
- `requireAdmin()` for pages (redirects to `/admin/login`).
- `assertAdmin()` for server actions (throws). **Every admin server action calls `assertAdmin()` first**, then uses `createClient()` from `lib/supabase/server.ts` so the database rules apply too.

Tables (CMSDB): `site_settings` (single row, id = 1), `carousel_slides`, `posts` (`content_json` may be null: then the editor loads from `content_html`), `admins`. Rules: the public reads settings, active slides and published posts; admins write. `private.is_admin()` backs the rules.

Login form contract (used by `scripts/shot.mjs --admin` and the e2e tests): `/admin/login` has `input[name="email"]`, `input[name="password"]` and a `button[type="submit"]`. A successful sign-in leaves `/admin/login`.

## Templates

- Registry: `lib/templates/registry.ts` maps `TemplateKey` to a `TemplateModule` (`lib/cms/types.ts`): `{ key, name, description, Home, BlogIndex, BlogPost }`.
- Each template lives only in `templates/<key>/` (entry `templates/<key>/index.ts`). **No imports between template folders, and no shared UI components.** A template may import from `lib/cms/*` and `lib/templates/*` helpers only.
- Every internal link uses the `basePath` prop: `${basePath}/blog`, `${basePath}/blog/${slug}`, `${basePath}/` for home. `basePath` is `""` on the live site, `/preview/<key>` in admin previews, `/dev/<key>` on fixture pages.
- Scope template CSS under a root class `tpl-<key>` on the template's outermost element. Load template fonts with `next/font` inside the template folder. The three templates must look clearly different from each other.
- Routes: `/`, `/blog`, `/blog/[slug]` (active template); `/preview/[template]`, `/preview/[template]/blog`, `/preview/[template]/blog/[slug]` (admins only); `/dev/[template]?case=full|empty|six|long` (fixture data, 404 in production) for testing edge cases without touching the database.
- Landing page sections: header (logo, company name, nav: Home, About, Blog, Contact), hero carousel, About (`id="about"`), Mission and Vision, latest 3 posts, contact block (`id="contact"`) and footer with company details and social links. Sections with no content hide themselves. No slides: a still hero from company name and tagline. Slide buttons only show when both label and link are set.

## Editor output (what post HTML can contain)

Rendered inside `<div className="cms-content">`. Templates style these descendants:

- Blocks: `p`, `h2`, `h3`, `h4`, `ul`, `ol`, `li` (Tiptap wraps list text in `p`), `blockquote` (contains `p`), `hr`, `img`.
- Inline: `strong`, `em`, `u`, `s`, `a[href]` (http, https, mailto only; opens normally), `mark` (highlight; may carry `style="background-color: #hex"`), `span` with `style` limited to `font-family`, `font-size`, `color`.
- `font-family` values come from `EDITOR_FONTS` in `lib/cms/editor-fonts.ts` (CSS variables defined on `<html>` by `app/fonts.ts`). `font-size` values come from `EDITOR_FONT_SIZES`. `color` is a hex value.
- Blocks may carry `style="text-align: left|center|right|justify"`.
- `img` has `src` (cms-media URL), `alt`, and `data-size="small|medium|full"`. Small is about a third of the text column, medium about two thirds, full is the whole column. Centered.
