// The seam's state, as plain numbers (pure, no DOM).
//
// The line: straight, tilted like "/", crossing the centre halfway down the
// name. Everything left of it is paint and right of it is bits, and the shader
// shows both only through the letters of the name. Both come out square to the
// line, so they're laid out in the seam's own frame: turned with the line, x
// across it (negative on the paint side), y down along it, 0 where it crosses
// the centre.
//
// The paint: each ribbon loops through its own cycle: a bead swells out of the
// line, pushes out sideways with a wave travelling along it, then lets go and
// floats on, thinning away to nothing. Every cycle re-rolls height, size,
// colour, reach and wave. The shader turns the ribbons into one distance field.
//
// The bits: spots along the line pop every few seconds. A pop is scheduled here
// (where and when); the shader draws its splash of digits.

import { DESIGN } from "./heroConfig";
import { BITS, SEAM, TILT, VIVID, type SplitLayout } from "./splitConfig";

// The shader's uniform arrays: 3 × 32 + 96 vec4s, inside WebGL2's minimum of 224 for a fragment shader.
export const MAX_STREAMS = 32;
export const MAX_POPS = 96;

/** Uniform arrays, 4 floats per ribbon (CSS px, in the seam's frame; x measured outward from the line). */
export interface StreamBuffers {
  /** where the line is (always 0 in the seam's frame), centre y, tail, front */
  a: Float32Array;
  /** body radius, leading-edge radius, wave amplitude, wave number */
  b: Float32Array;
  /** colour index, seed, flow (how far the paint has moved out), wave phase */
  c: Float32Array;
}

