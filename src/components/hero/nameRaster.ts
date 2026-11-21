// The name as pixels (client only: needs a canvas and Poppins): the mask the
// seam is seen through.

import { DESIGN, NAME } from "./heroConfig";

const { titleBox: box, cx } = DESIGN;

export function hash(n: number): number {
  const s = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return s - Math.floor(s);
}

export function tint(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${ch((n >> 16) & 255)} ${ch((n >> 8) & 255)} ${ch(n & 255)})`;
}

export type Accent = "kw" | "str" | "fn" | "num" | "punct";

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

/** The letterforms over the whole title box, white on transparent, `scale` device px per design px. */
export function letterMaskCanvas(fontFamily: string, scale: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(box.w * scale));
  canvas.height = Math.max(1, Math.round(box.h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.translate(-box.x, -box.y);
  letterforms(ctx, fontFamily);
  return canvas;
}
