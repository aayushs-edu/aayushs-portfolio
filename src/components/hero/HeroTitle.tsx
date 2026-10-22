"use client";

import { motion, type MotionStyle } from "framer-motion";
import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./Hero.module.css";
import { BRUSH, CODE_CELLS, DESIGN, GALLERY, MODE_LABEL, MODES, SNIPPETS, type Mode, type Tier } from "./heroConfig";
import { bristlePaths, BRISTLE_OPACITY, introStrokes, useBrushStrokes } from "./useBrushStrokes";
import { CELL_H, CELL_W, GRID_COLS, GRID_ROWS, GRID_X0, GRID_Y0, codeRows, staticCodePaths, useCodeReveal } from "./useCodeReveal";

const { titleBox: box, cx } = DESIGN;
const VIEWBOX = `${box.x} ${box.y} ${box.w} ${box.h}`;
const ID = {
  nameClip: "hero-name-clip",
  wordClip: (m: Mode) => `hero-word-${m}`,
  wipe: (m: Mode) => `hero-wipe-${m}`,
  bristle: "hero-bristle",
  paint: (i: number) => `hero-paint-${i}`,
  codeMask: "hero-code-mask",
  codeText: "hero-code-text",
};

type Box = { x: number; y: number; w: number; h: number };
/** Pre-font estimates of the two words' boxes (replaced by measured ones). */
const WORD_GUESS: Record<Mode, Box> = {
  art: { x: 370, y: 218, w: 212, h: 104 },
  code: { x: 704, y: 218, w: 338, h: 104 },
};

export interface HeroTitleProps {
  /** Requested mode: drives the Art / Code word styles. */
  mode: Mode;
  /** Mode on screen (the stack lags during a flip). */
  displayMode: Mode;
  selected: Record<Mode, number>;
  tier: Tier;
  interactive: boolean;
  panelId: string;
  onSwitch: (mode: Mode) => void;
  /** Scroll-driven CSS variables (--rise, --title-fade). */
  scrollStyle?: MotionStyle;
}

function NameText({ className }: { className?: string }) {
  return (
    <>
      <text className={`${styles.nameText} ${className ?? ""}`} x={cx} y={DESIGN.baseline1}>
        Aayush
      </text>
      <text className={`${styles.nameText} ${className ?? ""}`} x={cx} y={DESIGN.baseline2}>
        Sharma
      </text>
    </>
  );
}

/** The code block that fills the title, set on the cell grid. */
const CodeText = memo(function CodeText({ snippetIndex }: { snippetIndex: number }) {
  const rows = useMemo(() => codeRows(SNIPPETS[snippetIndex % SNIPPETS.length]), [snippetIndex]);
  const baseline = (CELL_H - CODE_CELLS.fontSize) / 2 + CODE_CELLS.fontSize * 0.8;
  return (
    <g id={ID.codeText}>
      {rows.map((runs, r) => (
        <text
          key={r}
          className={styles.codeLine}
          x={GRID_X0}
          y={GRID_Y0 + r * CELL_H + baseline}
          textLength={GRID_COLS * CELL_W}
          lengthAdjust="spacing"
          xmlSpace="preserve"
        >
          {runs.map(([text, cls], k) => (
            <tspan key={k} className={styles[cls]}>
              {text}
            </tspan>
          ))}
        </text>
      ))}
    </g>
  );
});

const STATIC_STROKES = introStrokes().map((points, i) => bristlePaths(points, 11 + i));
const STATIC_CODE = staticCodePaths();

