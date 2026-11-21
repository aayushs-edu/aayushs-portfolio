"use client";

import { useEffect, useId, useRef } from "react";

/**
 * The title as a hand-drawn line that boils: a pencil outline over a painted
 * fill, wobbled by an SVG displacement whose noise is redrawn BOIL_FPS times
 * a second (four drawings in turn), as lines shimmer in hand animation. It
 * rests while out of view; with reduced motion it holds one drawing.
 */
const BOIL_FPS = 8;
const SEEDS = [3, 11, 19, 27];
const WOBBLE = 5;

export default function HandDrawnTitle({ id, className, text }: { id: string; className: string; text: string }) {
  const filterId = useId().replace(/:/g, "");
  const ref = useRef<HTMLHeadingElement | null>(null);
  const lineRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const title = ref.current;
    const line = lineRef.current;
    if (!title || !line || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number | null = null;
    let k = 0;
    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };
    // The last entry is the current one (a busy page can deliver several at once).
    const seen = new IntersectionObserver((es) => {
      if (!es[es.length - 1].isIntersecting) return stop();
      if (timer !== null) return;
      timer = window.setInterval(() => {
        k = (k + 1) % SEEDS.length;
        line.style.filter = `url(#${filterId}-${k})`;
      }, 1000 / BOIL_FPS);
    });
    seen.observe(title);
    return () => {
      seen.disconnect();
      stop();
    };
  }, [filterId]);

  return (
    <h2 ref={ref} id={id} className={className}>
      <span
        ref={lineRef}
        style={{
          display: "inline-block",
          color: "rgb(236 228 212 / 0.88)",
          WebkitTextStroke: "1.5px rgb(236 228 212 / 0.95)",
          filter: `url(#${filterId}-0)`,
        }}
      >
        {text}
      </span>
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true" focusable="false">
        {SEEDS.map((seed, k) => (
          <filter key={seed} id={`${filterId}-${k}`} x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale={WOBBLE} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </svg>
    </h2>
  );
}
