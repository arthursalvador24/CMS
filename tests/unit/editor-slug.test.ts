import { describe, expect, it } from "vitest";
import { SLUG_PATTERN, slugify, uniqueSlug } from "@/lib/cms/slug";

describe("slugify", () => {
  it.each([
    ["Designing a Living Room", "designing-a-living-room"],
    ["Café & Co: Spring 2026!", "cafe-co-spring-2026"],
    ["  --Hello   World--  ", "hello-world"],
    ["Ünïcödé façade", "unicode-facade"],
    ["!!!", "post"],
    ["", "post"],
  ])("%j -> %j", (title, slug) => {
    expect(slugify(title)).toBe(slug);
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it("keeps long titles valid and short enough for a suffix", () => {
    const slug = slugify("word ".repeat(60));
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug).toMatch(SLUG_PATTERN);
  });
});

describe("uniqueSlug", () => {
  it("keeps a free slug", () => {
    expect(uniqueSlug("kitchen", ["kitchen-island"])).toBe("kitchen");
  });

  it("suggests -2, then -3 and so on", () => {
    expect(uniqueSlug("kitchen", ["kitchen"])).toBe("kitchen-2");
    expect(uniqueSlug("kitchen", ["kitchen", "kitchen-2", "kitchen-3"])).toBe("kitchen-4");
  });

  it("fills the first gap", () => {
    expect(uniqueSlug("kitchen", ["kitchen", "kitchen-3"])).toBe("kitchen-2");
  });
});
