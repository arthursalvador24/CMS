"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Slide } from "@/lib/cms/types";
import { ctaHref } from "@/lib/templates/utils";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Full-width photo with a white caption panel cut into its lower left, and a tab rail along its base.
 * The active tab's progress line (CSS animation, 7s) drives rotation: its animationend advances the slide.
 * Hover, focus and the pause button freeze it; under reduced motion nothing auto-advances.
 */
export function Carousel({ slides, basePath }: { slides: Slide[]; basePath: string }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  // The server snapshot says "reduced" so nothing rotates before hydration.
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true);
  const rotating = count > 1 && !reduced && !paused && !hovered && !focused;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const control = "m-focus grid size-10 place-items-center border border-slate-200 text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      data-rotating={rotating}
      className="m-hero border-b border-slate-200 bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <div className="relative md:flex md:min-h-[clamp(540px,76svh,800px)] md:items-end">
        <div className="relative h-[min(52svh,420px)] min-h-[260px] overflow-hidden bg-slate-100 md:absolute md:inset-0 md:h-auto">
          {slides.map((slide, i) => (
            <div key={slide.id} className="m-hero-img" data-active={i === index}>
              <Image src={slide.imageUrl} alt="" fill sizes="100vw" preload={i === 0} className="object-cover" />
            </div>
          ))}
        </div>

        <div className="m-wrap relative">
          <div
            className="grid bg-white pt-7 pb-8 md:-ml-10 md:w-[min(44rem,64%)] md:px-10 md:pt-11 md:pb-12"
            aria-live={rotating ? "off" : "polite"}
          >
            {slides.map((slide, i) => {
              const active = i === index;
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
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={!active}
                  inert={!active}
                  data-active={active}
                  className="m-slide flex min-w-0 flex-col items-start"
                >
                  {slide.heading && (
                    <h2 className="text-[clamp(1.875rem,1.2rem+2.4vw,3.25rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance break-words">
                      {slide.heading}
                    </h2>
                  )}
                  {slide.caption && (
                    <p className={`${slide.heading ? "mt-4" : ""} max-w-xl text-lg leading-relaxed text-pretty break-words text-slate-600 md:text-xl`}>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {count > 1 && (
        <div className="m-wrap flex items-start gap-4 md:gap-10">
          <ul className="grid min-w-0 flex-1" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {slides.map((slide, i) => {
              const label = slide.heading || slide.caption;
              return (
                <li key={slide.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={label ? `Show slide ${i + 1}: ${label}` : `Show slide ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className="m-tab m-focus group block w-full pr-3 pb-5 text-left md:pr-6"
                  >
                    <span aria-hidden className="relative block h-0.5 overflow-hidden bg-slate-200 group-aria-[current=true]:bg-slate-300">
                      <span className="m-tab-fill absolute inset-0 bg-blue-800" onAnimationEnd={() => go(1)} />
                    </span>
                    <span aria-hidden className="mt-3.5 flex gap-3 text-sm leading-snug text-slate-500 transition-colors group-hover:text-slate-900 group-aria-[current=true]:text-slate-900">
                      <span className="font-semibold tabular-nums">{pad(i + 1)}</span>
                      {label && <span className="hidden min-w-0 font-medium md:line-clamp-2">{label}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex shrink-0 gap-2 pt-3.5 pb-5 md:pt-4">
            <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className={control}>
              <ChevronLeft aria-hidden size={18} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next slide" className={control}>
              <ChevronRight aria-hidden size={18} />
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              className={`${control} m-motion-only`}
            >
              {paused ? <Play aria-hidden size={16} /> : <Pause aria-hidden size={16} />}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
