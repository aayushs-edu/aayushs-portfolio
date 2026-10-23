// The hero wall: a full-screen surface the visitor paints on with the mouse.
// Art mode lays down colored brush strokes that dry and fade; Code mode prints
// syntax-colored code cell by cell along the cursor's path. Both are plain
// canvas engines driven imperatively (no React state per pointer move), and
// both stop their frame loop whenever nothing is changing.

import { bristlePaths, WALL_BRISTLES, type Vec } from "./brushGeometry";
import { codeRows } from "./codeLayout";
import { BRUSH, type Snippet, type TokenClass } from "./heroConfig";

const now = () => performance.now();
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number, dpr: number) {
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
}

// ---------------------------------------------------------------------------
// Brush

/** Splits very long strokes so each pointer move rebuilds a bounded outline. */
const MAX_POINTS = 180;

interface Stroke {
  points: Vec[];
  seed: number;
  /** One color per bristle: the base color, slightly lighter or darker. */
  colors: string[];
  paths: Path2D[] | null;
  dirty: boolean;
  endedAt: number | null;
  /** Set when the stroke is told to go early (too many on the wall, mode switch). */
  fadeFrom: number | null;
  fadeMs: number;
  intro: boolean;
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${ch((n >> 16) & 255)} ${ch((n >> 8) & 255)} ${ch(n & 255)})`;
}

export class BrushEngine {
  /** Core brush width in CSS px. */
  width = 48;
  private ctx: CanvasRenderingContext2D | null;
  private strokes: Stroke[] = [];
  private current: Stroke | null = null;
  private lastMove = 0;
  private lastPoint: Vec | null = null;
  private raf = 0;
  private timer = 0;
  private seed = 1;
  private colorIndex = 0;
  private dpr = 1;
  private introPlaying = false;
  private visitorStroked = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private palette: string[],
    private maxStrokes: number = BRUSH.maxStrokes,
  ) {
    this.ctx = canvas.getContext("2d");
  }

  resize(w: number, h: number, dpr: number) {
    this.dpr = dpr;
    setupCanvas(this.canvas, w, h, dpr);
    this.kick();
  }

  move(x: number, y: number) {
    const t = now();
    if (this.current && t - this.lastMove > BRUSH.pauseMs) this.end();
    this.lastMove = t;
    if (!this.current) {
      if (!this.visitorStroked) {
        this.visitorStroked = true;
        // The intro starts drying once the visitor takes over (or when it finishes, if still playing).
        if (!this.introPlaying) for (const stroke of this.strokes) if (stroke.intro && stroke.endedAt === null) stroke.endedAt = t;
      }
      this.current = this.start();
    }
    const p: Vec = [x, y];
    if (this.lastPoint && Math.hypot(x - this.lastPoint[0], y - this.lastPoint[1]) < BRUSH.minPointDist) return;
    if (this.current.points.length >= MAX_POINTS) {
      // Continue seamlessly in a fresh stroke of the same color.
      const tail = this.current.points.slice(-3);
      const colors = this.current.colors;
      this.current.endedAt = t;
      this.current = this.start(colors);
      this.current.points.push(...tail);
    }
    this.lastPoint = p;
    this.current.points.push(p);
    this.current.dirty = true;
    this.kick();
  }

  end() {
    if (this.current) this.current.endedAt = now();
    this.current = null;
    this.lastPoint = null;
    this.kick();
  }

  /** One scripted stroke, drawn over `ms`; it stays until the visitor paints. */
  intro(points: Vec[], ms: number) {
    if (this.introPlaying || points.length < 2) return;
    this.introPlaying = true;
    const stroke = this.start();
    stroke.intro = true;
    const t0 = now();
    const step = () => {
      const t = Math.min(1, (now() - t0) / ms);
      stroke.points = points.slice(0, Math.max(2, Math.round(easeInOut(t) * points.length)));
      stroke.dirty = true;
      this.kick();
      if (t < 1) requestAnimationFrame(step);
      else {
        this.introPlaying = false;
        if (this.visitorStroked) stroke.endedAt = now();
      }
    };
    requestAnimationFrame(step);
  }

  /** Everything fades out over `ms` (mode switch). */
  clear(ms = 300) {
    this.end();
    const t = now();
    for (const stroke of this.strokes) if (stroke.fadeFrom === null) Object.assign(stroke, { fadeFrom: t, fadeMs: ms });
    this.kick();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.timer);
  }

  private start(colors?: string[]): Stroke {
    const base = this.palette[this.colorIndex++ % this.palette.length];
    const stroke: Stroke = {
      points: [],
      seed: this.seed++,
      colors: colors ?? WALL_BRISTLES.map((_, i) => shade(base, ((i * 37) % 7) / 7 * 0.24 - 0.1)),
      paths: null,
      dirty: true,
      endedAt: null,
      fadeFrom: null,
      fadeMs: 0,
      intro: false,
    };
    this.strokes.push(stroke);
    // Too many on the wall: the oldest dry out quickly rather than vanish.
    const t = now();
    let live = this.strokes.filter((s) => s.fadeFrom === null).length;
    for (const old of this.strokes) {
      if (live <= this.maxStrokes) break;
      if (old.fadeFrom === null && old !== stroke) {
        old.fadeFrom = t;
        old.fadeMs = 700;
        live--;
      }
    }
    return stroke;
  }

  private opacity(stroke: Stroke, t: number): number {
    let o = 1;
    if (stroke.endedAt !== null && !(stroke.intro && !this.visitorStroked)) {
      const age = t - stroke.endedAt - BRUSH.dryDelayMs;
      if (age > 0) o = Math.min(o, 1 - age / BRUSH.dryFadeMs);
    }
    if (stroke.fadeFrom !== null) o = Math.min(o, 1 - (t - stroke.fadeFrom) / Math.max(1, stroke.fadeMs));
    return Math.max(0, o);
  }

  private kick() {
    window.clearTimeout(this.timer);
    if (!this.raf) this.raf = requestAnimationFrame(this.render);
  }

  private render = () => {
    this.raf = 0;
    const ctx = this.ctx;
    if (!ctx) return;
    const t = now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    let animating = this.introPlaying || this.current !== null;
    let nextDry = Infinity;
    for (const stroke of this.strokes) {
      const o = this.opacity(stroke, t);
      if (o <= 0) continue;
      if (stroke.dirty || !stroke.paths) {
        stroke.paths = bristlePaths(stroke.points, stroke.seed, this.width, WALL_BRISTLES).map((d) => new Path2D(d));
        stroke.dirty = false;
      }
      stroke.paths.forEach((path, i) => {
        ctx.globalAlpha = o * WALL_BRISTLES[i].op;
        ctx.fillStyle = stroke.colors[i];
        ctx.fill(path);
      });
      if (o < 1 || stroke.fadeFrom !== null) animating = true;
      else if (stroke.endedAt !== null && !(stroke.intro && !this.visitorStroked)) nextDry = Math.min(nextDry, stroke.endedAt + BRUSH.dryDelayMs);
    }
    ctx.globalAlpha = 1;
    this.strokes = this.strokes.filter((stroke) => this.opacity(stroke, t) > 0);

    if (animating) this.raf = requestAnimationFrame(this.render);
    else if (nextDry < Infinity) this.timer = window.setTimeout(() => this.kick(), Math.max(0, nextDry - now()));
  };
}

// ---------------------------------------------------------------------------
// Code

export interface CodeEngineOptions {
  fontSize: number;
  lineHeight: number;
  advance: number;
  /** Reveal radius around the cursor, in rows. */
  radius: number;
  perCellMs: number;
  fadeAfterMs: number;
  cap: number;
  palette: Record<TokenClass, string>;
}

export class CodeEngine {
  private ctx: CanvasRenderingContext2D | null;
  private layer = document.createElement("canvas");
  private cellW: number;
  private cellH: number;
  private cols = 0;
  private rows = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private revealAt = new Float64Array(0);
  private hideAt = new Float64Array(0);
  private rowNext = new Float64Array(0);
  private rowRuns: [number, number][][] = [];
  private queue: number[] = [];
  private queueHead = 0;
  private raf = 0;
  private timer = 0;
  private last: Vec | null = null;
  private snippet: Snippet | null = null;
  private family = "monospace";

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: CodeEngineOptions,
  ) {
    this.ctx = canvas.getContext("2d");
    this.cellW = opts.fontSize * opts.advance;
    this.cellH = opts.fontSize * opts.lineHeight;
  }

  setFont(family: string) {
    this.family = family;
    this.paintLayer();
  }

  setSnippet(snippet: Snippet) {
    this.snippet = snippet;
    this.paintLayer();
    this.kick();
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    setupCanvas(this.canvas, w, h, dpr);
    const cols = Math.ceil(w / this.cellW);
    const rows = Math.ceil(h / this.cellH);
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols;
      this.rows = rows;
      this.reset();
    }
    this.paintLayer();
    this.kick();
  }

  move(x: number, y: number) {
    const t = now();
    const from = this.last ?? ([x, y] as Vec);
    this.last = [x, y];
    const { cellW, cellH, cols, rows } = this;
    const radius = this.opts.radius * cellH;
    const touched = new Map<number, number[]>();
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from[0], y - from[1]) / (cellW * 1.5)));
    const rowReach = Math.ceil(radius / cellH);
    const colReach = Math.ceil(radius / cellW);
    for (let k = 0; k <= steps; k++) {
      const px = from[0] + ((x - from[0]) * k) / steps;
      const py = from[1] + ((y - from[1]) * k) / steps;
      const cc = Math.floor(px / cellW);
      const cr = Math.floor(py / cellH);
      for (let r = Math.max(0, cr - rowReach); r <= Math.min(rows - 1, cr + rowReach); r++) {
        const dy = (r + 0.5) * cellH - py;
        for (let c = Math.max(0, cc - colReach); c <= Math.min(cols - 1, cc + colReach); c++) {
          const dx = (c + 0.5) * cellW - px;
          if (dx * dx + dy * dy > radius * radius) continue;
          const i = r * cols + c;
          if (this.revealAt[i] !== Infinity) continue;
          this.revealAt[i] = -1; // claimed; scheduled below
          const list = touched.get(r);
          if (list) list.push(c);
          else touched.set(r, [c]);
        }
      }
    }
    // Each newly touched row prints left to right from now.
    touched.forEach((list, r) => {
      list.sort((a, b) => a - b);
      let at = t;
      for (const c of list) {
        const i = r * cols + c;
        this.revealAt[i] = at;
        this.hideAt[i] = at + this.opts.fadeAfterMs;
        this.queue.push(i);
        at += this.opts.perCellMs;
      }
      this.rowNext[r] = Math.min(this.rowNext[r], t);
    });
    this.enforceCap(t);
    if (touched.size) this.kick();
  }

  end() {
    this.last = null;
  }

  /** Everything hides at once (mode switch; the canvas itself fades in CSS). */
  clear() {
    this.reset();
    this.kick();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.timer);
  }

  private reset() {
    const n = this.cols * this.rows;
    this.revealAt = new Float64Array(n).fill(Infinity);
    this.hideAt = new Float64Array(n).fill(Infinity);
    this.rowNext = new Float64Array(this.rows).fill(Infinity);
    this.rowRuns = Array.from({ length: this.rows }, () => []);
    this.queue = [];
    this.queueHead = 0;
    this.last = null;
  }

  private enforceCap(t: number) {
    let live = this.queue.length - this.queueHead;
    while (live > this.opts.cap && this.queueHead < this.queue.length) {
      const i = this.queue[this.queueHead++];
      if (this.revealAt[i] !== Infinity) {
        this.hideAt[i] = t;
        const r = Math.floor(i / this.cols);
        this.rowNext[r] = Math.min(this.rowNext[r], t);
      }
      live--;
    }
  }

  /** The whole grid of code, drawn once into an offscreen layer and clipped per frame. */
  private paintLayer() {
    if (!this.snippet || !this.cols) return;
    const { cellW, cellH, cols, rows, dpr } = this;
    setupCanvas(this.layer, this.w, this.h, dpr);
    const ctx = this.layer.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${this.opts.fontSize}px ${this.family}`;
    ctx.textBaseline = "alphabetic";
    const baseline = (cellH - this.opts.fontSize) / 2 + this.opts.fontSize * 0.8;
    codeRows(this.snippet, cols, rows).forEach((runs, r) => {
      let col = 0;
      for (const [text, cls] of runs) {
        if (text.trim()) {
          ctx.fillStyle = this.opts.palette[cls];
          ctx.fillText(text, col * cellW, r * cellH + baseline);
        }
        col += text.length;
      }
    });
  }

  private kick() {
    window.clearTimeout(this.timer);
    if (!this.raf) this.raf = requestAnimationFrame(this.render);
  }

  private render = () => {
    this.raf = 0;
    const ctx = this.ctx;
    if (!ctx) return;
    const t = now();
    const { cols, rows } = this;
    let nextEvent = Infinity;
    for (let r = 0; r < rows; r++) {
      if (this.rowNext[r] > t) {
        nextEvent = Math.min(nextEvent, this.rowNext[r]);
        continue;
      }
      const runs: [number, number][] = [];
      let next = Infinity;
      let start = -1;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let visible = false;
        if (this.hideAt[i] <= t) {
          this.revealAt[i] = Infinity;
          this.hideAt[i] = Infinity;
        } else if (this.revealAt[i] <= t) {
          visible = true;
          if (this.hideAt[i] < next) next = this.hideAt[i];
        } else if (this.revealAt[i] < next) {
          next = this.revealAt[i];
        }
        if (visible && start < 0) start = c;
        if (!visible && start >= 0) {
          runs.push([start, c]);
          start = -1;
        }
      }
      if (start >= 0) runs.push([start, cols]);
      this.rowRuns[r] = runs;
      this.rowNext[r] = next;
      nextEvent = Math.min(nextEvent, next);
    }
    while (this.queueHead < this.queue.length && this.revealAt[this.queue[this.queueHead]] === Infinity) this.queueHead++;
    if (this.queueHead > 4096) {
      this.queue.splice(0, this.queueHead);
      this.queueHead = 0;
    }

    // Hard-edged cells: clip the code layer to the revealed runs.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const { cellW, cellH, dpr } = this;
    ctx.beginPath();
    let any = false;
    this.rowRuns.forEach((runs, r) => {
      for (const [c0, c1] of runs) {
        ctx.rect(Math.floor(c0 * cellW * dpr), Math.floor(r * cellH * dpr), Math.ceil((c1 - c0) * cellW * dpr), Math.ceil(cellH * dpr));
        any = true;
      }
    });
    if (any) {
      ctx.save();
      ctx.clip();
      ctx.drawImage(this.layer, 0, 0);
      ctx.restore();
    }

    if (nextEvent === Infinity) return;
    const wait = nextEvent - now();
    if (wait <= 34) this.raf = requestAnimationFrame(this.render);
    else this.timer = window.setTimeout(() => this.kick(), wait - 16);
  };
}
