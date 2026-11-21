"use client";

import { useEffect, useRef } from "react";
import css from "./InputDrift.module.css";

/**
 * The Games background: the outlines of controller inputs (d-pads, lettered
 * face buttons, sticks, shoulder buttons, face-button diamonds) drifting
 * upward at three depths (far ones smaller, dimmer and slower). Now and then
 * one is pressed: it lights in the current game's colour and sends out a
 * ring. Every few seconds a combo goes in: a few neighbours pressed in quick
 * succession, joined by a fading line. All of it very faint.
 *
 * It's held to the view (sticky) so the canvas stays screen-sized, rests
 * while the section is out of view, and is drawn once and kept still with
 * reduced motion.
 */
type Kind = "dpad" | "button" | "stick" | "shoulder" | "diamond";
const KINDS: Kind[] = ["dpad", "button", "stick", "shoulder", "diamond", "button", "dpad", "button"];
const LETTERS = ["A", "B", "X", "Y"];
type Glyph = { kind: Kind; letter: string | null; x: number; y: number; z: number; size: number; vy: number; sway: number; phase: number; turn: number; alpha: number; press: number };
type Ring = { x: number; y: number; r: number; age: number };
type Chain = { points: [number, number][]; age: number };

const AREA_PER_GLYPH = 26000;
const PRESS_MIN = 900;
const PRESS_MAX = 2200;
const COMBO_MIN = 4500;
const COMBO_MAX = 8500;
const COMBO_STEP = 0.13; // seconds between a combo's presses
const PRESS_FADE = 0.6; // seconds
const RING_LIFE = 0.8;
const CHAIN_LIFE = 1.4;
const CREAM = "236 228 212";

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function outline(ctx: CanvasRenderingContext2D, g: Glyph) {
  const s = g.size;
  ctx.beginPath();
  if (g.kind === "dpad") {
    const a = s * 0.17;
    const h = s * 0.5;
    ctx.moveTo(-a, -h);
    ctx.lineTo(a, -h);
    ctx.lineTo(a, -a);
    ctx.lineTo(h, -a);
    ctx.lineTo(h, a);
    ctx.lineTo(a, a);
    ctx.lineTo(a, h);
    ctx.lineTo(-a, h);
    ctx.lineTo(-a, a);
    ctx.lineTo(-h, a);
    ctx.lineTo(-h, -a);
    ctx.lineTo(-a, -a);
    ctx.closePath();
  } else if (g.kind === "button") {
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
  } else if (g.kind === "stick") {
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.moveTo(s * 0.22, 0);
    ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
  } else if (g.kind === "shoulder") {
    ctx.roundRect(-s * 0.7, -s * 0.22, s * 1.4, s * 0.44, s * 0.22);
  } else {
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      ctx.moveTo(dx * s * 0.34 + s * 0.15, dy * s * 0.34);
      ctx.arc(dx * s * 0.34, dy * s * 0.34, s * 0.15, 0, Math.PI * 2);
    }
  }
}

