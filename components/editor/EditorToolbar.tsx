"use client";

import type { ChainedCommands, Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Highlighter,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  TextQuote,
  Trash2,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EDITOR_FONTS, EDITOR_FONT_SIZES, EDITOR_IMAGE_SIZES } from "@/lib/cms/editor-fonts";
import { MAX_UPLOAD_BYTES } from "@/lib/cms/upload";
import { ALIGNMENTS, SAFE_HREF, type ImageSize } from "./extensions";
import type { UploadImage } from "./RichTextEditor";

// The toolbar renders only in the browser (after the editor exists), so this cannot mismatch on hydration.
const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd" : "Ctrl";
const ICON = 18;
const HEX6 = /^#[0-9a-f]{6}$/i;
const ALIGN_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify };
const ALIGN_KEYS = { left: "L", center: "E", right: "R", justify: "J" };
const SIZE_LABELS: Record<ImageSize, string> = { small: "Small", medium: "Medium", full: "Full width" };

/** "example.com" -> "https://example.com", "me@x.com" -> "mailto:me@x.com"; null when it is not a usable link. */
export function normalizeHref(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (SAFE_HREF.test(value)) return value;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(value)) return `mailto:${value}`;
  if (/^[\w-]+(\.[\w-]+)+([/?#]\S*)?$/.test(value)) return `https://${value}`;
  return null;
}

function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const style = e.getAttributes("textStyle");
      const sel = e.state.selection;
      const image = sel instanceof NodeSelection && sel.node.type.name === "image" ? sel.node : null;
      return {
        block: ([2, 3, 4].find((level) => e.isActive("heading", { level })) ?? "p").toString(),
        fontFamily: (style.fontFamily as string | undefined) ?? "",
        fontSize: (style.fontSize as string | undefined) ?? "",
        color: (style.color as string | undefined) ?? "",
        highlightColor: (e.getAttributes("highlight").color as string | undefined) ?? "",
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        highlight: e.isActive("highlight"),
        align: ALIGNMENTS.find((a) => e.isActive({ textAlign: a })) ?? "left",
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        link: e.isActive("link"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        image: image ? { alt: image.attrs.alt as string, size: image.attrs.size as ImageSize } : null,
      };
    },
  });
}

type BtnProps = {
  label: string;
  keys?: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  expanded?: boolean;
};

