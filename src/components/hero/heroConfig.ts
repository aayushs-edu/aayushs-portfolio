// Global tunables for the hero, plus the typed gallery merged from
// gallery.json (what to show) and gallery.generated.json (what the asset
// script measured). Nothing here names a specific painting or project.

import galleryJson from "./gallery.json";
import generatedJson from "./gallery.generated.json";
import { POINT_BUDGETS } from "./heroPipeline";

export * from "./heroPipeline";

export type Mode = "art" | "code";
export type Tier = "full" | "lite" | "static";
export type PointTier = keyof typeof POINT_BUDGETS;
export const MODES: readonly Mode[] = ["art", "code"];

// ---------------------------------------------------------------------------
// Composition, in design px (the Figma frame). CSS scales it by --u.

export const DESIGN = {
  width: 1414,
  height: 1271,
  /** Below 640px wide, --u is computed from width against this instead. */
  narrowWidth: 1100,
  cx: 707,
  nameSize: 256,
  tagSize: 128,
  lineHeight: 1.108,
  /** Baselines of "Aayush" / "Sharma" with the name's ink top at y = 0. */
  baseline1: 195,
  baseline2: 195 + 256 * 1.108,
  /** The tagline's line box is centred 19px below the boundary between the two name lines (as in Figma). */
  tagBaseline: 310,
  outline: 2.5,
  /** The title SVG's viewBox: name ink plus room for the stroke and the "y" descender. */
  titleBox: { x: 0, y: -40, w: 1414, h: 560 },
  /** Centre of the card stack. The front frame's top sits ~45px under "Sharma". */
  stackCy: 896,
  imageBox: { w: 926, h: 689 },
  inset: { x: 44, y: 33 },
  radius: 33,
  /** Half the nominal front frame width (1013 / 2). Side slots are measured from this edge. */
  frontHalfW: 506.5,
  gutter: 48,
  gutterNarrow: 16,
  placardReserve: 64,
} as const;

export interface CardFrame {
  /** Frame size in design px */
  w: number;
  h: number;
  /** Image size inside the frame */
  imgW: number;
  imgH: number;
}

/** The image is contained in the 926×689 box; the frame adds the 44/33 insets. */
export function frameFor(aspect: number): CardFrame {
  const { imageBox, inset } = DESIGN;
  const boxAspect = imageBox.w / imageBox.h;
  const imgW = aspect >= boxAspect ? imageBox.w : imageBox.h * aspect;
  const imgH = aspect >= boxAspect ? imageBox.w / aspect : imageBox.h;
  return { w: imgW + inset.x * 2, h: imgH + inset.y * 2, imgW, imgH };
}

// ---------------------------------------------------------------------------
// Card fan

export interface SlotTransform {
  x: number;
  y: number;
  r: number;
  s: number;
  o: number;
  z: number;
}

/**
 * Slot placement for circular offset d (d > 0 is right). Side cards lean
 * their tops toward the centre, as in the Figma. `protrude` is how far the
 * rotated card's outer edge reaches past the nominal front frame edge.
 */
export const SLOTS = {
  side1: { s: 0.85, r: 8, y: -25, protrude: 200 },
  side2: { s: 0.78, r: 13, y: -45, protrude: 228 },
  collapsed: { s: 0.9, y: 0 },
} as const;

function rotatedHalfWidth(frame: CardFrame, s: number, rDeg: number): number {
  const t = (rDeg * Math.PI) / 180;
  return s * ((frame.w / 2) * Math.cos(t) + (frame.h / 2) * Math.sin(t));
}

export function slotFor(d: number, frame: CardFrame): SlotTransform {
  if (d === 0) return { x: 0, y: 0, r: 0, s: 1, o: 1, z: 30 };
  const side = Math.sign(d);
  const abs = Math.abs(d);
  const slot = abs === 1 ? SLOTS.side1 : SLOTS.side2;
  // Left card (side −1) turns clockwise, right card counter-clockwise.
  const r = -side * slot.r;
  const x = side * (DESIGN.frontHalfW + slot.protrude - rotatedHalfWidth(frame, slot.s, slot.r));
  return {
    x,
    y: slot.y,
    r,
    s: slot.s,
    o: abs <= 2 ? 1 : 0,
    z: abs === 1 ? 20 : abs === 2 ? 10 : 0,
  };
}

/** Behind the front card, used while the stack gathers for a flip. */
export function collapsedSlot(d: number): SlotTransform {
  return { x: 0, y: SLOTS.collapsed.y, r: 0, s: SLOTS.collapsed.s, o: Math.abs(d) <= 2 ? 1 : 0, z: d === 0 ? 30 : 5 };
}

