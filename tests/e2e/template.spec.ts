import { expect, openPublic, resetSeed, test } from "./fixtures";
import type { Page } from "@playwright/test";

test.afterAll(() => resetSeed());

async function useTemplate(page: Page, name: string) {
  await page.getByRole("article", { name }).getByRole("button", { name: "Use this template" }).click();
  await page.getByRole("dialog").getByRole("button", { name: `Use ${name}` }).click();
  await expect(page.getByText(`Your live site now uses ${name}.`)).toBeVisible();
  await expect(page.getByRole("article", { name }).getByText("Live on your site")).toBeVisible();
}

test("switch the live site to Folio and back to Meridian", async ({ page }) => {
  await page.goto("/admin/template");

  await useTemplate(page, "Folio");
  const folio = await openPublic(page, "/", ".tpl-folio");
  await expect(folio.locator(".tpl-meridian")).toHaveCount(0);
  await folio.close();

  await useTemplate(page, "Meridian");
  const meridian = await openPublic(page, "/", ".tpl-meridian");
  await expect(meridian.locator(".tpl-folio")).toHaveCount(0);
});
