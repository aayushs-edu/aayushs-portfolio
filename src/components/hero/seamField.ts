// The seam's state, as plain numbers (pure, no DOM).
//
// The line: a fluid curve. Slow waves run along it, and each paint ribbon pulls
// it toward the paint while attached. The shader reads it, and it becomes the
// CSS clip-paths that split the wall and the name, so everything splits on it.
//
// The paint: each ribbon loops through its own cycle: a bead swells out of the
// line, pushes out sideways with a wave travelling along it, then lets go and
// floats on, thinning away to nothing. Every cycle re-rolls height, size,
// colour, reach and wave. The shader turns the ribbons into one distance field.
//
// The bits: spots along the line pop every few seconds. A pop is scheduled here
// (where, when, where the line was); the shader draws its splash of digits.

import type { NameTouch } from "./nameTouch";
import { BITS, CURVE, SEAM, VIVID, type SplitLayout } from "./splitConfig";

export const MAX_STREAMS = 16;
export const MAX_POPS = 64;

/** Uniform arrays, 4 floats per ribbon (CSS px; x measured outward from the line). */
export interface StreamBuffers {
  /** where the line is at the ribbon's height (x from the centre), centre y, tail, front */
  a: Float32Array;
  /** body radius, leading-edge radius, wave amplitude, wave number */
  b: Float32Array;
  /** colour index, seed, flow (how far the paint has moved out), wave phase */
  c: Float32Array;
  /** How hard each ribbon pulls on the line, 0..1 (CPU only). */
  pull: Float32Array;
}

export function createStreamBuffers(): StreamBuffers {
  const n = MAX_STREAMS * 4;
  return { a: new Float32Array(n), b: new Float32Array(n), c: new Float32Array(n), pull: new Float32Array(MAX_STREAMS) };
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


/**
 * Writes `count` paint ribbons (all on the left of the seam) at time `t` (s) into `out`.
 * Returns how many were written.
 */
export function writeStreams(out: StreamBuffers, t: number, count: number, layout: SplitLayout): number {
  const { u } = layout;
  const n = Math.min(MAX_STREAMS, count);
  const halfW = layout.seamX;
  for (let i = 0; i < n; i++) {
    const period = lerp(SEAM.period[0], SEAM.period[1], hash(i * 13.7 + 1));
    // Golden-ratio phases: at any moment the ribbons are at different stages.
    const x = t / period + ((i * 0.618034 + 0.21) % 1);
    const cycle = Math.floor(x);
    const tau = x - cycle;
    const roll = (k: number) => hash(i * 91.7 + cycle * 17.3 + k * 3.1);

    const R = lerp(SEAM.radius[0], SEAM.radius[1], roll(1)) * u;
    const body = R * lerp(SEAM.body[0], SEAM.body[1], roll(2));
    // Stratified heights over the whole line (under the name too): each ribbon takes
    // its own lane, and the lanes rotate every cycle.
    const band = (i * 2 + cycle) % n;
    const bob = Math.sin(t * 0.45 + i * 1.7) * SEAM.bob * R;
    const y = R + ((band + 0.15 + 0.7 * roll(3)) / n) * Math.max(0, layout.h - 2 * R) + bob;
    const reach = lerp(SEAM.reach[0], SEAM.reach[1], roll(4)) * halfW;
    const amp = lerp(SEAM.wave[0], SEAM.wave[1], roll(5)) * R;
    const k = (2 * Math.PI) / (lerp(SEAM.wavelength[0], SEAM.wavelength[1], roll(6)) * u);
    const phase = t * SEAM.waveSpeed * u * k + roll(7) * 6.283;

    const { emergeEnd: A, pushEnd: B } = SEAM;
    let tail = 0;
    let front: number;
    let scale = 1;
    let pull = 1;
    if (tau < A) {
      // A bead swells out of the line, drawing it along.
      front = 0;
      scale = easeOutCubic(tau / A);
      pull = scale;
    } else if (tau < B) {
      // The ribbon pushes out, still attached to the line.
      front = reach * easeInOutSine((tau - A) / (B - A));
    } else {
      // It lets go (the line springs back) and floats on; the tail catches up and the whole thing thins away.
      const s = (tau - B) / (1 - B);
      front = reach * (1 + SEAM.float * easeOutCubic(s));
      tail = front * smooth(0, 1, s) ** 0.8;
      scale = 1 - smooth(0.25, 1, s);
      pull = 1 - smooth(0, 0.35, s);
    }

    const j = i * 4;
    out.pull[i] = pull;
    // a.x (where the line is at this height) is filled in once the line is known.
    out.a.set([0, y, tail, front], j);
    out.b.set([body * scale, R * scale, amp, k], j);
    out.c.set([Math.min(VIVID.length - 1, Math.floor(roll(8) * VIVID.length)), (i * 7.31 + cycle * 3.17) % 97, front, phase], j);
  }
  return n;
}

/** The line's offset from the centre (CSS px) at height y, from the samples. */
export function curveAt(curve: Float32Array, y: number, h: number): number {
  const f = Math.min(1, Math.max(0, y / h)) * (curve.length - 1);
  const i = Math.min(curve.length - 2, Math.floor(f));
  return curve[i] + (curve[i + 1] - curve[i]) * (f - i);
}

/** The line's own travelling waves at height y, time t (CSS px from the centre). */
function baseWave(y: number, t: number, u: number): number {
  let x = 0;
  for (const [length, speed, weight] of CURVE.waves) x += weight * Math.sin((2 * Math.PI * y) / (length * u) + speed * t + length);
  return x * CURVE.amp * u;
}

/** How far the attached paint ribbons pull the line toward the paint at height y. */
function pullAt(y: number, streams: StreamBuffers, count: number): number {
  let x = 0;
  for (let k = 0; k < count; k++) {
    const pull = streams.pull[k];
    const r = streams.b[k * 4 + 1];
    if (pull <= 0 || r <= 0) continue;
    const dy = (y - streams.a[k * 4 + 1]) / (CURVE.pullSpread * r);
    x -= pull * CURVE.pull * r * Math.exp(-dy * dy);
  }
  return x;
}

/** A pop's kick on the line over its age: snaps out, then settles back. */
function kickPulse(age: number): number {
  return age < 0.12 ? smooth(0, 0.12, age) : Math.exp(-(age - 0.12) / 0.35);
}

/** Bits that have popped and are still in the air. */
export interface PopBuffers {
  /** Per pop: centre row, age (s), seed, origin x (where the line was when it popped, from the centre) */
  p: Float32Array;
  /** Per pop (CPU only): centre y, age, whether it kicks the line, and a key to remember its origin by */
  y: Float32Array;
  age: Float32Array;
  kicks: Uint8Array;
  key: Float64Array;
  count: number;
}

export function createPopBuffers(): PopBuffers {
  return {
    p: new Float32Array(MAX_POPS * 4),
    y: new Float32Array(MAX_POPS),
    age: new Float32Array(MAX_POPS),
    kicks: new Uint8Array(MAX_POPS),
    key: new Float64Array(MAX_POPS),
    count: 0,
  };
}

/** The pops in the air at time t, from `emitters` spots along the line. */
export function writePops(out: PopBuffers, t: number, emitters: number, layout: SplitLayout) {
  const { h, gridY, cellH } = layout;
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
      const row = Math.floor((roll(1) * h - gridY) / cellH);
      out.p.set([row, age, ((k * 7.31 + j * 3.17) % 97) + roll(2) + 0.01, 0], n * 4);
      out.y[n] = gridY + (row + 0.5) * cellH;
      out.age[n] = age;
      out.kicks[n] = 1;
      out.key[n] = k * 1e6 + j;
      n++;
    }
  }
  out.count = n;
}

