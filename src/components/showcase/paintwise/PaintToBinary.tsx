"use client";

import { useEffect, useRef } from "react";
import css from "./PaintToBinary.module.css";

/**
 * Behind Paintwise: paint turning into code. Now and then a swirling brush
 * stroke is laid across the page in pixel art (a few at a time, never many),
 * in a vibrant colour dulled down. Its first half is paint; halfway along, the
 * paint breaks up into 0s and 1s in a tiny pixel font, which flicker and fade
 * out toward the stroke's curled end, as the hackathons' letters do. A little
 * behind the brush, it dissolves from its start to its end, as it was laid.
 * Under the strokes, a dim ground fills the space (GROUND). Small canvases,
 * scaled up with hard pixels, drawn only while on screen; with reduced motion,
 * one still frame.
 */

/**
 * What fills the space under the strokes: soft fields of the same dulled
 * colours, dithered and drifting ("underpainting"); a faint still grid of tiny
 * 0s and 1s that flicker now and then ("binary"); or a primed canvas's weave
 * ("weave"). `?ground=` in the URL tries another.
 */
type Ground = "underpainting" | "binary" | "weave";
const GROUND: Ground = "underpainting";

/** CSS px per art pixel: the paint's, and the digits' (finer, so they're small). */
const PX = 3;
const DIGIT_PX = 2;
/** A digit's cell (digit px): a 3 × 5 glyph and its gap. */
const CELL_W = 4;
const CELL_H = 6;
const GLYPHS = [
  [0b111, 0b101, 0b101, 0b101, 0b111],
  [0b010, 0b110, 0b010, 0b010, 0b111],
];
/** At most this many strokes at once, one begun every SPAWN_MS (a random time between the two). */
const MAX_STROKES = 12;
const SPAWN_MS = [300, 650] as const;
/** The brush lays a stroke over PAINT_MS; each part starts to fade TRAIL_MS after the brush laid it (so the start goes while the brush is still going), taking FADE_EACH_MS to go. */
const PAINT_MS = 2200;
const TRAIL_MS = 1100;
const FADE_EACH_MS = 700;
/** Over this stretch of the stroke (0–1) the paint thins out as the digits come in, taking on their colour. */
const BLEND = [0.32, 0.68] as const;
/** A digit flips every FLIP_MS or so, and drops this far (digit px) over DROP_MS. */
const FLIP_MS = 320;
const FALL = 4;
const DROP_MS = 3200;
const FRAME_MS = 33;

