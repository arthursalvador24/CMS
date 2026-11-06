import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= "test-key";
  return {
    assertAdmin: vi.fn(),
    createClient: vi.fn(),
    updateTag: vi.fn(),
  };
});

vi.mock("@/lib/auth/require-admin", () => ({ assertAdmin: mocks.assertAdmin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ updateTag: mocks.updateTag, cacheTag: vi.fn(), cacheLife: vi.fn() }));

import * as posts from "@/lib/cms/actions/posts";

const ID = "3c8e767f-7427-4422-b12a-97506cbdf00d";
const image = () => {
  const formData = new FormData();
  formData.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "x.png"));
  return formData;
};

const calls: [string, () => Promise<{ ok: boolean }>][] = [
  ["createPost", () => posts.createPost()],
  [
    "savePost",
    () => posts.savePost({ id: ID, title: "T", slug: "t", excerpt: "", contentJson: null, contentHtml: "<p>x</p>" }),
  ],
  ["setPostCover", () => posts.setPostCover(ID, image())],
  ["removePostCover", () => posts.removePostCover(ID)],
  ["publishPost", () => posts.publishPost(ID)],
  ["unpublishPost", () => posts.unpublishPost(ID)],
  ["deletePost", () => posts.deletePost(ID)],
  ["uploadInlineImage", () => posts.uploadInlineImage(image())],
];

describe("post actions re-check the admin on the server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAdmin.mockRejectedValue(new Error("Not authorized"));
  });

  it.each(calls)("%s refuses a non-admin without touching the database", async (_name, call) => {
    const result = await call();
    expect(result.ok).toBe(false);
    expect(mocks.assertAdmin).toHaveBeenCalledOnce();
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});

describe("savePost validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAdmin.mockResolvedValue({ id: ID, email: "a@example.com" });
  });

  it.each([
    ["slug", { slug: "Not A Slug" }],
    ["slug", { slug: "double--hyphen" }],
    ["title", { title: "   " }],
    ["excerpt", { excerpt: "x".repeat(401) }],
    ["contentJson", { contentJson: { type: "paragraph" } }],
    ["id", { id: "not-a-uuid" }],
  ])("rejects a bad %s before the database", async (field, patch) => {
    const result = await posts.savePost({
      id: ID,
      title: "Title",
      slug: "title",
      excerpt: "",
      contentJson: null,
      contentHtml: "",
      ...patch,
    } as posts.SavePostInput);
    expect(result).toMatchObject({ ok: false, fieldErrors: { [field]: expect.any(String) } });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

/** Supabase stand-in: every query call chains, and each awaited query or maybeSingle() takes the next result. */
function fakeDb(...results: { data?: unknown; error?: unknown }[]) {
  const calls: string[] = [];
  const next = () => ({ data: null, error: null, ...results.shift() });
  const query: object = new Proxy(
    {},
    {
      get: (_, prop) =>
        prop === "then"
          ? (resolve: (v: unknown) => void) => resolve(next())
          : prop === "maybeSingle"
            ? async () => next()
            : (...args: unknown[]) => {
                calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(", ")})`);
                return query;
              },
    },
  );
  mocks.createClient.mockResolvedValue({ from: () => query });
  return calls;
}

const save = (patch: Partial<posts.SavePostInput> = {}) =>
  posts.savePost({ id: ID, title: "Spring menu", slug: "spring-menu", excerpt: "", contentJson: null, contentHtml: "<p>Hello</p>", ...patch });

describe("savePost on a published post", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAdmin.mockResolvedValue({ id: ID, email: "a@example.com" });
  });

  it("refuses a slug change, so the public web address stays put", async () => {
    const calls = fakeDb({ data: { status: "published", slug: "spring-menu" } });
    const result = await save({ slug: "new-address" });
    expect(result).toMatchObject({ ok: false, fieldErrors: { slug: "Unpublish to change the web address." } });
    expect(calls.some((c) => c.startsWith("update"))).toBe(false);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it.each([
    ["title", { title: "Untitled post" }],
    ["contentHtml", { contentHtml: "<p> </p>" }],
  ])("refuses to put an empty %s live", async (field, patch) => {
    const calls = fakeDb({ data: { status: "published", slug: "spring-menu" } });
    const result = await save(patch);
    expect(result).toMatchObject({ ok: false, fieldErrors: { [field]: expect.any(String) } });
    expect(calls.some((c) => c.startsWith("update"))).toBe(false);
  });

  it("saves edits with the same slug and refreshes the public site", async () => {
    const calls = fakeDb(
      { data: { status: "published", slug: "spring-menu" } },
      { data: [] },
      { data: { status: "published", updated_at: "2026-11-06T00:00:00Z" } },
    );
    expect((await save()).ok).toBe(true);
    expect(calls).toContain('eq("status", "published")');
    expect(mocks.updateTag).toHaveBeenCalledOnce();
  });

  it("still lets a draft change its slug, without a public refresh", async () => {
    fakeDb(
      { data: { status: "draft", slug: "untitled-post" } },
      { data: [] },
      { data: { status: "draft", updated_at: "2026-11-06T00:00:00Z" } },
    );
    expect((await save({ slug: "new-address" })).ok).toBe(true);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});

describe("publishPost needs a real title and some content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertAdmin.mockResolvedValue({ id: ID, email: "a@example.com" });
  });

  it.each([
    ["the default title", "Untitled post", "<p>Hello</p>", "title"],
    ["a blank title", "   ", "<p>Hello</p>", "title"],
    ["an empty body", "Spring menu", "", "contentHtml"],
    ["empty paragraphs", "Spring menu", "<p></p><p>&nbsp; </p>", "contentHtml"],
  ])("refuses %s", async (_case, title, html, field) => {
    const calls = fakeDb({ data: { published_at: null, title, content_html: html } });
    const result = await posts.publishPost(ID);
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/cannot be (untitled|empty)/), fieldErrors: { [field]: expect.any(String) } });
    expect(calls.some((c) => c.startsWith("update"))).toBe(false);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it.each([
    ["text", "<p>Hello</p>"],
    ["only an image", '<p><img src="https://example.supabase.co/x.png" alt=""></p>'],
  ])("publishes a post with %s", async (_case, html) => {
    fakeDb({ data: { published_at: null, title: "Spring menu", content_html: html } }, { error: null });
    expect((await posts.publishPost(ID)).ok).toBe(true);
    expect(mocks.updateTag).toHaveBeenCalledOnce();
  });
});
