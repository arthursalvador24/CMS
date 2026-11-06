# Simple CMS: build plan

**Date:** 2026-11-06
**Folder:** `LGF Projects/simple-cms`
**Goal:** a small CMS for one company website. The admin signs in, edits the company details, logo, About, Mission, Vision, the homepage carousel and blog posts, and picks one of three website templates. The public site shows that content in the chosen template.

**Stack:** Next.js 16.4.5, React 19, Tailwind v4, TypeScript (same as `appointment-templates` and `inventory-templates`). Supabase project **CMSDB** (`ptftqwrzofadosnxzwek`, ap-southeast-1) for the database, admin sign-in and image storage. Rich text: Tiptap.
**CMSDB today:** empty (no public tables, no storage buckets).

## What the admin can edit (nothing else for now)

- Company details: name, tagline, email, phone, address, social links (Facebook, Instagram, LinkedIn, X, YouTube, TikTok)
- Logo (image upload)
- About, Mission, Vision (plain text with paragraphs)
- Homepage carousel: slides with image, heading, caption, optional button label and link, order, show/hide
- Blog posts: title, slug, cover image, excerpt, rich-text body (fonts, sizes, styles, colors, images), draft or published
- Active template: one of three

Not in this plan: custom pages or a page builder, menu editing, more than one website, admin roles beyond "admin", comments, newsletter, an SEO settings screen, custom domains, analytics.

## The three templates

Working directions; the design steps finalize the look.

| Key | Name | Direction |
|---|---|---|
| `meridian` | Meridian | Light, clean corporate. Full-width image carousel hero, crisp sans type, structured sections. |
| `folio` | Folio | Warm editorial. Serif headlines, story-led About, blog-forward layout. |
| `onyx` | Onyx | Dark and bold. Full-bleed imagery, high contrast, confident motion. |

Every template renders the same data on the same routes: `/` (landing page), `/blog`, `/blog/[slug]`. Each template lives in its own folder `templates/<key>/` and shares no components with the others. The three must look clearly different from each other.

Landing page sections (all templates): header with logo, company name and nav; hero carousel; About; Mission and Vision; latest 3 posts; contact block and footer with company details and social links. Sections with no content hide themselves (no slides: a still hero built from the company name and tagline; no posts: no blog section).

## Data model (CMSDB)

- `site_settings` (one row): company_name, tagline, email, phone, address, socials (jsonb), logo_path, about, mission, vision, active_template (`meridian` | `folio` | `onyx`), updated_at
- `carousel_slides`: id, image_path, heading, caption, cta_label, cta_url, sort_order, is_active, timestamps
- `posts`: id, title, slug (unique), excerpt, cover_image_path, content_json (Tiptap JSON), content_html (sanitized on save), status (`draft` | `published`), published_at, author_id, timestamps
- `admins`: user_id (references auth.users)
- Storage bucket `cms-media`: public read; upload and delete for admins only; PNG, JPG, WebP up to 5 MB (no SVG, since SVG files can carry scripts)
- Row-level security on every table: anyone can read site settings, active slides and published posts; only admins can write. An `is_admin()` security-definer helper backs the policies.

## Rules for every step

- Keys live in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). The secret key is server-only and used only by scripts. Never commit keys.
- Auth checks use `supabase.auth.getClaims()`. Next 16 uses `proxy.ts` (not `middleware.ts`) for the `/admin` guard.
- Next 16.4 dev: a client-only `page.tsx` needs `export const instant = false`.
- No em dashes in visible UI text.
- Seed content: "Kestrel & Vale", a fictional interior design studio. Images are royalty-free, with sources listed in `docs/SOURCES.md`.
- Dev server port 3220.
- `git init` in step 1; commit only when the user says yes.

---

## Step 1: Scaffold the app

Create the Next.js 16.4.5 + React 19 + Tailwind v4 + TypeScript app in `simple-cms` (keep `docs/`). Add `@supabase/supabase-js` and `@supabase/ssr` with browser and server clients in `lib/supabase/`, `.env.local` pointing at CMSDB, and `.env.example` without values. Create the folders `app/(site)`, `app/admin`, `templates/meridian`, `templates/folio`, `templates/onyx`, `lib/cms`. Run `git init`; no commit without a yes.

