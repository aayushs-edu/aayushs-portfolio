// The paintings wall, pure: where each painting hangs on the plane, and how
// much it fades with its distance from the middle of the view.
//
// The high school portfolio hangs in the middle as it did on the /paintings
// page: three columns, the side ones centred on the middle one. The early
// work hangs in a loose ring round it. Units are world px at scale 1, with
// (0, 0) the middle of the portfolio.

export interface WallPainting {
  slug: string;
  /** width / height */
  aspect: number;
  wall?: "portfolio" | "early";
}

export interface Placement {
  slug: string;
  /** Centre */
  x: number;
  y: number;
  w: number;
  h: number;
  wall: "portfolio" | "early";
}

export const WALL = {
  /** The portfolio's column width and the gap between paintings */
  column: 300,
  gap: 22,
  /** The early work's width */
  early: 230,
  /**
   * The ring the early work hangs on: a superellipse (radii to each
   * painting's centre; the higher `power`, the squarer), so it hugs the
   * portfolio's corners as closely as its sides.
   */
  ring: { rx: 660, ry: 560, power: 4, jitter: 20 },
  /** How far past the outermost painting the middle of the view may go */
  margin: 60,
  /** The world the view fits at scale 1: the portfolio plus a glimpse of the ring */
  fit: { w: 1180, h: 900 },
  /**
   * The fade, over the distance from the middle of the view to a painting's
   * centre, as a fraction of the view's half-size (an ellipse): whole inside
   * `from`, gone at `to`.
   */
  fade: { from: 0.6, to: 1.5, minScale: 0.86 },
} as const;

/** The portfolio's columns, top to bottom, as the old /paintings page hung them. */
export const PORTFOLIO_COLUMNS: string[][] = [
  ["snorkeling-hawaii", "snowboarding"],
  ["soccer-penalty", "childhood-toys", "taj-mahal"],
  ["safari-kid", "red-dead-redemption"],
];

/** A stable pseudo-random number in [-1, 1] for the i-th painting. */
const wobble = (i: number, salt: number) => {
  const s = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
};

export function layoutWall(paintings: WallPainting[]): Placement[] {
  const bySlug = new Map(paintings.map((p) => [p.slug, p]));
  const placed: Placement[] = [];
  const { column, gap } = WALL;

  // The portfolio: each column stacked and centred on y = 0.
  PORTFOLIO_COLUMNS.forEach((slugs, c) => {
    const items = slugs.map((s) => bySlug.get(s)).filter((p): p is WallPainting => !!p);
    const heights = items.map((p) => column / p.aspect);
    const total = heights.reduce((a, b) => a + b, 0) + gap * Math.max(0, items.length - 1);
    const x = (c - (PORTFOLIO_COLUMNS.length - 1) / 2) * (column + gap);
    let top = -total / 2;
    items.forEach((p, i) => {
      placed.push({ slug: p.slug, x, y: top + heights[i] / 2, w: column, h: heights[i], wall: "portfolio" });
      top += heights[i] + gap;
    });
  });

  // Anything else (the early work, and any portfolio painting not in a column) rings it.
  const inColumns = new Set(PORTFOLIO_COLUMNS.flat());
  const rest = paintings.filter((p) => !inColumns.has(p.slug));
  const { rx, ry, power, jitter } = WALL.ring;
  const squash = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 2 / power);
  const at = (a: number): [number, number] => [squash(Math.cos(a)) * rx, squash(Math.sin(a)) * ry];
  // Spaced evenly along the ring's length (by angle they'd bunch at its corners),
  // starting up and to the left, so neither axis lines up with the columns.
  const N = 720;
  const start = -Math.PI * 0.62;
  const lengths = [0];
  let [px, py] = at(start);
  for (let k = 1; k <= N; k++) {
    const [qx, qy] = at(start + (k / N) * Math.PI * 2);
    lengths.push(lengths[k - 1] + Math.hypot(qx - px, qy - py));
    [px, py] = [qx, qy];
  }
  let k = 0;
  rest.forEach((p, i) => {
    const target = (i / rest.length) * lengths[N];
    while (lengths[k + 1] < target) k++;
    const [x, y] = at(start + (k / N) * Math.PI * 2);
    const r = 1 + (wobble(i, 2) * jitter) / Math.hypot(x, y);
    const w = WALL.early * (p.aspect < 1 ? 0.82 : 1);
    placed.push({ slug: p.slug, x: x * r, y: y * r + wobble(i, 3) * jitter * 0.5, w, h: w / p.aspect, wall: p.wall === "portfolio" ? "portfolio" : "early" });
  });
  return placed;
}

