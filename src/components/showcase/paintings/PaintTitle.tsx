"use client";

import { useEffect, useRef, useState } from "react";
import {
  bristlePaths,
  CORE_BRISTLES,
  type Vec,
} from "../../hero/brushGeometry";
import { DESIGN, NAME, SYNTAX_PALETTE } from "../../hero/heroConfig";
import { hash, tint, type Accent } from "../../hero/nameRaster";
import { FluidTitle } from "./fluidTitle";
import css from "./PaintTitle.module.css";

/** Drawn at the hero name's design size, so the brush, the strokes and the edges match it exactly. */
const SIZE = DESIGN.nameSize;
/** The word's ink, from its baseline (y = 0): Poppins 800's cap top and the "g" descender, plus room for the waver. */
const TOP = -210;
const BOTTOM = 80;
/** Until Poppins is in and measured: the word's width at SIZE. */
const GUESS_W = 1390;
/** Wider than any heading the strokes need to cover. */
const SPAN_W = 2400;

/** Brush strokes across the word, as the hero lays them across each line of the name (design px). */
function buildStrokes(): { d: string; fill: string; op: number }[] {
  const strokes: { d: string; fill: string; op: number }[] = [];
  const accents: Accent[] = ["kw", "str", "fn"];
  const count = 10;
  for (let j = 0; j < count; j++) {
    const k = j + 40;
    const y = -196 + (j / (count - 1)) * 262;
    const angle = (hash(k * 3 + 1) - 0.5) * 0.24;
    const x0 = -40 + (hash(k * 5 + 2) - 0.3) * 260;
    const x1 = SPAN_W - (hash(k * 7 + 3) - 0.3) * 260;
    const pts: Vec[] = [];
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      pts.push([
        x,
        y + (x - GUESS_W / 2) * Math.tan(angle) + Math.sin(t * 8 + j) * 4,
      ]);
    }
    const accent =
      j % 4 === 1 ? accents[Math.floor(j / 4) % accents.length] : null;
    const fill = accent
      ? SYNTAX_PALETTE[accent]
      : tint(NAME.paint, (hash(k * 11 + 4) - 0.5) * 0.16);
    const width = NAME.strokeWidth * (0.85 + hash(k * 13 + 5) * 0.35);
    bristlePaths(pts, 200 + k, width, CORE_BRISTLES).forEach((d, b) =>
      strokes.push({ d, fill, op: CORE_BRISTLES[b].op * (accent ? 0.5 : 1) }),
    );
  }
  return strokes;
}

const STROKES = buildStrokes();

/**
 * A section heading painted as the hero paints the name: warm off-white
 * paint streaked with brush strokes (tints and a few palette accents), cut to
 * the letters, whose edges waver as if brushed. Like the name, it's fluid:
 * moving through it pushes the paint, which flows back into shape (WebGL2, on
 * a canvas over the SVG). With reduced motion or without WebGL2 the SVG stays.
 * Text for screen readers.
 */
export default function PaintTitle({
  id,
  children,
}: {
  id: string;
  children: string;
}) {
  const textRef = useRef<SVGTextElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fluidRef = useRef<FluidTitle | null>(null);
  const [width, setWidth] = useState(GUESS_W);
  const [measured, setMeasured] = useState(false);
  const [fluid, setFluid] = useState(false);
  const rough = `${id}-rough`;
  const mask = `${id}-mask`;

  // Fit the view to the word once Poppins is in.
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      const w = textRef.current?.getComputedTextLength();
      if (!live) return;
      if (w) setWidth(Math.ceil(w));
      setMeasured(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const pad = 24;
  const region = {
    x: -pad,
    y: TOP,
    width: width + pad * 2,
    height: BOTTOM - TOP,
  };

  // The fluid paint, once the word is measured (it covers the SVG exactly).
  useEffect(() => {
    const canvas = canvasRef.current;
    const text = textRef.current;
    if (
      !measured ||
      !canvas ||
      !text ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const family = getComputedStyle(text).fontFamily;
    const box = { x: -pad, y: TOP, w: width + pad * 2, h: BOTTOM - TOP };
    let title: FluidTitle;
    try {
      title = new FluidTitle(canvas, {
        box: { w: box.w, h: box.h },
        paint: (ctx) => {
          ctx.translate(-box.x, -box.y);
          ctx.fillStyle = NAME.paint;
          ctx.fillRect(box.x, box.y, box.w, box.h);
          for (const s of STROKES) {
            ctx.globalAlpha = s.op;
            ctx.fillStyle = s.fill;
            ctx.fill(new Path2D(s.d));
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "destination-in";
          ctx.fillStyle = "#fff";
          ctx.font = `800 ${SIZE}px ${family}`;
          ctx.fillText(children, 0, 0);
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn(error);
      return;
    }
    fluidRef.current = title;
    const resize = () => {
      const { width: w, height: h } = canvas.getBoundingClientRect();
      title.resize(w, h, Math.min(2, window.devicePixelRatio || 1));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    setFluid(true);
    const lost = (e: Event) => {
      e.preventDefault();
      setFluid(false);
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      title.destroy();
      fluidRef.current = null;
      setFluid(false);
    };
  }, [measured, width, children]);

  const onPointerMove = (e: React.PointerEvent) => {
    // As on the hero, the mouse pushes the paint; a finger scrolls the page.
    if (e.pointerType === "touch" || !fluidRef.current || !canvasRef.current)
      return;
    const r = canvasRef.current.getBoundingClientRect();
    fluidRef.current.move(e.clientX - r.left, e.clientY - r.top);
  };

  return (
    <h2 id={id} className={css.title}>
      <span className="sr-only">{children}</span>
      <span
        className={css.stage}
        data-fluid={fluid}
        onPointerMove={onPointerMove}
        onPointerLeave={() => fluidRef.current?.leave()}
      >
        <svg
          className={css.svg}
          viewBox={`${region.x} ${region.y} ${region.width} ${region.height}`}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* As the hero's name: a soft waver plus a fine grain, so the edges read as brushed, not cut. */}
            <filter id={rough} filterUnits="userSpaceOnUse" {...region}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency={NAME.waverFrequency}
                numOctaves={2}
                seed={4}
                result="warp"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="warp"
                scale={NAME.waver}
                xChannelSelector="R"
                yChannelSelector="G"
                result="soft"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency={NAME.grainFrequency}
                numOctaves={1}
                seed={9}
                result="grain"
              />
              <feDisplacementMap
                in="soft"
                in2="grain"
                scale={NAME.grain}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <mask id={mask} maskUnits="userSpaceOnUse" {...region}>
              <text
                ref={textRef}
                className={css.text}
                x={0}
                y={0}
                fontSize={SIZE}
                fill="#fff"
                filter={`url(#${rough})`}
              >
                {children}
              </text>
            </mask>
          </defs>
          <g mask={`url(#${mask})`}>
            <rect {...region} style={{ fill: NAME.paint }} />
            {STROKES.map((s, i) => (
              <path
                key={i}
                d={s.d}
                style={{ fill: s.fill }}
                fillOpacity={s.op}
              />
            ))}
          </g>
        </svg>
        <canvas ref={canvasRef} className={css.canvas} aria-hidden="true" />
      </span>
    </h2>
  );
}
