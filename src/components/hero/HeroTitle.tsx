"use client";

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from "react";
import styles from "./Hero.module.css";
import { bristlePaths, CORE_BRISTLES, type Vec } from "./brushGeometry";
import { codeRows } from "./codeLayout";
import { CODE_CELLS, DESIGN, GALLERY, MODE_LABEL, MODES, NAME, SNIPPETS, type Mode, type Tier } from "./heroConfig";

const { titleBox: box, cx } = DESIGN;
const VIEWBOX = `${box.x} ${box.y} ${box.w} ${box.h}`;
const ID = {
  rough: "hero-name-rough",
  paintMask: "hero-name-paint",
  wordClip: (m: Mode) => `hero-word-${m}`,
  wipe: (m: Mode) => `hero-wipe-${m}`,
  codeText: "hero-code-text",
};

type Box = { x: number; y: number; w: number; h: number };
/** Pre-font estimates of the two words' boxes (replaced by measured ones). */
const WORD_GUESS: Record<Mode, Box> = {
  art: { x: 370, y: 218, w: 212, h: 104 },
  code: { x: 704, y: 218, w: 338, h: 104 },
};

/** The title's code grid (used by the "Code" hover preview). */
const CELL_W = CODE_CELLS.fontSize * CODE_CELLS.advance;
const CELL_H = CODE_CELLS.fontSize * CODE_CELLS.lineHeight;
const GRID_COLS = Math.floor(box.w / CELL_W);
const GRID_ROWS = Math.ceil(box.h / CELL_H);

function hash(n: number): number {
  const s = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return s - Math.floor(s);
}

function tint(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${ch((n >> 16) & 255)} ${ch((n >> 8) & 255)} ${ch(n & 255)})`;
}

/**
 * Brush strokes laid across each line of the name at slightly different
 * angles and lengths: mostly the off-white paint in lighter and darker
 * tints, with a few soft palette accents (warm on the first line, cool on
 * the second). The letterforms mask them, so the name reads as painted.
 */
function buildNameStrokes() {
  const strokes: { d: string; fill: string; op: number }[] = [];
  const lines = [
    { baseline: DESIGN.baseline1, span: 262, accents: ["var(--syn-kw)", "var(--syn-str)", "var(--syn-fn)"] },
    { baseline: DESIGN.baseline2, span: 212, accents: ["var(--syn-num)", "var(--syn-punct)", "var(--syn-num)"] },
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
      const accent = j % 4 === 1;
      const fill = accent ? accents[Math.floor(j / 4) % accents.length] : tint(NAME.paint, (hash(k * 11 + 4) - 0.5) * 0.16);
      const width = NAME.strokeWidth * (0.85 + hash(k * 13 + 5) * 0.35);
      bristlePaths(pts, 200 + k, width, CORE_BRISTLES).forEach((d, b) => strokes.push({ d, fill, op: CORE_BRISTLES[b].op * (accent ? 0.5 : 1) }));
      k++;
    }
  });
  return strokes;
}

const NAME_STROKES = buildNameStrokes();

interface BinaryRow {
  /** Text baseline, cell top and cell height (design px) */
  y: number;
  top: number;
  h: number;
  runs: { x: number; w: number; text: string }[];
}

/** The tagline drawn thick in black: cut out of the name so "Art x Code" stays legible. */
function TaglineGap() {
  return (
    <text
      className={styles.tagText}
      x={cx}
      y={DESIGN.tagBaseline}
      fill="#000"
      stroke="#000"
      strokeWidth={NAME.taglineGap}
      strokeLinejoin="round"
    >
      Art x Code
    </text>
  );
}

/**
 * The name as binary: the letterforms are rasterized onto a character grid
 * and every cell inside a letter gets a 0 or a 1.
 */
function buildBinaryName(fontFamily: string): BinaryRow[] {
  const cw = NAME.binaryFont * CODE_CELLS.advance;
  const ch = NAME.binaryFont * NAME.binaryLineHeight;
  const cols = Math.floor(box.w / cw);
  const rows = Math.ceil(box.h / ch);
  const S = 4; // samples per cell side
  const canvas = document.createElement("canvas");
  canvas.width = cols * S;
  canvas.height = rows * S;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.scale(S / cw, S / ch);
  ctx.translate(-box.x, -box.y);
  ctx.font = `800 ${DESIGN.nameSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.fillText("Aayush", cx, DESIGN.baseline1);
  ctx.fillText("Sharma", cx, DESIGN.baseline2);
  // Leave the cells under the tagline (plus a gap) empty.
  ctx.globalCompositeOperation = "destination-out";
  ctx.font = `800 ${DESIGN.tagSize}px ${fontFamily}`;
  ctx.lineWidth = NAME.taglineGap;
  ctx.lineJoin = "round";
  ctx.strokeText("Art x Code", cx, DESIGN.tagBaseline);
  ctx.fillText("Art x Code", cx, DESIGN.tagBaseline);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const inside = (c: number, r: number) => data[((r * S + S / 2) * canvas.width + c * S + S / 2) * 4 + 3] > 110;

  const out: BinaryRow[] = [];
  for (let r = 0; r < rows; r++) {
    const runs: BinaryRow["runs"] = [];
    let start = -1;
    for (let c = 0; c <= cols; c++) {
      const on = c < cols && inside(c, r);
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        let text = "";
        for (let k = start; k < c; k++) text += hash(r * 997 + k) > 0.5 ? "1" : "0";
        runs.push({ x: box.x + start * cw, w: (c - start) * cw, text });
        start = -1;
      }
    }
    if (runs.length) out.push({ y: box.y + r * ch + (ch - NAME.binaryFont) / 2 + NAME.binaryFont * 0.8, top: box.y + r * ch, h: ch, runs });
  }
  return out;
}

