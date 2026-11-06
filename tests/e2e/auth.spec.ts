// Plain @playwright/test: these tests start with no session on purpose.
import { expect, test } from "@playwright/test";
import { signIn } from "./fixtures";

test("no session goes to the login page, and a wrong password shows an error", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);

  await page.fill('input[name="email"]', process.env.CMS_DEMO_ADMIN_EMAIL!);
  await page.fill('input[name="password"]', "not-the-password");
  await page.click('button[type="submit"]');
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("sign in, then sign out", async ({ page }) => {
  await signIn(page);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText(`Signed in as ${process.env.CMS_DEMO_ADMIN_EMAIL}`).first()).toBeAttached();

  await page.locator("aside").getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/company");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fcompany$/);
});