/** Circular offset of item i from the selection, in (−n/2, n/2]. No looping under 3 items. */
export function circularOffset(i: number, selected: number, n: number): number {
  if (n < 3) return i - selected;
  let d = (((i - selected) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

// ---------------------------------------------------------------------------
// Motion

export const CARD_SPRING = { type: "spring", stiffness: 260, damping: 32 } as const;
export const SWITCH = {
  gatherMs: 250,
  flipMs: 450,
  spreadMs: 250,
  flipEase: [0.6, 0, 0.2, 1] as [number, number, number, number],
  staticFadeMs: 150,
  revealFadeMs: 300,
};
export const BROWSE = {
  wheelStepPx: 80,
  cooldownMs: 350,
  dragStepFraction: 0.18,
  dragVelocity: 450,
  dragFollow: 0.3,
  clickSlopPx: 6,
};

/** Scroll progress breakpoints (p in 0..1). */
export const PHASES = {
  rest: 0.03,
  sideGone: 0.12,
  titleGone: 0.14,
  zoomEnd: 0.2,
  neutralEnd: 0.23,
  handoffEnd: 0.26,
  /** Dots lift into depth layers. */
  depthEnd: 0.46,
  /** The camera pushes through the cloud. */
  flyEnd: 0.92,
  /**
   * The next section is pinned under the hero from here on (CSS sticky, so this
   * also sets how far it overlaps the hero) and the wall fades to reveal it.
   */
  reveal: 0.5,
  /** The wall starts to fade once the camera is inside the cloud. */
  clearStart: 0.62,
  revealEnd: 0.86,
} as const;

export const SCROLL = {
  /** Hero section height in svh per tier. */
  heightFull: 300,
  heightLite: 220,
  smoothing: 8,
  zoomFill: 0.84,
  sideSpread: 0.35,
  titleRise: 60,
} as const;

// ---------------------------------------------------------------------------
// Letters

export const BRUSH = {
  /** Core brush width in design px (the wall brush scales it by --u). */
  coreWidth: 70,
  minPointDist: 6,
  pauseMs: 250,
  dryDelayMs: 6000,
  dryFadeMs: 2500,
  /** Past this many strokes on the wall, the oldest dry out quickly. */
  maxStrokes: 40,
  introMs: 1400,
} as const;

/** The painted / binary name. */
export const NAME = {
  /** Art mode: warm off-white paint, streaked with tints and a few soft palette accents. */
  paint: "#ece4d4",
  /** Width of the brush strokes that fill the letters (design px). */
  strokeWidth: 78,
  /** Gap kept clear of paint around the tagline, so "Art x Code" reads over the name. */
  taglineGap: 16,
  /** Letter edges: a soft waver plus a fine grain (SVG displacement, design px). */
  waver: 10,
  waverFrequency: 0.016,
  grain: 4,
  grainFrequency: 0.11,
  /** Code mode: the letters as 0s and 1s on this grid. */
  binaryFont: 14,
  binaryLineHeight: 1.15,
} as const;

/** The wall the visitor paints on (CSS px). */
export const WALL = {
  brushScale: 1.15,
  minBrushPx: 18,
  dprCap: 2,
  codeFontPx: 12,
  codeLineHeight: 1.5,
  codeCap: { full: 3000, lite: 1200, static: 3000 } as Record<Tier, number>,
} as const;

export const CODE_CELLS = {
  fontSize: 11,
  lineHeight: 1.5,
  /** Geist Mono advance is 0.6em. */
  advance: 0.6,
  radius: 3,
  perCellMs: 12,
  fadeAfterMs: 6000,
  /** Code is laid out as side-by-side panes this many characters wide (longer lines are cut at the pane edge). */
  columnChars: 52,
  columnGap: 2,
} as const;

export const HOVER_PREVIEW_MS = 350;

// ---------------------------------------------------------------------------
// WebGL

export const BUDGETS = POINT_BUDGETS;
export const DPR = { full: [1, 1.75] as [number, number], lite: [1, 1.5] as [number, number] };
/** The front image plane. */
export const FRONT = {
  /** Project screenshots tilt toward the cursor by up to this much. */
  tiltDeg: 3,
  /** Easing rate of the tilt (1/s). */
  follow: 6,
};
export const CANVAS_FADE = { outMs: 120, inMs: 300 };
export const POINTS = {
  depthDelay: 0.15,
  shrink: 0.25,
  /** Extra depth scatter (× plane height) so the cloud has volume to fly through. */
  scatter: 0.9,
  /** Camera z at the end of the fly-through, as a fraction of its rest distance (negative = past the image). */
  flyTo: -0.25,
  /** Dots fade as they come within this fraction of the rest distance of the camera. */
  nearFade: [0.04, 0.3] as [number, number],
  /** Cap on a dot's on-screen size (device px) as it rushes past. */
  maxSize: 48,
  pushRadiusPx: 90,
  pushDamping: 5,
};

export interface Tuning {
  depthScale: number;
}

export const TUNING_DEFAULTS: Record<Mode, Tuning> = {
  art: { depthScale: 0.35 },
  code: { depthScale: 0.2 },
};

// ---------------------------------------------------------------------------
// Gallery data

export interface TierGrid {
  gw: number;
  gh: number;
  count: number;
}

export interface GalleryItem {
  mode: Mode;
  slug: string;
  index: number;
  title: string;
  year?: string;
  /** Medium for art, stack for code */
  detail: string;
  /** Placard link: /paintings for art, the project's href for code */
  href: string;
  external: boolean;
  width: number;
  height: number;
  aspect: number;
  maxZoom: number;
  avgColor: string;
  tiers: Record<PointTier, TierGrid>;
  assets: { color: string; paint?: string; depth: string };
  tuning: Tuning;
  frame: CardFrame;
}

export type TokenClass = "kw" | "str" | "num" | "fn" | "punct" | "com";
export type TokenRun = [text: string, cls: TokenClass];
export interface Snippet {
  name: string;
  lines: TokenRun[][];
}

interface GeneratedEntry {
  title: string;
  year?: string;
  width: number;
  height: number;
  aspect: number;
  maxZoom: number;
  avgColor: string;
  tiers: Record<PointTier, TierGrid>;
  assets: GalleryItem["assets"];
}

interface Generated {
  palette: Record<TokenClass, string>;
  snippets: Snippet[];
  items: Record<Mode, Record<string, GeneratedEntry>>;
}

interface RawItem {
  slug: string;
  src: string;
  medium?: string;
  title?: string;
  year?: string;
  stack?: string;
  href?: string;
  tuning?: Partial<Tuning>;
}

interface RawGallery {
  initialMode: string;
  art: { initial: string; items: RawItem[] };
  code: { initial: string; items: RawItem[] };
}

const raw = galleryJson as RawGallery;
const generated = generatedJson as unknown as Generated;

function buildItems(mode: Mode): GalleryItem[] {
  return raw[mode].items.map((item, index) => {
    const gen = generated.items[mode]?.[item.slug];
    if (!gen) {
      throw new Error(`Hero: "${mode}/${item.slug}" is missing from gallery.generated.json. Run \`npm run hero:assets\`.`);
    }
    const href = mode === "art" ? "/paintings" : (item.href ?? "/");
    return {
      mode,
      slug: item.slug,
      index,
      title: gen.title,
      year: gen.year,
      detail: mode === "art" ? (item.medium ?? "Oil on canvas") : (item.stack ?? ""),
      href,
      external: /^https?:\/\//.test(href),
      width: gen.width,
      height: gen.height,
      aspect: gen.aspect,
      maxZoom: gen.maxZoom,
      avgColor: gen.avgColor,
      tiers: gen.tiers,
      assets: gen.assets,
      tuning: { ...TUNING_DEFAULTS[mode], ...item.tuning },
      frame: frameFor(gen.aspect),
    };
  });
}

export const GALLERY: Record<Mode, GalleryItem[]> = { art: buildItems("art"), code: buildItems("code") };

export const INITIAL_MODE: Mode = raw.initialMode === "code" ? "code" : "art";
export const INITIAL_INDEX: Record<Mode, number> = {
  art: Math.max(0, GALLERY.art.findIndex((item) => item.slug === raw.art.initial)),
  code: Math.max(0, GALLERY.code.findIndex((item) => item.slug === raw.code.initial)),
};

export const SYNTAX_PALETTE = generated.palette;
export const SNIPPETS = generated.snippets;

export const MODE_LABEL: Record<Mode, { word: string; region: string; shown: string; link: string }> = {
  art: { word: "Art", region: "Paintings", shown: "Showing paintings", link: "All paintings" },
  code: { word: "Code", region: "Projects", shown: "Showing projects", link: "View project" },
};

export const itemLabel = (item: GalleryItem) => (item.year ? `${item.title}, ${item.year}` : item.title);
