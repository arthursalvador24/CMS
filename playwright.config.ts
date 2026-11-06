import { defineConfig, devices } from "@playwright/test";

// Demo admin credentials and Supabase keys for the sign-in and the seed reset helper.
process.loadEnvFile(".env.local");

const baseURL = "http://localhost:3220";

export default defineConfig({
  testDir: "tests/e2e",
  // Every spec writes to the one shared CMSDB, so nothing runs in parallel.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: { baseURL, trace: "retain-on-first-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
