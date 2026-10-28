// Tunables for the showcase under the split hero.

export type SceneTier = "full" | "lite";

export const SHOWCASE = {
  /** Scrolling, in viewports: the hero tearing open, then each work and each chapter title. */
  units: { entrance: 1, work: 1, title: 0.8 },
  /** How much the camera slows at each beat (0 = not at all, 1 = it stops). */
  dwell: 0.82,
  /** Scroll smoothing rate (1/s), as the gallery hero. */
  smoothing: 8,
  background: "#0d0d0d",
  /** FogExp2 density: pieces emerge from the dark as they approach. */
  fog: 0.075,
  /** While the hero opens, the camera moves forward this far (m) through the gap. */
  dolly: 3.2,
  /** Look-around toward the cursor: at most this many degrees, eased at this rate (1/s). */
  look: { degrees: 5, follow: 4 },
  /** Flying in to a work: duration (s) and how much of the free part of the viewport it fills. */
  flight: { seconds: 0.8, fill: 0.6 },
  /** Hovering lifts a work toward the camera (m), eased at this rate (1/s). */
  hover: { lift: 0.08, follow: 10 },
  dpr: { full: [1, 1.5], lite: [1, 1] } as Record<SceneTier, [number, number]>,
  /** Paintings in low relief (full tier): displacement (m), mesh segments along the long side, bump from the colour. */
  relief: { scale: 0.035, segments: 160, bump: 0.5 },
  /** A caption is fully in within fade[0] beats of its work's stop and gone by fade[1]. */
  caption: { fade: [0.3, 0.5] as [number, number] },
  title: { fade: [0.35, 0.6] as [number, number] },
  /** A work's textures load once it is this many beats away. */
  streamBeats: 3,
  /**
   * The detail panel: at or above `breakpoint` px wide, a side panel `width` px
   * wide (at most `maxShare` of the viewport); below it, a bottom sheet `sheet`
   * of the height. Showcase.module.css uses the same numbers.
   */
  panel: { width: 440, maxShare: 0.42, sheet: 0.58, breakpoint: 768 },
} as const;

/** The free part of the viewport (px) next to the open panel: [left, top, width, height]. */
export function freeArea(width: number, height: number): [number, number, number, number] {
  const { panel } = SHOWCASE;
  if (width >= panel.breakpoint) return [0, 0, width - Math.min(panel.width, width * panel.maxShare), height];
  return [0, 0, width, height * (1 - panel.sheet)];
}
