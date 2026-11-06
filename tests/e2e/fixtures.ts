import { test as base, expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export { expect };

/** Unique per run, so titles, headings and slugs never collide with an earlier run. */
export const STAMP = Date.now().toString(36);

/** site_settings values from supabase/migrations/*_cms_seed.sql. */
export const SEED = {
  company_name: "Kestrel & Vale",
  tagline: "Interiors designed around the way you actually live.",
  email: "hello@kestrelvale.example",
  phone: "+63 2 8123 4567",
  address: "118 Alder Lane, Poblacion, Makati City, Metro Manila",
  socials: {
    instagram: "https://instagram.com/kestrelandvale",
    facebook: "https://facebook.com/kestrelandvale",
    linkedin: "https://linkedin.com/company/kestrelandvale",
  },
  logo_path: "seed/logo.png",
  about:
    "Kestrel & Vale is a small interior design studio founded in 2016 by two friends who kept being asked the same question: how do you make a home feel finished without making it feel staged?\n\nWe design homes, apartments and small workplaces from the first floor plan to the last lamp. Every project starts with how you spend an ordinary Tuesday, then we shape light, storage, materials and furniture around it.\n\nToday we are a team of nine designers, makers and project leads, working with local carpenters, upholsterers and stone workshops we have known for years.",
  mission:
    "To design rooms that make everyday life easier and calmer, using honest materials, local craft and budgets we are open about from day one.",
  vision: "A city where good design is not a luxury, and where every home, however small, is built to be lived in well for decades.",
  active_template: "meridian",
};
const SEED_SLIDES = ["seed/slide-1.jpg", "seed/slide-2.jpg", "seed/slide-3.jpg"];

/** Signs in through the login form (contract in docs/CONTRACTS.md). */
export async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', process.env.CMS_DEMO_ADMIN_EMAIL!);
  await page.fill('input[name="password"]', process.env.CMS_DEMO_ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"));
}

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

/** `test` with an admin session. One sign-in per worker, since Supabase rate-limits sign-ins per IP. */
export const test = base.extend<object, { adminState: StorageState }>({
  adminState: [
    // Fixture callbacks are named `provide`, not `use`, so the React hooks lint rule leaves them alone.
    async ({ browser }, provide, workerInfo) => {
      const page = await browser.newPage({ baseURL: workerInfo.project.use.baseURL });
      await signIn(page);
      const state = await page.context().storageState();
      await page.close();
      await provide(state);
    },
    { scope: "worker" },
  ],
  storageState: ({ adminState }, provide) => provide(adminState),
});

/** A real PNG of one flat color, made by screenshotting a div. */
export async function png(page: Page, width: number, height: number, color: string) {
  const scratch = await page.context().newPage();
  await scratch.setContent(`<div style="width:${width}px;height:${height}px;background:${color}"></div>`);
  const buffer = await scratch.locator("div").screenshot();
  await scratch.close();
  return { name: "e2e.png", mimeType: "image/png", buffer };
}

export async function saveForm(page: Page) {
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved. The live site is updated.")).toBeVisible();
}

/** Public page HTML, refetched until `check` passes: a page fetched in the same instant as a save can be stale once. */
export async function expectPublic(request: APIRequestContext, path: string, check: (html: string) => void) {
  await expect(async () => check(await (await request.get(path)).text())).toPass({ timeout: 15_000 });
}

/** Opens a public page in a new tab, reloading until `ready` is in the page (same staleness as above). */
export async function openPublic(page: Page, path: string, ready: string) {
  const site = await page.context().newPage();
  await expect(async () => {
    await site.goto(path);
    await expect(site.locator(ready).first()).toBeAttached({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  return site;
}

/* ---------- seed reset (supabase-js as the demo admin; RLS allows admin writes) ---------- */

let db: Promise<SupabaseClient> | undefined;
function adminDb() {
  db ??= (async () => {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.signInWithPassword({
      email: process.env.CMS_DEMO_ADMIN_EMAIL!,
      password: process.env.CMS_DEMO_ADMIN_PASSWORD!,
    });
    if (error) throw error;
    return client;
  })();
  return db;
}

function must<T>({ data, error }: { data: T; error: unknown }) {
  if (error) throw error;
  return data as NonNullable<T>;
}

const INLINE_IMAGE = /cms-media\/(inline\/[\w-]+\.(?:png|jpg|webp))/g;
type PostFiles = { cover_image_path: string | null; content_html: string };

/**
 * Puts CMSDB back to the seed: settings and logo, the three seed slides in order 1, 2, 3 and shown,
 * no e2e-* posts (plus `postIds`), and removes the storage files of whatever it deletes. seed/ files are kept.
 * It writes the database directly, so the public cache can show old values for up to a minute
 * (cacheLife "minutes"); the specs restore through the admin UI first, which refreshes it.
 */
export async function resetSeed(postIds: string[] = []) {
  const client = await adminDb();
  const files: (string | null)[] = [];

  files.push(must(await client.from("site_settings").select("logo_path").eq("id", 1).single()).logo_path);
  must(await client.from("site_settings").update(SEED).eq("id", 1));

  for (const slide of must(await client.from("carousel_slides").select("id, image_path"))) {
    const order = SEED_SLIDES.indexOf(slide.image_path) + 1;
    if (order) must(await client.from("carousel_slides").update({ sort_order: order, is_active: true }).eq("id", slide.id));
    else {
      must(await client.from("carousel_slides").delete().eq("id", slide.id));
      files.push(slide.image_path);
    }
  }

  const posts: PostFiles[] = must(await client.from("posts").delete().like("slug", "e2e-%").select("cover_image_path, content_html"));
  if (postIds.length) posts.push(...must(await client.from("posts").delete().in("id", postIds).select("cover_image_path, content_html")));
  for (const post of posts) files.push(post.cover_image_path, ...[...post.content_html.matchAll(INLINE_IMAGE)].map((m) => m[1]));

  const stale = files.filter((path): path is string => Boolean(path) && !path!.startsWith("seed/"));
  if (stale.length) must(await client.storage.from("cms-media").remove(stale));
}