function HeroTitle({ mode, displayMode, selected, tier, interactive, panelId, onSwitch, scrollStyle }: HeroTitleProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const maskGroups = useRef<(SVGGElement | null)[]>([]);
  const images = useRef<(SVGImageElement | null)[]>([]);
  const rowPaths = useRef<(SVGPathElement | null)[]>([]);
  const strokeRefs = useRef<Record<Mode, SVGTSpanElement | null>>({ art: null, code: null });
  const tabRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ art: null, code: null });
  const [words, setWords] = useState<Record<Mode, Box>>(WORD_GUESS);
  const [preview, setPreview] = useState(false);
  const [seen, setSeen] = useState<Record<Mode, boolean>>({ art: false, code: false });

  const isStatic = tier === "static";
  const live = !isStatic;
  const layers = BRUSH.maxLayers[tier];
  const paintings = useMemo(() => GALLERY.art.map((item) => item.assets.paint ?? item.assets.color), []);
  const artIndex = selected.art;
  // The code layer is ~1,400 tspans: let it re-lay out at low priority while browsing.
  const codeIndex = useDeferredValue(selected.code);

  // Each mode's intro plays the first time that mode is on screen.
  useEffect(() => {
    if (!live) return;
    setSeen((prev) => (prev[displayMode] ? prev : { ...prev, [displayMode]: true }));
  }, [displayMode, live]);

  const artActive = live && interactive && displayMode === "art" && mode === "art";
  const codeActive = live && interactive && displayMode === "code" && mode === "code";

  const brush = useBrushStrokes({
    surfaceRef,
    svgRef,
    maskGroups,
    images,
    paintings,
    startIndex: artIndex,
    layers,
    active: artActive,
    intro: live && seen.art,
  });
  const code = useCodeReveal({
    surfaceRef,
    svgRef,
    rowPaths,
    active: codeActive,
    intro: live && seen.code,
    cap: CODE_CELLS.cap[tier],
  });

  // Live reveals from the old mode fade out (300ms), then clear.
  const showArt = mode === "art";
  const showCode = mode === "code";
  const clearBrush = brush.clear;
  const clearCode = code.clear;
  // (The static tier's fixed reveal is React-rendered and never cleared.)
  useEffect(() => {
    if (showArt || isStatic) return;
    const timer = window.setTimeout(clearBrush, 320);
    return () => window.clearTimeout(timer);
  }, [showArt, isStatic, clearBrush]);
  useEffect(() => {
    if (showCode || isStatic) return;
    const timer = window.setTimeout(clearCode, 320);
    return () => window.clearTimeout(timer);
  }, [showCode, isStatic, clearCode]);

  // Measure the real word boxes once Poppins is in.
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const next = { ...WORD_GUESS };
      for (const m of MODES) {
        const el = strokeRefs.current[m];
        if (!el) continue;
        try {
          const b = el.getBBox();
          if (b.width > 0) next[m] = { x: b.x, y: b.y, w: b.width, h: b.height };
        } catch {
          // getBBox can throw before layout; keep the estimate.
        }
      }
      setWords(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const inactive: Mode = mode === "art" ? "code" : "art";
  const switchable = interactive && mode === displayMode;

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, m: Mode) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const other: Mode = m === "art" ? "code" : "art";
      tabRefs.current[other]?.focus();
    }
  };

  const staticPainting = paintings[artIndex];
  const wordStyleVars = { "--word-delay": isStatic ? "0ms" : `${250}ms` } as CSSProperties;

  return (
    <motion.div ref={surfaceRef} className={styles.titleWrap} style={scrollStyle}>
      <div className={styles.titleIn}>
        <h1 className="sr-only">Aayush Sharma</h1>
        <svg ref={svgRef} className={styles.titleSvg} viewBox={VIEWBOX} aria-hidden="true" focusable="false" style={wordStyleVars}>
          <defs>
            <clipPath id={ID.nameClip}>
              <NameText />
            </clipPath>
            {MODES.map((m) => (
              <clipPath key={m} id={ID.wordClip(m)}>
                {/* The word alone, started at its measured pen position. */}
                <text className={styles.tagText} x={words[m].x} y={DESIGN.tagBaseline} style={{ textAnchor: "start" }}>
                  {MODE_LABEL[m].word}
                </text>
              </clipPath>
            ))}
            <filter id={ID.bristle} filterUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h} colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency={BRUSH.turbulence.baseFrequency} numOctaves={BRUSH.turbulence.octaves} seed={7} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={BRUSH.turbulence.scale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            {Array.from({ length: layers }, (_, i) => (
              <mask key={i} id={ID.paint(i)} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
                <g ref={(el) => void (maskGroups.current[i] = el)} filter={`url(#${ID.bristle})`}>
                  {isStatic &&
                    i === 0 &&
                    STATIC_STROKES.map((paths, k) => (
                      <g key={k}>
                        {paths.map((d, j) => (
                          <path key={j} d={d} fill="#fff" fillOpacity={BRISTLE_OPACITY[j]} />
                        ))}
                      </g>
                    ))}
                </g>
              </mask>
            ))}
            <mask id={ID.codeMask} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
              {Array.from({ length: GRID_ROWS }, (_, r) => (
                <path key={r} ref={(el) => void (rowPaths.current[r] = el)} fill="#fff" d={isStatic ? STATIC_CODE[r] : ""} />
              ))}
            </mask>
            <CodeText snippetIndex={codeIndex} />
            {MODES.map((m) => (
              <mask key={m} id={ID.wipe(m)} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
                <rect
                  className={styles.previewWipe}
                  data-on={preview && inactive === m}
                  x={words[m].x - 4}
                  y={words[m].y - 4}
                  width={words[m].w + 8}
                  height={words[m].h + 8}
                  fill="#fff"
                />
              </mask>
            ))}
          </defs>

          {/* 1. Name fill */}
          <g className={styles.nameFill}>
            <NameText />
          </g>

          {/* 2. Reveal layers, clipped to the letterforms */}
          <g clipPath={`url(#${ID.nameClip})`}>
            <g className={styles.revealGroup} style={{ opacity: showArt ? 1 : 0 }}>
              {Array.from({ length: layers }, (_, i) => (
                <image
                  key={i}
                  ref={(el) => void (images.current[i] = el)}
                  href={isStatic && i === 0 ? staticPainting : undefined}
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  preserveAspectRatio="xMidYMid slice"
                  mask={`url(#${ID.paint(i)})`}
                />
              ))}
            </g>
            <g className={styles.revealGroup} style={{ opacity: showCode ? 1 : 0 }} mask={`url(#${ID.codeMask})`}>
              <use href={`#${ID.codeText}`} />
            </g>
          </g>

          {/* 3. Crisp outline over everything */}
          <g className={styles.nameStroke}>
            <NameText />
          </g>

          {/* 4. Tagline / mode switch: fills, hover previews, then outlines */}
          <text className={styles.tagText} x={cx} y={DESIGN.tagBaseline}>
            <tspan className={styles.word} data-active={mode === "art"}>
              Art
            </tspan>
            <tspan className={styles.tagX}>{" x "}</tspan>
            <tspan className={styles.word} data-active={mode === "code"}>
              Code
            </tspan>
          </text>
          {!isStatic && (
            <>
              <g clipPath={`url(#${ID.wordClip("code")})`} mask={`url(#${ID.wipe("code")})`}>
                <rect x={words.code.x - 4} y={words.code.y - 4} width={words.code.w + 8} height={words.code.h + 8} fill="var(--name-fill)" />
                <use href={`#${ID.codeText}`} />
              </g>
              <g clipPath={`url(#${ID.wordClip("art")})`} mask={`url(#${ID.wipe("art")})`}>
                <image
                  href={paintings[artIndex]}
                  x={words.art.x - 20}
                  y={words.art.y - 20}
                  width={words.art.w + 40}
                  height={words.art.h + 40}
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            </>
          )}
          <text className={styles.tagText} x={cx} y={DESIGN.tagBaseline}>
            <tspan ref={(el) => void (strokeRefs.current.art = el)} className={styles.wordStroke} data-active={mode === "art"}>
              Art
            </tspan>
            <tspan className={styles.tagXStroke}>{" x "}</tspan>
            <tspan ref={(el) => void (strokeRefs.current.code = el)} className={styles.wordStroke} data-active={mode === "code"}>
              Code
            </tspan>
          </text>
        </svg>

        <div role="tablist" aria-label="Portfolio side" className={styles.tablist}>
          {MODES.map((m) => {
            const b = words[m];
            const selectedTab = mode === m;
            return (
              <button
                key={m}
                ref={(el) => void (tabRefs.current[m] = el)}
                type="button"
                role="tab"
                id={`hero-tab-${m}`}
                aria-selected={selectedTab}
                aria-controls={panelId}
                tabIndex={selectedTab ? 0 : -1}
                className={styles.tab}
                style={{
                  left: `${((b.x + b.w / 2 - box.x) / box.w) * 100}%`,
                  top: `${((b.y + b.h / 2 - box.y) / box.h) * 100}%`,
                  width: `${((b.w + 16) / box.w) * 100}%`,
                  height: `${((b.h + 8) / box.h) * 100}%`,
                }}
                onClick={() => {
                  if (!selectedTab && switchable) {
                    setPreview(false);
                    onSwitch(m);
                  }
                }}
                onKeyDown={(event) => onTabKey(event, m)}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "touch" && !selectedTab && !isStatic) setPreview(true);
                }}
                onPointerLeave={() => setPreview(false)}
              >
                {MODE_LABEL[m].word}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(HeroTitle);
