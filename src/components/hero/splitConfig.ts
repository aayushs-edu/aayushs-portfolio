// Tunables for the split hero (paint left of a tilted line and bits right of
// it, seen only through the name), plus the character grid the bits sit on.

import { CODE_CELLS, DESIGN, NAME, type Tier } from "./heroConfig";

/** The line crosses the centre of the title composition (design px). */
export const SEAM_X = DESIGN.cx;

/** The bits' grid, in design px: one cell per digit. Its rows run square to the line (seamField.ts). */
export const GRID = {
  cellW: NAME.binaryFont * CODE_CELLS.advance,
  cellH: NAME.binaryFont * NAME.binaryLineHeight,
} as const;

/** Everything the seam needs to line up with the title (CSS px, relative to the hero). */
export interface SplitLayout {
  w: number;
  h: number;
  /** CSS px per design px */
  u: number;
  seamX: number;
  /** The top of the title box */
  gridY: number;
  cellW: number;
  cellH: number;
}

/** Saturated pigments for the paint (cadmium red, orange, yellow, emerald, ultramarine, magenta). */
export const VIVID = ["#ff3b2f", "#ff8f1f", "#ffd21f", "#12c48b", "#2f6bff", "#ff2f8e"] as const;

export const SEAM = {
  /** Paint colours; the last entry is the line's own bead (the name's paint). */
  palette: [...VIVID, NAME.paint],
  /** Paint ribbons on the left. */
  ribbons: { full: 32, lite: 20, static: 32 } as Record<Tier, number>,
  /** The name's ink: top to bottom (design px, from the ink top), and how far it reaches either side of the centre (design px). */
  span: [-6, 486] as [number, number],
  halfWidth: 540,
  /** Cycle length range (s); each ribbon gets its own, so the loop never lines up. */
  period: [10, 16] as [number, number],
  /** Fractions of a cycle: a bead swells out of the line, then the ribbon pushes out; the rest it floats away. */
  emergeEnd: 0.12,
  pushEnd: 0.6,
  /** Leading-edge radius range (design px); the body is a fraction of it. */
  radius: [14, 24] as [number, number],
  body: [0.6, 0.85] as [number, number],
  /** How far a ribbon pushes out before it lets go (design px; the name is about 600 either side of the centre). */
  reach: [280, 640] as [number, number],
  /** Extra distance it floats after letting go, as a fraction of its reach. */
  float: 0.45,
  /** Wave along the ribbon: amplitude as a fraction of the radius, wavelength in design px, speed in design px/s. */
  wave: [0.45, 1.6] as [number, number],
  wavelength: [380, 720] as [number, number],
  waveSpeed: 46,
  /** Slow vertical bob of a whole ribbon (fraction of its radius). */
  bob: 0.35,
  /** Half-width of the line's bead (design px), plus a slow swell along its length. */
  bead: 1.4,
  beadSwell: 1.2,
  /** The line itself, drawn faintly over the wall too: half-width (design px), opacity, and how far it runs past the name's ink at each end (design px), fading out over that stretch. */
  line: { width: 1.1, alpha: 0.5, overhang: 80 },
  /** Smooth-union radius where ribbons merge (design px). */
  blend: 8,
  dpr: { full: 1.5, lite: 1, static: 1.5 } as Record<Tier, number>,
  /** The still frame shown with reduced motion (and before the animation starts). */
  stillTime: 8.2,
  /** Longest step the clock takes per frame (s), so nothing jumps after a pause. */
  maxStep: 0.05,
} as const;

/** The line: straight, tilted like "/" (its top leans right), crossing the centre halfway down the name. */
export const TILT = {
  /** Degrees off vertical. */
  angle: 20,
  /** Where it crosses the centre (design px, from the name's ink top). */
  centreY: 240,
} as const;

/**
 * The right side: bits popping out of the line. Spots along the line pop every
 * few seconds; each pop spits a small splash of digit packets across a few
 * neighbouring rows. They burst out fast, brake, drift and fade, leaving the
 * line white-hot and cooling to the pop's colour (green or grey).
 */
export const BITS = {
  /** A terminal's colours, not the paint's: hacker green (bright, then dimmer) and greys. */
  palette: ["#00ff41", "#00b02d", "#ededed", "#a3a3a3", "#666666"],
  /** Spots along the line that pop; each pops again every `period`. */
  emitters: { full: 36, lite: 22, static: 36 } as Record<Tier, number>,
  period: [1.6, 3.6] as [number, number],
  /** How long a pop's bits live (s): long enough to drift about as far out as the paint strokes reach. */
  life: [3.5, 7] as [number, number],
  /** Rows a pop can span either side of its centre, and the chance each of those rows gets a packet. */
  spread: 3,
  rowChance: 0.9,
  /** Burst speed (design px/s), how quickly it dies away (s), then the slow drift (design px/s). */
  burst: [380, 900] as [number, number],
  burstTime: 0.32,
  drift: [40, 95] as [number, number],
  /** Longest packet (digits); short ones are much more common. */
  maxLength: 11,
  /** How often a floating digit flips (per second). */
  flipRate: 0.6,
  /** Bits leave the line white-hot and cool to their colour over this long (s). */
  cool: 0.35,
} as const;
