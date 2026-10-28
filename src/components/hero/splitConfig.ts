// Tunables for the split hero (Art left, Code right, a living seam between),
// plus the one character grid that everything right of the seam sits on.

import { CODE_CELLS, DESIGN, NAME, type Tier } from "./heroConfig";

/** The seam is the centre of the title composition (design px). */
export const SEAM_X = DESIGN.cx;

/** The binary grid, in design px: the binary name's cells. Column 0 starts at the seam. */
export const GRID = {
  cellW: NAME.binaryFont * CODE_CELLS.advance,
  cellH: NAME.binaryFont * NAME.binaryLineHeight,
} as const;

/** Everything the wall and seam need to line up with the title (CSS px, relative to the hero). */
export interface SplitLayout {
  w: number;
  h: number;
  /** CSS px per design px */
  u: number;
  seamX: number;
  /** Top of grid row 0 (the top of the title box) */
  gridY: number;
  cellW: number;
  cellH: number;
}

/** Saturated pigments for the seam (cadmium red, orange, yellow, emerald, ultramarine, magenta). */
export const VIVID = ["#ff3b2f", "#ff8f1f", "#ffd21f", "#12c48b", "#2f6bff", "#ff2f8e"] as const;

export const SEAM = {
  /** Paint and bit colours; the last entry is the seam's own bead (the name's paint). */
  palette: [...VIVID, NAME.paint],
  /** Paint ribbons on the left. */
  ribbons: { full: 16, lite: 10, static: 16 } as Record<Tier, number>,
  /** Cycle length range (s); each ribbon gets its own, so the loop never lines up. */
  period: [10, 16] as [number, number],
  /** Fractions of a cycle: a bead swells out of the seam, then the ribbon pushes out; the rest it floats away. */
  emergeEnd: 0.12,
  pushEnd: 0.6,
  /** Leading-edge radius range (design px); the body is a fraction of it. */
  radius: [10, 18] as [number, number],
  body: [0.6, 0.85] as [number, number],
  /** How far a ribbon pushes out before it lets go, as a fraction of the left half's width. */
  reach: [0.3, 0.72] as [number, number],
  /** Extra distance it floats after letting go, as a fraction of its reach. */
  float: 0.45,
  /** Wave along the ribbon: amplitude as a fraction of the radius, wavelength in design px, speed in design px/s. */
  wave: [0.45, 1.6] as [number, number],
  wavelength: [380, 720] as [number, number],
  waveSpeed: 46,
  /** Slow vertical bob of a whole ribbon (fraction of its radius). */
  bob: 0.35,
  /** Half-width of the seam's bead (design px), plus a slow swell along its length. */
  bead: 1.4,
  beadSwell: 1.2,
  /** Smooth-union radius where ribbons merge (design px). */
  blend: 8,
  dpr: { full: 1.5, lite: 1, static: 1.5 } as Record<Tier, number>,
  /** The still frame shown with reduced motion (and before the animation starts). */
  stillTime: 8.2,
  /** Longest step the clock takes per frame (s), so nothing jumps after a pause. */
  maxStep: 0.05,
} as const;

/**
 * The line itself: a fluid boundary, not a ruler. Slow waves run along it, and
 * each paint ribbon pulls it toward the paint while it's attached. The wall,
 * the name, the paint and the bits all split on this one curve.
 */
export const CURVE = {
  /** Samples down the height of the hero (the shader reads these). */
  samples: 256,
  /** Points in the CSS clip-path polygons that split the wall and the name. */
  clipPoints: 128,
  /** Overall swing either side of the centre (design px). */
  amp: 26,
  /** Waves along the line: wavelength (design px), speed (rad/s; the sign sets the direction), weight. */
  waves: [
    [620, 0.42, 0.55],
    [290, -0.75, 0.3],
    [150, 1.15, 0.15],
  ] as [number, number, number][],
  /** How far an attached paint ribbon pulls the line toward it (× its radius), and over what height (× its radius). */
  pull: 0.55,
  pullSpread: 2.4,
} as const;

/**
 * The right side: bits popping out of the line. Spots along the line pop every
 * few seconds; each pop spits a small splash of digit packets across a few
 * neighbouring rows. They burst out fast, brake, drift and fade, leaving the
 * line white-hot and cooling to the pop's pigment. Each pop kicks the line
 * toward the code side for a moment.
 */
export const BITS = {
  /** Spots along the line that pop; each pops again every `period`. */
  emitters: { full: 26, lite: 14, static: 26 } as Record<Tier, number>,
  period: [1.6, 3.6] as [number, number],
  /** How long a pop's bits live (s): long enough to drift about as far out as the paint strokes reach. */
  life: [3.5, 7] as [number, number],
  /** Rows a pop can span either side of its centre, and the chance each of those rows gets a packet. */
  spread: 3,
  rowChance: 0.8,
  /** Burst speed (design px/s), how quickly it dies away (s), then the slow drift (design px/s). */
  burst: [380, 900] as [number, number],
  burstTime: 0.32,
  drift: [40, 95] as [number, number],
  /** Longest packet (digits); short ones are much more common. */
  maxLength: 7,
  /** How often a floating digit flips (per second). */
  flipRate: 0.6,
  /** Bits leave the line white-hot and cool to their colour over this long (s). */
  cool: 0.35,
  /** How far a pop kicks the line toward the code side (design px), over how many rows either side. */
  kick: 12,
  kickRows: 4,
} as const;

/** Touching the name. */
export const TOUCH = {
  /** Pulling the line: spring stiffness (1/s²), damping while held and after letting go (1/s). */
  spring: 110,
  holdDamping: 14,
  releaseDamping: 5,
  /** Height of the bend (design px, Gaussian width): wide, so the pulled line stays a gentle, flat curve. */
  bulge: 380,
  /** Furthest the line can be pulled from the middle of the screen, either way, as a fraction of the screen width. */
  reach: 0.3,
  /** Movement (CSS px) before a press counts as a drag. */
  dragSlop: 8,
  /**
   * The name is fluid: moving through it pushes the letters around (smoothly on
   * the paint side, cell by cell on the binary side) and they flow back into shape.
   */
  fluid: {
    /** Simulation cells across the title box. */
    resolution: 192,
    /** Push radius (design px) and strength (share of the pointer's speed). */
    radius: 24,
    force: 0.18,
    /** How fast the flow dies down, and how fast the letters flow back into shape (1/s). */
    settle: 4.5,
    reform: 3.5,
    pressureIterations: 16,
    /** Stop simulating this long after the last push (s), fading the flow out over the last `fadeOut` s (no snap). */
    idle: 6,
    fadeOut: 1.5,
  },
  /** Binary letters: the cells under the moving cursor come loose and fly off. */
  knock: {
    /** Reach around the cursor, in cells across and rows down. */
    cols: 3.5,
    rows: 1.6,
    /** Cursor speed (CSS px/s) needed to knock cells loose. */
    minSpeed: 40,
    /** A knocked-out cell is retyped after this long (s), flickering for `retype` s. */
    refill: [1.0, 2.2] as [number, number],
    retype: 0.2,
    /** Loose digits: life (s), throw (design px/s), share of the cursor's speed they take, drift away from the paint (design px/s). */
    life: [1.0, 2.0] as [number, number],
    burst: [60, 220] as [number, number],
    carry: 0.45,
    drift: 30,
    max: 900,
  },
} as const;
