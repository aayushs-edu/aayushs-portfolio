// Scroll progress → where the showcase is (pure, no DOM).
//
// The scroll is measured in units of one viewport. The first `entranceUnits`
// tear the hero open. After that, each beat (a work, or a chapter title) gets
// its own chunk of scrolling. Across a chunk the camera moves from halfway
// after the previous beat to halfway before the next one, slowing right down
// at the beat itself, so each piece holds centre for a moment.

export interface Beat {
  key: string;
  /** Path parameter (0..1) where the beat is presented */
  t: number;
  /** Scrolling it gets, in viewports */
  units: number;
}

export interface ScrollMap {
  /** All the scrolling, in viewports: the entrance plus every beat. */
  units: number;
  entranceUnits: number;
  /** Ordered by t */
  beats: Beat[];
  dwell: number;
  /** Per beat: where its chunk starts (viewports), and the path span [a, b] it covers. */
  starts: number[];
  a: number[];
  b: number[];
}

export interface ScrollSample {
  /** 0..1 through the entrance */
  entrance: number;
  /** Path parameter, 0..1 */
  t: number;
  /** Continuous beat index: i at beat i, i ± 0.5 at its chunk's edges, −1 before the entrance. */
  beat: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** `dwell` (0..1): how much the camera slows at a beat (0 = not at all). */
export function createScrollMap(beats: Beat[], entranceUnits: number, dwell: number): ScrollMap {
  const sorted = [...beats].sort((x, y) => x.t - y.t);
  const n = sorted.length;
  const starts: number[] = [];
  const a: number[] = [];
  const b: number[] = [];
  let s = entranceUnits;
  sorted.forEach((beat, i) => {
    starts.push(s);
    s += beat.units;
    a.push(i === 0 ? 0 : (sorted[i - 1].t + beat.t) / 2);
    b.push(i === n - 1 ? 1 : (beat.t + sorted[i + 1].t) / 2);
  });
  return { units: s, entranceUnits, beats: sorted, dwell: Math.min(0.99, Math.max(0, dwell)), starts, a, b };
}

/** Where the showcase is at scroll progress 0..1. */
export function sampleScroll(map: ScrollMap, progress: number, out: ScrollSample = { entrance: 0, t: 0, beat: -1 }): ScrollSample {
  const s = clamp01(progress) * map.units;
  const n = map.beats.length;
  if (s < map.entranceUnits || n === 0) {
    out.entrance = map.entranceUnits > 0 ? clamp01(s / map.entranceUnits) : 1;
    out.t = 0;
    out.beat = -1 + 0.5 * out.entrance;
    return out;
  }
  let i = n - 1;
  while (i > 0 && map.starts[i] > s) i--;
  const beat = map.beats[i];
  const x = clamp01((s - map.starts[i]) / Math.max(1e-9, beat.units));
  // Slow at x = 0.5 (the beat), fast at the chunk's edges.
  const f = x + (map.dwell / (2 * Math.PI)) * Math.sin(2 * Math.PI * x);
  out.entrance = 1;
  out.t = x < 0.5 ? map.a[i] + (beat.t - map.a[i]) * 2 * f : beat.t + (map.b[i] - beat.t) * (2 * f - 1);
  out.beat = i + x - 0.5;
  return out;
}

/** The scroll progress (0..1) at which beat `index` is presented. */
export function progressForBeat(map: ScrollMap, index: number): number {
  const i = Math.min(map.beats.length - 1, Math.max(0, index));
  if (i < 0 || map.units <= 0) return 0;
  return (map.starts[i] + map.beats[i].units / 2) / map.units;
}
