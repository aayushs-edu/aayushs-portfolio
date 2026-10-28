// Checks for the showcase's pure modules. Run with `npm run showcase:check`.

import { createScrollMap, progressForBeat, sampleScroll, type Beat } from "../../src/components/showcase/scrollMap";

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (error) {
    failures.push(`✗ ${name}\n    ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

// ---------------------------------------------------------------------------
// Scroll map

const BEATS: Beat[] = [
  { key: "a", t: 0.1, units: 1 },
  { key: "b", t: 0.3, units: 0.8 },
  { key: "c", t: 0.32, units: 1 },
  { key: "d", t: 0.8, units: 1 },
];
const map = createScrollMap(BEATS, 1, 0.82);

check("scroll: total units are the entrance plus every beat", () => {
  assert(near(map.units, 1 + 1 + 0.8 + 1 + 1), `units ${map.units}`);
});

check("scroll: progress 0 is the start of the entrance", () => {
  const s = sampleScroll(map, 0);
  assert(s.entrance === 0 && s.t === 0 && s.beat === -1, JSON.stringify(s));
});

check("scroll: the end of the entrance is the start of the path", () => {
  const s = sampleScroll(map, map.entranceUnits / map.units);
  assert(near(s.entrance, 1) && near(s.t, 0) && near(s.beat, -0.5), JSON.stringify(s));
});

check("scroll: progress 1 is the end of the path", () => {
  const s = sampleScroll(map, 1);
  assert(near(s.entrance, 1) && near(s.t, 1) && near(s.beat, BEATS.length - 0.5), JSON.stringify(s));
});

check("scroll: entrance, t and beat never go backwards", () => {
  let prev = sampleScroll(map, 0);
  for (let k = 1; k <= 4000; k++) {
    const s = sampleScroll(map, k / 4000);
    assert(s.entrance >= prev.entrance - 1e-9, `entrance fell at ${k}`);
    assert(s.t >= prev.t - 1e-9, `t fell at ${k}: ${prev.t} → ${s.t}`);
    assert(s.beat >= prev.beat - 1e-9, `beat fell at ${k}`);
    prev = s;
  }
});

check("scroll: progressForBeat lands on each beat", () => {
  BEATS.forEach((beat, i) => {
    const s = sampleScroll(map, progressForBeat(map, i));
    assert(near(s.t, beat.t) && near(s.beat, i), `beat ${i}: ${JSON.stringify(s)}`);
  });
});

check("scroll: the camera dwells at each beat", () => {
  const eps = 1e-5;
  BEATS.forEach((beat, i) => {
    const p = progressForBeat(map, i);
    const before = (sampleScroll(map, p).t - sampleScroll(map, p - eps).t) / eps;
    const after = (sampleScroll(map, p + eps).t - sampleScroll(map, p).t) / eps;
    // Mean rate over each half of the beat's chunk.
    const half = beat.units / 2 / map.units;
    const a = i === 0 ? 0 : (BEATS[i - 1].t + beat.t) / 2;
    const b = i === BEATS.length - 1 ? 1 : (beat.t + BEATS[i + 1].t) / 2;
    assert(before < 0.3 * ((beat.t - a) / half), `beat ${i}: rate in ${before}`);
    assert(after < 0.3 * ((b - beat.t) / half), `beat ${i}: rate out ${after}`);
  });
});

check("scroll: progress outside 0..1 is clamped", () => {
  assert(sampleScroll(map, -1).t === 0 && near(sampleScroll(map, 2).t, 1), "not clamped");
});

// ---------------------------------------------------------------------------

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`showcase:check: ${failures.length} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`showcase:check: ${passed} passed`);
}
