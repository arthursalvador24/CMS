import { describe, expect, it } from "vitest";
import {
  aboutSchema,
  companyDetailsSchema,
  fieldErrors,
  isSafeCtaUrl,
  safeNextPath,
  signInSchema,
  slideFieldsSchema,
  slideOrderSchema,
  templateKeySchema,
} from "@/lib/cms/schemas";

const company = {
  companyName: "Kestrel & Vale",
  tagline: "Interiors designed around the way you actually live.",
  email: "hello@kestrelvale.example",
  phone: "+63 2 8123 4567",
  address: "118 Alder Lane,\r\nMakati City",
  socials: { instagram: "https://instagram.com/kestrelandvale", facebook: "" },
};

const errorsOf = (result: { success: boolean; error?: Parameters<typeof fieldErrors>[0] }) =>
  result.error ? fieldErrors(result.error) : {};

describe("company details", () => {
  it("accepts good input, trims, normalizes line endings and drops empty socials", () => {
    const result = companyDetailsSchema.safeParse({ ...company, companyName: "  Kestrel & Vale  " });
    expect(result.success).toBe(true);
    expect(result.data?.companyName).toBe("Kestrel & Vale");
    expect(result.data?.address).toBe("118 Alder Lane,\nMakati City");
    expect(result.data?.socials).toEqual({ instagram: "https://instagram.com/kestrelandvale" });
  });

  it("accepts an empty email, phone and socials", () => {
    expect(companyDetailsSchema.safeParse({ ...company, email: "", phone: "", socials: {} }).success).toBe(true);
  });

  it("requires a company name and respects the database lengths", () => {
    expect(errorsOf(companyDetailsSchema.safeParse({ ...company, companyName: "   " }))).toHaveProperty("companyName");
    expect(errorsOf(companyDetailsSchema.safeParse({ ...company, companyName: "x".repeat(121) }))).toHaveProperty(
      "companyName",
    );
    expect(errorsOf(companyDetailsSchema.safeParse({ ...company, tagline: "x".repeat(201) }))).toHaveProperty("tagline");
    expect(errorsOf(companyDetailsSchema.safeParse({ ...company, address: "x".repeat(401) }))).toHaveProperty("address");
  });

  it("rejects a bad email and a phone with letters", () => {
    expect(errorsOf(companyDetailsSchema.safeParse({ ...company, email: "not-an-email" }))).toHaveProperty("email");
    expect(errorsOf(companyDetailsSchema.safeParse({ ...company, phone: "call me" }))).toHaveProperty("phone");
  });

  it("only allows https social links for known networks", () => {
    const http = errorsOf(companyDetailsSchema.safeParse({ ...company, socials: { facebook: "http://facebook.com/x" } }));
    expect(http).toHaveProperty(["socials.facebook"]);
    const js = errorsOf(companyDetailsSchema.safeParse({ ...company, socials: { x: "javascript:alert(1)" } }));
    expect(js).toHaveProperty(["socials.x"]);
    expect(companyDetailsSchema.safeParse({ ...company, socials: { myspace: "https://myspace.com/x" } }).success).toBe(
      false,
    );
  });
});

describe("about, mission, vision", () => {
  it("keeps paragraphs and enforces lengths", () => {
    const result = aboutSchema.safeParse({ about: "One.\r\n\r\nTwo.", mission: "M", vision: "" });
    expect(result.data).toEqual({ about: "One.\n\nTwo.", mission: "M", vision: "" });
    expect(aboutSchema.safeParse({ about: "x".repeat(5001), mission: "", vision: "" }).success).toBe(false);
    expect(aboutSchema.safeParse({ about: "", mission: "x".repeat(2001), vision: "" }).success).toBe(false);
  });
});

describe("slides", () => {
  const slide = { heading: "Rooms that feel like you", caption: "Full-home interiors.", ctaLabel: "See our work", ctaUrl: "#about" };

  it("accepts the four safe kinds of button link", () => {
    for (const ctaUrl of ["#about", "/blog", "https://example.com/work", "mailto:hello@example.com"]) {
      expect(slideFieldsSchema.safeParse({ ...slide, ctaUrl }).success, ctaUrl).toBe(true);
    }
    expect(slideFieldsSchema.safeParse({ ...slide, ctaLabel: "", ctaUrl: "" }).success).toBe(true);
  });

  it("rejects javascript: and other unsafe links", () => {
    for (const ctaUrl of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      " javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "http://example.com",
      "//evil.example",
      "/\\evil.example",
      "java\tscript:alert(1)",
      "#",
      "mailto:nobody",
    ]) {
      expect(errorsOf(slideFieldsSchema.safeParse({ ...slide, ctaUrl })), ctaUrl).toHaveProperty("ctaUrl");
    }
    expect(isSafeCtaUrl("javascript:alert(1)")).toBe(false);
  });

  it("needs both a button label and a link, or neither", () => {
    expect(errorsOf(slideFieldsSchema.safeParse({ ...slide, ctaUrl: "" }))).toHaveProperty("ctaUrl");
    expect(errorsOf(slideFieldsSchema.safeParse({ ...slide, ctaLabel: "" }))).toHaveProperty("ctaLabel");
  });

  it("respects the database lengths", () => {
    expect(slideFieldsSchema.safeParse({ ...slide, heading: "x".repeat(141) }).success).toBe(false);
    expect(slideFieldsSchema.safeParse({ ...slide, caption: "x".repeat(301) }).success).toBe(false);
    expect(slideFieldsSchema.safeParse({ ...slide, ctaLabel: "x".repeat(41) }).success).toBe(false);
  });

  it("validates a reorder list", () => {
    const a = "f078dd03-f436-4068-b1bd-24386a7b35ef";
    const b = "51e02050-f6b6-45c2-9a97-fd9ba74aaa4c";
    expect(slideOrderSchema.safeParse([a, b]).success).toBe(true);
    expect(slideOrderSchema.safeParse([a, a]).success).toBe(false);
    expect(slideOrderSchema.safeParse(["not-a-uuid"]).success).toBe(false);
    expect(slideOrderSchema.safeParse([]).success).toBe(false);
  });
});

describe("template key", () => {
  it("accepts only the three templates", () => {
    expect(templateKeySchema.safeParse("folio").success).toBe(true);
    expect(templateKeySchema.safeParse("retro").success).toBe(false);
  });
});

describe("sign-in", () => {
  it("validates email and password", () => {
    expect(signInSchema.safeParse({ email: " a@b.co ", password: "x", next: null }).data).toEqual({
      email: "a@b.co",
      password: "x",
      next: "/admin",
    });
    expect(errorsOf(signInSchema.safeParse({ email: "nope", password: "", next: "/admin" }))).toMatchObject({
      email: expect.any(String),
      password: expect.any(String),
    });
  });

  it("only follows same-site /admin and /preview paths after sign-in", () => {
    expect(safeNextPath("/admin/carousel?tab=2")).toBe("/admin/carousel?tab=2");
    expect(safeNextPath("/preview/onyx/blog")).toBe("/preview/onyx/blog");
    for (const bad of [
      "https://evil.example/admin",
      "//evil.example/admin",
      "/\\evil.example/admin",
      "/admin/../blog",
      "/administrator",
      "/blog",
      "/admin/login",
      "javascript:alert(1)",
      "",
      null,
    ]) {
      expect(safeNextPath(bad), String(bad)).toBe("/admin");
    }
  });
});
