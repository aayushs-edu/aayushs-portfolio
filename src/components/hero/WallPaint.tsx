"use client";

import { useEffect, useRef, type RefObject } from "react";
import styles from "./Hero.module.css";
import type { Vec } from "./brushGeometry";
import { BRUSH, CODE_CELLS, DESIGN, SNIPPETS, SYNTAX_PALETTE, WALL, type Mode, type Tier } from "./heroConfig";
import { BrushEngine, CodeEngine } from "./wallEngines";

interface WallPaintProps {
  mode: Mode;
  tier: Tier;
  /** Painting only at rest (p < 0.03). */
  interactive: boolean;
  /** The hero viewport: receives pointer input and sets the wall's size. */
  surfaceRef: RefObject<HTMLElement | null>;
  /** The composition box, for --u and the title's position. */
  compRef: RefObject<HTMLElement | null>;
  codeIndex: number;
}

const PAINT = [SYNTAX_PALETTE.num, SYNTAX_PALETTE.kw, SYNTAX_PALETTE.fn, SYNTAX_PALETTE.str, SYNTAX_PALETTE.punct];

/** Code-mode grid: one dot every other character cell, on the same grid code prints into. */
const CELL_W = WALL.codeFontPx * CODE_CELLS.advance;
const CELL_H = WALL.codeFontPx * WALL.codeLineHeight;
const DOTS_STYLE = {
  backgroundSize: `${CELL_W * 2}px ${CELL_H}px`,
  backgroundPosition: `${CELL_W / 2 - CELL_W}px 0`,
};

/**
 * A primed-linen tile: plain weave, each thread a slightly different tone,
 * light where a thread passes over and dark in the gaps. Drawn once.
 */
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

/** Title geometry in wall (CSS px) coordinates. */
function titleRect(comp: HTMLElement) {
  const u = comp.offsetWidth / DESIGN.width;
  const { titleBox } = DESIGN;
  return { u, x: comp.offsetLeft, y: comp.offsetTop + titleBox.y * u, w: titleBox.w * u, h: titleBox.h * u };
}

/**
 * The wall behind the name and cards. Move the mouse anywhere over the hero to
 * paint (Art) or print code (Code); strokes dry and fade on their own.
 */
export default function WallPaint({ mode, tier, interactive, surfaceRef, compRef, codeIndex }: WallPaintProps) {
  const paintRef = useRef<HTMLCanvasElement | null>(null);
  const codeRef = useRef<HTMLCanvasElement | null>(null);
  const weaveRef = useRef<HTMLDivElement | null>(null);

  // The linen tile is generated on the client (it needs a canvas), once.
  useEffect(() => {
    const el = weaveRef.current;
    if (!el) return;
    el.style.backgroundImage = weaveTile(Math.min(WALL.dprCap, window.devicePixelRatio || 1));
    el.style.backgroundSize = `${WALL.weave.tile}px ${WALL.weave.tile}px`;
  }, []);
  const engines = useRef<{ brush: BrushEngine; code: CodeEngine } | null>(null);
  const modeRef = useRef(mode);
  const interactiveRef = useRef(interactive);
  modeRef.current = mode;
  interactiveRef.current = interactive;

  // Engines, sizing and pointer input.
  useEffect(() => {
    const surface = surfaceRef.current;
    const paintCanvas = paintRef.current;
    const codeCanvas = codeRef.current;
    if (!surface || !paintCanvas || !codeCanvas) return;
    const brush = new BrushEngine(paintCanvas, PAINT);
    const code = new CodeEngine(codeCanvas, {
      fontSize: WALL.codeFontPx,
      lineHeight: WALL.codeLineHeight,
      advance: CODE_CELLS.advance,
      radius: CODE_CELLS.radius,
      perCellMs: CODE_CELLS.perCellMs,
      fadeAfterMs: CODE_CELLS.fadeAfterMs,
      cap: WALL.codeCap[tier],
      palette: SYNTAX_PALETTE,
    });
    engines.current = { brush, code };

    const resize = () => {
      const w = surface.clientWidth;
      const h = surface.clientHeight;
      const dpr = Math.min(WALL.dprCap, window.devicePixelRatio || 1);
      brush.resize(w, h, dpr);
      code.resize(w, h, dpr);
      const comp = compRef.current;
      if (comp) brush.width = Math.max(WALL.minBrushPx, BRUSH.coreWidth * titleRect(comp).u * WALL.brushScale);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(surface);

    const mono = getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim() || "monospace";
    let cancelled = false;
    document.fonts.load(`${WALL.codeFontPx}px ${mono}`).finally(() => !cancelled && code.setFont(mono));

    const onMove = (event: PointerEvent) => {
      // Mouse and pen only: on touch, swipes stay for scrolling and browsing.
      if (event.pointerType === "touch") return;
      if (!interactiveRef.current) {
        brush.end();
        code.end();
        return;
      }
      const rect = surface.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (modeRef.current === "art") brush.move(x, y);
      else code.move(x, y);
    };
    const onLeave = () => {
      brush.end();
      code.end();
    };
    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerleave", onLeave);

    return () => {
      cancelled = true;
      observer.disconnect();
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerleave", onLeave);
      brush.destroy();
      code.destroy();
      engines.current = null;
    };
  }, [surfaceRef, compRef, tier]);

  // Code mode prints the selected project's snippet.
  useEffect(() => {
    engines.current?.code.setSnippet(SNIPPETS[codeIndex % SNIPPETS.length]);
  }, [codeIndex, tier]);

  // The mode that's leaving fades out (CSS), then clears.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (mode === "art") engines.current?.code.clear();
      else engines.current?.brush.clear(0);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [mode]);

  // Art's intro stroke plays once, the first time Art is on screen. (Code has no
  // intro: printed code behind the binary name would blur its letters.)
  const played = useRef(false);
  useEffect(() => {
    if (tier === "static" || mode !== "art" || played.current) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      const comp = compRef.current;
      const e = engines.current;
      if (cancelled || !comp || !e || played.current) return;
      played.current = true;
      const t = titleRect(comp);
      // One sweep across the wall, behind the name.
      const surfaceW = surfaceRef.current?.clientWidth ?? t.w;
      const points: Vec[] = [];
      for (let i = 0; i <= 110; i++) {
        const k = i / 110;
        points.push([surfaceW * (0.05 + 0.9 * k), t.y + t.h * 0.47 + t.h * 0.3 * Math.sin(k * Math.PI * 2.6 + 0.4)]);
      }
      e.brush.intro(points, BRUSH.introMs);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, tier, compRef, surfaceRef]);

  return (
    <div className={styles.wall} aria-hidden="true">
      {/* The surface you're painting on: a dot grid for code, linen for paint. */}
      <div className={styles.wallSurface} data-kind="dots" data-on={mode === "code"} style={DOTS_STYLE} />
      <div className={styles.wallInk}>
        <canvas ref={paintRef} className={styles.wallCanvas} data-on={mode === "art"} />
        <canvas ref={codeRef} className={styles.wallCanvas} data-kind="code" data-on={mode === "code"} />
      </div>
      {/* Linen sits over the paint too, so strokes take on the weave. */}
      <div ref={weaveRef} className={styles.wallSurface} data-kind="weave" data-on={mode === "art"} />
    </div>
  );
}
