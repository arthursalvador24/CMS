"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Slide } from "@/lib/cms/types";
import { ctaHref } from "@/lib/templates/utils";
import { WRAP, fit } from "./ui";

const INTERVAL_MS = 6500;
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const pad = (n: number) => String(n).padStart(2, "0");
const BUTTON =
  "grid size-11 place-items-center border border-stone-100/35 text-stone-100 transition-colors hover:border-stone-100 hover:bg-stone-100 hover:text-stone-950";

/**
 * Full-bleed hero. Each new slide rises in from the bottom edge like a blind (clip-path),
 * driven by the timeline bar: when the active bar fills, the next slide shows.
 * Hover, focus or the pause button freeze the bar; reduced motion never auto-rotates and crossfades instead.
 */
export function Carousel({
  slides,
  basePath,
}: {
  slides: Slide[];
  basePath: string;
}) {
  const count = slides.length;
  const [{ index, prev }, setPos] = useState({ index: 0, prev: -1 });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  // The server snapshot says "reduced" so nothing rotates before hydration.
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => true,
  );
  const rotating = count > 1 && !reduced && !paused && !hovered && !focused;

  const go = (to: number) =>
    setPos((p) => {
      const next = (to + count) % count;
      return next === p.index ? p : { index: next, prev: p.index };
    });

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      data-moved={prev >= 0 || undefined}
      className="relative bg-stone-950 text-stone-100"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {/* All slides share one grid cell, so the hero is as tall as its tallest slide and never jumps. */}
      <div className="grid" aria-live={rotating ? "off" : "polite"}>
        {slides.map((slide, i) => {
          const active = i === index;
          const link = slide.ctaLabel.trim()
            ? ctaHref(slide.ctaUrl, basePath)
            : null;
          const cta =
            "inline-flex items-center gap-3 border border-stone-100 px-6 py-3.5 text-sm font-semibold tracking-[0.14em] uppercase transition-colors hover:bg-stone-100 hover:text-stone-950";
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              data-state={active ? "active" : i === prev ? "prev" : "idle"}
              className="onyx-slide relative col-start-1 row-start-1 flex min-h-[max(32rem,80svh)] flex-col justify-end overflow-hidden md:min-h-[max(38rem,calc(100svh_-_4.5rem))]"
            >
              <Image
                src={slide.imageUrl}
                alt=""
                fill
                sizes="100vw"
                preload={i === 0}
                className="onyx-slide-img object-cover"
              />
              {/* The scrim grows with the text block, so long headings stay readable on bright photos. */}
              <div className="onyx-scrim relative w-full pt-40">
                <div
                  className={`${WRAP} ${count > 1 ? "pb-32 md:pb-36" : "pb-16 md:pb-24"}`}
                >
                  <div className="onyx-rise max-w-[min(100%,82rem)]">
                    {slide.heading && (
                      <h2
                        className={`onyx-display text-balance wrap-anywhere ${fit(
                          slide.heading,
                          [
                            "text-[clamp(3.5rem,10.5vw,10.5rem)]",
                            "text-[clamp(2.5rem,6.6vw,7rem)]",
                            "text-[clamp(2rem,4.4vw,4.75rem)]",
                          ],
                        )}`}
                      >
                        {slide.heading}
                      </h2>
                    )}
                    {slide.caption && (
                      <p className="mt-6 max-w-2xl text-lg text-pretty text-stone-200 wrap-anywhere md:text-xl">
                        {slide.caption}
                      </p>
                    )}
                    {link && (
                      <p className="mt-8">
                        {link.startsWith("/") ? (
                          <Link href={link} className={cta}>
                            {slide.ctaLabel}
                            <ArrowRight
                              aria-hidden
                              size={18}
                              className="shrink-0"
                            />
                          </Link>
                        ) : (
                          <a href={link} className={cta}>
                            {slide.ctaLabel}
                            {link.startsWith("#") ? (
                              <ArrowRight
                                aria-hidden
                                size={18}
                                className="shrink-0"
                              />
                            ) : (
                              <ArrowUpRight
                                aria-hidden
                                size={18}
                                className="shrink-0"
                              />
                            )}
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div
            className={`${WRAP} flex items-center gap-4 pb-5 md:gap-6 md:pb-8`}
          >
            <p
              className="onyx-label hidden shrink-0 text-stone-400 tabular-nums sm:block"
              aria-hidden
            >
              <span className="text-stone-100">{pad(index + 1)}</span> /{" "}
              {pad(count)}
            </p>
            <div className="flex min-w-0 flex-1 gap-1.5">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className="group flex-1 py-5"
                >
                  <span className={`relative block h-0.5 overflow-hidden text-stone-100 transition-colors group-hover:bg-stone-100/60 ${i === index ? "bg-stone-100/50" : "bg-stone-100/20"}`}>
                    {i === index &&
                      (reduced ? (
                        <span className="absolute inset-0 bg-current" />
                      ) : (
                        <span
                          className="onyx-fill"
                          style={{
                            animationDuration: `${INTERVAL_MS}ms`,
                            animationPlayState: rotating ? "running" : "paused",
                          }}
                          onAnimationEnd={() => go(index + 1)}
                        />
                      ))}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous slide"
                className={BUTTON}
              >
                <ArrowLeft aria-hidden size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next slide"
                className={BUTTON}
              >
                <ArrowRight aria-hidden size={18} />
              </button>
              {/* Hidden by CSS under reduced motion (nothing rotates), so the server HTML already has it and nothing shifts. */}
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                className={`${BUTTON} motion-reduce:hidden`}
              >
                {paused ? <Play aria-hidden size={18} /> : <Pause aria-hidden size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
