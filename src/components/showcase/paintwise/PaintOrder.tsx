"use client";

import { useEffect, useRef } from "react";
import css from "./PaintOrder.module.css";

/**
 * Behind Paintwise: its "what to paint first" step, as a background. The page
 * is cut into soft regions (like SAM's masks), outlined faintly and drifting
 * slowly; they're filled in one at a time in the order Paintwise would paint
 * them, the largest first, each with its step number. The board is never full:
 * once about two thirds are in, each new one fades out the oldest. When the
 * order runs out it starts again in the order the regions now make. A WebGL2
 * canvas, drawn only while on screen; with reduced motion, one still frame with
 * the first two thirds in. Without WebGL2, nothing.
 */

/** How many regions, and how far (CSS px) and how slowly each one's centre drifts. */
const REGIONS = 22;
const DRIFT = 46;
/** One region is filled every STEP_MS; at most FILLED are in at once (about 65%), the oldest fading out over CLEAR_MS as each new one comes in. */
const STEP_MS = 900;
const FILLED = Math.round(REGIONS * 0.65);
const CLEAR_MS = 1400;
/** A region's fill takes this long to come in (ms). */
const FILL_MS = 700;
/** Drawn at this share of the CSS size, and this often (ms). */
const RES = 0.5;
const FRAME_MS = 33;

/** Paintwise's colours (from its logo): violet, blue, pink, cyan. */
const PALETTE = ["#8b6cff", "#4f9dff", "#ff6fd2", "#3fd0e0", "#b28bff"].map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

const VS = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

// Each pixel finds its nearest and second-nearest region centre: the nearest
// picks the region (its colour and fill), the gap between the two draws the
// outline. A filled region is shaded darker away from its centre, like a depth map.
const FS = /* glsl */ `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uPx;
uniform vec2 uSeeds[${REGIONS}];
uniform vec3 uColours[${REGIONS}];
uniform float uFill[${REGIONS}];
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float d1 = 1e9;
  float d2 = 1e9;
  int k = 0;
  for (int i = 0; i < ${REGIONS}; i++) {
    float d = distance(p, uSeeds[i]);
    if (d < d1) { d2 = d1; d1 = d; k = i; }
    else if (d < d2) { d2 = d; }
  }
  float line = 1.0 - smoothstep(0.0, 1.2 * uPx, (d2 - d1) * 0.5);
  float fill = uFill[k];
  float depth = 1.0 - 0.6 * smoothstep(0.0, 320.0 * uPx, d1);
  vec3 c = uColours[k];
  float a = fill * 0.13 * depth + line * (0.09 + 0.16 * fill);
  o = vec4(c * a, a);
}
`;

