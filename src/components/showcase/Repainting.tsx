"use client";

import { useEffect, useRef } from "react";
import { WORKS } from "./works";
import css from "./Repainting.module.css";

/**
 * A background: one of the paintings painted again the way Paintwise teaches,
 * big strokes of the broad colours first, then the forms, then the details
 * where the picture changes most, each stroke laid along the edges round it.
 * When one is finished it rests, then the next (chosen at random, each
 * painting once a round) is painted over it: the old one fades out as the new
 * one's wash fades in. The first is chosen at random too. In the hero it fills
 * the hero, fading into the page at the bottom; behind a section it's fainter
 * and runs the full width of the page. It paints only while on screen; with
 * reduced motion, one finished painting. A picker can ask for a painting
 * (`request`); it's told which one is up (`onPainting`).
 */

/** The paintings it works through, in turn (the gallery's, and the early work's). */
const SLUGS = [
  "snowboarding",
  "snorkeling-hawaii",
  "forest-cottage",
  "taj-mahal",
  "soccer-penalty",
  "snowy-cabin",
  "safari-kid",
  "lone-boat",
  "childhood-toys",
];
export const PAINTINGS = SLUGS.flatMap((slug) => {
  const w = WORKS.find((x) => x.slug === slug);
  return w ? [{ title: w.title, src: w.media.image }] : [];
});

/** The three passes, coarse to fine: brush size (CSS px at 1440 wide), how long the pass takes (s), and how different from the pass before a spot must be to get strokes (0–255). */
const PASSES = [
  // The first pass goes quickly: a canvas of a few sparse blobs looks unfinished, not painterly.
  { radius: 32, seconds: 3.5, threshold: 0 },
  { radius: 24, seconds: 11, threshold: 18 },
  { radius: 10, seconds: 13, threshold: 26 },
] as const;
/** How long a stroke takes to lay down (ms), per pass. */
const STROKE_MS = [300, 300, 200];
/**
 * A finished painting rests this long (ms); then the next is painted over it,
 * the old one fading out as the new one's wash fades in over CROSS_MS (quicker
 * for one asked for).
 */
const REST_MS = 7000;
const CROSS_MS = 1800;
const QUICK_CROSS_MS = 900;
/** A painting asked for paints this many times faster. */
const ASKED_SPEED = 2;
/** The underpainting: a soft wash of the picture's own colours laid first, as a painter tones a canvas, so the strokes go on over colour rather than black. How strong it is (0–1), and how coarse (CSS px a cell). */
const UNDERPAINTING = true;
const WASH = 0.6;
const WASH_CELL = 44;

