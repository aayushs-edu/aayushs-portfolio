// The geometry the showcase's layouts are built from. World units are
// metres; y is up; the camera starts at the origin looking down −z.

import type { Work } from "../works";

export type Vec3 = [number, number, number];

export interface Viewport {
  width: number;
  height: number;
}

/** A work in the scene: its centre, its turn about y (0 faces +z) and its outer size. */
export interface Placement {
  slug: string;
  position: Vec3;
  rotationY: number;
  width: number;
  height: number;
}

export interface PathPoint {
  position: Vec3;
  target: Vec3;
}

/** Vertical field of view (degrees) and eye height (m). */
export const FOV_Y = 40;
export const EYE = 1.55;
/** How much of the viewport a presented work fills, at most. */
export const PRESENT_FILL = { height: 0.5, width: 0.6 } as const;

const DEG = Math.PI / 180;

/** Outer size (m): paintings by area, screens to fit a box. */
export function sizeOf(work: Work): { width: number; height: number } {
  const aspect = work.media.aspect;
  if (work.kind === "painting") {
    const height = Math.min(1.6, Math.sqrt(1.9 / aspect));
    return { width: height * aspect, height };
  }
  const box = { width: 1.7, height: 1.1 };
  return aspect >= box.width / box.height ? { width: box.width, height: box.width / aspect } : { width: box.height * aspect, height: box.height };
}

/** Centre height of a work: paintings hang at eye level, screens stand a little lower. */
export function centreY(work: Work): number {
  return work.kind === "painting" ? EYE + 0.05 : 1.4;
}

/** How far from a work the camera presents it, so it fills PRESENT_FILL of the viewport. */
export function presentDistance(width: number, height: number, viewport: Viewport): number {
  const tanV = Math.tan((FOV_Y / 2) * DEG);
  const tanH = tanV * (viewport.width / Math.max(1, viewport.height));
  return Math.max(height / (PRESENT_FILL.height * 2 * tanV), width / (PRESENT_FILL.width * 2 * tanH), 1.6);
}

/** Turn about y that makes a plane at `from` face `to` (xz only). */
export const yawFacing = (from: Vec3, to: Vec3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