/** Vibrant hues, dulled toward a dark grey: the stroke's body, and its digits (a little brighter). */
const HUES = ["#ff4f8b", "#ffb020", "#3fd0e0", "#8b6cff", "#4cd97b", "#ff6a3d", "#4f9dff"];
const GREY = [58, 58, 66];
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const css3 = (c: number[]) => `rgb(${c.join(" ")})`;
const PALETTE = HUES.map((hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const body = mix(c, GREY, 0.45);
  return {
    rgb: body,
    body: css3(body),
    light: css3(mix(body, [255, 255, 255], 0.16)),
    dark: css3(mix(body, [0, 0, 0], 0.3)),
    /** A digit's colour, from the paint's (k = 0) to its own (k = 1) */
    digit: (k: number) => css3(mix(body, mix(c, GREY, 0.25), k)),
  };
});
const smooth = (a: number, b: number, x: number) => {
  const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

interface Cell {
  /** Its glyph's top left (digit px) */
  x: number;
  y: number;
  /** Where along the stroke it is (0–1): when the brush reaches it */
  t: number;
  /** How strong it is (0–1): coming in through the blend, fainter toward the stroke's end */
  strength: number;
  colour: string;
  digit: number;
  seed: number;
}

interface Stroke {
  born: number;
  colour: (typeof PALETTE)[number];
  /** Its paint pixels by shade, flat [x, y, t, …] */
  body: number[];
  light: number[];
  dark: number[];
  /** Its second half, as digits (on the digits' finer grid) */
  cells: Cell[];
  /** Its middle (art px), to keep new strokes clear of it */
  cx: number;
  cy: number;
}

/** A pixel's own fixed noise (0–1), for the dithered blend. */
const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

/**
 * A swirling stroke across a cols × rows board: the brush's heading keeps
 * turning, tighter toward the end, so it curls. Its paint pixels are shaded in
 * bands along it (a highlight, a dark edge) and dithered at the rim; past the
 * middle they give way to digit cells.
 */
function makeStroke(cols: number, rows: number, born: number, avoid: Stroke[]): Stroke {
  // Of a few places, the one farthest from the strokes already there.
  let best = { x: 0, y: 0, score: -1 };
  for (let k = 0; k < 6; k++) {
    const x = cols * (0.12 + Math.random() * 0.76);
    const y = rows * (0.12 + Math.random() * 0.76);
    const score = avoid.length ? Math.min(...avoid.map((s) => Math.hypot(s.cx - x, s.cy - y))) : 1;
    if (score > best.score) best = { x, y, score };
  }

  // The path, one art pixel a step: the turn per step grows along it, adding up to `turn`.
  const n = Math.round(cols * (0.2 + Math.random() * 0.12));
  const turn = (Math.random() < 0.5 ? -1 : 1) * Math.PI * (1.5 + Math.random() * 0.8);
  const weights = Array.from({ length: n }, (_, i) => 0.4 + 1.2 * (i / n));
  const total = weights.reduce((a, b) => a + b, 0);
  let heading = Math.random() * Math.PI * 2;
  let [x, y] = [0, 0];
  const path: { x: number; y: number; tx: number; ty: number }[] = [];
  for (let i = 0; i <= n; i++) {
    path.push({ x, y, tx: Math.cos(heading), ty: Math.sin(heading) });
    if (i < n) {
      heading += (turn * weights[i]) / total;
      x += Math.cos(heading);
      y += Math.sin(heading);
    }
  }
  // Centred on the chosen place.
  const xs = path.map((p) => p.x);
  const ys = path.map((p) => p.y);
  const ox = best.x - (Math.min(...xs) + Math.max(...xs)) / 2;
  const oy = best.y - (Math.min(...ys) + Math.max(...ys)) / 2;
  const r = 4.5 + Math.random() * 2.5;

  // Stamp the brush along it: each pixel keeps the first t that reached it, how far it is from the middle, and which side.
  const hit = new Map<number, { t: number; d: number; side: number }>();
  path.forEach((p, i) => {
    const t = i / n;
    const [sx, sy] = [p.x + ox, p.y + oy];
    const rt = r * Math.sqrt(0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.92)));
    for (let py = Math.floor(sy - rt); py <= Math.ceil(sy + rt); py++) {
      for (let px = Math.floor(sx - rt); px <= Math.ceil(sx + rt); px++) {
        if (px < 0 || py < 0 || px >= cols || py >= rows) continue;
        const d = Math.hypot(px - sx, py - sy) / rt;
        if (d > 1) continue;
        const key = py * cols + px;
        const was = hit.get(key);
        const side = ((px - sx) * -p.ty + (py - sy) * p.tx) / rt;
        if (!was) hit.set(key, { t, d, side });
        else if (d < was.d) hit.set(key, { t: was.t, d, side });
      }
    }
  });

  const body: number[] = [];
  const light: number[] = [];
  const dark: number[] = [];
  let [minX, minY, maxX, maxY] = [cols, rows, 0, 0];
  for (const [key, { t, d, side }] of hit) {
    const px = key % cols;
    const py = Math.floor(key / cols);
    [minX, minY, maxX, maxY] = [Math.min(minX, px), Math.min(minY, py), Math.max(maxX, px), Math.max(maxY, py)];
    // Paint, thinning out (dithered) through the blend; a dithered rim, as pixel art blends an edge.
    if (hash(px, py) < smooth(BLEND[0], BLEND[1], t)) continue;
    if (d > 0.82 && (px + py) % 2) continue;
    const band = side > -0.4 && side < -0.12 ? light : side > 0.55 || d > 0.9 ? dark : body;
    band.push(px, py, t);
  }
  const colour = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  // Digits from the blend on, on their own finer grid: a cell gets one where its glyph's middle and corners are inside the stroke, so they keep its shape.
  const at = (dx: number, dy: number) => hit.get(Math.floor((dy * DIGIT_PX) / PX) * cols + Math.floor((dx * DIGIT_PX) / PX));
  const cells: Cell[] = [];
  const k = PX / DIGIT_PX;
  for (let gy = Math.floor((minY * k) / CELL_H); gy <= Math.ceil(((maxY + 1) * k) / CELL_H); gy++) {
    for (let gx = Math.floor((minX * k) / CELL_W); gx <= Math.ceil(((maxX + 1) * k) / CELL_W); gx++) {
      const [x, y] = [gx * CELL_W, gy * CELL_H];
      const mid = at(x + 1.5, y + 2.5);
      if (!mid || mid.d > 0.85 || mid.t < BLEND[0] || !at(x, y) || !at(x + 3, y + 5)) continue;
      const comeIn = smooth(BLEND[0], BLEND[1], mid.t);
      const toEnd = Math.max(0, (mid.t - BLEND[1]) / (1 - BLEND[1]));
      cells.push({ x, y, t: mid.t, strength: comeIn * (1 - 0.9 * toEnd ** 1.3), colour: colour.digit(comeIn), digit: Math.random() < 0.5 ? 0 : 1, seed: Math.random() });
    }
  }
  return { born, colour, body, light, dark, cells, cx: best.x, cy: best.y };
}

