"use client";

import { useEffect, useRef, useState } from "react";
import css from "./ButtonTitle.module.css";

/**
 * The Games title as a row of arcade buttons: each letter stands on a stacked
 * base, and presses down when the pointer is on it. While the title is in
 * view, now and then a letter presses on its own, as if someone were mashing
 * buttons. With reduced motion only the pointer presses them.
 */
const IDLE_MIN = 1400;
const IDLE_MAX = 3000;
const TAP_MS = 170;

export default function ButtonTitle({ id, className, text }: { id: string; className: string; text: string }) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [tapped, setTapped] = useState<number | null>(null);
  const letters = [...text];

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let next: number | null = null;
    let release: number | null = null;
    const stop = () => {
      if (next !== null) window.clearTimeout(next);
      next = null;
    };
    const tap = () => {
      const i = Math.floor(Math.random() * letters.length);
      setTapped(i);
      release = window.setTimeout(() => setTapped(null), TAP_MS);
      next = window.setTimeout(tap, IDLE_MIN + Math.random() * (IDLE_MAX - IDLE_MIN));
    };
    // The last entry is the current one (a busy page can deliver several at once).
    const seen = new IntersectionObserver((es) => {
      if (!es[es.length - 1].isIntersecting) return stop();
      if (next === null) next = window.setTimeout(tap, 900);
    });
    seen.observe(el);
    return () => {
      seen.disconnect();
      stop();
      if (release !== null) window.clearTimeout(release);
    };
  }, [letters.length]);

  return (
    <h2 ref={ref} id={id} className={`${className} ${css.title}`} aria-label={text} onMouseLeave={() => setHeld(null)}>
      {letters.map((ch, i) => (
        <span key={i} className={css.key} data-pressed={held === i || tapped === i} onMouseEnter={() => setHeld(i)} aria-hidden="true">
          {ch}
        </span>
      ))}
    </h2>
  );
}
