import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= "test-key";
});

import { getSchema, type JSONContent } from "@tiptap/core";
import { DOMSerializer, Node as PMNode } from "@tiptap/pm/model";
import { editorExtensions } from "@/components/editor/extensions";
import { EDITOR_FONTS } from "@/lib/cms/editor-fonts";
import { MEDIA_PREFIX, sanitizePostHtml } from "@/lib/cms/sanitize";

const IMG = (name: string) => `${MEDIA_PREFIX}inline/${name}`;

/** Every format the editor can produce, in the form sanitizePostHtml saves it. */
const SAVED = [
  `<h2 style="text-align:center">Heading two</h2>`,
  `<h3>Heading three</h3>`,
  `<h4 style="text-align:right">Heading four</h4>`,
  `<p style="text-align:left">` +
    EDITOR_FONTS.map((f) => `<span style="font-family:${f.value}">${f.label}</span>`).join(" ") +
    `</p>`,
  `<p style="text-align:justify"><span style="font-size:18px">Sized</span> <span style="color:#c0392b">Red</span> ` +
    `<span style="font-family:var(--font-ed-lora);font-size:24px;color:#123abc">Combo</span> ` +
    `<mark style="background-color:#fef08a">Marked</mark> <mark>Plain</mark> ` +
    `<strong>Bold</strong> <em>Italic</em> <u>Under</u> <s>Strike</s> ` +
    `<a href="https://example.com/a?x=1&amp;y=2">Link</a> <a href="mailto:hi@example.com">Mail</a></p>`,
  `<ul><li><p>Bullet</p></li></ul>`,
  `<ol><li><p>Number</p></li></ol>`,
  `<blockquote><p>Quote</p></blockquote>`,
  `<hr />`,
  `<img src="${IMG("a.webp")}" alt="Small one" width="800" height="600" data-size="small" />`,
  // An older image saved before sizes existed.
  `<img src="${IMG("b.png")}" alt="" data-size="medium" />`,
  `<img src="${IMG("c.jpg")}" alt="Full one" width="10000" height="1" data-size="full" />`,
].join("");

describe("sanitizePostHtml keeps the editor output", () => {
  it("keeps every allowed format exactly", () => {
    expect(sanitizePostHtml(SAVED)).toBe(SAVED);
  });

  it("turns the browser's rgb() colors back into the editor's hex values", () => {
    // What editor.getHTML() really returns in a browser (styles go through cssText).
    const browser =
      `<p style="text-align: center;"><span style="font-family: var(--font-ed-lora); font-size: 30px; color: rgb(18, 58, 188);">a</span>` +
      `<mark style="background-color: rgb(167, 243, 208);">b</mark></p><hr style="">`;
    expect(sanitizePostHtml(browser)).toBe(
      `<p style="text-align:center"><span style="font-family:var(--font-ed-lora);font-size:30px;color:#123abc">a</span>` +
        `<mark style="background-color:#a7f3d0">b</mark></p><hr />`,
    );
  });

  it("keeps the seed images under seed/", () => {
    const html = `<img src="${MEDIA_PREFIX}seed/post-1.jpg" alt="x" data-size="full" />`;
    expect(sanitizePostHtml(html)).toBe(html);
  });
});

describe("sanitizePostHtml strips attacks", () => {
  const cases: [string, string, string][] = [
    ["script tag", `<p>a</p><script>alert(1)</script>`, `<p>a</p>`],
    ["onerror handler", `<img src="${IMG("a.webp")}" alt="" data-size="full" onerror="alert(1)" />`, `<img src="${IMG("a.webp")}" alt="" data-size="full" />`],
    ["onclick on a block", `<p onclick="alert(1)">a</p>`, `<p>a</p>`],
    ["javascript: link", `<p><a href="javascript:alert(1)">x</a></p>`, `<p>x</p>`],
    ["encoded javascript: link", `<p><a href="jav&#x09;ascript:alert(1)">x</a></p>`, `<p>x</p>`],
    ["relative link", `<p><a href="/admin">x</a></p>`, `<p>x</p>`],
    ["data: image", `<img src="data:image/png;base64,AAAA" alt="" data-size="full" />`, ``],
    ["external image host", `<img src="https://evil.example.com/x.png" alt="" />`, ``],
    ["path escape out of cms-media", `<img src="${MEDIA_PREFIX}../other/x.png" alt="" />`, ``],
    ["style url()", `<p style="background:url(https://evil.example.com/x)">a</p>`, `<p>a</p>`],
    ["expression() in a span", `<span style="color:expression(alert(1))">a</span>`, `a`],
    ["unlisted font", `<span style="font-family:Comic Sans MS">a</span>`, `a`],
    ["unlisted size", `<span style="font-size:13px">a</span>`, `a`],
    ["non-hex color", `<span style="color:red">a</span>`, `a`],
    ["iframe", `<p>a</p><iframe src="https://evil.example.com"></iframe>`, `<p>a</p>`],
    ["classes and ids", `<p class="x" id="y">a</p>`, `<p>a</p>`],
    ["bad data-size", `<img src="${IMG("a.webp")}" alt="" data-size="huge" />`, `<img src="${IMG("a.webp")}" alt="" />`],
    ["percent width", `<img src="${IMG("a.webp")}" alt="" width="100%" height="600" />`, `<img src="${IMG("a.webp")}" alt="" height="600" />`],
    ["negative height", `<img src="${IMG("a.webp")}" alt="" width="800" height="-5" />`, `<img src="${IMG("a.webp")}" alt="" width="800" />`],
    ["exponent width", `<img src="${IMG("a.webp")}" alt="" width="1e9" />`, `<img src="${IMG("a.webp")}" alt="" />`],
    ["non-numeric sizes", `<img src="${IMG("a.webp")}" alt="" width="auto" height="12px" />`, `<img src="${IMG("a.webp")}" alt="" />`],
    ["zero, too big, decimal, padded", `<img src="${IMG("a.webp")}" alt="" width="0" height="10001" />` + `<img src="${IMG("a.webp")}" alt="" width="12.5" height=" 40" />`, `<img src="${IMG("a.webp")}" alt="" /><img src="${IMG("a.webp")}" alt="" />`],
    ["sizes on other tags", `<p width="10" height="10">a</p>`, `<p>a</p>`],
    ["unlisted tags keep their text", `<h1>T</h1><div>d</div>`, `Td`],
  ];
  it.each(cases)("%s", (_name, dirty, clean) => {
    expect(sanitizePostHtml(dirty)).toBe(clean);
  });
});