Acceptance: `npm run dev` serves a placeholder page on port 3220; `npx tsc --noEmit` and `npm run lint` pass; a server-side query to CMSDB succeeds.

## Step 2: Database schema, storage and security on CMSDB

Create migrations in `supabase/migrations/` and apply them to CMSDB: the four tables, `is_admin()`, row-level security policies, the `cms-media` bucket with its policies (PNG, JPG, WebP, 5 MB), an `updated_at` trigger, and seed data (one site_settings row with Kestrel & Vale content, 3 carousel slides, 3 published posts, 1 draft).

Acceptance: the public key can read settings, active slides and published posts, but cannot read drafts or write anything; an admin can write every table and upload to cms-media; Supabase security advisors show no errors.

Out of scope: multi-site tables, roles beyond admin.

## Step 3: Admin sign-in

Add email and password sign-in at `/admin/login` with Supabase Auth, plus sign-out. A `proxy.ts` guard uses `getClaims()` and sends anyone who is not in `admins` from `/admin/*` to the login page. Public sign-up stays off. Add `npm run admin:create -- <email>` (uses the server-only secret key) to create or promote an admin.

Acceptance: a signed-in non-admin is refused at /admin; an admin reaches /admin; a wrong password shows a clear error.

Out of scope: password reset email, social login, 2FA.

## Step 4: Content data layer and saving

Add `lib/cms/`: typed reads (site, active slides, published posts, post by slug, plus admin reads that include drafts) and zod-validated server actions that re-check admin on the server, for company details, logo, about, mission, vision, carousel slides (create, edit, reorder, show/hide, delete) and the active template. Add an image upload helper for cms-media (PNG, JPG, WebP, 5 MB, random file names, old file removed on replace). Public pages refresh after each save.

Acceptance: unit tests cover validation and the admin re-check; a save shows on the public site on the next load; non-admin calls to any action fail.

## Step 5: Blog rich-text editor

Add a Tiptap editor component and the post actions behind it. Editor features: font family (template default plus 6 curated web fonts: Inter, DM Sans, Lora, Playfair Display, Merriweather, JetBrains Mono), font size 12 to 48 px, bold, italic, underline, strikethrough, headings H2 to H4, text color, highlight, alignment, bulleted and numbered lists, quote, link, horizontal rule, undo and redo, image upload with alt text and small, medium or full width. Posts save Tiptap JSON plus server-sanitized HTML (allowlist of exactly what the editor produces). Post actions: create, update, autosave draft, publish and unpublish, delete, unique slug from the title (editable), cover image, excerpt.

Acceptance: a round-trip test keeps every format from JSON to saved HTML; script tags, on* handlers and javascript: links are stripped; a published post appears on /blog.

Out of scope: scheduled posts, categories, tags, revision history, comments.

## Step 6: Template system and public routes

Add one `SiteData` type and a template registry. Each template (meridian, folio, onyx, each in its own `templates/<key>` folder with no shared components) exports `Home`, `BlogIndex` and `BlogPost`. `/`, `/blog` and `/blog/[slug]` render the template stored in `site_settings.active_template`. Admin-only `/preview/[template]` routes (with their blog pages) show any template with live content. Each template starts with a plain working version of every section, so the design steps restyle instead of rewiring.

Acceptance: changing active_template switches the live site; unknown slugs return 404; preview routes refuse non-admins.

## Step 7: Meridian landing page

Design and build the Meridian landing page in `templates/meridian`, with content from CMSDB through `lib/cms`. Light, clean corporate look with crisp sans type. Header with logo, company name and nav (Home, About, Blog, Contact); full-width image carousel hero from carousel_slides (heading, caption, optional button); About; Mission and Vision side by side; latest 3 blog posts; contact block and footer with address, phone, email and social links. Empty sections hide themselves (no slides: a still hero from the company name and tagline).

Acceptance: every section renders at 1440 and 390 px with seed data and with a near-empty site row, including a long company name and 1 or 6 slides; one signature interaction that fits the page, with a calm reduced-motion version; the contact action stays clear.

## Step 8: Folio landing page

Design and build the Folio landing page in `templates/folio`, with content from CMSDB through `lib/cms`. Warm editorial look: serif headlines, warm paper tones, a story-led About with a large pull quote, Mission and Vision as an editorial spread, a blog-forward section (one featured post plus two), and the carousel as a quieter framed slideshow with captions. Header with logo, company name and nav; contact block and footer with company details and social links. Empty sections hide themselves.

