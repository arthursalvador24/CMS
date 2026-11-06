"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { ActionResult } from "@/lib/cms/action-result";
import { uploadInlineImage } from "@/lib/cms/actions/posts";
import { EditorToolbar } from "./EditorToolbar";
import { editorExtensions } from "./extensions";
import "./editor.css";

export type EditorValue = { json: JSONContent; html: string };
export type UploadImage = (file: File) => Promise<ActionResult<{ path: string; url: string }>>;

export type RichTextEditorProps = {
  /** Saved Tiptap JSON (posts.content_json). Wins over initialHtml. Read once, on mount. */
  initialJson?: unknown;
  /** Saved HTML (posts.content_html), used when there is no JSON yet (seed posts). Read once, on mount. */
  initialHtml?: string;
  /** Called on every edit with plain JSON and HTML. Send both to savePost(); the server sanitizes the HTML. */
  onChange?: (value: EditorValue) => void;
  /** Uploads a body image and returns its public URL. Defaults to the uploadInlineImage server action. */
  onUploadImage?: UploadImage;
  /** Accessible name of the writing area. */
  label?: string;
  className?: string;
};

const uploadWithAction: UploadImage = (file) => {
  const formData = new FormData();
  formData.set("file", file);
  return uploadInlineImage(formData);
};

/**
 * Pasted styles, classes and ids are dropped, so the editor never shows formatting the site would strip.
 * Copy and paste inside the editor (marked with data-pm-slice) keeps its formatting.
 */
function cleanPastedHtml(html: string): string {
  if (html.includes("data-pm-slice")) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("[style],[class],[id]").forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("class");
    el.removeAttribute("id");
  });
  return doc.body.innerHTML;
}

/**
 * Blog post editor. Structure and class hooks only (rte-*); the look lives in editor.css.
 * Remount it (change its key) to load a different post.
 */
export function RichTextEditor({
  initialJson,
  initialHtml,
  onChange,
  onUploadImage = uploadWithAction,
  label = "Post body",
  className,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const editor = useEditor({
    extensions: editorExtensions,
    content: (initialJson as JSONContent | null | undefined) ?? initialHtml ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "rte-content", role: "textbox", "aria-multiline": "true", "aria-label": label },
      transformPastedHTML: cleanPastedHtml,
    },
    // structuredClone: ProseMirror builds attrs with Object.create(null), which server actions cannot send.
    onUpdate: ({ editor }) => onChangeRef.current?.({ json: structuredClone(editor.getJSON()), html: editor.getHTML() }),
  });

  return (
    <div className={className ? `rte ${className}` : "rte"}>
      {editor ? <EditorToolbar editor={editor} uploadImage={onUploadImage} /> : <div className="rte-bar rte-bar-loading" />}
      <EditorContent editor={editor} className="rte-body" />
    </div>
  );
}
