"use client";

import { memo, useEffect, useRef, useState, type Ref } from "react";
import styles from "./Hero.module.css";
import split from "./SplitHero.module.css";
import { DESIGN, NAME } from "./heroConfig";
import { buildBinaryGrid, NAME_STROKES } from "./nameRaster";
import { GRID, SEAM_X } from "./splitConfig";

// The DOM name: what shows before the WebGL name is ready, and without WebGL.
// The name is drawn twice, in full, once painted and once in binary. SplitHero
// clips each to its side of the seam's fluid line; the tagline sits over both.

const { titleBox: box, cx } = DESIGN;
const VIEWBOX = `${box.x} ${box.y} ${box.w} ${box.h}`;
const ID = {
  rough: "split-name-rough",
  paintMask: "split-name-paint",
};

interface BinaryRow {
  /** Text baseline, cell top and cell height (design px) */
  y: number;
  top: number;
  h: number;
  runs: { x: number; w: number; text: string }[];
}

/** The binary grid as runs of digits per row, for SVG text. */
function binaryRows(fontFamily: string): BinaryRow[] {
  const grid = buildBinaryGrid(fontFamily);
  if (!grid) return [];
  const { cellW: cw, cellH: ch } = GRID;
  const out: BinaryRow[] = [];
  for (let r = 0; r < grid.rows; r++) {
    const runs: BinaryRow["runs"] = [];
    let start = -1;
    for (let c = 0; c <= grid.cols; c++) {
      const on = c < grid.cols && grid.cells[r * grid.cols + c] > 0;
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        let text = "";
        for (let k = start; k < c; k++) text += grid.cells[r * grid.cols + k] === 2 ? "1" : "0";
        runs.push({ x: SEAM_X + (start + grid.c0) * cw, w: (c - start) * cw, text });
        start = -1;
      }
    }
    if (runs.length) out.push({ y: box.y + r * ch + (ch - NAME.binaryFont) / 2 + NAME.binaryFont * 0.8, top: box.y + r * ch, h: ch, runs });
  }
  return out;
}

/** The tagline drawn thick in black: cut out of the name so "Art x Code" stays legible. */
function TaglineGap() {
  return (
    <text className={styles.tagText} x={cx} y={DESIGN.tagBaseline} fill="#000" stroke="#000" strokeWidth={NAME.taglineGap} strokeLinejoin="round">
      Art x Code
    </text>
  );
}

function NameText({ textRef }: { textRef?: Ref<SVGTextElement> }) {
  return (
    <>
      <text ref={textRef} className={styles.nameText} x={cx} y={DESIGN.baseline1}>
        Aayush
      </text>
      <text className={styles.nameText} x={cx} y={DESIGN.baseline2}>
        Sharma
      </text>
    </>
  );
}

/** "Aayush Sharma" in full, painted. */
export const PaintedName = memo(function PaintedName() {
  return (
    <div className={`${styles.titleIn} ${split.cached}`}>
      <svg className={styles.titleSvg} viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        <defs>
          {/* Soft waver plus a fine grain: letter edges read as brushed, not cut. */}
          <filter id={ID.rough} filterUnits="userSpaceOnUse" x={box.x - 20} y={box.y - 20} width={box.w + 40} height={box.h + 40}>
            <feTurbulence type="fractalNoise" baseFrequency={NAME.waverFrequency} numOctaves={2} seed={4} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale={NAME.waver} xChannelSelector="R" yChannelSelector="G" result="soft" />
            <feTurbulence type="fractalNoise" baseFrequency={NAME.grainFrequency} numOctaves={1} seed={9} result="grain" />
            <feDisplacementMap in="soft" in2="grain" scale={NAME.grain} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id={ID.paintMask} maskUnits="userSpaceOnUse" x={box.x - 20} y={box.y - 20} width={box.w + 40} height={box.h + 40}>
            <g filter={`url(#${ID.rough})`} fill="#fff">
              <NameText />
            </g>
            <TaglineGap />
          </mask>
        </defs>
        <g mask={`url(#${ID.paintMask})`}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} style={{ fill: NAME.paint }} />
          {NAME_STROKES.map((s, i) => (
            <path key={i} d={s.d} style={{ fill: s.fill }} fillOpacity={s.op} />
          ))}
        </g>
      </svg>
    </div>
  );
});

/** "Aayush Sharma" in full, in binary. */
export const BinaryName = memo(function BinaryName() {
  const nameRef = useRef<SVGTextElement | null>(null);
  const [binary, setBinary] = useState<BinaryRow[] | null>(null);

  // Once Poppins is in, rasterize the letters onto the grid.
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const family = nameRef.current ? getComputedStyle(nameRef.current).fontFamily : "sans-serif";
      setBinary(binaryRows(family));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`${styles.titleIn} ${split.cached}`}>
      <svg className={styles.titleSvg} viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        {binary ? (
          <>
            {/* Solid backing: the wall and the seam never show through the letters. */}
            <g className={styles.binaryBacking}>
              {binary.map((row) => row.runs.map((run, k) => <rect key={`${row.y}-${k}`} x={run.x} y={row.top} width={run.w} height={row.h} />))}
            </g>
            {binary.map((row, r) => (
              <text key={r} className={styles.binaryLine} y={row.y} xmlSpace="preserve">
                {row.runs.map((run, k) => (
                  <tspan key={k} x={run.x}>
                    {run.text}
                  </tspan>
                ))}
              </text>
            ))}
          </>
        ) : (
          <g className={styles.punct}>
            <NameText textRef={nameRef} />
          </g>
        )}
      </svg>
    </div>
  );
});

/** "Art x Code" over both halves, plus the real heading. */
export const Tagline = memo(function Tagline() {
  return (
    <div className={styles.titleIn}>
      <h1 className="sr-only">Aayush Sharma</h1>
      <svg className={styles.titleSvg} viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        <text className={`${styles.tagText} ${split.tagline}`} x={cx} y={DESIGN.tagBaseline}>
          Art x Code
        </text>
      </svg>
    </div>
  );
});