Acceptance: every section renders at 1440 and 390 px with seed data and with a near-empty site row, including a long company name and 1 or 6 slides; one signature interaction that fits the page, with a calm reduced-motion version; the contact action stays clear.

## Step 9: Onyx landing page

Design and build the Onyx landing page in `templates/onyx`, with content from CMSDB through `lib/cms`. Dark, bold, high-contrast look: full-bleed carousel with large type over the images, Mission and Vision as big statements, About with strong imagery, latest posts as image-led cards, and a strong footer with company details and social links. Header with logo, company name and nav. Empty sections hide themselves.

Acceptance: every section renders at 1440 and 390 px with seed data and with a near-empty site row, including a long company name and 1 or 6 slides; one signature interaction that fits the page, with a calm reduced-motion version; the contact action stays clear.

## Step 10: Blog pages for all three templates

Design and build the blog index and blog post pages for Meridian, Folio and Onyx, each in its own template folder and matching that template's landing page. The post page shows the editor's saved HTML faithfully (the 6 editor fonts, sizes 12 to 48 px, colors, highlight, alignment, headings, lists, quotes, links, images at small, medium or full width) inside the template frame, with cover image, date, reading time and previous and next links. The index shows cover, title, excerpt and date, 9 posts per page.

Acceptance: a post using every editor feature reads correctly in all three templates at 1440 and 390 px; the index paginates at 9 posts; images cause no layout shift.

## Step 11: Admin panel for company content

Design and build the admin panel under `/admin`, wired to the `lib/cms` server actions. A calm, clear shell (sidebar: Dashboard, Company, About & Mission, Carousel, Blog, Template; sign-out) and a dashboard with quick links and the active template. Company screen: name, tagline, email, phone, address, social links, logo upload with preview. About, Mission and Vision editor. Carousel manager: add, edit, drag to reorder, show or hide, delete slides (image, heading, caption, button label and link). Every form shows saving, saved and error states and warns before leaving with unsaved changes. Works on desktop and phone.

Acceptance: each screen saves and the public site shows the change on reload; slide order persists; every screen works at 1440 and 390 px.

Out of scope: menus, custom pages, extra admin roles.

## Step 12: Admin blog screens

Design and build the admin blog screens using the step 5 editor. Post list with search, a draft/published filter, status, date and quick actions. Post editor page with a clear toolbar (font family, font size, bold, italic, underline, strikethrough, headings, text color, highlight, alignment, lists, quote, link, image upload), title, slug, excerpt, cover image, autosave status, a preview in the active template, and publish and unpublish. The toolbar works on a phone (wraps or scrolls, never clips).

Acceptance: a post can be written, formatted, given an image and published entirely from the UI, and it appears on /blog; drafts never show publicly; the editor works at 1440 and 390 px.

## Step 13: Template picker

Design and build the admin Template screen: three cards (Meridian, Folio, Onyx), each with a live preview of the site using the company's own content (an iframe of `/preview/<key>`), a short description, a desktop/phone toggle, a full-screen preview, and a "Use this template" button with a confirm step. The active template is clearly marked. Switching updates `site_settings.active_template` and the live site.

Acceptance: picking a template changes the public site on reload; previews show the real CMSDB content; the screen works at 1440 and 390 px, with a calm reduced-motion version of any transition.

## Step 14: End-to-end tests

Add Playwright tests for the admin flows: sign in, edit company details and logo, edit About, Mission and Vision, manage carousel slides, write and publish a formatted post with an image, switch templates, and check each change on the public site.

## Step 15: Final review before going live

Review the whole app before it goes live: row-level security and storage policies, the admin guard, HTML sanitizing, upload limits, error handling and leftover debug code.

---

## Open items (built on the defaults above; change any time)

1. One website for one company. A CMS that serves many client websites is a bigger build (sites table, per-site admins, domains).
2. About, Mission and Vision are plain text with paragraphs, not rich text.
3. The first admin's email: run `npm run admin:create -- <email>` after step 3.
4. No password-reset email yet (Supabase can add it later).
5. "Landing page for the websites and templates" is read as each template's home page, not a separate marketing page for the CMS itself.
6. Going live: later, on the personal Vercel account (`arthur-9650`) like the sister apps.
