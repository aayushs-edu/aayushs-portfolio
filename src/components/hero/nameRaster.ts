// The name as pixels and cells (client only: needs a canvas and Poppins).
// The DOM fallback, the WebGL name and the touch logic all draw on these, so
// the painted letters and the binary cells match exactly whichever is showing.

import { bristlePaths, CORE_BRISTLES, type Vec } from "./brushGeometry";
import { DESIGN, NAME, SYNTAX_PALETTE } from "./heroConfig";
import { GRID, SEAM_X } from "./splitConfig";

const { titleBox: box, cx } = DESIGN;

function hash(n: number): number {
  const s = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return s - Math.floor(s);
}

function tint(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${ch((n >> 16) & 255)} ${ch((n >> 8) & 255)} ${ch(n & 255)})`;
}

export type Accent = "kw" | "str" | "fn" | "num" | "punct";
export interface NameStroke {
  d: string;
  /** A tint of the paint, or one of the palette accents */
  fill: string;
  accent: Accent | null;
  op: number;
}

/** Brush strokes across each line of the name (design px); the letterforms mask them. */
function buildNameStrokes(): NameStroke[] {
  const strokes: NameStroke[] = [];
  const lines: { baseline: number; span: number; accents: Accent[] }[] = [
    { baseline: DESIGN.baseline1, span: 262, accents: ["kw", "str", "fn"] },
    { baseline: DESIGN.baseline2, span: 212, accents: ["num", "punct", "num"] },
  ];
  const count = 10;
  let k = 0;
  lines.forEach(({ baseline, span, accents }) => {
    for (let j = 0; j < count; j++) {
      const y = baseline - 196 + (j / (count - 1)) * span;
      const angle = (hash(k * 3 + 1) - 0.5) * 0.24;
      const x0 = 110 + (hash(k * 5 + 2) - 0.3) * 260;
      const x1 = 1304 - (hash(k * 7 + 3) - 0.3) * 260;
      const pts: Vec[] = [];
      const steps = 36;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x0 + (x1 - x0) * t;
        pts.push([x, y + (x - cx) * Math.tan(angle) + Math.sin(t * 8 + j) * 4]);
      }
      const isAccent = j % 4 === 1;
      const accent = isAccent ? accents[Math.floor(j / 4) % accents.length] : null;
      const fill = accent ? SYNTAX_PALETTE[accent] : tint(NAME.paint, (hash(k * 11 + 4) - 0.5) * 0.16);
      const width = NAME.strokeWidth * (0.85 + hash(k * 13 + 5) * 0.35);
      bristlePaths(pts, 200 + k, width, CORE_BRISTLES).forEach((d, b) => strokes.push({ d, fill, accent, op: CORE_BRISTLES[b].op * (isAccent ? 0.5 : 1) }));
      k++;
    }
  });
  return strokes;
}

export const NAME_STROKES = buildNameStrokes();

/** Draws the name's letters in white (and cuts the tagline's gap) in design px, using the current transform. */
function letterforms(ctx: CanvasRenderingContext2D, fontFamily: string) {
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${DESIGN.nameSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.fillText("Aayush", cx, DESIGN.baseline1);
  ctx.fillText("Sharma", cx, DESIGN.baseline2);
  // Keep the tagline (plus a gap) clear of the name.
  ctx.globalCompositeOperation = "destination-out";
  ctx.font = `800 ${DESIGN.tagSize}px ${fontFamily}`;
  ctx.lineWidth = NAME.taglineGap;
  ctx.lineJoin = "round";
  ctx.strokeText("Art x Code", cx, DESIGN.tagBaseline);
  ctx.fillText("Art x Code", cx, DESIGN.tagBaseline);
  ctx.globalCompositeOperation = "source-over";
}

/**
 * The painted name over the whole title box, `scale` device px per design px:
 * off-white paint streaked with brush strokes, cut to the letterforms. (The
 * brushed edges come from the shader that draws it.)
 */
export function paintNameCanvas(fontFamily: string, scale: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(box.w * scale));
  canvas.height = Math.max(1, Math.round(box.h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.translate(-box.x, -box.y);
  ctx.fillStyle = NAME.paint;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  for (const s of NAME_STROKES) {
    ctx.globalAlpha = s.op;
    ctx.fillStyle = s.fill;
    ctx.fill(new Path2D(s.d));
  }
  ctx.globalAlpha = 1;
  // Cut the paint to the letterforms (drawn once into a mask: clipping word by word would keep only their overlap).
  const mask = document.createElement("canvas");
  mask.width = canvas.width;
  mask.height = canvas.height;
  const m = mask.getContext("2d");
  if (!m) return null;
  m.scale(scale, scale);
  m.translate(-box.x, -box.y);
  letterforms(m, fontFamily);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

/**
 * The name as binary cells on the seam-anchored grid (column 0 starts at the
 * centre, row 0 at the title box top): 0 for no letter, else 1 + the digit.
 */
export interface BinaryGrid {
  /** Column of cells[0] (negative: left of the centre) */
  c0: number;
  cols: number;
  rows: number;
  cells: Uint8Array;
  /** Cells that hold a letter: first and last column and row */
  bounds: { c0: number; c1: number; r0: number; r1: number };
}

export function buildBinaryGrid(fontFamily: string): BinaryGrid | null {
  const { cellW: cw, cellH: ch } = GRID;
  const c0 = -Math.floor((SEAM_X - box.x) / cw);
  const cols = Math.floor((box.x + box.w - SEAM_X) / cw) - c0;
  const x0 = SEAM_X + c0 * cw;
  const rows = Math.ceil(box.h / ch);
  const S = 4; // samples per cell side
  const canvas = document.createElement("canvas");
  canvas.width = cols * S;
  canvas.height = rows * S;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.scale(S / cw, S / ch);
  ctx.translate(-x0, -box.y);
  letterforms(ctx, fontFamily);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const cells = new Uint8Array(cols * rows);
  const bounds = { c0: Infinity, c1: -Infinity, r0: Infinity, r1: -Infinity };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (data[((r * S + S / 2) * canvas.width + c * S + S / 2) * 4 + 3] <= 110) continue;
      cells[r * cols + c] = hash(r * 997 + c + c0) > 0.5 ? 2 : 1;
      bounds.c0 = Math.min(bounds.c0, c + c0);
      bounds.c1 = Math.max(bounds.c1, c + c0);
      bounds.r0 = Math.min(bounds.r0, r);
      bounds.r1 = Math.max(bounds.r1, r);
    }
  }
  return { c0, cols, rows, cells, bounds };
}
