"use client";

// Code mode: the cursor reveals syntax-coloured code inside the letters, cell
// by cell on a monospace grid, printed left to right along the cursor's path.
// The mask is hard-edged rects (one merged path per row), updated imperatively.

import { useEffect, useRef, type RefObject } from "react";
import { CODE_CELLS, DESIGN, type Snippet, type TokenRun } from "./heroConfig";

export const CELL_W = CODE_CELLS.fontSize * CODE_CELLS.advance;
export const CELL_H = CODE_CELLS.fontSize * CODE_CELLS.lineHeight;
export const GRID_X0 = DESIGN.titleBox.x;
export const GRID_Y0 = DESIGN.titleBox.y;
export const GRID_COLS = Math.floor(DESIGN.titleBox.w / CELL_W);
export const GRID_ROWS = Math.ceil(DESIGN.titleBox.h / CELL_H);

/** Brush radius for the reveal, in design px (~3 rows). */
const RADIUS = CODE_CELLS.radius * CELL_H;

// ---------------------------------------------------------------------------
// Layout (pure)

/**
 * Lays the snippet out as side-by-side columns of code filling the grid.
 * Every row is exactly GRID_COLS characters so it can be set with textLength.
 */
export function codeRows(snippet: Snippet): TokenRun[][] {
  const block = CODE_CELLS.columnChars + CODE_CELLS.columnGap;
  const blocks = Math.ceil(GRID_COLS / block);
  // Blank lines would leave holes in the letters; the layout keeps only lines with code.
  const filled = snippet.lines.filter((line) => line.some(([text]) => text.trim().length > 0));
  const lines = filled.length ? filled : [[]];
  const rows: TokenRun[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const runs: TokenRun[] = [];
    let used = 0;
    for (let b = 0; b < blocks && used < GRID_COLS; b++) {
      const line = lines[(b * GRID_ROWS + r) % lines.length];
      let width = 0;
      for (const [text, cls] of line) {
        const room = Math.min(block, GRID_COLS - used) - width;
        if (room <= 0) break;
        const piece = text.slice(0, room);
        runs.push([piece, cls]);
        width += piece.length;
      }
      const pad = Math.min(block, GRID_COLS - used) - width;
      if (pad > 0) runs.push([" ".repeat(pad), "punct"]);
      used += width + Math.max(0, pad);
    }
    rows.push(runs);
  }
  return rows;
}

/** Hard-edged rect subpaths for the visible runs of one row. */
export function rowPath(row: number, runs: [number, number][]): string {
  const y = GRID_Y0 + row * CELL_H;
  return runs
    .map(([c0, c1]) => `M${(GRID_X0 + c0 * CELL_W).toFixed(2)} ${y.toFixed(2)}h${((c1 - c0) * CELL_W).toFixed(2)}v${CELL_H.toFixed(2)}h${(-(c1 - c0) * CELL_W).toFixed(2)}Z`)
    .join("");
}

/** The intro's printed block: ~40% of the letter area, a slanted band, line by line. */
export function introCells(): { row: number; c0: number; c1: number }[] {
  const span = Math.round(GRID_COLS * (CODE_CELLS.introCoverage + 0.05));
  const out = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const start = Math.round(GRID_COLS * (0.06 + 0.42 * (r / GRID_ROWS)));
    out.push({ row: r, c0: start, c1: Math.min(GRID_COLS, start + span) });
  }
  return out;
}

export function staticCodePaths(): string[] {
  const rows: string[] = Array.from({ length: GRID_ROWS }, () => "");
  for (const { row, c0, c1 } of introCells()) rows[row] = rowPath(row, [[c0, c1]]);
  return rows;
}

// ---------------------------------------------------------------------------
// Hook

export interface CodeRevealOptions {
  surfaceRef: RefObject<HTMLElement | null>;
  svgRef: RefObject<SVGSVGElement | null>;
  /** One <path> per grid row, inside the code <mask>. */
  rowPaths: RefObject<(SVGPathElement | null)[]>;
  active: boolean;
  intro: boolean;
  cap: number;
  onInteract?: () => void;
}