const goneAt = (s: Stroke) => s.born + PAINT_MS + TRAIL_MS + FADE_EACH_MS;

/** Draws a stroke: its paint on `ctx`, its digits on `dctx` (the finer grid). */
function drawStroke(ctx: CanvasRenderingContext2D, dctx: CanvasRenderingContext2D, s: Stroke, now: number) {
  const age = now - s.born;
  const laid = Math.min(1, age / PAINT_MS);
  // How far each part has faded (0–1): the fade follows the brush from the start to the end, TRAIL_MS behind it.
  const gone = (t: number) => Math.max(0, Math.min(1, (age - t * PAINT_MS - TRAIL_MS) / FADE_EACH_MS));
  ctx.globalAlpha = 1;
  for (const [pixels, colour] of [
    [s.dark, s.colour.dark],
    [s.body, s.colour.body],
    [s.light, s.colour.light],
  ] as const) {
    ctx.fillStyle = colour;
    for (let i = 0; i < pixels.length; i += 3) {
      const t = pixels[i + 2];
      // Fading, the paint dissolves pixel by pixel (dithered), as pixel art fades.
      if (t <= laid && hash(pixels[i] + 37, pixels[i + 1] + 91) >= gone(t)) ctx.fillRect(pixels[i], pixels[i + 1], 1, 1);
    }
  }
  // The digits: each comes in as the brush passes it, flipping now and then and slowly dropping.
  for (const c of s.cells) {
    if (c.t > laid) continue;
    const since = now - (s.born + c.t * PAINT_MS);
    const fade = 1 - gone(c.t);
    if (fade <= 0) continue;
    dctx.globalAlpha = fade * Math.min(1, since / 180) * c.strength;
    dctx.fillStyle = c.colour;
    const glyph = GLYPHS[(c.digit + Math.floor(now / (FLIP_MS * (0.7 + c.seed)) + c.seed * 5)) % 2];
    const drop = Math.floor(Math.min(1, since / DROP_MS) * FALL);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (glyph[row] & (4 >> col)) dctx.fillRect(c.x + col, c.y + row + drop, 1, 1);
      }
    }
  }
}

// ---- The ground -----------------------------------------------------------------

/** A 4 × 4 ordered dither, 0–1: pixel art's way of shading between flat colours. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
/** The underpainting's fields: how many, how big (share of the width), how far they drift (share of the board), redrawn every UNDER_MS. */
const FIELDS = 7;
const FIELD_SIZE = 0.24;
const FIELD_DRIFT = 0.1;
const UNDER_MS = 160;
/** How many shades the underpainting is dithered between. */
const SHADES = 4;

