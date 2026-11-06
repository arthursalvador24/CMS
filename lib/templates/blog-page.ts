import { getPublishedPosts } from "@/lib/cms/read";
import type { PostSummary } from "@/lib/cms/types";
import { POSTS_PER_PAGE } from "./utils";

/**
 * One page of published posts, or null when the page is past the end (the route then 404s).
 * shortcut: reads page 1 first because getPublishedPosts throws on an out-of-range page (PostgREST 416);
 * drop the first read once lib/cms/read.ts returns an empty page for that case.
 */
export async function readBlogPage(page: number): Promise<{ posts: PostSummary[]; page: number; totalPages: number } | null> {
  const first = await getPublishedPosts(1, POSTS_PER_PAGE);
  if (page > first.totalPages) return null;
  const { posts, totalPages } = page === 1 ? first : await getPublishedPosts(page, POSTS_PER_PAGE);
  return { posts, page, totalPages };
}
