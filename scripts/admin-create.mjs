// Creates a CMS admin, or promotes an existing user to admin.
// Usage: npm run admin:create -- <email> [--password=<pw>]
// New users are created with a confirmed email. Without --password a random one is printed once.
// For an existing user, --password replaces their password; without it the password is left alone.
// Needs SUPABASE_SECRET_KEY in .env.local (server-only; never ship it to the browser).
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const USAGE = "Usage: npm run admin:create -- <email> [--password=<pw>]";

function exit(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
const passwordArg = args.find((a) => a.startsWith("--password="))?.slice("--password=".length);
const unknown = args.filter((a) => a.startsWith("--") && !a.startsWith("--password="));

if (unknown.length) exit(`Unknown option: ${unknown.join(" ")}\n${USAGE}`);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) exit(`Give a valid email address.\n${USAGE}`);
if (passwordArg !== undefined && passwordArg.length < 8) exit("The password needs at least 8 characters.");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url) exit("NEXT_PUBLIC_SUPABASE_URL is missing from .env.local.");
if (!secretKey) {
  exit(
    "SUPABASE_SECRET_KEY is empty in .env.local.\n" +
      "Copy the secret key from Supabase (Project Settings > API Keys), paste it into .env.local, then run this again.",
  );
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser(address) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) exit(`Could not list users: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === address);
    if (match || data.users.length < 1000) return match ?? null;
  }
}

let user = await findUser(email);
let shownPassword = null;

if (!user) {
  const password = passwordArg ?? randomBytes(18).toString("base64url");
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) exit(`Could not create the user: ${error.message}`);
  user = data.user;
  if (!passwordArg) shownPassword = password;
  console.log(`Created user ${email}.`);
} else {
  console.log(`Found existing user ${email}.`);
  if (passwordArg) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: passwordArg });
    if (error) exit(`Could not set the password: ${error.message}`);
    console.log("Password updated.");
  }
}

const { error: adminError } = await supabase
  .from("admins")
  .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
if (adminError) exit(`Could not add the admin row: ${adminError.message}`);

console.log(`${email} is an admin. Sign in at /admin/login.`);
if (shownPassword) console.log(`Password (shown once, store it safely): ${shownPassword}`);