/**
 * How far the middle of the view may go: the paintings' extent, plus a
 * margin, and at least far enough to centre any painting (selecting one
 * glides it to the middle).
 */
export function panBounds(placed: Placement[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let cx = 0;
  let cy = 0;
  for (const p of placed) {
    x = Math.max(x, Math.abs(p.x) + p.w / 2);
    y = Math.max(y, Math.abs(p.y) + p.h / 2);
    cx = Math.max(cx, Math.abs(p.x));
    cy = Math.max(cy, Math.abs(p.y));
  }
  return { x: Math.max(cx, x - WALL.fit.w / 2 + WALL.margin), y: Math.max(cy, y - WALL.fit.h / 2 + WALL.margin) };
}

/** The scale that fits `WALL.fit` into a view of this size. */
export const fitScale = (viewW: number, viewH: number) => Math.min(viewW / WALL.fit.w, viewH / WALL.fit.h, 1.15);

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The vignette for a painting whose centre is (dx, dy) screen px from the
 * middle of a view of half-size (hw, hh): its opacity and scale.
 */
export function fadeAt(dx: number, dy: number, hw: number, hh: number): { opacity: number; scale: number } {
  const d = Math.hypot(dx / hw, dy / hh);
  const t = smoothstep(WALL.fade.from, WALL.fade.to, d);
  return { opacity: 1 - t, scale: 1 - (1 - WALL.fade.minScale) * t };
}

/** Clamp a pan (the world point at the middle of the view) to the bounds. */
export function clampPan(x: number, y: number, bounds: { x: number; y: number }): [number, number] {
  return [Math.max(-bounds.x, Math.min(bounds.x, x)), Math.max(-bounds.y, Math.min(bounds.y, y))];
}

export interface Focus {
  /** The selected painting's growth, and its centre in view px */
  zoom: number;
  cx: number;
  cy: number;
  /** Its title: beside it (wide views) or under it, in view px */
  info: { mode: "side" | "below"; left: number; top: number; width: number };
}

/** Views narrower than this put the title under the painting. */
const SIDE_MIN = 720;

/**
 * Where a selected painting (world size pw × ph, the wall at scale s) sits in
 * a view of viewW × viewH: grown, with its title beside it, the two
 * centred together; or, in a narrow view, the title under it. Kept clear of
 * the vignette's top and bottom.
 */
export function focusLayout(pw: number, ph: number, s: number, viewW: number, viewH: number): Focus {
  const gap = 40;
  if (viewW >= SIDE_MIN) {
    const textW = Math.min(380, Math.max(240, viewW * 0.26));
    const maxW = viewW * 0.88 - gap - textW;
    const zoom = Math.min(maxW / (pw * s), (viewH * 0.68) / (ph * s));
    const w = pw * s * zoom;
    const left = (viewW - (w + gap + textW)) / 2;
    return { zoom, cx: left + w / 2, cy: viewH / 2, info: { mode: "side", left: left + w + gap, top: viewH / 2, width: textW } };
  }
  const zoom = Math.min((viewW * 0.86) / (pw * s), (viewH * 0.46) / (ph * s));
  const h = ph * s * zoom;
  const cy = viewH * 0.14 + h / 2;
  const width = Math.min(viewW - 32, 520);
  return { zoom, cx: viewW / 2, cy, info: { mode: "below", left: (viewW - width) / 2, top: cy + h / 2 + 20, width } };
}
