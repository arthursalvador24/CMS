"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { Slide } from "@/lib/cms/types";
import { ctaHref } from "@/lib/templates/utils";

const REDUCED = "(prefers-reduced-motion: reduce)";
const WIDE = "(min-width: 768px)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const HOVER_INTENT_MS = 320;

const subscribers = new Map<string, (onChange: () => void) => () => void>();
function subscribeTo(query: string) {
  let subscribe = subscribers.get(query);
  if (!subscribe) {
    subscribe = (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    };
    subscribers.set(query, subscribe);
  }
  return subscribe;
}
function useMedia(query: string, serverValue: boolean) {
  return useSyncExternalStore(subscribeTo(query), () => window.matchMedia(query).matches, () => serverValue);
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Panorama hero: every slide is a photo panel in one row. The open panel takes about two thirds of the
 * width and shows its copy on a white card; the others show their number and title and open on click,
 * a short hover, the arrow keys, or the timer (the card's top line fills over 7s, then the next opens).
 * Phones get a swipe strip with the next photo peeking. Under reduced motion nothing auto-advances.
 */
export function Panorama({ slides, basePath }: { slides: Slide[]; basePath: string }) {
  const count = slides.length;
  const many = count > 1;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  // Server snapshots: assume the calm, wide layout so nothing rotates or scrolls before hydration.
  const reduced = useMedia(REDUCED, true);
  const wide = useMedia(WIDE, true);
  const finePointer = useMedia(FINE_POINTER, false);
  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const intent = useRef<number | undefined>(undefined);
  const pendingIntent = useRef<number | null>(null);
  // When a switch hides the focused control, focus follows into the new card: undefined = leave focus alone,
  // a string = the aria-label of the control to refocus there, null = the card itself.
  const focusTarget = useRef<string | null | undefined>(undefined);
  const rotating = wide && many && !reduced && !paused && !hovered && !focused;

  function show(i: number, fromPanel = false) {
    const next = (i + count) % count;
    const focusedEl = document.activeElement as HTMLElement | null;
    if (wide && (fromPanel || (focusedEl && rowRef.current?.contains(focusedEl)))) {
      focusTarget.current = fromPanel ? null : (focusedEl?.getAttribute("aria-label") ?? null);
    }
    setIndex(next);
    if (!wide) {
      rowRef.current?.children[next]?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }
  function startIntent(i: number, e: PointerEvent<HTMLButtonElement>) {
    if (!finePointer || !wide || e.pointerType !== "mouse") return;
    // A switch slides panels under a resting pointer; only a pointer that actually moved may open one.
    if (e.movementX === 0 && e.movementY === 0) return;
    if (pendingIntent.current === i) return;
    window.clearTimeout(intent.current);
    pendingIntent.current = i;
    intent.current = window.setTimeout(() => {
      pendingIntent.current = null;
      setIndex(i);
    }, HOVER_INTENT_MS);
  }
  function cancelIntent() {
    window.clearTimeout(intent.current);
    pendingIntent.current = null;
  }
  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (!many) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      show(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      show(index - 1);
    }
  }

  useEffect(() => () => window.clearTimeout(intent.current), []);

  useEffect(() => {
    const label = focusTarget.current;
    if (label === undefined) return;
    focusTarget.current = undefined;
    const card = cardRefs.current[index];
    const same = label ? card?.querySelector<HTMLElement>(`[aria-label="${CSS.escape(label)}"]`) : null;
    (same ?? card)?.focus({ preventScroll: true });
  }, [index]);

  // Phones: the strip scrolls freely, so follow the photo the visitor swiped to.
  useEffect(() => {
    const row = rowRef.current;
    if (wide || !row || !many) return;
    const io = new IntersectionObserver(
      (entries) => {
        // The next photo always peeks in, so only a mostly visible photo counts as the current one.
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.6) setIndex(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: row, threshold: 0.6 },
    );
    Array.from(row.children).forEach((child) => io.observe(child));
    return () => io.disconnect();
  }, [wide, many]);

  const current = slides[index];
  const control =
    "m-focus grid size-9 place-items-center border border-slate-200 text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      data-rotating={rotating}
      className="m-pano border-b border-slate-200 bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        cancelIntent();
      }}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      <div ref={rowRef} className="m-pano-row" style={{ "--grow": Math.max(1, 2 * (count - 1)) } as CSSProperties}>
        {slides.map((slide, i) => {
          const active = i === index;
          // Wide screens show one card at a time; on phones every card is part of the strip.
          const hideCopy = wide && !active;
          const label = slide.heading || slide.caption;
          const link = slide.ctaLabel.trim() ? ctaHref(slide.ctaUrl, basePath) : null;
          const ctaClass = "m-focus m-btn m-btn-primary mt-7 min-h-12 max-w-full px-5 py-3 text-[15px] md:text-base";
          const cta = (
            <>
              <span className="break-words">{slide.ctaLabel}</span>
              <ArrowRight aria-hidden size={18} className="shrink-0" />
            </>
          );
          return (
            <div
              key={slide.id}
              data-index={i}
              data-active={active}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="m-panel"
            >
              <div className="m-panel-media">
                <Image
                  src={slide.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 70vw, 86vw"
                  preload={i === 0}
                  className="object-cover"
                />
                <span aria-hidden className="m-panel-shade" />
              </div>

              {many && (
                <button
                  type="button"
                  inert={active || !wide}
                  onClick={() => show(i, true)}
                  onPointerMove={(e) => startIntent(i, e)}
                  onPointerLeave={cancelIntent}
                  aria-label={label ? `Show slide ${i + 1}: ${label}` : `Show slide ${i + 1}`}
                  className="m-panel-tab m-focus"
                >
                  <span className="m-panel-num">{pad(i + 1)}</span>
                  {label && <span className="m-panel-name">{label}</span>}
                </button>
              )}

              <div
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                tabIndex={-1}
                className="m-panel-copy"
                aria-hidden={hideCopy}
                inert={hideCopy}
              >
                {many && (
                  <span aria-hidden className="m-pano-track">
                    <span className="m-pano-fill" onAnimationEnd={() => show(i + 1)} />
                  </span>
                )}
                {slide.heading && (
                  <h2 className="text-[clamp(1.75rem,1.2rem+2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance break-words">
                    {slide.heading}
                  </h2>
                )}
                {slide.caption && (
                  <p className={`${slide.heading ? "mt-4" : ""} max-w-xl text-lg leading-relaxed text-pretty break-words text-slate-600`}>
                    {slide.caption}
                  </p>
                )}
                {link &&
                  (link.startsWith("/") ? (
                    <Link href={link} className={ctaClass}>
                      {cta}
                    </Link>
                  ) : (
                    <a href={link} className={ctaClass}>
                      {cta}
                    </a>
                  ))}
                {many && (
                  <div className="mt-8 hidden items-center justify-between gap-4 border-t border-slate-200 pt-4 md:flex">
                    <p className="text-sm font-semibold text-slate-500 tabular-nums">
                      <span className="text-slate-900">{pad(i + 1)}</span> / {pad(count)}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => show(i - 1)} aria-label="Previous slide" className={control}>
                        <ChevronLeft aria-hidden size={18} />
                      </button>
                      <button type="button" onClick={() => show(i + 1)} aria-label="Next slide" className={control}>
                        <ChevronRight aria-hidden size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaused((p) => !p)}
                        aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                        className={`${control} m-motion-only`}
                      >
                        {paused ? <Play aria-hidden size={15} /> : <Pause aria-hidden size={15} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {many && (
        <div className="m-wrap flex items-center justify-between gap-4 py-4 md:hidden">
          <p className="text-sm font-semibold text-slate-500 tabular-nums">
            <span className="text-slate-900">{pad(index + 1)}</span> / {pad(count)}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => show(index - 1)} aria-label="Previous slide" className={control}>
              <ChevronLeft aria-hidden size={18} />
            </button>
            <button type="button" onClick={() => show(index + 1)} aria-label="Next slide" className={control}>
              <ChevronRight aria-hidden size={18} />
            </button>
          </div>
        </div>
      )}

      {many && (
        <p className="sr-only" aria-live="polite">
          {rotating ? "" : `Slide ${index + 1} of ${count}${current?.heading ? `: ${current.heading}` : ""}`}
        </p>
      )}
    </section>
  );
}
