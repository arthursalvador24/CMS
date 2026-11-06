import { expect, expectPublic, png, resetSeed, STAMP, test } from "./fixtures";

test.afterAll(() => resetSeed());

const FIRST_SEED_SLIDE = "Rooms that feel like you";

test("add a slide, move it to the top, hide it and delete it", async ({ page, request }) => {
  const heading = `E2E slide ${STAMP}`;
  const rows = page.getByRole("list", { name: "Slides in carousel order" }).getByRole("listitem");

  // Add
  await page.goto("/admin/carousel");
  await page.getByRole("button", { name: "Add slide" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a slide" });
  await dialog.locator('input[type="file"]').setInputFiles(await png(page, 640, 360, "#1d4ed8"));
  await dialog.locator("#heading").fill(heading);
  await dialog.getByRole("button", { name: "Add slide" }).click();
  await expect(page.getByText("Slide added to the end of the carousel.")).toBeVisible();
  await expect(rows).toHaveCount(4);
  const imageFile = (await rows.last().locator("img").getAttribute("src"))!.match(/slides(?:\/|%2F)([\w-]+\.png)/)![1];
  await expectPublic(request, "/", (html) => {
    expect(html).toContain(heading);
    expect(html).toContain(imageFile);
  });

  // Move to the top with the keyboard (dnd-kit's sensor needs a moment between key presses)
  await page.getByRole("button", { name: `Move slide 4, ${heading}` }).focus();
  for (const key of ["Space", "ArrowUp", "ArrowUp", "ArrowUp", "Space"]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
  await expect(page.getByText("New order saved.")).toBeVisible();
  await expect(rows.first()).toContainText(heading);
  await expectPublic(request, "/", (html) => {
    expect(html.indexOf(heading)).toBeGreaterThan(-1);
    expect(html.indexOf(heading)).toBeLessThan(html.indexOf(FIRST_SEED_SLIDE));
  });

  // Hide
  await page.getByRole("switch", { name: `Show slide 1, ${heading} on the site` }).click();
  await expect(page.getByText("Slide hidden from the live site.")).toBeVisible();
  await expectPublic(request, "/", (html) => {
    expect(html).not.toContain(heading);
    expect(html).toContain(FIRST_SEED_SLIDE);
  });

  // Delete
  await page.getByRole("button", { name: `Delete slide 1, ${heading}` }).click();
  await page.getByRole("button", { name: "Delete slide", exact: true }).click();
  await expect(page.getByText("Slide deleted.")).toBeVisible();
  await page.reload();
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText(FIRST_SEED_SLIDE);
});
