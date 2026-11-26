"use client";

import { useEffect, useRef } from "react";
import { usePerfLite } from "@/lib/perf";
import map from "./overworld.generated.json";
import css from "./GamesSection.module.css";

/** The glints' colour, and how often they're drawn (they fade slowly, so 30 a second is smooth). */
const GLINT = "#4a77a3";
const FRAME_MS = 32;
const LITE_FRAME_MS = 64;
/** Seconds for a glint to brighten and fade, at the slowest and fastest. */
const SLOW = 7;
const FAST = 4;
/** Kept this many map pixels clear of the content. */
const CLEAR = 3;
/** How often the content's place is measured again (it moves when a game's manual is longer). */
const MEASURE_MS = 500;
/** The section's end fades (CSS px), which the glints fade with too. */
const FADE = 320;

/**
 * Light glinting on the overworld's water: short dashes (2–3 pixels) that brighten and
 * fade, each in its own time. One canvas the map's size, laid exactly over
 * the map's background image and above the section's content (with clicks
 * passing through), drawing only on water that nothing covers ([data-cover]
 * and the title). It sits on top on purpose: anything animated under the
 * content makes the browser lift the content into GPU layers, and fast scrolls
 * showed those arriving as black rectangles. Still while off screen or with
 * reduced motion.
 */
export default function MapGlints() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const lite = usePerfLite();

  useEffect(() => {
    const canvas = ref.current;
    const section = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !section || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frameMs = lite ? LITE_FRAME_MS : FRAME_MS;
    const sites: { x: number; y: number; len: number; phase: number; speed: number; fade: number }[] = [];
    for (let i = 0; i < map.glints.length; i += 4) {
      const seed = map.glints[i + 2] / 100;
      sites.push({ x: map.glints[i], y: map.glints[i + 1], len: map.glints[i + 3], phase: seed * Math.PI * 2, speed: (Math.PI * 2) / (SLOW - (SLOW - FAST) * ((seed * 7.31) % 1)), fade: 1 });
    }
    let open = sites;
    let measured = 0;
    let raf = 0;
    let last = 0;
    let shown = false;

    /** The sites no content covers, in map pixels. */
    const measure = () => {
      const box = canvas.getBoundingClientRect();
      const k = map.width / box.width;
      const covers = [...section.querySelectorAll("[data-cover], h2")].map((el) => {
        const r = el.getBoundingClientRect();
        return { l: (r.left - box.left) * k - CLEAR, t: (r.top - box.top) * k - CLEAR, r: (r.right - box.left) * k + CLEAR, b: (r.bottom - box.top) * k + CLEAR };
      });
      open = sites.filter((s) => !covers.some((c) => s.x + s.len > c.l && s.x < c.r && s.y + 1 > c.t && s.y < c.b));
      const tall = section.clientHeight;
      for (const s of open) {
        const y = s.y * map.pixel;
        s.fade = Math.max(0, Math.min(1, y / FADE, (tall - y) / FADE));
      }
    };

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, map.width, map.height);
      ctx.fillStyle = GLINT;
      for (const s of open) {
        const a = Math.sin(t * s.speed + s.phase);
        if (a <= 0.35) continue;
        ctx.globalAlpha = ((a - 0.35) / 0.65) ** 2 * s.fade;
        ctx.fillRect(s.x, s.y, s.len, 1);
      }
      ctx.globalAlpha = 1;
    };
    const frame = (now: number) => {
      raf = 0;
      if (now - last >= frameMs) {
        last = now;
        if (now - measured > MEASURE_MS) {
          measured = now;
          measure();
        }
        draw(now);
      }
      if (shown && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf && shown && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const seen = new IntersectionObserver((es) => {
      shown = es[es.length - 1].isIntersecting;
      wake();
    });
    seen.observe(section);
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelAnimationFrame(raf);
      seen.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [lite]);

  return <canvas ref={ref} className={css.glints} width={map.width} height={map.height} style={{ width: map.width * map.pixel, height: map.height * map.pixel }} aria-hidden="true" />;
}
