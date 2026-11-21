"use client";

import { useEffect, useRef } from "react";
import css from "./HackathonsSection.module.css";

/** The glyphs a letter passes through on its way (after 21st.dev's Raining Letters hero). */
const GLYPHS = "!<>-_\\/[]{}—=+*^?#";
/** How often it glitches again while on screen (ms). */
const AGAIN_MS = 9000;

const escape = (c: string) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c);

/**
 * Scrambles an element's text into `text`: each letter flickers through
 * glyphs between a random start and end frame, then settles. `spread` is the
 * frame window: wide for the first reveal, narrow for a passing glitch.
 */
function scramble(el: HTMLElement, text: string, from: string, spread: number, onDone: () => void) {
  const queue = [...text].map((to, i) => {
    const start = Math.floor(Math.random() * spread);
    return { from: from[i] ?? "", to, start, end: start + 4 + Math.floor(Math.random() * spread), glyph: "" };
  });
  let frame = 0;
  let raf = 0;
  const update = () => {
    let out = "";
    let done = 0;
    for (const q of queue) {
      if (frame >= q.end) {
        done++;
        out += escape(q.to);
      } else if (frame >= q.start) {
        if (!q.glyph || Math.random() < 0.28) q.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        out += `<span class="dud">${escape(q.glyph)}</span>`;
      } else {
        out += escape(q.from);
      }
    }
    el.innerHTML = out;
    frame++;
    if (done === queue.length) onDone();
    else raf = requestAnimationFrame(update);
  };
  update();
  return () => cancelAnimationFrame(raf);
}

/**
 * The section's heading: scrambled in from glyphs the first time it comes on
 * screen, then glitching briefly now and again, when the pointer comes onto
 * it, and whenever `pulse` changes (a new project). An invisible copy holds
 * the heading's width, so nothing moves while the glyphs (of other widths)
 * flicker. With reduced motion it's plain text.
 */
export default function ScrambleTitle({ id, text, pulse }: { id: string; text: string; pulse: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const glitchRef = useRef<(spread?: number) => void>(() => {});

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop = () => {};
    let timer = 0;
    let revealed = false;
    let visible = false;

    const run = (from: string, spread: number) => {
      stop();
      window.clearTimeout(timer);
      stop = scramble(el, text, from, spread, () => {
        if (visible) timer = window.setTimeout(() => run(text, 14), AGAIN_MS);
      });
    };
    glitchRef.current = (spread = 12) => {
      if (visible && revealed) run(text, spread);
    };

    // Hidden until it first comes on screen, then scrambled in from nothing.
    el.textContent = "";
    const seen = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (!visible) {
          stop();
          window.clearTimeout(timer);
          if (revealed) el.textContent = text;
          return;
        }
        if (!revealed) {
          revealed = true;
          run("", 40);
        } else {
          timer = window.setTimeout(() => run(text, 14), AGAIN_MS);
        }
      },
      { threshold: 0.6 },
    );
    seen.observe(el);
    return () => {
      seen.disconnect();
      stop();
      window.clearTimeout(timer);
      glitchRef.current = () => {};
      el.textContent = text;
    };
  }, [text]);

  useEffect(() => {
    glitchRef.current();
  }, [pulse]);

  return (
    <h2 id={id} className={`${css.title} ${css.scrambleTitle}`} onPointerEnter={() => glitchRef.current(20)}>
      <span className={css.titleSizer} aria-hidden="true">
        {text}
      </span>
      {/* Its contents are written outside React (the scramble). */}
      <span ref={ref} className={css.titleLetters} aria-hidden="true" dangerouslySetInnerHTML={{ __html: text }} />
      <span className="sr-only">{text}</span>
    </h2>
  );
}