interface Field {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  colour: number[];
}

function makeFields(): Field[] {
  return Array.from({ length: FIELDS }, (_, i) => ({
    x: ((i % 4) + 0.2 + Math.random() * 0.6) / 4,
    y: (Math.floor(i / 4) + 0.2 + Math.random() * 0.6) / 2,
    r: FIELD_SIZE * (0.8 + Math.random() * 0.5),
    phase: Math.random() * Math.PI * 2,
    speed: 0.05 + Math.random() * 0.05,
    colour: PALETTE[i % PALETTE.length].rgb,
  }));
}

/** The underpainting at t (s): each pixel takes the fields' colours by how near it is to each, its strength dithered to a few shades. */
function underpaint(img: ImageData, fields: Field[], t: number) {
  const { width: cols, height: rows, data } = img;
  const at = fields.map((f) => ({
    x: (f.x + Math.cos(t * f.speed + f.phase) * FIELD_DRIFT) * cols,
    y: (f.y + Math.sin(t * f.speed * 1.3 + f.phase) * FIELD_DRIFT) * rows,
    r2: (f.r * cols) ** 2,
    c: f.colour,
  }));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let w = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (const f of at) {
        const k = 1 - ((x - f.x) ** 2 + (y - f.y) ** 2) / f.r2;
        if (k <= 0) continue;
        const kk = k * k;
        w += kk;
        r += kk * f.c[0];
        g += kk * f.c[1];
        b += kk * f.c[2];
      }
      const i = (y * cols + x) * 4;
      const shade = w > 0 ? Math.min(SHADES, Math.floor(Math.min(1, w) * SHADES + BAYER[(y & 3) * 4 + (x & 3)])) / SHADES : 0;
      data[i] = w > 0 ? r / w : 0;
      data[i + 1] = w > 0 ? g / w : 0;
      data[i + 2] = w > 0 ? b / w : 0;
      data[i + 3] = shade * 255;
    }
  }
}

/** A primed canvas: threads over and under in a 2-pixel weave, a little uneven, and a broad unevenness of tone. */
function weave(img: ImageData) {
  const { width: cols, height: rows, data } = img;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const over = ((x >> 1) + (y >> 1)) % 2 === 0;
      const thread = over ? (y & 1 ? 0.75 : 1) : x & 1 ? 0.75 : 1;
      const tone = 0.75 + 0.25 * Math.sin(x * 0.021 + Math.sin(y * 0.013) * 2) * Math.cos(y * 0.017);
      const v = thread * tone * (0.85 + hash(x, y) * 0.3);
      const i = (y * cols + x) * 4;
      data[i] = 168 * v;
      data[i + 1] = 158 * v;
      data[i + 2] = 146 * v;
      data[i + 3] = 255;
    }
  }
}

/** The binary field: a digit in every cell of the digits' grid. */
function binaryCell(g: CanvasRenderingContext2D, x: number, y: number, digit: number) {
  g.clearRect(x, y, CELL_W, CELL_H);
  const glyph = GLYPHS[digit];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if (glyph[row] & (4 >> col)) g.fillRect(x + col, y + row, 1, 1);
    }
  }
}
/** This share of the field's digits flips each frame. */
const FLICKER = 0.004;