interface Stroke {
  pass: number;
  /** Start, bend, end (CSS px) */
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  width: number;
  color: string;
  /** The bristles' colours, a little lighter and darker */
  light: string;
  dark: string;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The picture (all of it, filling w × h CSS px) averaged over cells of about `cell` px; `at` reads the cell under a point (CSS px, clamped to the picture). */
function sample(img: HTMLImageElement, w: number, h: number, cell: number) {
  const gw = Math.max(2, Math.ceil(w / cell));
  const gh = Math.max(2, Math.ceil(h / cell));
  const c = document.createElement("canvas");
  c.width = gw;
  c.height = gh;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingQuality = "high";
  // Over every cell, so none is left part empty (that read as black at the edges).
  g.drawImage(img, 0, 0, gw, gh);
  const data = g.getImageData(0, 0, gw, gh).data;
  const at = (x: number, y: number) => {
    const i = (Math.min(gh - 1, Math.max(0, Math.floor((y * gh) / h))) * gw + Math.min(gw - 1, Math.max(0, Math.floor((x * gw) / w)))) * 4;
    return [data[i], data[i + 1], data[i + 2]] as const;
  };
  return at;
}

const rgb = (c: readonly number[], k = 0) => `rgb(${c.map((v) => Math.round(Math.min(255, Math.max(0, v + k)))).join(" ")})`;
const lum = (c: readonly number[]) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Every stroke of a painting w × h (CSS px, from its top left), pass by pass, shuffled within each pass. `scale` sizes the brushes. */
function plan(img: HTMLImageElement, w: number, h: number, scale: number, seed: number): Stroke[] {
  const rand = rng(seed);
  const grids = PASSES.map((p) => sample(img, w, h, p.radius * scale));
  const strokes: Stroke[] = [];
  PASSES.forEach((pass, pi) => {
    const r = pass.radius * scale;
    const at = grids[pi];
    const before = pi > 0 ? grids[pi - 1] : null;
    const these: Stroke[] = [];
    // One cell past each edge (the strokes are clipped to the painting), so the edges are as covered as the middle.
    for (let gy = -1; gy <= Math.ceil(h / r); gy++) {
      for (let gx = -1; gx <= Math.ceil(w / r); gx++) {
        const x = (gx + 0.5 + (rand() - 0.5) * 0.8) * r;
        const y = (gy + 0.5 + (rand() - 0.5) * 0.8) * r;
        const c = at(x, y);
        // Later passes paint only where the coarser one got it wrong.
        if (before && dist(c, before(x, y)) < pass.threshold) continue;
        // Along the edge: across the brightness gradient.
        const gxl = lum(at(x + r, y)) - lum(at(x - r, y));
        const gyl = lum(at(x, y + r)) - lum(at(x, y - r));
        let a = Math.hypot(gxl, gyl) > 3 ? Math.atan2(gxl, -gyl) : (rand() - 0.5) * 0.6;
        a += (rand() - 0.5) * 0.35;
        const len = r * (1.6 + rand() * 0.9);
        const bend = (rand() - 0.5) * r * 0.7;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        const x0 = x - (dx * len) / 2;
        const y0 = y - (dy * len) / 2;
        const jitter = (rand() - 0.5) * 14;
        these.push({
          pass: pi,
          x0,
          y0,
          x1: x0 + dx * len,
          y1: y0 + dy * len,
          cx: x - dy * bend,
          cy: y + dx * bend,
          // The first pass a little wider than its spacing, so little shows between its strokes (the underpainting covers the rest).
          width: r * [1, 0.9, 0.8][pi],
          color: rgb(c, jitter),
          light: rgb(c, jitter + 22),
          dark: rgb(c, jitter - 26),
        });
      }
    }
    for (let i = these.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [these[i], these[j]] = [these[j], these[i]];
    }
    strokes.push(...these);
  });
  return strokes;
}

/** Lays the underpainting over the painting's box: the picture shrunk to a few cells and stretched back, so it blurs to soft patches of its colours. */
function underpaint(ctx: CanvasRenderingContext2D, img: HTMLImageElement, box: Box) {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.ceil(box.w / WASH_CELL));
  c.height = Math.max(2, Math.ceil(box.h / WASH_CELL));
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  ctx.save();
  ctx.globalAlpha = WASH;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(c, box.x, box.y, box.w, box.h);
  ctx.restore();
}

/** Where the painting sits on the canvas (CSS px, whole pixels); it can run past the canvas. */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The painting's box in a w × h canvas: filling it, its overflow cropped evenly (cover). */
function fit(img: HTMLImageElement, w: number, h: number): Box {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const bw = Math.round(img.naturalWidth * s);
  const bh = Math.round(img.naturalHeight * s);
  return { x: Math.round((w - bw) / 2), y: Math.round((h - bh) / 2), w: bw, h: bh };
}

/** Runs `draw` with the strokes' coordinates in the painting's box, and clipped to it. */
function inBox(ctx: CanvasRenderingContext2D, box: Box, draw: () => void) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.translate(box.x, box.y);
  draw();
  ctx.restore();
}

/** The point at t (0–1) along a stroke's curve. */
function at(s: Stroke, t: number): [number, number] {
  const u = 1 - t;
  return [u * u * s.x0 + 2 * u * t * s.cx + t * t * s.x1, u * u * s.y0 + 2 * u * t * s.cy + t * t * s.y1];
}

