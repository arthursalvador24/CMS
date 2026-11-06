import { expect, openPublic, png, resetSeed, STAMP, test } from "./fixtures";

let postId: string | undefined;
test.afterAll(() => resetSeed(postId ? [postId] : []));

const LINES = {
  boldItalic: "Bold and italic words",
  styled: "Lora at 24 px in red",
  highlight: "Highlighted words",
  center: "A centered line",
  list: "A list item",
  quote: "A quoted line",
  link: "Visit the example site",
  last: "A photo comes next",
};

/** What each format becomes in the public post's .cms-content. */
const FORMATS = {
  bold: "strong",
  italic: "em",
  font: '[style*="--font-ed-lora"]',
  size: '[style*="font-size"][style*="24px"]',
  color: '[style*="#b91c1c" i]',
  highlight: "mark",
  center: '[style*="text-align"][style*="center"]',
  list: "ul > li",
  quote: "blockquote",
  link: 'a[href^="https://example.com"]',
  image: 'img[src*="/cms-media/inline/"][alt="E2E test image"]',
};

test("write, format, publish, unpublish and delete a post", async ({ page, request }) => {
  const title = `E2E post ${STAMP}`;
  const slug = `e2e-post-${STAMP}`;
  const postStatus = (path: string) => request.get(path).then((res) => res.status());

  await page.goto("/admin/blog");
  await page.getByRole("button", { name: "New post" }).click();
  await page.waitForURL(/\/admin\/blog\/[0-9a-f-]{36}$/);
  postId = page.url().split("/").pop();
  await page.fill("#title", title);
  await expect(page.locator("#slug")).toHaveValue(slug);

  // Type every line plain first, then select each one and format it, so block formats never nest.
  const editor = page.locator(".rte-content");
  const toolbar = page.getByRole("toolbar", { name: "Formatting" });
  const button = (name: string) => toolbar.getByRole("button", { name, exact: true });
  await editor.click();
  for (const [i, line] of Object.values(LINES).entries()) {
    if (i) await page.keyboard.press("Enter");
    await page.keyboard.type(line);
  }
  const select = async (line: string) => {
    await editor.getByText(line, { exact: true }).click();
    await page.keyboard.press("Home");
    await page.keyboard.press("Shift+End");
    await page.waitForTimeout(200); // ProseMirror reads a new selection a moment later
  };

  await select(LINES.boldItalic);
  await button("Bold").click();
  await button("Italic").click();

  await select(LINES.styled);
  await toolbar.getByRole("combobox", { name: "Font", exact: true }).selectOption({ label: "Lora" });
  await toolbar.getByRole("combobox", { name: "Font size" }).selectOption("24px");
  // fill() does not fire React's onChange on a color input; set the value natively and send "input".
  await toolbar.getByLabel("Text color", { exact: true }).evaluate((input: HTMLInputElement) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "#b91c1c");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await select(LINES.highlight);
  await button("Highlight").click();

  await select(LINES.center);
  await button("Align center").click();

  await select(LINES.list);
  await button("Bulleted list").click();

  await select(LINES.quote);
  await button("Quote").click();

  await select(LINES.link);
  await button("Link").click();
  const linkInput = page.getByPlaceholder("https://example.com or name@example.com");
  await linkInput.fill("https://example.com");
  await linkInput.press("Enter");

  await editor.focus();
  await page.keyboard.press("Control+End");
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await toolbar.locator('input[type="file"]').setInputFiles(await png(page, 480, 320, "#15803d"));
  await expect(page.getByText("Image added.")).toBeVisible();
  await page.getByPlaceholder("Describe the image for screen readers").fill("E2E test image");
  await expect(page.getByTestId("save-status")).toHaveText("All changes saved");

  // A draft is not public.
  expect(await postStatus(`/blog/${slug}`)).toBe(404);

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByText("Published. The post is live on your blog.")).toBeVisible();
  const site = await openPublic(page, `/blog/${slug}`, ".cms-content");
  await expect(site.getByRole("heading", { level: 1 })).toHaveText(title);
  const content = site.locator(".cms-content");
  for (const [name, selector] of Object.entries(FORMATS)) {
    await expect(content.locator(selector).first(), `${name} (${selector})`).toBeAttached();
  }
  await site.close();

  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await expect(page.getByText("Moved back to drafts.")).toBeVisible();
  await expect.poll(() => postStatus(`/blog/${slug}`)).toBe(404);

  await page.getByRole("button", { name: "Delete post" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete post" }).click();
  await page.waitForURL(/\/admin\/blog$/);
  await expect(page.getByText("Stairs as sculpture", { exact: true })).toBeVisible();
  // The editor we just left can stay in the DOM, hidden, so count only what is on screen.
  await expect(page.getByText(title).filter({ visible: true })).toHaveCount(0);
});