/**
 * Samples the line at time t: travelling waves, a pull toward each attached
 * paint ribbon, a kick toward the code side wherever bits just popped, and the
 * bend where someone is holding it. Then tells each ribbon where the line is at
 * its height, and each new pop where the line is as it pops (remembered in
 * `origins`, so its bits don't ride the line afterwards).
 */
export function writeCurve(
  curve: Float32Array,
  t: number,
  layout: SplitLayout,
  streams: StreamBuffers,
  count: number,
  pops: PopBuffers,
  origins: Map<number, number>,
  touch?: NameTouch,
) {
  const { u, h } = layout;
  const n = curve.length;
  const kick = BITS.kick * u;
  const kickSpread = BITS.kickRows * layout.cellH;
  for (let i = 0; i < n; i++) {
    const y = (i / (n - 1)) * h;
    let x = baseWave(y, t, u) + pullAt(y, streams, count) + (touch?.bulgeAt(y) ?? 0);
    for (let k = 0; k < pops.count; k++) {
      if (!pops.kicks[k]) continue;
      const dy = (y - pops.y[k]) / kickSpread;
      if (Math.abs(dy) < 3) x += kick * kickPulse(pops.age[k]) * Math.exp(-dy * dy);
    }
    curve[i] = x;
  }
  for (let k = 0; k < count; k++) streams.a[k * 4] = curveAt(curve, streams.a[k * 4 + 1], h);
  const seen = new Map<number, number>();
  for (let k = 0; k < pops.count; k++) {
    const key = pops.key[k];
    if (key < 0) continue;
    const origin = origins.get(key) ?? curveAt(curve, pops.y[k], h);
    seen.set(key, origin);
    pops.p[k * 4 + 3] = origin;
  }
  origins.clear();
  seen.forEach((v, k) => origins.set(k, v));
}

/** clip-path polygons for the two sides of the line, in the hero's own coordinates. */
export function clipPaths(curve: Float32Array, layout: SplitLayout): { left: string; right: string } {
  const { w, h, seamX } = layout;
  const points: string[] = [];
  for (let k = 0; k < CURVE.clipPoints; k++) {
    const y = (k / (CURVE.clipPoints - 1)) * h;
    points.push(`${(seamX + curveAt(curve, y, h)).toFixed(2)}px ${y.toFixed(2)}px`);
  }
  // Run past the hero's edges so nothing antialiases along them.
  const top = `${(seamX + curve[0]).toFixed(2)}px -2px`;
  const bottom = `${(seamX + curve[curve.length - 1]).toFixed(2)}px ${h + 2}px`;
  const line = [top, ...points, bottom].join(",");
  return {
    left: `polygon(-2px -2px,${line},-2px ${h + 2}px)`,
    right: `polygon(${w + 2}px -2px,${line},${w + 2}px ${h + 2}px)`,
  };
}

/** Everything one frame of the seam needs: the ribbons, the pops and the line. */
export class SeamState {
  streams = createStreamBuffers();
  pops = createPopBuffers();
  curve = new Float32Array(CURVE.samples);
  count = 0;
  private origins = new Map<number, number>();

  update(t: number, ribbons: number, emitters: number, layout: SplitLayout, touch?: NameTouch) {
    this.count = writeStreams(this.streams, t, ribbons, layout);
    writePops(this.pops, t, emitters, layout);
    writeCurve(this.curve, t, layout, this.streams, this.count, this.pops, this.origins, touch);
  }
}