export function useCodeReveal(opts: CodeRevealOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const clearAll = useRef<() => void>(() => {});
  const playIntro = useRef<() => void>(() => {});

  useEffect(() => {
    const N = GRID_ROWS * GRID_COLS;
    const revealAt = new Float64Array(N).fill(Infinity);
    const hideAt = new Float64Array(N).fill(Infinity);
    const rowNext = new Float64Array(GRID_ROWS).fill(Infinity);
    const rowCursor = new Float64Array(GRID_ROWS);
    const queue: number[] = [];
    let queueHead = 0;
    let raf = 0;
    let last: [number, number] | null = null;
    let introPending = false;
    let introT0 = 0;
    let interacted = false;
    const now = () => performance.now();

    const render = () => {
      raf = 0;
      const t = now();
      const paths = optsRef.current.rowPaths.current ?? [];
      let pending = false;
      for (let r = 0; r < GRID_ROWS; r++) {
        if (rowNext[r] > t) {
          if (rowNext[r] < Infinity) pending = true;
          continue;
        }
        const runs: [number, number][] = [];
        let next = Infinity;
        let start = -1;
        for (let c = 0; c < GRID_COLS; c++) {
          const i = r * GRID_COLS + c;
          let visible = false;
          if (hideAt[i] <= t) {
            revealAt[i] = Infinity;
            hideAt[i] = Infinity;
          } else if (revealAt[i] <= t) {
            visible = true;
            if (hideAt[i] < next) next = hideAt[i];
          } else if (revealAt[i] < next) {
            next = revealAt[i];
          }
          if (visible && start < 0) start = c;
          if (!visible && start >= 0) {
            runs.push([start, c]);
            start = -1;
          }
        }
        if (start >= 0) runs.push([start, GRID_COLS]);
        paths[r]?.setAttribute("d", rowPath(r, runs));
        rowNext[r] = next;
        if (next < Infinity) pending = true;
      }
      while (queueHead < queue.length && revealAt[queue[queueHead]] === Infinity) queueHead++;
      if (queueHead > 4096) {
        queue.splice(0, queueHead);
        queueHead = 0;
      }
      if (pending) raf = requestAnimationFrame(render);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    // Each batch prints left to right from now; batches never queue behind each other,
    // so fast strokes don't build a backlog.
    const schedule = (r: number, cols: number[], t: number) => {
      cols.sort((a, b) => a - b);
      let at = t;
      for (const c of cols) {
        const i = r * GRID_COLS + c;
        revealAt[i] = at;
        hideAt[i] = at + CODE_CELLS.fadeAfterMs;
        queue.push(i);
        at += CODE_CELLS.perCellMs;
      }
      rowCursor[r] = at;
      rowNext[r] = Math.min(rowNext[r], t);
    };

    const enforceCap = (t: number) => {
      const cap = optsRef.current.cap;
      let live = queue.length - queueHead;
      while (live > cap && queueHead < queue.length) {
        const i = queue[queueHead++];
        if (revealAt[i] !== Infinity) {
          hideAt[i] = t;
          const r = Math.floor(i / GRID_COLS);
          rowNext[r] = Math.min(rowNext[r], t);
        }
        live--;
      }
    };

    const toUser = (clientX: number, clientY: number): [number, number] | null => {
      const svg = optsRef.current.svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return null;
      const { titleBox } = DESIGN;
      return [titleBox.x + ((clientX - rect.left) / rect.width) * titleBox.w, titleBox.y + ((clientY - rect.top) / rect.height) * titleBox.h];
    };

    const releaseIntro = (t: number) => {
      // Intro cells start their 6s countdown in the order they were printed.
      for (let k = queueHead; k < queue.length; k++) {
        const i = queue[k];
        if (hideAt[i] === Infinity && revealAt[i] !== Infinity) hideAt[i] = t + CODE_CELLS.fadeAfterMs + (revealAt[i] - introT0);
      }
      for (let r = 0; r < GRID_ROWS; r++) rowNext[r] = Math.min(rowNext[r], t);
    };

    const onMove = (event: PointerEvent) => {
      const o = optsRef.current;
      if (!o.active) return;
      const p = toUser(event.clientX, event.clientY);
      if (!p) return;
      const t = now();
      if (!interacted) {
        interacted = true;
        if (!introPending) releaseIntro(t);
        o.onInteract?.();
      }
      const from = last ?? p;
      last = p;
      const touched = new Map<number, number[]>();
      const dist = Math.hypot(p[0] - from[0], p[1] - from[1]);
      const steps = Math.max(1, Math.ceil(dist / (CELL_W * 1.5)));
      const rowReach = Math.ceil(RADIUS / CELL_H);
      const colReach = Math.ceil(RADIUS / CELL_W);
      for (let k = 0; k <= steps; k++) {
        const x = from[0] + ((p[0] - from[0]) * k) / steps;
        const y = from[1] + ((p[1] - from[1]) * k) / steps;
        const cc = Math.floor((x - GRID_X0) / CELL_W);
        const cr = Math.floor((y - GRID_Y0) / CELL_H);
        for (let r = Math.max(0, cr - rowReach); r <= Math.min(GRID_ROWS - 1, cr + rowReach); r++) {
          const dy = (r + 0.5) * CELL_H + GRID_Y0 - y;
          for (let c = Math.max(0, cc - colReach); c <= Math.min(GRID_COLS - 1, cc + colReach); c++) {
            const dx = (c + 0.5) * CELL_W + GRID_X0 - x;
            if (dx * dx + dy * dy > RADIUS * RADIUS) continue;
            const i = r * GRID_COLS + c;
            if (revealAt[i] !== Infinity) continue;
            revealAt[i] = -1; // claimed; scheduled below
            const list = touched.get(r);
            if (list) list.push(c);
            else touched.set(r, [c]);
          }
        }
      }
      touched.forEach((cols, r) => schedule(r, cols, t));
      enforceCap(t);
      if (touched.size) kick();
    };

    const onBoundary = () => {
      last = null;
    };

    const surface = optsRef.current.surfaceRef.current;
    surface?.addEventListener("pointermove", onMove);
    surface?.addEventListener("pointerleave", onBoundary);

    clearAll.current = () => {
      revealAt.fill(Infinity);
      hideAt.fill(Infinity);
      rowCursor.fill(0);
      queue.length = 0;
      queueHead = 0;
      last = null;
      const paths = optsRef.current.rowPaths.current ?? [];
      for (let r = 0; r < GRID_ROWS; r++) {
        rowNext[r] = Infinity;
        paths[r]?.setAttribute("d", "");
      }
    };

    // Prints ~40% of the letter area line by line; persists until the first interaction.
    playIntro.current = () => {
      introPending = true;
      const t0 = now();
      introT0 = t0;
      const cells = introCells();
      const perCell = 2;
      const longest = Math.max(...cells.map(({ c0, c1 }) => c1 - c0));
      const rowStagger = Math.max(0, CODE_CELLS.introMs - longest * perCell) / GRID_ROWS;
      for (const { row, c0, c1 } of cells) {
        let at = t0 + row * rowStagger;
        for (let c = c0; c < c1; c++) {
          const i = row * GRID_COLS + c;
          if (revealAt[i] !== Infinity) continue;
          revealAt[i] = at;
          hideAt[i] = Infinity;
          queue.push(i);
          at += perCell;
        }
        rowCursor[row] = Math.max(rowCursor[row], at);
        rowNext[row] = Math.min(rowNext[row], t0);
      }
      introPending = false;
      if (interacted) releaseIntro(now());
      kick();
    };

    return () => {
      surface?.removeEventListener("pointermove", onMove);
      surface?.removeEventListener("pointerleave", onBoundary);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const { intro } = opts;
  useEffect(() => {
    if (!intro) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) playIntro.current();
    });
    return () => {
      cancelled = true;
    };
  }, [intro]);

  return { clear: () => clearAll.current() };
}
