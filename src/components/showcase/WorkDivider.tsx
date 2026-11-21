"use client";

import { useLayoutEffect, useRef, type MouseEvent } from "react";
import css from "./WorkDivider.module.css";

/** At the top of the page, "My Work" sits this far (px) above the window's bottom, over the hero. */
const START_FROM_BOTTOM = 120;
/** The lines draw out over the last part of its way down (share of the scroll). */
const LINES_FROM = 0.7;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Between the hero and the work. "my work", thin and small, with an arrow
 * beside it, starts near the bottom of the hero and slides down the page as
 * you scroll, landing between two white lines once the divider reaches the
 * middle of the window; the lines draw out from it as it arrives. The arrow takes you to
 * the first section. With reduced motion it simply sits between the lines.
 */
export default function WorkDivider({ target }: { target: string }) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const group = groupRef.current;
    if (!row || !group || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Page positions (px from the top of the page): where it starts, where it rests, and the scroll at which it gets there.
    let start = 0;
    let rest = 0;
    let end = 1;
    let raf = 0;

    const measure = () => {
      const r = row.getBoundingClientRect();
      rest = r.top + window.scrollY + r.height / 2;
      start = Math.min(rest, window.innerHeight - START_FROM_BOTTOM);
      end = Math.max(1, rest - window.innerHeight / 2);
    };
    const paint = () => {
      raf = 0;
      const p = clamp01(window.scrollY / end);
      group.style.transform = `translate(-50%, ${((start - rest) * (1 - p)).toFixed(1)}px)`;
      const draw = smooth(clamp01((p - LINES_FROM) / (1 - LINES_FROM)));
      for (const line of lineRefs.current) if (line) line.style.transform = `scaleX(${draw.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onResize = () => {
      group.style.transform = "translate(-50%, 0)";
      measure();
      paint();
    };

    onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    const to = document.getElementById(target);
    if (!to) return;
    event.preventDefault();
    to.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className={css.divider}>
      <div ref={rowRef} className={css.row}>
        {["left", "right"].map((side, i) => (
          <span
            key={side}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`${css.line} ${css[side]}`}
            aria-hidden="true"
          />
        ))}
        {/* The words and the arrow, moved by scroll; they rest with the words between the lines. */}
        <div ref={groupRef} className={css.group}>
          <h2 className={css.label}>My Work</h2>
          <a href={`#${target}`} className={css.arrow} onClick={go} aria-label="Down to the work">
            <svg viewBox="0 0 12 24" className={css.arrowIcon} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2v19" />
              <path d="M2 17l4 4 4-4" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
