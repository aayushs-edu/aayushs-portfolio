"use client";

// Art mode: the cursor paints paintings into the letterforms with a ragged
// oil-brush stroke. Strokes are built as filled bristle outlines inside SVG
// masks and updated imperatively (no React state per pointer move).

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { BRUSH, DESIGN } from "./heroConfig";

type Vec = [number, number];
const SVG_NS = "http://www.w3.org/2000/svg";

/** One bristle: perpendicular offset, width and mask opacity, all relative to the core width. */
const BRISTLES = [
  { off: 0, w: 0.62, op: 1 },
  { off: -0.29, w: 0.36, op: 0.85 },
  { off: 0.29, w: 0.36, op: 0.8 },
  { off: -0.44, w: 0.16, op: 0.6 },
  { off: 0.45, w: 0.14, op: 0.5 },
].slice(0, BRUSH.bristles);

// ---------------------------------------------------------------------------
// Geometry (pure)

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth 1D value noise in 0..1. */
function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i + seed * 57.3);
  const b = hash(i + 1 + seed * 57.3);
  return a + (b - a) * f * f * (3 - 2 * f);
}

/** Catmull-Rom resample so the outline follows the cursor smoothly. */
export function smoothPath(points: Vec[], subdivisions = 3): Vec[] {
  if (points.length < 3) return points.slice();
  const out: Vec[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/**
 * Filled outline for each bristle of a stroke. Width tapers over the first
 * and last `BRUSH.taper` design px and wobbles with per-bristle noise so the
 * edge reads as dry paint, not a marker.
 */
export function bristlePaths(raw: Vec[], seed: number, width = BRUSH.coreWidth): string[] {
  const pts = smoothPath(raw);
  const n = pts.length;
  if (n < 2) return BRISTLES.map(() => "");
  const arc = new Float32Array(n);
  for (let i = 1; i < n; i++) arc[i] = arc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const length = arc[n - 1];
  const normals: Vec[] = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  });

  return BRISTLES.map((bristle, k) => {
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i < n; i++) {
      const s = arc[i];
      const head = Math.min(1, s / BRUSH.taper);
      const tail = Math.min(1, (length - s) / (BRUSH.taper * 0.6));
      const taper = Math.sqrt(Math.max(0, head)) * Math.sqrt(Math.max(0, tail));
      // Outer bristles start later and leave earlier, like a loaded brush lifting off.
      const reach = 1 - Math.abs(bristle.off) * 0.5;
      const t = Math.min(1, taper / reach);
      const wobble = 0.72 + 0.56 * noise1(s / 23 + k * 3.1, seed + k);
      const half = (bristle.w * width * 0.5) * t * wobble;
      const drift = (noise1(s / 41 + k * 7.7, seed * 3 + k) - 0.5) * width * 0.08;
      const off = bristle.off * width * (0.55 + 0.45 * t) + drift;
      const [nx, ny] = normals[i];
      const cx = pts[i][0] + nx * off;
      const cy = pts[i][1] + ny * off;
      left.push(`${f1(cx + nx * half)} ${f1(cy + ny * half)}`);
      right.push(`${f1(cx - nx * half)} ${f1(cy - ny * half)}`);
    }
    return `M${left.join("L")}L${right.reverse().join("L")}Z`;
  });
}

export const BRISTLE_OPACITY = BRISTLES.map((b) => b.op);

/** The scripted zig-zag: across "Aayush", down, then back across "Sharma". */
export function introPath(samples = 140): Vec[] {
  const { baseline1, baseline2, cx } = DESIGN;
  const halfW = 560;
  const rows = [
    { y0: 18, y1: baseline1 - 22, from: cx - halfW, to: cx + halfW },
    { y0: baseline2 - 178, y1: baseline2 - 18, from: cx + halfW, to: cx - halfW },
  ];
  const zigs = 5;
  const out: Vec[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const row = t < 0.5 ? rows[0] : rows[1];
    const local = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const x = row.from + (row.to - row.from) * local;
    const phase = Math.abs(((local * zigs * 2) % 2) - 1);
    const y = row.y0 + (row.y1 - row.y0) * phase;
    out.push([x, y]);
  }
  return out;
}

