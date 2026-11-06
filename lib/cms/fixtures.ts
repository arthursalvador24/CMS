/**
 * Fixture content for /dev/<template> pages, so templates can be tested on edge cases
 * without touching the database. Images reuse the seed files in cms-media.
 */
import { EDITOR_FONTS, EDITOR_FONT_SIZES } from "./editor-fonts";
import { mediaUrl } from "./media";
import { readingMinutes } from "./read";
import type { BlogIndexData, BlogPostData, Post, PostSummary, SiteData, SiteSettings, Slide } from "./types";

export const FIXTURE_CASES = ["full", "empty", "six", "long"] as const;
export type FixtureCase = (typeof FIXTURE_CASES)[number];
export function fixtureCase(value: string | string[] | undefined): FixtureCase {
  const v = Array.isArray(value) ? value[0] : value;
  return (FIXTURE_CASES as readonly string[]).includes(v ?? "") ? (v as FixtureCase) : "full";
}

/** Slug of the post that uses every editor feature (style `.cms-content` against it). */
export const FEATURES_POST_SLUG = "every-editor-feature";

const img = (n: string) => mediaUrl(`seed/${n}`) ?? "";

/* ---------- site ---------- */

const fullSite: SiteSettings = {
  companyName: "Kestrel & Vale",
  tagline: "Interiors designed around the way you actually live.",
  email: "hello@kestrelvale.example",
  phone: "+63 2 8123 4567",
  address: "118 Alder Lane, Poblacion, Makati City, Metro Manila",
  socials: {
    facebook: "https://facebook.com/kestrelandvale",
    instagram: "https://instagram.com/kestrelandvale",
    linkedin: "https://linkedin.com/company/kestrelandvale",
  },
  logoPath: "seed/logo.png",
  logoUrl: img("logo.png"),
  about:
    "Kestrel & Vale is a small interior design studio founded in 2016 by two friends who kept being asked the same question: how do you make a home feel finished without making it feel staged?\n\nWe design homes, apartments and small workplaces from the first floor plan to the last lamp. Every project starts with how you spend an ordinary Tuesday, then we shape light, storage, materials and furniture around it.\n\nToday we are a team of nine designers, makers and project leads, working with local carpenters, upholsterers and stone workshops we have known for years.",
  mission:
    "To design rooms that make everyday life easier and calmer, using honest materials, local craft and budgets we are open about from day one.",
  vision:
    "A city where good design is not a luxury, and where every home, however small, is built to be lived in well for decades.",
  activeTemplate: "meridian",
  updatedAt: "2026-11-06T00:00:00Z",
};

const emptySite: SiteSettings = {
  ...fullSite,
  companyName: "",
  tagline: "",
  email: "",
  phone: "",
  address: "",
  socials: {},
  logoPath: null,
  logoUrl: null,
  about: "",
  mission: "",
  vision: "",
};

const longSite: SiteSettings = {
  ...fullSite,
  companyName: "Kestrel & Vale Interior Architecture, Furniture and Lighting Design Studio of Greater Metro Manila",
  tagline:
    "Interiors designed around the way you actually live, from the first floor plan and the morning light to the very last lamp, cushion and cabinet handle, for homes, apartments and small workplaces of every size.",
  email: "a.very.long.mailbox.name.for.new.projects@kestrel-and-vale-interior-architecture.example",
  phone: "+63 2 8123 4567 local 2201 (weekdays 9 AM to 6 PM)",
  address:
    "Unit 2201, 22nd Floor, The Alder Residences and Creative Offices, 118 Alder Lane corner Narra Street, Barangay Poblacion, Makati City, Metro Manila 1210, Philippines",
  socials: {
    facebook: "https://facebook.com/kestrelandvale",
    instagram: "https://instagram.com/kestrelandvale",
    linkedin: "https://linkedin.com/company/kestrelandvale",
    x: "https://x.com/kestrelandvale",
    youtube: "https://youtube.com/@kestrelandvale",
    tiktok: "https://tiktok.com/@kestrelandvale",
  },
  about: Array.from({ length: 6 }, (_, i) =>
    `${i === 0 ? "Kestrel & Vale began in 2016 at a borrowed kitchen table" : "Paragraph " + (i + 1) + " keeps going"}, and this deliberately long paragraph exists to test how the About section copes with a great deal of text: several sentences in a row, long words like interdisciplinary, characteristically and counterintuitively, and a rhythm that never quite stops. We design homes, apartments and small workplaces from the first floor plan to the last lamp, and we like to explain every decision along the way.`,
  ).join("\n\n"),
  mission:
    "To design rooms that make everyday life easier and calmer for every person who lives in them, using honest materials, local craft, careful lighting, generous storage and budgets we are open about from the very first conversation to the final handover, and to keep supporting our clients long after the last piece of furniture has arrived.",
  vision:
    "A city where good design is not a luxury reserved for a few, where every home and workplace, however small or unusual its floor plan, is built to be lived in well for decades, repaired rather than replaced, and shaped by the people and workshops of the neighbourhood around it.",
};

