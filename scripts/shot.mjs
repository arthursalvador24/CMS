// Screenshots a route on the shared dev server (http://localhost:3220).
// Usage: npm run shot -- <route> [--w=1440,390] [--out=.shots] [--name=home] [--admin] [--reduced] [--viewport-only]
// --admin signs in through /admin/login with CMS_DEMO_ADMIN_EMAIL / CMS_DEMO_ADMIN_PASSWORD first.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const route = args.find((a) => !a.startsWith("--")) ?? "/";
const opt = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const flag = (name) => args.includes(`--${name}`);
const widths = opt("w", "1440,390").split(",").map(Number);
const out = opt("out", ".shots");
const name = opt("name", route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home");
const base = process.env.SHOT_BASE ?? "http://localhost:3220";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    reducedMotion: flag("reduced") ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  if (flag("admin")) {
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name="email"]', process.env.CMS_DEMO_ADMIN_EMAIL ?? "");
    await page.fill('input[name="password"]', process.env.CMS_DEMO_ADMIN_PASSWORD ?? "");
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.pathname.startsWith("/admin/login"), { timeout: 20000 });
  }
  await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  const file = `${out}/${name}-${width}.png`;
  await page.screenshot({ path: file, fullPage: !flag("viewport-only") });
  console.log(file);
  await context.close();
}
await browser.close();
