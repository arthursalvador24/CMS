import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/require-admin", () => ({ assertAdmin: vi.fn(), requireAdmin: vi.fn(), getAdmin: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ SUPABASE_URL: "https://test.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test" }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), cacheTag: vi.fn(), cacheLife: vi.fn() }));

import { updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import * as site from "@/lib/cms/actions/site";
import * as slides from "@/lib/cms/actions/slides";
import * as template from "@/lib/cms/actions/template";
import { CMS_TAG } from "@/lib/cms/read";
import { createClient } from "@/lib/supabase/server";

const SLIDE_ID = "f078dd03-f436-4068-b1bd-24386a7b35ef";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const company = {
  companyName: "Kestrel & Vale",
  tagline: "",
  email: "",
  phone: "",
  address: "",
  socials: {},
};

function slideForm(fields: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("id", SLIDE_ID);
  fd.set("heading", "Heading");
  fd.set("caption", "");
  fd.set("ctaLabel", "");
  fd.set("ctaUrl", "");
  fd.set("image", new File([PNG], "slide.png", { type: "image/png" }));
  fd.set("logo", new File([PNG], "logo.png", { type: "image/png" }));
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

// One valid call per exported action. The "covers every action" test fails when a new action is added here without a case.
const calls: Record<string, () => Promise<{ ok: boolean }>> = {
  updateCompanyDetails: () => site.updateCompanyDetails(company),
  uploadLogo: () => site.uploadLogo(slideForm()),
  removeLogo: () => site.removeLogo(),
  updateAboutMissionVision: () => site.updateAboutMissionVision({ about: "A", mission: "M", vision: "V" }),
  createSlide: () => slides.createSlide(slideForm()),
  updateSlide: () => slides.updateSlide(slideForm()),
  reorderSlides: () => slides.reorderSlides([SLIDE_ID]),
  setSlideActive: () => slides.setSlideActive(SLIDE_ID, false),
  deleteSlide: () => slides.deleteSlide(SLIDE_ID),
  setActiveTemplate: () => template.setActiveTemplate("folio"),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(assertAdmin).mockRejectedValue(new Error("Not authorized"));
});

describe("admin re-check in every content action", () => {
  it("covers every exported action", () => {
    const exported = Object.keys({ ...site, ...slides, ...template }).sort();
    expect(Object.keys(calls).sort()).toEqual(exported);
  });

  it.each(Object.entries(calls))("%s refuses a non-admin without touching the database", async (_name, call) => {
    const result = await call();
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/sign in again/i) });
    expect(assertAdmin).toHaveBeenCalledTimes(1);
    expect(createClient).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("for an admin", () => {
  beforeEach(() => {
    vi.mocked(assertAdmin).mockResolvedValue({ id: "admin-id", email: "admin@example.com" });
  });

  it("rejects bad input before touching the database", async () => {
    const slide = await slides.updateSlide(slideForm({ ctaLabel: "Go", ctaUrl: "javascript:alert(1)" }));
    expect(slide).toMatchObject({ ok: false, fieldErrors: { ctaUrl: expect.any(String) } });
    const details = await site.updateCompanyDetails({ ...company, socials: { facebook: "http://facebook.com/x" } });
    expect(details).toMatchObject({ ok: false, fieldErrors: { "socials.facebook": expect.any(String) } });
    const tpl = await template.setActiveTemplate("retro" as never);
    expect(tpl.ok).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("refreshes the public site after a successful save", async () => {
    const row = {
      company_name: "Kestrel & Vale",
      tagline: "",
      email: "",
      phone: "",
      address: "",
      socials: {},
      logo_path: null,
      about: "",
      mission: "",
      vision: "",
      active_template: "folio",
      updated_at: "2026-11-06T00:00:00Z",
    };
    const query = {
      from: () => query,
      update: vi.fn(() => query),
      eq: () => query,
      select: () => query,
      single: async () => ({ data: row, error: null }),
    };
    vi.mocked(createClient).mockResolvedValue(query as never);
    const result = await template.setActiveTemplate("folio");
    expect(result).toMatchObject({ ok: true, data: { activeTemplate: "folio" } });
    expect(query.update).toHaveBeenCalledWith({ active_template: "folio" });
    expect(updateTag).toHaveBeenCalledWith(CMS_TAG);
  });
});