function Btn({ label, keys, pressed, disabled, onClick, children, expanded }: BtnProps) {
  return (
    <button
      type="button"
      className="rte-btn"
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-keyshortcuts={keys?.replace("Cmd", "Meta").replace("Ctrl", "Control")}
      title={keys ? `${label} (${keys})` : label}
      disabled={disabled}
      // Keep the editor's selection while clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rte-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}

export function EditorToolbar({ editor, uploadImage }: { editor: Editor; uploadImage: UploadImage }) {
  const s = useToolbarState(editor);
  const [highlightPick, setHighlightPick] = useState("#fef08a");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const linkInput = useRef<HTMLInputElement>(null);

  const run = (command: (chain: ChainedCommands) => ChainedCommands) => command(editor.chain().focus()).run();
  const highlightColor = HEX6.test(s.highlightColor) ? s.highlightColor.toLowerCase() : highlightPick;

  const openLink = () => {
    setLinkDraft((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkError(null);
    setLinkOpen(true);
  };

  // Ctrl/Cmd+K opens the link field from inside the editor.
  useEffect(() => {
    const dom = editor.view.dom;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setLinkDraft((editor.getAttributes("link").href as string | undefined) ?? "");
        setLinkError(null);
        setLinkOpen(true);
      }
    };
    dom.addEventListener("keydown", onKey);
    return () => dom.removeEventListener("keydown", onKey);
  }, [editor]);

  useEffect(() => {
    if (linkOpen) linkInput.current?.focus();
  }, [linkOpen]);

  const applyLink = () => {
    if (!linkDraft.trim()) return removeLink();
    const href = normalizeHref(linkDraft);
    if (!href) return setLinkError("Use a web address (https://...) or an email address.");
    const { empty } = editor.state.selection;
    if (empty && !editor.isActive("link")) {
      // Nothing selected: insert the address itself as the link text.
      editor.chain().focus().insertContent({ type: "text", text: linkDraft.trim(), marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  };

  const insertImage = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) return setNotice("Images must be 5 MB or smaller.");
    setNotice(null);
    setUploading(true);
    try {
      const result = await uploadImage(file);
      if (!result.ok) return setNotice(result.error);
      const src = result.data.url;
      const image = { type: "image", attrs: { src, alt: "", size: "full" } };
      const sel = editor.state.selection;
      // With an image selected, add the new one after it instead of replacing it.
      if (sel instanceof NodeSelection) editor.chain().focus().insertContentAt(sel.to, image).run();
      else editor.chain().focus().insertContent(image).run();
      // Select the new image so its size and alt text controls show right away.
      let found = -1;
      editor.state.doc.descendants((node, pos) => {
        if (found < 0 && node.type.name === "image" && node.attrs.src === src) found = pos;
        return found < 0;
      });
      if (found >= 0) editor.commands.setNodeSelection(found);
      setNotice("Image added. Describe it in the alt text field.");
    } catch {
      setNotice("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const updateImage = (attrs: { alt?: string; size?: ImageSize }) => {
    const { from } = editor.state.selection;
    editor.chain().updateAttributes("image", attrs).setNodeSelection(from).run();
  };

  const setBlock = (value: string) =>
    run((c) => (value === "p" ? c.setParagraph() : c.setHeading({ level: Number(value) as 2 | 3 | 4 })));

  return (
    <div className="rte-bar">
      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        <Group label="History">
          <Btn label="Undo" keys={`${MOD}+Z`} disabled={!s.canUndo} onClick={() => run((c) => c.undo())}>
            <Undo2 size={ICON} aria-hidden />
          </Btn>
          <Btn label="Redo" keys={`${MOD}+Shift+Z`} disabled={!s.canRedo} onClick={() => run((c) => c.redo())}>
            <Redo2 size={ICON} aria-hidden />
          </Btn>
        </Group>

        <Group label="Text style">
          <select
            className="rte-select rte-select-block"
            aria-label="Paragraph style"
            title={`Paragraph style (${MOD}+Alt+0, 2, 3, 4)`}
            value={s.block}
            onChange={(e) => setBlock(e.target.value)}
          >
            <option value="p">Paragraph</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>
          <select
            className="rte-select rte-select-font"
            aria-label="Font"
            value={s.fontFamily}
            onChange={(e) => run((c) => (e.target.value ? c.setFontFamily(e.target.value) : c.unsetFontFamily()))}
          >
            <option value="">Default font</option>
            {EDITOR_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <select
            className="rte-select rte-select-size"
            aria-label="Font size"
            value={s.fontSize}
            onChange={(e) => run((c) => (e.target.value ? c.setFontSize(e.target.value) : c.unsetFontSize()))}
          >
            <option value="">Default size</option>
            {EDITOR_FONT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size.replace("px", " px")}
              </option>
            ))}
          </select>
        </Group>

        <Group label="Text formatting">
          <Btn label="Bold" keys={`${MOD}+B`} pressed={s.bold} onClick={() => run((c) => c.toggleBold())}>
            <Bold size={ICON} aria-hidden />
          </Btn>
          <Btn label="Italic" keys={`${MOD}+I`} pressed={s.italic} onClick={() => run((c) => c.toggleItalic())}>
            <Italic size={ICON} aria-hidden />
          </Btn>
          <Btn label="Underline" keys={`${MOD}+U`} pressed={s.underline} onClick={() => run((c) => c.toggleUnderline())}>
            <Underline size={ICON} aria-hidden />
          </Btn>
          <Btn label="Strikethrough" keys={`${MOD}+Shift+S`} pressed={s.strike} onClick={() => run((c) => c.toggleStrike())}>
            <Strikethrough size={ICON} aria-hidden />
          </Btn>
          <Btn label="Clear formatting" onClick={() => run((c) => c.unsetAllMarks().clearNodes())}>
            <RemoveFormatting size={ICON} aria-hidden />
          </Btn>
        </Group>

        <Group label="Color">
          <label className="rte-color" title="Text color">
            <Baseline size={ICON} aria-hidden />
            <input
              type="color"
              aria-label="Text color"
              value={HEX6.test(s.color) ? s.color.toLowerCase() : "#000000"}
              // No focus() here: it would close the browser's color picker while dragging.
              onChange={(e) => editor.chain().setColor(e.target.value).run()}
            />
          </label>
          <Btn label="Default text color" disabled={!s.color} onClick={() => run((c) => c.unsetColor())}>
            <span className="rte-swatch-reset" aria-hidden>
              A
            </span>
          </Btn>
          <Btn
            label="Highlight"
            keys={`${MOD}+Shift+H`}
            pressed={s.highlight}
            onClick={() => run((c) => (s.highlight ? c.unsetHighlight() : c.setHighlight({ color: highlightColor })))}
          >
            <Highlighter size={ICON} aria-hidden />
          </Btn>
          <label className="rte-color" title="Highlight color">
            <input
              type="color"
              aria-label="Highlight color"
              value={highlightColor}
              onChange={(e) => {
                setHighlightPick(e.target.value);
                editor.chain().setHighlight({ color: e.target.value }).run();
              }}
            />
          </label>
        </Group>

        <Group label="Alignment">
          {ALIGNMENTS.map((align) => {
            const Icon = ALIGN_ICONS[align];
            return (
              <Btn
                key={align}
                label={`Align ${align}`}
                keys={`${MOD}+Shift+${ALIGN_KEYS[align]}`}
                pressed={s.align === align}
                onClick={() => run((c) => c.setTextAlign(align))}
              >
                <Icon size={ICON} aria-hidden />
              </Btn>
            );
          })}
        </Group>

        <Group label="Blocks">
          <Btn label="Bulleted list" keys={`${MOD}+Shift+8`} pressed={s.bulletList} onClick={() => run((c) => c.toggleBulletList())}>
            <List size={ICON} aria-hidden />
          </Btn>
          <Btn label="Numbered list" keys={`${MOD}+Shift+7`} pressed={s.orderedList} onClick={() => run((c) => c.toggleOrderedList())}>
            <ListOrdered size={ICON} aria-hidden />
          </Btn>
          <Btn label="Quote" keys={`${MOD}+Shift+B`} pressed={s.blockquote} onClick={() => run((c) => c.toggleBlockquote())}>
            <TextQuote size={ICON} aria-hidden />
          </Btn>
          <Btn label="Horizontal line" onClick={() => run((c) => c.setHorizontalRule())}>
            <Minus size={ICON} aria-hidden />
          </Btn>
        </Group>

        <Group label="Insert">
          <Btn label="Link" keys={`${MOD}+K`} pressed={s.link} expanded={linkOpen} onClick={openLink}>
            <Link size={ICON} aria-hidden />
          </Btn>
          <Btn label="Remove link" disabled={!s.link} onClick={removeLink}>
            <Unlink size={ICON} aria-hidden />
          </Btn>
          <Btn label="Insert image" disabled={uploading} onClick={() => fileInput.current?.click()}>
            <ImagePlus size={ICON} aria-hidden />
          </Btn>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              void insertImage(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </Group>
      </div>

      {linkOpen && (
        <div className="rte-panel rte-linkbar" role="group" aria-label="Link">
          <label className="rte-field">
            <span>Link address</span>
            <input
              ref={linkInput}
              type="text"
              inputMode="url"
              placeholder="https://example.com or name@example.com"
              value={linkDraft}
              aria-invalid={linkError ? true : undefined}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setLinkOpen(false);
                  editor.commands.focus();
                }
              }}
            />
          </label>
          <div className="rte-panel-actions">
            <button type="button" className="rte-action rte-action-primary" onClick={applyLink}>
              Apply
            </button>
            {s.link && (
              <button type="button" className="rte-action" onClick={removeLink}>
                Remove link
              </button>
            )}
            <button type="button" className="rte-action" onClick={() => setLinkOpen(false)}>
              Cancel
            </button>
          </div>
          {linkError && (
            <p className="rte-error" role="alert">
              {linkError}
            </p>
          )}
        </div>
      )}

      {s.image && (
        <div className="rte-panel rte-imagebar" role="group" aria-label="Selected image">
          <div className="rte-segmented" role="group" aria-label="Image size">
            {EDITOR_IMAGE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className="rte-action"
                aria-pressed={s.image?.size === size}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateImage({ size })}
              >
                {SIZE_LABELS[size]}
              </button>
            ))}
          </div>
          <label className="rte-field">
            <span>Alt text</span>
            <input
              type="text"
              placeholder="Describe the image for screen readers"
              value={s.image.alt}
              onChange={(e) => updateImage({ alt: e.target.value })}
            />
          </label>
          <button type="button" className="rte-action rte-action-danger" onClick={() => run((c) => c.deleteSelection())}>
            <Trash2 size={16} aria-hidden /> Remove image
          </button>
        </div>
      )}

      <p className="rte-notice" role="status" aria-live="polite">
        {uploading ? "Uploading image..." : notice}
      </p>
    </div>
  );
}