/** Lays the part of a stroke from t0 to t1: the body, then three bristle lines over it. */
function lay(ctx: CanvasRenderingContext2D, s: Stroke, t0: number, t1: number) {
  const [ax, ay] = at(s, t0);
  const [bx, by] = at(s, t1);
  const nx = -(by - ay);
  const ny = bx - ax;
  const n = Math.hypot(nx, ny) || 1;
  ctx.lineCap = "round";
  ctx.globalAlpha = 1;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = Math.max(1, s.width * 0.08);
  for (const [k, colour] of [[-0.32, s.light], [0.05, s.dark], [0.3, s.light]] as const) {
    const ox = (nx / n) * s.width * k;
    const oy = (ny / n) * s.width * k;
    ctx.strokeStyle = colour;
    ctx.beginPath();
    ctx.moveTo(ax + ox, ay + oy);
    ctx.lineTo(bx + ox, by + oy);
    ctx.stroke();
  }
}

interface RepaintingProps {
  /** Behind a section (faint, full width) or filling the hero */
  variant?: "section" | "hero";
  /** Which painting it starts with; without it, one at random */
  startAt?: number;
  /** A painting asked for (by its index in PAINTINGS); `at` makes each ask new */
  request?: { index: number; at: number } | null;
  /** Told the index of each painting as it begins */
  onPainting?: (index: number) => void;
}

