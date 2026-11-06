import { expect, expectPublic, resetSeed, saveForm, SEED, STAMP, test } from "./fixtures";

test.afterAll(() => resetSeed());

test("about, mission and vision show on the home page", async ({ page, request }) => {
  const fields = ["about", "mission", "vision"] as const;
  const edited = { about: `E2E about ${STAMP}`, mission: `E2E mission ${STAMP}`, vision: `E2E vision ${STAMP}` };

  await page.goto("/admin/about");
  for (const field of fields) await page.fill(`#${field}`, edited[field]);
  await saveForm(page);
  await expectPublic(request, "/", (html) => fields.forEach((field) => expect(html).toContain(edited[field])));

  for (const field of fields) await page.fill(`#${field}`, SEED[field]);
  await saveForm(page);
  await expectPublic(request, "/", (html) => {
    expect(html).toContain(SEED.mission);
    expect(html).toContain(SEED.vision);
    expect(html).toContain("how do you make a home feel finished without making it feel staged?");
    expect(html).not.toContain(edited.about);
  });
});
