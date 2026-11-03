// The upside-down zip under the split hero (pure; checked by showcase:check).
// For a scroll position: where the halves still meet, how far each half has
// moved off the line at any height, where the line runs below the hero, and
// the clip-paths that split the wall on the opened edges. Heights are in the
// hero's own coordinates (y down from its top); the hero has moved up the
// screen by `scroll`, so a row on screen at y is the hero's row y + scroll.

import { curveAt } from "./seamField";
import { BITS, CURVE, SEAM, ZIP, type SplitLayout } from "./splitConfig";

export interface Zip {
  /** How far the page has scrolled (CSS px): the hero has moved up by this much. */
  scroll: number;
  /** Where the halves still meet (hero px); above it the line is closed. */
  apex: number;
  /** The opening below the apex, k1 · d + k2 · d² (d in CSS px). */
  k1: number;
  k2: number;
}

/** Closed and still: the hero as it is without the zip (the static tier). */
export const CLOSED: Zip = { scroll: 0, apex: 1e9, k1: 0, k2: 0 };

export function zipFor(scroll: number, layout: SplitLayout): Zip {
  const s = Math.max(0, scroll);
  return { scroll: s, apex: ZIP.start * layout.h - ZIP.climb * s, k1: ZIP.k1, k2: ZIP.k2 / layout.h };
}

/** How far each half has moved off the line at hero height y (CSS px). */
export function openAt(zip: Zip, y: number): number {
  const d = y - zip.apex;
  return d > 0 ? d * (zip.k1 + d * zip.k2) : 0;
}

/**
 * Where the line is at hero height y (x from the centre, CSS px). Over the
 * hero it's the sampled curve; below it the line runs on along its last
 * direction and straightens out, so the opened halves keep their edges.
 */
export function lineAt(curve: Float32Array, y: number, layout: SplitLayout): number {
  const { h } = layout;
  if (y <= h) return curveAt(curve, y, h);
  const n = curve.length;
  const slope = Math.min(ZIP.maxSlope, Math.max(-ZIP.maxSlope, ((curve[n - 1] - curve[n - 2]) * (n - 1)) / h));
  const runOn = ZIP.runOn * layout.u;
  return curve[n - 1] + slope * runOn * Math.tanh((y - h) / runOn);
}

/** The most the line (and what it carries) can be off the centre: its swing, pulled by paint, kicked by bits, and its run-on. */
export function swing(layout: SplitLayout): number {
  return (CURVE.amp + CURVE.pull * SEAM.radius[1] + BITS.kick + ZIP.maxSlope * ZIP.runOn) * layout.u;
}

/** The scroll (CSS px) from which both halves are off screen at every row: the hero can hide. */
export function goneAt(layout: SplitLayout): number {
  const zip = zipFor(0, layout);
  const reach = Math.max(layout.seamX, layout.w - layout.seamX) + swing(layout);
  // The top row is the last to clear: solve openAt(top) = reach for d, the top row's depth below the apex.
  const d = (-zip.k1 + Math.sqrt(zip.k1 * zip.k1 + 4 * zip.k2 * reach)) / (2 * zip.k2);
  // The top row is at hero height `scroll`; the apex at start·h − climb·scroll.
  return (d + ZIP.start * layout.h) / (1 + ZIP.climb);
}

/** clip-path polygons for the wall's two halves on screen (the stage is the viewport), split on the opened edges. */
export function zipClipPaths(curve: Float32Array, layout: SplitLayout, zip: Zip): { left: string; right: string } {
  const { w, h, seamX } = layout;
  const left: string[] = [];
  const right: string[] = [];
  const n = CURVE.clipPoints;
  for (let k = 0; k < n; k++) {
    const y = (k / (n - 1)) * h;
    const row = y + zip.scroll;
    const x = seamX + lineAt(curve, row, layout);
    const open = openAt(zip, row);
    left.push(`${Math.max(-2, x - open).toFixed(2)}px ${y.toFixed(2)}px`);
    right.push(`${Math.min(w + 2, x + open).toFixed(2)}px ${y.toFixed(2)}px`);
  }
  // Run past the hero's edges so nothing antialiases along them.
  const ends = (points: string[]) => {
    const first = points[0].split(" ")[0];
    const last = points[n - 1].split(" ")[0];
    return [`${first} -2px`, ...points, `${last} ${h + 2}px`].join(",");
  };
  return {
    left: `polygon(-2px -2px,${ends(left)},-2px ${h + 2}px)`,
    right: `polygon(${w + 2}px -2px,${ends(right)},${w + 2}px ${h + 2}px)`,
  };
}
