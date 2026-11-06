import { expect, expectPublic, png, resetSeed, saveForm, SEED, STAMP, test } from "./fixtures";

test.afterAll(() => resetSeed());

test("tagline, phone and logo show on the home page", async ({ page, request }) => {
  const tagline = `E2E tagline ${STAMP}`;
  const phone = "+63 2 8000 1234";

  await page.goto("/admin/company");
  await page.fill("#tagline", tagline);
  await page.fill("#phone", phone);
  await saveForm(page);
  await expectPublic(request, "/", (html) => {
    expect(html).toContain(tagline);
    expect(html).toContain(phone);
  });

  await page.locator('input[type="file"]').setInputFiles(await png(page, 96, 96, "#b91c1c"));
  await expect(page.getByText("Logo updated on the live site.")).toBeVisible();
  const logoFile = (await page.getByAltText("Current logo").getAttribute("src"))!.match(/logo(?:\/|%2F)([\w-]+\.png)/)![1];
  await expectPublic(request, "/", (html) => expect(html).toContain(logoFile));

  // Restore: remove the test logo in the UI (deletes its file), point back at seed/logo.png (the UI can only
  // upload new files), then save the seed text through the UI, which also refreshes the public cache.
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("button", { name: "Remove logo" }).click();
  await expect(page.getByText("Logo removed.")).toBeVisible();
  await resetSeed();
  await page.fill("#tagline", SEED.tagline);
  await page.fill("#phone", SEED.phone);
  await saveForm(page);
  await expectPublic(request, "/", (html) => {
    expect(html).toContain(SEED.tagline);
    expect(html).toContain(SEED.phone);
    expect(html).toMatch(/seed(?:\/|%2F)logo\.png/);
    expect(html).not.toContain(logoFile);
  });
});
