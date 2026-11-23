"use client";

import { useEffect, useRef, useState } from "react";
import css from "./PixelTitle.module.css";

/**
 * The Games title as pixel art: a pixel face standing on a stepped block
 * shadow in the coral of the background's glow (fixed, whatever the game). The
 * first time it comes into view its letters drop in one by one, smoothly
 * (the art is pixels, the motion isn't); a letter hops up while the pointer is on it. With
 * reduced motion it just stands there.
 */
export default function PixelTitle({ id, className, text }: { id: string; className: string; text: string }) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The last entry is the current one (a busy page can deliver several at once).
    const seen = new IntersectionObserver(
      (es) => {
        if (!es[es.length - 1].isIntersecting) return;
        setShown(true);
        seen.disconnect();
      },
      { threshold: 0.6 },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  return (
    <h2 ref={ref} id={id} className={`${className} ${css.title}`} aria-label={text} data-shown={shown}>
      {[...text].map((ch, i) => (
        <span key={i} className={css.letter} style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
          {ch}
        </span>
      ))}
    </h2>
  );
}