/** The indices 0…n-1 but `not`, in a random order. */
function shuffled(n: number, not: number) {
  const out = Array.from({ length: n }, (_, i) => i).filter((i) => i !== not);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function Repainting({ variant = "section", startAt, request = null, onPainting }: RepaintingProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /** The painting before, fading out under the new one */
  const backRef = useRef<HTMLCanvasElement | null>(null);
  const showRef = useRef<(index: number) => void>(() => {});
  const onPaintingRef = useRef(onPainting);
  useEffect(() => {
    onPaintingRef.current = onPainting;
  }, [onPainting]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const back = backRef.current;
    const ctx = canvas?.getContext("2d");
    const bctx = back?.getContext("2d");
    if (!root || !canvas || !back || !ctx || !bctx || PAINTINGS.length === 0) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let which = startAt === undefined ? Math.floor(Math.random() * PAINTINGS.length) : startAt % PAINTINGS.length;
    /** The paintings still to come this round, shuffled: each round shows every one once, never the same twice running */
    let bag: number[] = [];
    const upNext = () => {
      if (!bag.length) bag = shuffled(PAINTINGS.length, which);
      return bag.shift() ?? which;
    };
    let img: HTMLImageElement | null = null;
    /** Where the painting sits, filling the canvas */
    let box: Box = { x: 0, y: 0, w: 0, h: 0 };
    let strokes: Stroke[] = [];
    let next = 0;
    let active: { s: Stroke; t: number }[] = [];
    let painted = 0;
    let raf = 0;
    let last = 0;
    let visible = false;
    let timer = 0;
    let resting = false;
    let alive = true;
    /** The latest painting asked for wins over any still loading */
    let token = 0;
    /** How fast the painting on the canvas goes (faster when it was asked for) */
    let speed = 1;

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
      });

    // Where the painting is now (s from the start), so strokes start at each pass's own pace.
    const passStart = PASSES.map((_, i) => PASSES.slice(0, i).reduce((a, p) => a + p.seconds, 0));
    const counts = () => PASSES.map((_, i) => strokes.filter((s) => s.pass === i).length);
    let perPass: number[] = [];
    let passFirst: number[] = [];

    const begin = () => {
      if (!img) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      box = fit(img, w, h);
      if (UNDERPAINTING) underpaint(ctx, img, box);
      strokes = plan(img, box.w, box.h, Math.max(0.6, Math.min(1.3, w / 1440)), 7 + which * 101);
      perPass = counts();
      passFirst = perPass.map((_, i) => perPass.slice(0, i).reduce((a, b) => a + b, 0));
      next = 0;
      active = [];
      painted = 0;
      resting = false;
      if (still) {
        inBox(ctx, box, () => {
          for (const s of strokes) lay(ctx, s, 0, 1);
        });
        next = strokes.length;
        return;
      }
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const frame = (now: number) => {
      // A finished painting waits for the next; it mustn't finish again (that skipped a painting).
      if (resting) {
        raf = 0;
        return;
      }
      raf = visible ? requestAnimationFrame(frame) : 0;
      const dt = Math.min(50, now - last) * speed;
      last = now;
      painted += dt / 1000;
      // Start the strokes due by now in the current pass.
      let pass = PASSES.findIndex((_, i) => painted < passStart[i] + PASSES[i].seconds);
      if (pass < 0) pass = PASSES.length - 1;
      const due = passFirst[pass] + Math.min(perPass[pass], Math.ceil((perPass[pass] * (painted - passStart[pass])) / PASSES[pass].seconds));
      while (next < Math.min(due, strokes.length)) active.push({ s: strokes[next++], t: 0 });
      // Lay each stroke a little further.
      inBox(ctx, box, () => {
        active = active.filter((a) => {
          const t = Math.min(1, a.t + dt / STROKE_MS[a.s.pass]);
          lay(ctx, a.s, a.t, t);
          a.t = t;
          return t < 1;
        });
      });
      if (next >= strokes.length && active.length === 0) finish();
    };

    // Fades the canvases over `ms`: the front one to `front`, the back one (the painting before) out.
    const fade = (front: number, ms: number) => {
      const how = still ? "none" : `opacity ${ms}ms ease`;
      canvas.style.transition = how;
      back.style.transition = how;
      canvas.style.opacity = String(front);
      back.style.opacity = "0";
    };

    // Paints `index` (once it has loaded) over what's there: the old painting
    // moves to the back canvas and fades out as the new one fades in over it.
    const show = (index: number, fast: boolean) => {
      const mine = ++token;
      window.clearTimeout(timer);
      resting = true;
      load(PAINTINGS[index].src)
        .then((im) => {
          if (!alive || mine !== token) return;
          bctx.setTransform(1, 0, 0, 1, 0, 0);
          bctx.clearRect(0, 0, back.width, back.height);
          bctx.drawImage(canvas, 0, 0);
          for (const [el, o] of [[back, "1"], [canvas, "0"]] as const) {
            el.style.transition = "none";
            el.style.opacity = o;
          }
          void canvas.offsetWidth; // (those start the fade, without a transition)
          which = index;
          img = im;
          bag = bag.filter((i) => i !== index);
          speed = fast ? ASKED_SPEED : 1;
          onPaintingRef.current?.(which);
          begin();
          fade(1, fast ? QUICK_CROSS_MS : CROSS_MS);
        })
        .catch(() => {});
    };
    showRef.current = (index) => show(index % PAINTINGS.length, true);

    const finish = () => {
      if (resting) return;
      resting = true;
      timer = window.setTimeout(() => show(upNext(), false), REST_MS);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (Math.abs(rect.width - w) < 40 && Math.abs(rect.height - h) < 120) return;
      w = rect.width;
      h = rect.height;
      // Soft strokes: drawn at CSS pixel size.
      for (const c of [canvas, back]) {
        c.width = Math.max(1, Math.round(w));
        c.height = Math.max(1, Math.round(h));
      }
      window.clearTimeout(timer);
      begin();
      // The first painting fades in rather than popping in.
      fade(1, CROSS_MS);
    };

    const sizer = new ResizeObserver(resize);
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf && !resting && !still && img) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    load(PAINTINGS[which].src)
      .then((im) => {
        if (!alive) return;
        img = im;
        onPaintingRef.current?.(which);
        sizer.observe(canvas);
        seen.observe(root);
      })
      .catch(() => {});

    return () => {
      alive = false;
      showRef.current = () => {};
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      sizer.disconnect();
      seen.disconnect();
    };
  }, [startAt]);

  useEffect(() => {
    if (request) showRef.current(request.index);
  }, [request]);

  return (
    <div ref={rootRef} className={css.backdrop} data-variant={variant} aria-hidden="true">
      <div className={css.paint}>
        <canvas ref={backRef} className={css.canvas} />
        <canvas ref={canvasRef} className={css.canvas} />
      </div>
    </div>
  );
}