export default function PaintToBinary() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const groundRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const digitsRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ground = groundRef.current;
    const canvas = canvasRef.current;
    const digits = digitsRef.current;
    const gctx = ground?.getContext("2d");
    const ctx = canvas?.getContext("2d");
    const dctx = digits?.getContext("2d");
    if (!root || !ground || !canvas || !digits || !gctx || !ctx || !dctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const asked = new URLSearchParams(window.location.search).get("ground");
    const mode: Ground = asked === "underpainting" || asked === "binary" || asked === "weave" ? asked : GROUND;
    ground.dataset.ground = mode;
    const fields = makeFields();
    let groundImg: ImageData | null = null;
    let underAt = 0;
    /** The binary field's digits, by cell */
    let field: Uint8Array = new Uint8Array(0);
    let fieldCols = 0;

    let cols = 0;
    let rows = 0;
    let strokes: Stroke[] = [];
    let nextAt = 0;
    let raf = 0;
    let last = 0;
    let visible = false;

    // The ground: the underpainting redrawn now and then as it drifts; the binary field's digits flipping a few at a time; the weave stays.
    const drawGround = (now: number) => {
      if (mode === "underpainting" && groundImg && now - underAt >= UNDER_MS) {
        underAt = now;
        underpaint(groundImg, fields, now / 1000);
        gctx.putImageData(groundImg, 0, 0);
      } else if (mode === "binary" && field.length) {
        for (let n = Math.ceil(field.length * FLICKER); n > 0; n--) {
          const c = Math.floor(Math.random() * field.length);
          field[c] ^= 1;
          binaryCell(gctx, (c % fieldCols) * CELL_W, Math.floor(c / fieldCols) * CELL_H, field[c]);
        }
      }
    };

    const draw = (now: number) => {
      drawGround(now);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dctx.clearRect(0, 0, digits.width, digits.height);
      for (const s of strokes) drawStroke(ctx, dctx, s, now);
    };

    const frame = (now: number) => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      if (now - last < FRAME_MS) return;
      last = now;
      strokes = strokes.filter((s) => now < goneAt(s));
      if (now >= nextAt) {
        if (strokes.length < MAX_STROKES) strokes.push(makeStroke(cols, rows, now, strokes));
        nextAt = now + SPAWN_MS[0] + Math.random() * (SPAWN_MS[1] - SPAWN_MS[0]);
      }
      draw(now);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const c = Math.ceil(rect.width / PX);
      const r = Math.ceil(rect.height / PX);
      if (c === cols && r === rows) return;
      cols = c;
      rows = r;
      // Whole art pixels, so every one is the same size on screen.
      for (const [el, px] of [
        [ground, mode === "binary" ? DIGIT_PX : PX],
        [canvas, PX],
        [digits, DIGIT_PX],
      ] as const) {
        el.width = Math.ceil((cols * PX) / px);
        el.height = Math.ceil((rows * PX) / px);
        el.style.width = `${el.width * px}px`;
        el.style.height = `${el.height * px}px`;
      }
      // The ground, laid in full.
      groundImg = mode === "binary" ? null : gctx.createImageData(ground.width, ground.height);
      if (mode === "weave" && groundImg) {
        weave(groundImg);
        gctx.putImageData(groundImg, 0, 0);
      } else if (mode === "underpainting") {
        underAt = -Infinity;
      } else if (mode === "binary") {
        fieldCols = Math.floor(ground.width / CELL_W);
        field = Uint8Array.from({ length: fieldCols * Math.floor(ground.height / CELL_H) }, () => (Math.random() < 0.5 ? 0 : 1));
        gctx.fillStyle = "rgb(150 146 176)";
        field.forEach((d, c) => binaryCell(gctx, (c % fieldCols) * CELL_W, Math.floor(c / fieldCols) * CELL_H, d));
      }
      strokes = [];
      if (still) {
        // A few strokes, each caught partway (the brush going, its start fading).
        const now = 1e6;
        strokes = [];
        for (const k of [0.7, 0.85, 1, 1.15]) strokes.push(makeStroke(cols, rows, now - k * PAINT_MS * 0.8, strokes));
        draw(now);
      }
    };

    const sizer = new ResizeObserver(resize);
    sizer.observe(root);
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !still;
      if (visible && !raf) {
        const now = performance.now();
        // Pick up where it left off.
        const away = last ? now - last : 0;
        strokes.forEach((s) => (s.born += away));
        nextAt = Math.max(nextAt + away, now);
        last = now - FRAME_MS;
        raf = requestAnimationFrame(frame);
      }
    });
    seen.observe(root);

    return () => {
      cancelAnimationFrame(raf);
      sizer.disconnect();
      seen.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className={css.backdrop} aria-hidden="true">
      <canvas ref={groundRef} className={`${css.canvas} ${css.ground}`} />
      <canvas ref={canvasRef} className={css.canvas} />
      <canvas ref={digitsRef} className={css.canvas} />
    </div>
  );
}
