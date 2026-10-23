// Hero viewport geometry shared by the DOM (Hero.tsx) and WebGL (HeroCanvas.tsx).

import { DESIGN, PHASES, SCROLL, type GalleryItem } from "./heroConfig";

export interface Rect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** Hero viewport geometry in CSS px, relative to the pinned container. */
export interface HeroLayout {
  W: number;
  H: number;
  u: number;
  /** Front card's inner image at rest */
  card: Rect;
  /** Its corner radius (CSS px) */
  cardRadius: number;
  /** Where the zoom act ends */
  zoom: Rect;
  /** Placard text offset to the bottom-left gutter */
  placard: { dx: number; dy: number };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const easeInOut = (t: number) => t * t * (3 - 2 * t);

/** Front image rect at a given zoom amount (0 = card, 1 = zoomed). Shared with WebGL. */
export function zoomRect(layout: HeroLayout, t: number): Rect {
  const { card, zoom } = layout;
  return {
    cx: card.cx + (zoom.cx - card.cx) * t,
    cy: card.cy + (zoom.cy - card.cy) * t,
    w: card.w + (zoom.w - card.w) * t,
    h: card.h + (zoom.h - card.h) * t,
  };
}

export const zoomAmount = (p: number) => easeInOut(range(p, PHASES.rest, PHASES.zoomEnd));

export function measureLayout(sticky: HTMLElement, comp: HTMLElement, item: GalleryItem, placardRest: DOMRect | null, stickyRect: DOMRect): HeroLayout {
  const W = sticky.clientWidth;
  const H = sticky.clientHeight;
  const u = comp.offsetWidth / DESIGN.width;
  const card: Rect = {
    cx: comp.offsetLeft + DESIGN.cx * u,
    cy: comp.offsetTop + DESIGN.stackCy * u,
    w: item.frame.imgW * u,
    h: item.frame.imgH * u,
  };
  let w = W * SCROLL.zoomFill;
  let h = w / item.aspect;
  if (h > H * SCROLL.zoomFill) {
    h = H * SCROLL.zoomFill;
    w = h * item.aspect;
  }
  const long = Math.max(w, h);
  if (long > item.maxZoom) {
    w *= item.maxZoom / long;
    h *= item.maxZoom / long;
  }
  // Small sources zoom less, but never shrink below the card.
  if (w < card.w) {
    w = card.w;
    h = card.h;
  }
  const gutter = W < 640 ? DESIGN.gutterNarrow : DESIGN.gutter;
  const placard = placardRest
    ? { dx: gutter - (placardRest.left - stickyRect.left), dy: H - gutter - placardRest.height - (placardRest.top - stickyRect.top) }
    : { dx: 0, dy: 0 };
  return { W, H, u, card, cardRadius: item.frame.innerRadius * u, zoom: { cx: W / 2, cy: H / 2, w, h }, placard };
}