interface Region {
  /** Where it rests (share of the canvas) and how it drifts */
  bx: number;
  by: number;
  phase: number;
  speed: number;
  colour: number[];
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** The regions' resting places: jittered on a loose grid, so none crowd. */
function makeRegions(): Region[] {
  const rand = rng(11);
  const cols = 6;
  const rows = Math.ceil(REGIONS / cols);
  return Array.from({ length: REGIONS }, (_, i) => ({
    bx: ((i % cols) + 0.2 + rand() * 0.6) / cols,
    by: (Math.floor(i / cols) + 0.2 + rand() * 0.6) / rows,
    phase: rand() * Math.PI * 2,
    speed: 0.05 + rand() * 0.06,
    colour: PALETTE[Math.floor(rand() * PALETTE.length)],
  }));
}

export default function PaintOrder() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS) && process.env.NODE_ENV !== "production") console.warn(gl.getShaderInfoLog(sh));
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    const vao = gl.createVertexArray();
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    const uRes = gl.getUniformLocation(program, "uRes");
    const uPx = gl.getUniformLocation(program, "uPx");
    const uSeeds = gl.getUniformLocation(program, "uSeeds");
    const uColours = gl.getUniformLocation(program, "uColours");
    const uFill = gl.getUniformLocation(program, "uFill");

    const regions = makeRegions();
    gl.uniform3fv(uColours, regions.flatMap((r) => r.colour));
    const labels = labelRefs.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    const seeds = new Float32Array(REGIONS * 2);
    const fill = new Float32Array(REGIONS);
    /** When each region began filling, and began fading out (ms), or -1 */
    const filledAt = new Array<number>(REGIONS).fill(-1);
    const clearedAt = new Array<number>(REGIONS).fill(-1);
    /** This round's regions still to fill, largest first */
    let queue: number[] = [];
    /** The regions in now, oldest first (not those fading out) */
    const lit: number[] = [];
    /** This round's step number, and when the next region fills (ms) */
    let step = 0;
    let nextAt = 0;
    let raf = 0;
    let last = 0;
    let clock = 0;
    let visible = false;

    // Each region's centre now (CSS px).
    const place = (t: number) => {
      regions.forEach((r, i) => {
        seeds[i * 2] = r.bx * w + Math.cos(t * r.speed + r.phase) * DRIFT;
        seeds[i * 2 + 1] = r.by * h + Math.sin(t * r.speed * 1.3 + r.phase) * DRIFT;
      });
    };
    // A new round, largest first: a region's size, roughly, is how far its nearest neighbour is.
    const plan = () => {
      const room = regions.map((_, i) => {
        let near = Infinity;
        for (let j = 0; j < REGIONS; j++) if (j !== i) near = Math.min(near, Math.hypot(seeds[i * 2] - seeds[j * 2], seeds[i * 2 + 1] - seeds[j * 2 + 1]));
        return near;
      });
      queue = regions.map((_, i) => i).sort((a, b) => room[b] - room[a]);
      step = 0;
    };
    // Fills the next region in the order that isn't still in (from the round before), numbered as it goes in; past FILLED, the oldest starts fading out.
    const fillNext = (now: number) => {
      let k = queue.findIndex((i) => filledAt[i] < 0);
      if (k < 0) {
        plan();
        k = queue.findIndex((i) => filledAt[i] < 0);
        if (k < 0) return;
      }
      const i = queue.splice(k, 1)[0];
      filledAt[i] = now;
      clearedAt[i] = -1;
      const el = labels[i];
      if (el) el.textContent = String(++step).padStart(2, "0");
      lit.push(i);
      if (lit.length > FILLED) clearedAt[lit.shift()!] = now;
    };

    const draw = (now: number) => {
      const t = clock / 1000;
      place(t);
      if (!still && now >= nextAt) {
        fillNext(now);
        nextAt = now + STEP_MS;
      }
      for (let i = 0; i < REGIONS; i++) {
        const f = filledAt[i] < 0 ? 0 : Math.min(1, (now - filledAt[i]) / FILL_MS);
        const c = clearedAt[i] < 0 ? 0 : Math.min(1, (now - clearedAt[i]) / CLEAR_MS);
        // Faded out: free to be filled again.
        if (c >= 1) filledAt[i] = clearedAt[i] = -1;
        fill[i] = c >= 1 ? 0 : f * f * (3 - 2 * f) * (1 - c * c * (3 - 2 * c));
        const el = labels[i];
        if (el) {
          el.style.opacity = fill[i].toFixed(3);
          el.style.transform = `translate(${seeds[i * 2].toFixed(1)}px, ${seeds[i * 2 + 1].toFixed(1)}px) translate(-50%, -50%)`;
        }
      }
      const px = canvas.width / Math.max(1, w);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uPx, px);
      gl.uniform2fv(uSeeds, seeds.map((v) => v * px));
      gl.uniform1fv(uFill, fill);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      raf = visible ? requestAnimationFrame(frame) : 0;
      if (now - last < FRAME_MS) return;
      clock += Math.min(100, now - last);
      last = now;
      draw(now);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * RES));
      canvas.height = Math.max(1, Math.round(h * RES));
      place(clock / 1000);
      if (still) {
        // The first FILLED in, in order.
        if (!lit.length) {
          plan();
          for (let n = 0; n < FILLED; n++) fillNext(0);
        }
        draw(FILL_MS);
      } else {
        draw(performance.now());
      }
    };

    const sizer = new ResizeObserver(resize);
    sizer.observe(canvas);
    const seen = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !still;
      if (visible && !raf) {
        const now = performance.now();
        // Pick up where it left off.
        const away = now - last;
        nextAt += away;
        filledAt.forEach((v, i) => (filledAt[i] = v < 0 ? v : v + away));
        clearedAt.forEach((v, i) => (clearedAt[i] = v < 0 ? v : v + away));
        last = now;
        raf = requestAnimationFrame(frame);
      }
    });
    seen.observe(root);
    last = performance.now();
    nextAt = last;

    return () => {
      cancelAnimationFrame(raf);
      sizer.disconnect();
      seen.disconnect();
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
    };
  }, []);

  return (
    <div ref={rootRef} className={css.backdrop} aria-hidden="true">
      <canvas ref={canvasRef} className={css.canvas} />
      {Array.from({ length: REGIONS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
          className={css.label}
        />
      ))}
    </div>
  );
}