/* ---------- slides ---------- */

const slide = (n: number, image: string, heading: string, caption: string, ctaLabel = "", ctaUrl = ""): Slide => ({
  id: `fixture-slide-${n}`,
  imagePath: `seed/${image}`,
  imageUrl: img(image),
  heading,
  caption,
  ctaLabel,
  ctaUrl,
  sortOrder: n,
  isActive: true,
});

const fullSlides: Slide[] = [
  slide(1, "slide-1.jpg", "Rooms that feel like you", "Full-home interiors, from floor plan to the final lamp.", "See our work", "#about"),
  slide(2, "slide-2.jpg", "Open plans, quiet corners", "We shape light and storage around how your day actually runs.", "Read the journal", "/blog"),
  slide(3, "slide-3.jpg", "Made with local craft", "Carpentry, upholstery and stone from workshops we trust.", "Talk to us", "#contact"),
];

const sixSlides: Slide[] = [
  ...fullSlides,
  slide(4, "post-1.jpg", "A living room for every hour", "", "Read the story", "/blog/living-room-every-hour"),
  slide(5, "post-2.jpg", "Plants without the clutter", "A caption with no button: the label is set but the link is empty.", "Hidden button", ""),
  slide(6, "post-3.jpg", "", "A slide with a caption and no heading.", "External link", "https://example.com"),
];

const longSlides: Slide[] = [
  slide(
    1,
    "slide-1.jpg",
    "Rooms that feel like you, designed around mornings, long afternoons, late dinners and everything in between",
    "Full-home interiors, from the first floor plan to the final lamp, with every decision explained in plain words and every budget agreed before a single piece of furniture is ordered.",
    "See our complete portfolio of finished homes and workplaces",
    "#about",
  ),
];

/* ---------- posts ---------- */

const fontLines = EDITOR_FONTS.map(
  (f) => `<p><span style="font-family: ${f.value}">${f.label}: Light falls across the oak floor at eight in the morning.</span></p>`,
).join("");
const sizeLines = EDITOR_FONT_SIZES.map((s) => `<p><span style="font-size: ${s}">This line is set at ${s}.</span></p>`).join("");

const FEATURES_HTML = [
  `<p>This post uses every format the editor can produce. Inline styles: <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <strong><em>bold italic</em></strong>, a <a href="https://example.com/materials">link to a materials guide</a>, an email <a href="mailto:hello@kestrelvale.example">link</a>, <mark>a default highlight</mark> and <mark style="background-color: #bbf7d0">a green highlight</mark>.</p>`,
  `<h2>Fonts</h2>`,
  `<p>The template default font, followed by each of the six editor fonts:</p>`,
  fontLines,
  `<h2>Sizes</h2>`,
  sizeLines,
  `<h3>Colors</h3>`,
  `<p><span style="color: #b91c1c">Brick red text</span>, <span style="color: #1d4ed8">ink blue text</span>, <span style="color: #15803d">moss green text</span> and <span style="font-family: var(--font-ed-playfair); font-size: 24px; color: #7c3aed">font, size and color together</span>.</p>`,
  `<h3>Alignment</h3>`,
  `<p style="text-align: left">Left aligned. Most body text sits here, and so should this sentence.</p>`,
  `<p style="text-align: center">Centered. Good for a short pause in the text.</p>`,
  `<p style="text-align: right">Right aligned. Rare, but the editor allows it.</p>`,
  `<p style="text-align: justify">Justified. This paragraph is long enough to wrap across several lines so that the justified spacing is visible: we map where the sun falls at eight in the morning, two in the afternoon and seven at night, then place seating, task lights and storage around those three moments.</p>`,
  `<h3 style="text-align: center">A centered heading</h3>`,
  `<h4>Lists</h4>`,
  `<ul><li><p>A bulleted item.</p></li><li><p>A second item with <strong>bold</strong> text.</p></li><li><p>A third item that runs long enough to wrap onto a second line on a phone screen.</p></li></ul>`,
  `<ol><li><p>Measure the light.</p></li><li><p>Plan the storage.</p></li><li><p>Choose the furniture last.</p></li></ol>`,
  `<h4>Quote</h4>`,
  `<blockquote><p>A room should work on an ordinary Tuesday, not only on the day it is photographed.</p></blockquote>`,
  `<hr>`,
  `<h2>Images</h2>`,
  `<p>Small, medium and full width:</p>`,
  `<img src="${img("post-2.jpg")}" alt="A bedroom with two potted plants beside the bed" data-size="small">`,
  `<img src="${img("post-3.jpg")}" alt="A kitchen island with stools on one side" data-size="medium">`,
  `<img src="${img("slide-2.jpg")}" alt="An open-plan living room with a reading corner" data-size="full">`,
  `<p>The last paragraph, after the images.</p>`,
].join("");

const shortBody = (topic: string) =>
  `<p>${topic} This is a short fixture body.</p><h2>A subheading</h2><p>Followed by one more paragraph of plain text.</p>`;