/* ---------- JSON -> HTML -> sanitized, without a browser ---------- */

const VOID = new Set(["img", "hr", "br"]);
const esc = (s: string, attr = false) =>
  s.replace(attr ? /[&"]/g : /[&<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]!);

class FakeNode {
  children: FakeNode[] = [];
  attrs = new Map<string, string>();
  constructor(public nodeType: number, public tag = "", public text = "") {}
  setAttribute(name: string, value: unknown) {
    this.attrs.set(name, String(value)); // like the DOM: width 800 becomes "800"
  }
  appendChild(child: FakeNode) {
    this.children.push(child);
    return child;
  }
  get html(): string {
    if (this.nodeType === 3) return esc(this.text);
    const inner = this.children.map((c) => c.html).join("");
    if (this.nodeType !== 1) return inner;
    const attrs = [...this.attrs].map(([k, v]) => ` ${k}="${esc(v, true)}"`).join("");
    return VOID.has(this.tag) ? `<${this.tag}${attrs}>` : `<${this.tag}${attrs}>${inner}</${this.tag}>`;
  }
}
const fakeDocument = {
  createElement: (tag: string) => new FakeNode(1, tag),
  createElementNS: (_ns: string, tag: string) => new FakeNode(1, tag),
  createTextNode: (text: string) => new FakeNode(3, "", text),
  createDocumentFragment: () => new FakeNode(11),
};

function editorHtml(json: JSONContent): string {
  const schema = getSchema(editorExtensions);
  const doc = PMNode.fromJSON(schema, json);
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content, {
    document: fakeDocument as unknown as Document,
  });
  return (fragment as unknown as FakeNode).html;
}

type Mark = { type: string; attrs?: Record<string, unknown> };
const t = (text: string, ...marks: Mark[]): JSONContent => ({ type: "text", text, ...(marks.length ? { marks } : {}) });
const style = (attrs: Record<string, unknown>): Mark => ({ type: "textStyle", attrs });
const para = (textAlign: string | null, ...content: JSONContent[]): JSONContent => ({ type: "paragraph", attrs: { textAlign }, content });
const heading = (level: number, textAlign: string | null, text: string): JSONContent => ({
  type: "heading",
  attrs: { level, textAlign },
  content: [t(text)],
});
const image = (src: string, alt: string, size: string, width?: number, height?: number): JSONContent => ({
  type: "image",
  attrs: { src, alt, size, width, height },
});
const sp = t(" ");

const DOC: JSONContent = {
  type: "doc",
  content: [
    heading(2, "center", "Heading two"),
    heading(3, null, "Heading three"),
    heading(4, "right", "Heading four"),
    para("left", ...EDITOR_FONTS.flatMap((f, i) => [...(i ? [sp] : []), t(f.label, style({ fontFamily: f.value }))])),
    para(
      "justify",
      t("Sized", style({ fontSize: "18px" })),
      sp,
      t("Red", style({ color: "#c0392b" })),
      sp,
      t("Combo", style({ fontFamily: "var(--font-ed-lora)", fontSize: "24px", color: "#123abc" })),
      sp,
      t("Marked", { type: "highlight", attrs: { color: "#fef08a" } }),
      sp,
      t("Plain", { type: "highlight" }),
      sp,
      t("Bold", { type: "bold" }),
      sp,
      t("Italic", { type: "italic" }),
      sp,
      t("Under", { type: "underline" }),
      sp,
      t("Strike", { type: "strike" }),
      sp,
      t("Link", { type: "link", attrs: { href: "https://example.com/a?x=1&y=2" } }),
      sp,
      t("Mail", { type: "link", attrs: { href: "mailto:hi@example.com" } }),
    ),
    { type: "bulletList", content: [{ type: "listItem", content: [para(null, t("Bullet"))] }] },
    { type: "orderedList", content: [{ type: "listItem", content: [para(null, t("Number"))] }] },
    { type: "blockquote", content: [para(null, t("Quote"))] },
    { type: "horizontalRule" },
    image(IMG("a.webp"), "Small one", "small", 800, 600),
    image(IMG("b.png"), "", "medium"),
    image(IMG("c.jpg"), "Full one", "full", 10000, 1),
  ],
};

describe("editor round trip", () => {
  it("keeps every format from Tiptap JSON to saved HTML", () => {
    expect(sanitizePostHtml(editorHtml(DOC))).toBe(SAVED);
  });

  it("drops a javascript: link the JSON smuggles in", () => {
    const html = editorHtml({
      type: "doc",
      content: [para(null, t("x", { type: "link", attrs: { href: "javascript:alert(1)" } }))],
    });
    expect(sanitizePostHtml(html)).toBe("<p>x</p>");
  });
});