export function createStreamBuffers(): StreamBuffers {
  const n = MAX_STREAMS * 4;
  return { a: new Float32Array(n), b: new Float32Array(n), c: new Float32Array(n) };
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Hero height (CSS px) of a height in design px measured from the name's ink top. */
function heroY(y: number, layout: SplitLayout): number {
  return layout.gridY + (y - DESIGN.titleBox.y) * layout.u;
}

/** The line: the height it crosses the centre at (CSS px), and its tilt as a cosine and sine. */
export function tilt(layout: SplitLayout): { centreY: number; cos: number; sin: number } {
  const angle = (TILT.angle * Math.PI) / 180;
  return { centreY: heroY(TILT.centreY, layout), cos: Math.cos(angle), sin: Math.sin(angle) };
}

/** Where the line is at hero height y (x from the centre, CSS px): right of the centre above its crossing, left below. */
export function lineAt(y: number, layout: SplitLayout): number {
  const { centreY, cos, sin } = tilt(layout);
  return ((centreY - y) * sin) / cos;
}

/** A point on the hero (x from the centre, y from the top, CSS px) in the seam's frame. */
export function toSeam(x: number, y: number, layout: SplitLayout): [number, number] {
  const { centreY, cos, sin } = tilt(layout);
  const dy = y - centreY;
  return [x * cos + dy * sin, -x * sin + dy * cos];
}

/** Where the line is drawn (y in the seam's frame, CSS px): across the name's ink, plus the overhang at each end. */
export function lineSpan(layout: SplitLayout): [number, number] {
  const { centreY, cos } = tilt(layout);
  const overhang = SEAM.line.overhang * layout.u;
  return [(heroY(SEAM.span[0], layout) - centreY) / cos - overhang, (heroY(SEAM.span[1], layout) - centreY) / cos + overhang];
}

/**
 * How far along the line the paint and the bits come out (y in the seam's
 * frame, CSS px): wherever a square path out of the line crosses the name's
 * half on that side.
 */
export function spans(layout: SplitLayout): { paint: [number, number]; bits: [number, number] } {
  const half = SEAM.halfWidth * layout.u;
  const [top, bottom] = [heroY(SEAM.span[0], layout), heroY(SEAM.span[1], layout)];
  const along = (x0: number, x1: number): [number, number] => {
    const ys = [x0, x1].flatMap((x) => [top, bottom].map((y) => toSeam(x, y, layout)[1]));
    return [Math.min(...ys), Math.max(...ys)];
  };
  return { paint: along(-half, 0), bits: along(0, half) };
}

/**
 * Writes `count` paint ribbons (all on the left of the line) at time `t` (s) into `out`.
 * Returns how many were written.
 */
export function writeStreams(out: StreamBuffers, t: number, count: number, layout: SplitLayout): number {
  const { u } = layout;
  const n = Math.min(MAX_STREAMS, count);
  const [top, bottom] = spans(layout).paint;
  for (let i = 0; i < n; i++) {
    const period = lerp(SEAM.period[0], SEAM.period[1], hash(i * 13.7 + 1));
    // Golden-ratio phases: at any moment the ribbons are at different stages.
    const x = t / period + ((i * 0.618034 + 0.21) % 1);
    const cycle = Math.floor(x);
    const tau = x - cycle;
    const roll = (k: number) => hash(i * 91.7 + cycle * 17.3 + k * 3.1);

    const R = lerp(SEAM.radius[0], SEAM.radius[1], roll(1)) * u;
    const body = R * lerp(SEAM.body[0], SEAM.body[1], roll(2));
    // Stratified lanes along the line where the name is: each ribbon takes its own, and the lanes rotate every cycle.
    const band = (i * 2 + cycle) % n;
    const bob = Math.sin(t * 0.45 + i * 1.7) * SEAM.bob * R;
    const y = top + ((band + 0.15 + 0.7 * roll(3)) / n) * (bottom - top) + bob;
    const reach = lerp(SEAM.reach[0], SEAM.reach[1], roll(4)) * u;
    const amp = lerp(SEAM.wave[0], SEAM.wave[1], roll(5)) * R;
    const k = (2 * Math.PI) / (lerp(SEAM.wavelength[0], SEAM.wavelength[1], roll(6)) * u);
    const phase = t * SEAM.waveSpeed * u * k + roll(7) * 6.283;

    const { emergeEnd: A, pushEnd: B } = SEAM;
    let tail = 0;
    let front: number;
    let scale = 1;
    if (tau < A) {
      // A bead swells out of the line.
      front = 0;
      scale = easeOutCubic(tau / A);
    } else if (tau < B) {
      // The ribbon pushes out, still attached to the line.
      front = reach * easeInOutSine((tau - A) / (B - A));
    } else {
      // It lets go and floats on; the tail catches up and the whole thing thins away.
      const s = (tau - B) / (1 - B);
      front = reach * (1 + SEAM.float * easeOutCubic(s));
      tail = front * smooth(0, 1, s) ** 0.8;
      scale = 1 - smooth(0.25, 1, s);
    }

    const j = i * 4;
    out.a.set([0, y, tail, front], j);
    out.b.set([body * scale, R * scale, amp, k], j);
    out.c.set([Math.min(VIVID.length - 1, Math.floor(roll(8) * VIVID.length)), (i * 7.31 + cycle * 3.17) % 97, front, phase], j);
  }
  return n;
}

/** Bits that have popped and are still in the air. */
export interface PopBuffers {
  /** Per pop: centre row, age (s), seed, unused */
  p: Float32Array;
  count: number;
}

export function createPopBuffers(): PopBuffers {
  return { p: new Float32Array(MAX_POPS * 4), count: 0 };
}

/** The pops in the air at time t, from `emitters` spots along the line (rows of the seam's frame, 0 where it crosses the centre, where the name is). */
export function writePops(out: PopBuffers, t: number, emitters: number, layout: SplitLayout) {
  const [top, bottom] = spans(layout).bits;
  let n = 0;
  for (let k = 0; k < emitters && n < MAX_POPS; k++) {
    const period = lerp(BITS.period[0], BITS.period[1], hash(k * 7.7 + 3));
    const phase = (k * 0.618034 + 0.37) % 1;
    const latest = Math.floor(t / period + phase);
    // A pop lives at most life[1]; check enough earlier pops to cover that.
    const back = Math.ceil(BITS.life[1] / period) + 1;
    for (let j = latest; j >= latest - back && n < MAX_POPS; j--) {
      const roll = (m: number) => hash(k * 53.1 + j * 11.7 + m * 2.3);
      const born = (j - phase + 0.5 * roll(0)) * period;
      const age = t - born;
      if (age < 0 || age > BITS.life[1]) continue;
      const row = Math.floor(lerp(top, bottom, roll(1)) / layout.cellH);
      out.p.set([row, age, ((k * 7.31 + j * 3.17) % 97) + roll(2) + 0.01, 0], n * 4);
      n++;
    }
  }
  out.count = n;
}

/** Everything one frame of the seam needs: the ribbons and the pops. */
export class SeamState {
  streams = createStreamBuffers();
  pops = createPopBuffers();
  count = 0;

  update(t: number, ribbons: number, emitters: number, layout: SplitLayout) {
    this.count = writeStreams(this.streams, t, ribbons, layout);
    writePops(this.pops, t, emitters, layout);
  }
}