export interface HeroTitleProps {
  /** Requested mode: drives the Art / Code word styles and which name shows. */
  mode: Mode;
  /** Mode on screen (the stack lags during a flip). */
  displayMode: Mode;
  selected: Record<Mode, number>;
  tier: Tier;
  interactive: boolean;
  panelId: string;
  onSwitch: (mode: Mode) => void;
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

/** Code for the "Code" hover preview: only the rows that cross the tagline. */
const PreviewCode = memo(function PreviewCode({ snippetIndex, band }: { snippetIndex: number; band: Box }) {
  const rows = useMemo(() => codeRows(SNIPPETS[snippetIndex % SNIPPETS.length], GRID_COLS, GRID_ROWS), [snippetIndex]);
  const baseline = (CELL_H - CODE_CELLS.fontSize) / 2 + CODE_CELLS.fontSize * 0.8;
  const r0 = Math.max(0, Math.floor((band.y - 8 - box.y) / CELL_H));
  const r1 = Math.min(GRID_ROWS - 1, Math.ceil((band.y + band.h + 8 - box.y) / CELL_H));
  return (
    <g id={ID.codeText}>
      {rows.slice(r0, r1 + 1).map((runs, i) => (
        <text
          key={r0 + i}
          className={styles.codeLine}
          x={box.x}
          y={box.y + (r0 + i) * CELL_H + baseline}
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

function HeroTitle({ mode, displayMode, selected, tier, interactive, panelId, onSwitch }: HeroTitleProps) {
  const nameRef = useRef<SVGTextElement | null>(null);
  const strokeRefs = useRef<Record<Mode, SVGTSpanElement | null>>({ art: null, code: null });
  const tabRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ art: null, code: null });
  const [words, setWords] = useState<Record<Mode, Box>>(WORD_GUESS);
  const [preview, setPreview] = useState(false);
  const [binary, setBinary] = useState<BinaryRow[] | null>(null);

  const isStatic = tier === "static";
  const paintings = useMemo(() => GALLERY.art.map((item) => item.assets.paint ?? item.assets.color), []);
  const artIndex = selected.art;
  // The preview code re-lays out at low priority while browsing.
  const codeIndex = useDeferredValue(selected.code);

  // Once Poppins is in: measure the tagline words and rasterize the binary name.
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
      const family = nameRef.current ? getComputedStyle(nameRef.current).fontFamily : "sans-serif";
      setBinary(buildBinaryName(family));
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

  const wordStyleVars = { "--word-delay": isStatic ? "0ms" : `${250}ms` } as CSSProperties;

  return (
    <div className={styles.titleWrap}>
      <div className={styles.titleIn}>
        <h1 className="sr-only">Aayush Sharma</h1>
        <svg className={styles.titleSvg} viewBox={VIEWBOX} aria-hidden="true" focusable="false" style={wordStyleVars}>
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
                <NameText textRef={nameRef} />
              </g>
              {/* Keep the paint clear of the tagline. */}
              <TaglineGap />
            </mask>
            {MODES.map((m) => (
              <clipPath key={m} id={ID.wordClip(m)}>
                {/* The word alone, started at its measured pen position. */}
                <text className={styles.tagText} x={words[m].x} y={DESIGN.tagBaseline} style={{ textAnchor: "start" }}>
                  {MODE_LABEL[m].word}
                </text>
              </clipPath>
            ))}
            <PreviewCode snippetIndex={codeIndex} band={words.code} />
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

          {/* 1. The name, painted (Art) */}
          <g className={styles.nameLayer} style={{ opacity: mode === "art" ? 1 : 0 }} mask={`url(#${ID.paintMask})`}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} style={{ fill: NAME.paint }} />
            {NAME_STROKES.map((s, i) => (
              <path key={i} d={s.d} style={{ fill: s.fill }} fillOpacity={s.op} />
            ))}
          </g>

          {/* 1'. The name, in binary (Code) */}
          <g className={styles.nameLayer} style={{ opacity: mode === "code" ? 1 : 0 }}>
            {binary ? (
              <>
                {/* Solid backing: code on the wall never shows through the letters. */}
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
                <NameText />
              </g>
            )}
          </g>

          {/* 2. Tagline / mode switch: fills, hover previews, then outlines */}
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
    </div>
  );
}

export default memo(HeroTitle);