function makePost(
  n: number,
  slug: string,
  title: string,
  excerpt: string,
  cover: string | null,
  publishedAt: string,
  contentHtml = shortBody(excerpt),
): Post {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    title,
    slug,
    excerpt,
    coverPath: cover ? `seed/${cover}` : null,
    coverUrl: cover ? img(cover) : null,
    publishedAt,
    readingMinutes: readingMinutes(contentHtml),
    status: "published",
    contentHtml,
    contentJson: null,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  };
}

const featuresPost = makePost(
  1,
  FEATURES_POST_SLUG,
  "Every editor feature in one post",
  "Fonts, sizes, colors, highlight, alignment, headings, lists, a quote, links, a rule and images at three sizes.",
  "slide-1.jpg",
  "2026-11-02T01:00:00Z",
  FEATURES_HTML,
);

const fullPosts: Post[] = [
  featuresPost,
  makePost(2, "living-room-every-hour", "Designing a living room that works at every hour", "Morning coffee, afternoon calls, a film at night. How we plan one room for three very different moods.", "post-1.jpg", "2026-10-28T01:00:00Z"),
  makePost(3, "plants-in-the-bedroom", "Bringing plants into the bedroom without the clutter", "Plants make a bedroom feel alive. Too many make it feel like a greenhouse. Here is where we draw the line.", "post-2.jpg", "2026-10-14T01:00:00Z"),
  makePost(4, "kitchen-island-rethought", "The kitchen island, rethought", "An island is not just extra counter space. Done well, it becomes the room's meeting point.", "post-3.jpg", "2026-09-30T01:00:00Z"),
];

// 12 posts so the index shows two pages; every third has no cover image.
const covers = ["post-1.jpg", "post-2.jpg", null, "post-3.jpg", "slide-1.jpg", null];
const sixPosts: Post[] = [
  featuresPost,
  ...Array.from({ length: 11 }, (_, i) =>
    makePost(
      i + 10,
      `fixture-post-${i + 2}`,
      `Fixture post number ${i + 2}`,
      `Excerpt for fixture post ${i + 2}.${i % 2 ? "" : " Some excerpts run a little longer than others."}`,
      covers[i % covers.length],
      new Date(Date.UTC(2026, 9, 30 - i * 2, 1)).toISOString(),
    ),
  ),
];

const longPosts: Post[] = [
  {
    ...featuresPost,
    title:
      "Every editor feature in one post, with a deliberately long title that wraps across several lines on a phone and at least two on a wide desktop screen",
  },
  makePost(
    20,
    "a-very-long-post-title",
    "Designing a living room that works at every hour of the day, from the first coffee of the morning to the last film of the night, without moving the sofa",
    "A deliberately long excerpt that keeps going so the card has to deal with overflow: morning coffee, afternoon calls, a film at night, homework at the dining table, guests on the weekend and a quiet corner for reading when everyone else has gone to bed.",
    "post-1.jpg",
    "2026-10-28T01:00:00Z",
  ),
  makePost(21, "averyveryverylongunbrokenslugwordthatkeepsgoingandgoingwithoutanyspaces", "Supercalifragilisticexpialidociouslyunbrokenwordsinatitlewithoutanyspacesatall", "A title made of one unbroken word.", null, "2026-10-14T01:00:00Z"),
];

/* ---------- public API ---------- */

const SITES: Record<FixtureCase, SiteSettings> = { full: fullSite, empty: emptySite, six: fullSite, long: longSite };
const SLIDES: Record<FixtureCase, Slide[]> = { full: fullSlides, empty: [], six: sixSlides, long: longSlides };
const POSTS: Record<FixtureCase, Post[]> = { full: fullPosts, empty: [], six: sixPosts, long: longPosts };

function summary(post: Post): PostSummary {
  const { id, title, slug, excerpt, coverPath, coverUrl, publishedAt, readingMinutes: minutes } = post;
  return { id, title, slug, excerpt, coverPath, coverUrl, publishedAt, readingMinutes: minutes };
}

export function fixtureSiteData(c: FixtureCase): SiteData {
  return { site: SITES[c], slides: SLIDES[c], latestPosts: POSTS[c].slice(0, 3).map(summary) };
}

export function fixtureBlogIndex(c: FixtureCase, page: number, perPage = 9): BlogIndexData | null {
  const posts = POSTS[c];
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
  if (page > totalPages) return null;
  return {
    site: SITES[c],
    posts: posts.slice((page - 1) * perPage, page * perPage).map(summary),
    page,
    totalPages,
  };
}

/** prev = older post, next = newer post (same as getPublishedPost). */
export function fixtureBlogPost(c: FixtureCase, slug: string): BlogPostData | null {
  const posts = POSTS[c];
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return null;
  return {
    site: SITES[c],
    post: posts[i],
    prev: posts[i + 1] ? summary(posts[i + 1]) : null,
    next: posts[i - 1] ? summary(posts[i - 1]) : null,
  };
}
