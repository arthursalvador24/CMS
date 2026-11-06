// Uploads the sample images (Unsplash License) and a generated logo to the cms-media bucket.
// Run: node --env-file=.env.local scripts/seed-media.mjs
import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.CMS_DEMO_ADMIN_EMAIL;
const password = process.env.CMS_DEMO_ADMIN_PASSWORD;
if (!url || !key || !email || !password) throw new Error('Missing env; run with --env-file=.env.local');

const photos = {
  'seed/slide-1.jpg': '1600210492486-724fe5c67fb0',
  'seed/slide-2.jpg': '1600607687939-ce8a6c25118c',
  'seed/slide-3.jpg': '1617806118233-18e1de247200',
  'seed/post-1.jpg': '1631679706909-1844bbd07221',
  'seed/post-2.jpg': '1615874959474-d609969a20ed',
  'seed/post-3.jpg': '1507089947368-19c1da9775ae',
  'seed/post-4.jpg': '1502005229762-cf1b2da7c5d6',
};

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
if (signInError) throw signInError;

async function put(path, body, contentType) {
  const { error } = await supabase.storage.from('cms-media').upload(path, body, { contentType, upsert: true });
  if (error) throw new Error(`${path}: ${error.message}`);
  console.log('uploaded', path, `${Math.round(body.byteLength / 1024)} KB`);
}

for (const [path, id] of Object.entries(photos)) {
  const res = await fetch(`https://images.unsplash.com/photo-${id}?w=2400&q=80&fm=jpg`);
  if (!res.ok) throw new Error(`download ${id}: ${res.status}`);
  await put(path, new Uint8Array(await res.arrayBuffer()), 'image/jpeg');
}

// Logo: a filled monogram so it reads on light and dark templates.
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
await page.setContent(`<html><body style="margin:0;background:transparent">
<div style="width:512px;height:512px;border-radius:50%;background:#2F3E36;display:grid;place-items:center">
<span style="font:500 190px/1 Georgia,'Times New Roman',serif;color:#F3EBDD;letter-spacing:-6px">K<span style="font-style:italic;font-size:150px;color:#C9A66B">&amp;</span>V</span>
</div></body></html>`);
const logo = await page.screenshot({ omitBackground: true, type: 'png' });
await browser.close();
await put('seed/logo.png', logo, 'image/png');

await supabase.auth.signOut();
console.log('done');
