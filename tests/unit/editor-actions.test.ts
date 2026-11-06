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
