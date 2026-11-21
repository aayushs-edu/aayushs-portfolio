"use client";

import { useEffect, useRef } from "react";
import css from "./RainingLetters.module.css";

/**
 * Behind the Hackathons: letters raining down (after 21st.dev's Raining
 * Letters hero), much fainter than there: dim grey glyphs falling at their own
 * speeds, a few at a time flashing up, bigger and faintly, in the colour of the project on
 * show. One canvas, drawn only while on screen; with reduced motion, one still
 * frame.
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
/** Screen area (CSS px²) per letter. */
const AREA_PER_LETTER = 10000;
/** Letter size (CSS px), and fall speed range (CSS px a second). */
const SIZE = 18;
const SPEED = [22, 80] as const;
/** The dim letters, and how often a new few flash (ms), and how many. */
const DIM = "rgb(100 116 139 / 0.12)";
const FLASH_MS = 70;
const FLASHES = [1, 3] as const;

interface Letter {
  char: string;
  x: number;
  y: number;
  speed: number;
}

const pick = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export default function RainingLetters({ accent }: { accent: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const accentRef = useRef(accent);
  useEffect(() => {
    accentRef.current = accent;
  }, [accent]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mono = getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim();
    const font = `${SIZE}px ${mono ? `${mono}, ` : ""}ui-monospace, monospace`;
    const flashFont = `600 ${SIZE * 1.25}px ${mono ? `${mono}, ` : ""}ui-monospace, monospace`;

    let letters: Letter[] = [];
    let flashing = new Set<number>();
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let lastFlash = 0;
    let visible = false;

    const spawn = (y: number): Letter => ({ char: pick(), x: Math.random() * w, y, speed: SPEED[0] + Math.random() * (SPEED[1] - SPEED[0]) });

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = font;
      ctx.fillStyle = DIM;
      ctx.shadowBlur = 0;
      letters.forEach((l, i) => {
        if (!flashing.has(i)) ctx.fillText(l.char, l.x, l.y);
      });
      ctx.font = flashFont;
      ctx.fillStyle = accentRef.current;
      ctx.globalAlpha = 0.16;
      flashing.forEach((i) => {
        const l = letters[i];
        if (l) ctx.fillText(l.char, l.x, l.y);
      });
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (const l of letters) {
        l.y += l.speed * dt;
        if (l.y > h + SIZE) Object.assign(l, spawn(-SIZE));
      }
      if (now - lastFlash > FLASH_MS) {
        lastFlash = now;
        flashing = new Set();
        const n = FLASHES[0] + Math.floor(Math.random() * (FLASHES[1] - FLASHES[0] + 1));
        for (let i = 0; i < n; i++) flashing.add(Math.floor(Math.random() * letters.length));
      }
      draw();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / AREA_PER_LETTER);
      letters = Array.from({ length: count }, (_, i) => letters[i] ?? spawn(Math.random() * h));
      for (const l of letters) if (l.x > w) l.x = Math.random() * w;
      draw();
    };

    const sizer = new ResizeObserver(resize);
    sizer.observe(canvas);
    resize();
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !still;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    seen.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      sizer.disconnect();
      seen.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={css.rain} aria-hidden="true" />;
}