/** Splits the intro path at the line change so each row is its own stroke. */
export function introStrokes(): Vec[][] {
  const path = introPath();
  const half = Math.floor(path.length / 2);
  return [path.slice(0, half + 1), path.slice(half + 1)];
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// ---------------------------------------------------------------------------
// Hook

interface Stroke {
  group: SVGGElement;
  paths: SVGPathElement[];
  points: Vec[];
  seed: number;
  slot: number;
  endedAt: number | null;
  intro: boolean;
  dirty: boolean;
  opacity: number;
}

interface Slot {
  painting: number;
  lastUsed: number;
}

export interface BrushOptions {
  /** Element receiving pointer events (the title area). */
  surfaceRef: RefObject<HTMLElement | null>;
  svgRef: RefObject<SVGSVGElement | null>;
  /** One <g> per paint layer, inside that layer's <mask>. */
  maskGroups: RefObject<(SVGGElement | null)[]>;
  /** One <image> per paint layer. */
  images: RefObject<(SVGImageElement | null)[]>;
  /** paint.webp URLs in gallery order. */
  paintings: string[];
  /** Painting the next stroke starts the cycle from (the selected one). */
  startIndex: number;
  layers: number;
  /** Accept pointer strokes. */
  active: boolean;
  /** Play the intro once fonts are ready (first time the mode is shown). */
  intro: boolean;
  /** Called on the visitor's first stroke. */
  onInteract?: () => void;
}

export function useBrushStrokes(opts: BrushOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const state = useRef({
    strokes: [] as Stroke[],
    current: null as Stroke | null,
    slots: [] as Slot[],
    cycle: 0,
    lastMove: 0,
    lastPoint: null as Vec | null,
    raf: 0,
    seed: 1,
    introPlaying: false,
    introDone: false,
    visitorStroked: false,
  });

  const clearAll = useRef<() => void>(() => {});
  const playIntro = useRef<() => void>(() => {});

  useEffect(() => {
    const s = state.current;
    const now = () => performance.now();

    const slotFor = (painting: number): number => {
      const o = optsRef.current;
      const images = o.images.current ?? [];
      const layers = Math.min(o.layers, images.length);
      const t = now();
      const existing = s.slots.findIndex((slot) => slot && slot.painting === painting);
      if (existing >= 0 && existing < layers) {
        s.slots[existing].lastUsed = t;
        return existing;
      }
      let pick = -1;
      for (let i = 0; i < layers; i++) {
        if (!s.slots[i]) {
          pick = i;
          break;
        }
      }
      if (pick < 0) {
        // Reuse the least recently used layer; strokes still on it are dropped.
        pick = 0;
        for (let i = 1; i < layers; i++) if (s.slots[i].lastUsed < s.slots[pick].lastUsed) pick = i;
        s.strokes = s.strokes.filter((stroke) => {
          if (stroke.slot !== pick) return true;
          stroke.group.remove();
          return false;
        });
      }
      s.slots[pick] = { painting, lastUsed: t };
      const image = images[pick];
      const url = o.paintings[painting];
      if (image && image.getAttribute("href") !== url) image.setAttribute("href", url);
      return pick;
    };

    const startStroke = (intro = false): Stroke | null => {
      const o = optsRef.current;
      const groups = o.maskGroups.current ?? [];
      if (!o.paintings.length) return null;
      const painting = (o.startIndex + s.cycle) % o.paintings.length;
      s.cycle++;
      const slot = slotFor(painting);
      const parent = groups[slot];
      if (!parent) return null;
      const group = document.createElementNS(SVG_NS, "g");
      const paths = BRISTLE_OPACITY.map((op) => {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("fill", "#fff");
        path.setAttribute("fill-opacity", String(op));
        group.appendChild(path);
        return path;
      });
      parent.appendChild(group);
      const stroke: Stroke = { group, paths, points: [], seed: s.seed++, slot, endedAt: null, intro, dirty: true, opacity: 1 };
      s.strokes.push(stroke);
      while (s.strokes.length > BRUSH.maxStrokes) {
        const old = s.strokes.shift();
        old?.group.remove();
      }
      return stroke;
    };

    const endStroke = () => {
      if (s.current) {
        s.current.endedAt = now();
        s.current = null;
      }
      s.lastPoint = null;
    };

    const render = (t: number) => {
      s.raf = 0;
      let busy = false;
      for (const stroke of s.strokes) {
        if (stroke.dirty) {
          const ds = bristlePaths(stroke.points, stroke.seed);
          stroke.paths.forEach((path, i) => path.setAttribute("d", ds[i]));
          stroke.dirty = false;
        }
        if (stroke.endedAt !== null && !(stroke.intro && !s.visitorStroked)) {
          const age = t - stroke.endedAt - BRUSH.dryDelayMs;
          const opacity = age <= 0 ? 1 : Math.max(0, 1 - age / BRUSH.dryFadeMs);
          if (opacity !== stroke.opacity) {
            stroke.opacity = opacity;
            stroke.group.setAttribute("opacity", opacity.toFixed(3));
          }
          if (opacity > 0) busy = true;
        } else if (stroke.endedAt === null) {
          busy = true;
        }
      }
      // Drop fully dried strokes.
      s.strokes = s.strokes.filter((stroke) => {
        if (stroke.opacity > 0) return true;
        stroke.group.remove();
        return false;
      });
      if (busy || s.introPlaying) s.raf = requestAnimationFrame(render);
    };

    const kick = () => {
      if (!s.raf) s.raf = requestAnimationFrame(render);
    };

    const toUser = (clientX: number, clientY: number): Vec | null => {
      const svg = optsRef.current.svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return null;
      const { titleBox } = DESIGN;
      return [titleBox.x + ((clientX - rect.left) / rect.width) * titleBox.w, titleBox.y + ((clientY - rect.top) / rect.height) * titleBox.h];
    };

    const onMove = (event: PointerEvent) => {
      const o = optsRef.current;
      if (!o.active) return;
      const t = now();
      if (s.current && t - s.lastMove > BRUSH.pauseMs) endStroke();
      s.lastMove = t;
      const p = toUser(event.clientX, event.clientY);
      if (!p) return;
      if (!s.current) {
        if (!s.visitorStroked) {
          s.visitorStroked = true;
          // The intro starts drying now that the visitor has taken over.
          for (const stroke of s.strokes) if (stroke.intro) stroke.endedAt = t;
          o.onInteract?.();
        }
        s.current = startStroke();
        if (!s.current) return;
      }
      if (s.lastPoint && Math.hypot(p[0] - s.lastPoint[0], p[1] - s.lastPoint[1]) < BRUSH.minPointDist) return;
      s.lastPoint = p;
      s.current.points.push(p);
      s.current.dirty = true;
      kick();
    };

    const onBoundary = () => endStroke();

    const surface = optsRef.current.surfaceRef.current;
    surface?.addEventListener("pointermove", onMove);
    surface?.addEventListener("pointerleave", onBoundary);
    surface?.addEventListener("pointerenter", onBoundary);

    clearAll.current = () => {
      for (const stroke of s.strokes) stroke.group.remove();
      s.strokes = [];
      s.current = null;
      s.slots = [];
      s.lastPoint = null;
    };

    // Intro: one scripted zig-zag over 1.4s, painting the selected artwork.
    playIntro.current = () => {
      if (s.introPlaying || s.introDone) return;
      s.introDone = true;
      s.introPlaying = true;
      const strokes = introStrokes();
      const total = strokes.reduce((n, part) => n + part.length, 0);
      const started: Stroke[] = [];
      const t0 = now();
      const step = () => {
        const t = Math.min(1, (now() - t0) / BRUSH.introMs);
        let budget = Math.round(easeInOut(t) * total);
        strokes.forEach((part, i) => {
          const take = Math.min(part.length, Math.max(0, budget));
          budget -= part.length;
          if (take < 2) return;
          if (!started[i]) {
            // Both rows of the intro paint the selected artwork.
            s.cycle = 0;
            const stroke = startStroke(true);
            if (!stroke) return;
            started[i] = stroke;
          }
          started[i].points = part.slice(0, take);
          started[i].dirty = true;
        });
        if (t < 1) requestAnimationFrame(step);
        else {
          for (const stroke of started) if (stroke) stroke.endedAt = now();
          s.introPlaying = false;
          s.cycle = 1;
        }
        kick();
      };
      requestAnimationFrame(step);
    };

    return () => {
      surface?.removeEventListener("pointermove", onMove);
      surface?.removeEventListener("pointerleave", onBoundary);
      surface?.removeEventListener("pointerenter", onBoundary);
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  // Intro once fonts are ready, the first time this mode is shown.
  const { intro } = opts;
  useEffect(() => {
    if (!intro) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) playIntro.current();
    });
    return () => {
      cancelled = true;
    };
  }, [intro]);

  return useMemo(() => ({ clear: () => clearAll.current() }), []);
}