export default function InputDrift({ accent }: { accent: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const accentRef = useRef(hexToRgb(accent));

  useEffect(() => {
    accentRef.current = hexToRgb(accent);
  }, [accent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = ref.current?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !section || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Canvas text can't read a CSS variable: resolve the site's sans first.
    const sans = getComputedStyle(document.body).getPropertyValue("--font-geist-sans").trim() || "sans-serif";
    let w = 0;
    let h = 0;
    let glyphs: Glyph[] = [];
    let rings: Ring[] = [];
    let chains: Chain[] = [];
    const queue: { at: number; g: Glyph }[] = [];

    const seed = () => {
      const n = Math.round((w * h) / AREA_PER_GLYPH);
      glyphs = Array.from({ length: n }, () => {
        // Three depths: far (small, dim, slow), middle, near.
        const z = [0.15, 0.5, 0.9][Math.floor(Math.random() * 3)] + (Math.random() - 0.5) * 0.15;
        const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
        return {
          kind,
          letter: kind === "button" && Math.random() < 0.6 ? LETTERS[Math.floor(Math.random() * LETTERS.length)] : null,
          x: Math.random() * w,
          y: Math.random() * h,
          z,
          size: 12 + z * 28,
          vy: 3 + z * 11,
          sway: 3 + z * 10,
          phase: Math.random() * Math.PI * 2,
          turn: (Math.random() - 0.5) * 0.12,
          alpha: 0.03 + z * 0.075,
          press: 0,
        };
      });
      glyphs.sort((a, b) => a.z - b.z);
      rings = [];
      chains = [];
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineJoin = "round";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      seed();
    };

    let t = 0;
    const pos = (g: Glyph): [number, number] => [g.x + Math.sin(t * 0.4 + g.phase) * g.sway, g.y];

    const paint = () => {
      const tint = accentRef.current;
      ctx.clearRect(0, 0, w, h);

      // The combos' lines, under the glyphs.
      for (const c of chains) {
        const a = 0.16 * (1 - c.age / CHAIN_LIFE);
        ctx.strokeStyle = `rgb(${tint} / ${a.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        c.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (const g of glyphs) {
        const [x, y] = pos(g);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(g.phase + t * g.turn);
        ctx.lineWidth = 1 + g.z * 0.6;
        outline(ctx, g);
        if (g.press > 0) {
          ctx.fillStyle = `rgb(${tint} / ${(0.22 * g.press * (0.5 + g.z)).toFixed(3)})`;
          ctx.fill();
        }
        const lit = g.press * (0.35 + g.z * 0.25);
        ctx.strokeStyle = g.press > 0 ? `rgb(${tint} / ${(g.alpha + lit).toFixed(3)})` : `rgb(${CREAM} / ${g.alpha.toFixed(3)})`;
        ctx.stroke();
        if (g.letter) {
          ctx.font = `600 ${Math.round(g.size * 0.38)}px ${sans}`;
          ctx.fillStyle = `rgb(${CREAM} / ${(g.alpha * 0.9 + lit * 0.6).toFixed(3)})`;
          ctx.fillText(g.letter, 0, 0.5);
        }
        ctx.restore();
      }

      for (const r of rings) {
        const k = r.age / RING_LIFE;
        ctx.strokeStyle = `rgb(${tint} / ${(0.22 * (1 - k)).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r * (0.6 + k * 1.4), 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const press = (g: Glyph) => {
      g.press = 1;
      const [x, y] = pos(g);
      rings.push({ x, y, r: g.size * 0.6, age: 0 });
    };

    // A combo: a near glyph and its two or three nearest near-ish neighbours, in order.
    const combo = (now: number) => {
      const near = glyphs.filter((g) => g.z > 0.4 && g.y > 40 && g.y < h - 40);
      if (near.length < 4) return;
      const first = near[Math.floor(Math.random() * near.length)];
      const picks = [first];
      const count = 3 + Math.floor(Math.random() * 2);
      while (picks.length < count) {
        const last = picks[picks.length - 1];
        const next = near
          .filter((g) => !picks.includes(g))
          .sort((a, b) => Math.hypot(a.x - last.x, a.y - last.y) - Math.hypot(b.x - last.x, b.y - last.y))[0];
        if (!next || Math.hypot(next.x - last.x, next.y - last.y) > 260) break;
        picks.push(next);
      }
      if (picks.length < 3) return;
      picks.forEach((g, i) => queue.push({ at: now + i * COMBO_STEP * 1000, g }));
      chains.push({ points: picks.map(pos), age: 0 });
    };

    let raf = 0;
    let last = 0;
    let nextPress = 0;
    let nextCombo = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      t += dt;
      for (const g of glyphs) {
        g.y -= g.vy * dt;
        if (g.y < -40) {
          g.y = h + 40;
          g.x = Math.random() * w;
        }
        if (g.press > 0) g.press = Math.max(0, g.press - dt / PRESS_FADE);
      }
      rings = rings.filter((r) => (r.age += dt) < RING_LIFE);
      chains = chains.filter((c) => (c.age += dt) < CHAIN_LIFE);
      while (queue.length && queue[0].at <= now) press(queue.shift()!.g);

      if (!nextCombo) nextCombo = now + 2500;
      if (now > nextPress && glyphs.length) {
        press(glyphs[Math.floor(Math.random() * glyphs.length)]);
        nextPress = now + PRESS_MIN + Math.random() * (PRESS_MAX - PRESS_MIN);
      }
      if (now > nextCombo) {
        combo(now);
        nextCombo = now + COMBO_MIN + Math.random() * (COMBO_MAX - COMBO_MIN);
      }
      paint();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || reduced) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    paint();
    const ro = new ResizeObserver(() => {
      resize();
      paint();
    });
    ro.observe(canvas);
    // The last entry is the current one (a busy page can deliver several at once).
    const seen = new IntersectionObserver((es) => (es[es.length - 1].isIntersecting ? start() : stop()));
    seen.observe(section);
    return () => {
      stop();
      ro.disconnect();
      seen.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={css.drift} aria-hidden="true">
      <div className={css.view}>
        <canvas ref={canvasRef} className={css.canvas} />
      </div>
    </div>
  );
}
