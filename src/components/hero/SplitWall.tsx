"use client";

import { useEffect, useRef } from "react";
import split from "./SplitHero.module.css";
import { WALL } from "./heroConfig";
import type { SplitLayout } from "./splitConfig";

/** A primed-linen tile (copied from WallPaint): plain weave, each thread a slightly different tone. */
function weaveTile(dpr: number): string {
  const { tile, thread } = WALL.weave;
  const n = Math.round(tile / thread);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.round(tile * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.scale(dpr, dpr);
  const tone = (i: number) => {
    const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
    return 0.55 + 0.9 * (s - Math.floor(s));
  };
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = i * thread;
      const y = j * thread;
      ctx.fillStyle = "rgb(0 0 0 / 0.22)";
      ctx.fillRect(x, y, thread, thread);
      ctx.fillStyle = `rgb(255 255 255 / ${(0.09 * ((i + j) % 2 === 0 ? tone(j) : tone(i + 500))).toFixed(3)})`;
      if ((i + j) % 2 === 0) ctx.fillRect(x, y + 0.5, thread, thread - 1);
      else ctx.fillRect(x + 0.5, y, thread - 1, thread);
    }
  }
  return `url(${canvas.toDataURL()})`;
}

/**
 * The wall: linen on the art side of the line, a dot grid (the title's grid) on
 * the code side. Both cover the hero; each is clipped to its side of the line.
 */
export default function SplitWall({ layout }: { layout: SplitLayout | null }) {
  const weaveRef = useRef<HTMLDivElement | null>(null);

  // The linen tile is generated on the client (it needs a canvas), once.
  useEffect(() => {
    const el = weaveRef.current;
    if (!el) return;
    el.style.backgroundImage = weaveTile(Math.min(WALL.dprCap, window.devicePixelRatio || 1));
    el.style.backgroundSize = `${WALL.weave.tile}px ${WALL.weave.tile}px`;
  }, []);

  // One dot every other cell, centred in the cells of the title's grid (column 0 starts at the centre).
  const dots = layout
    ? {
        backgroundSize: `${layout.cellW * 2}px ${layout.cellH}px`,
        backgroundPosition: `${layout.seamX - layout.cellW / 2}px ${layout.gridY}px`,
      }
    : undefined;

  return (
    <div className={split.wall} aria-hidden="true">
      <div ref={weaveRef} className={`${split.artSide} ${split.weave}`} />
      <div className={`${split.codeSide} ${split.dots}`} style={dots} />
    </div>
  );
}
