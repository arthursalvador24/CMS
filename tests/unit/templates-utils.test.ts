import { describe, expect, it } from "vitest";
import { ctaHref, formatDate, href, pageParam, paragraphs, socialLinks } from "@/lib/templates/utils";

describe("template helpers", () => {
  it("builds links inside the current base path", () => {
    expect(href("", "/")).toBe("/");
    expect(href("", "/blog")).toBe("/blog");
    expect(href("", "/#about")).toBe("/#about");
    expect(href("/preview/folio", "/")).toBe("/preview/folio");
    expect(href("/preview/folio", "/#contact")).toBe("/preview/folio#contact");
    expect(href("/dev/onyx", "/blog?page=2")).toBe("/dev/onyx/blog?page=2");
  });

  it("only allows safe slide button links", () => {
    expect(ctaHref("#about", "/preview/onyx")).toBe("#about");
    expect(ctaHref("/blog", "/preview/onyx")).toBe("/preview/onyx/blog");
    expect(ctaHref("https://example.com", "")).toBe("https://example.com");
    expect(ctaHref("mailto:a@b.co", "")).toBe("mailto:a@b.co");
    expect(ctaHref("javascript:alert(1)", "")).toBeNull();
    expect(ctaHref("//evil.example", "")).toBeNull();
    expect(ctaHref("  ", "")).toBeNull();
  });

  it("formats dates, paragraphs, socials and page numbers", () => {
    expect(formatDate("2026-10-28T01:00:00Z")).toBe("Oct 28, 2026");
    expect(formatDate(null)).toBe("");
    expect(paragraphs("One.\n\nTwo\nlines.\n \n\nThree.")).toEqual(["One.", "Two\nlines.", "Three."]);
    expect(socialLinks({ x: "https://x.com/a", facebook: "javascript:alert(1)", youtube: "" })).toEqual([
      { key: "x", label: "X", url: "https://x.com/a" },
    ]);
    expect(pageParam("3")).toBe(3);
    expect(pageParam(["2", "5"])).toBe(2);
    expect(pageParam("-1")).toBe(1);
    expect(pageParam(undefined)).toBe(1);
  });
});
