// Checks for the showcase's pure modules. Run with `npm run showcase:check`.

import * as THREE from "three";
import { openFor } from "../../src/components/hero/seamField";
import { BITS, CURVE, SEAM } from "../../src/components/hero/splitConfig";
import { createCameraPath } from "../../src/components/showcase/cameraPath";
import { beatsFor, LAYOUTS, type LayoutName } from "../../src/components/showcase/layouts";
import { FOV_Y, type Placement, type SceneLayout, type Vec3, type Viewport } from "../../src/components/showcase/layouts/types";
import { createScrollMap, progressForBeat, sampleScroll, type Beat } from "../../src/components/showcase/scrollMap";
import type { Work, WorkKind, WorkSide } from "../../src/components/showcase/works";

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
// The hero tearing open

for (const [w, h, seamX, u] of [
  [1440, 900, 720, 0.62],
  [390, 844, 195, 0.32],
  [1024, 768, 400, 0.6],
]) {
  const layout = { w, h, u, seamX, gridY: 100, cellW: 8 * u, cellH: 16 * u };
  check(`tear ${w}×${h}: closed at the top, both halves off screen at the end`, () => {
    assert(openFor(0, layout) === 0, `open(0) = ${openFor(0, layout)}`);
    // The line swings, is pulled by paint and kicked by bits: the halves must clear all of it.
    const swing = (CURVE.amp + CURVE.pull * SEAM.radius[1] + BITS.kick) * u;
    const full = openFor(1, layout);
    assert(full >= Math.max(seamX, w - seamX) + swing, `open(1) = ${full.toFixed(1)}`);
    let prev = 0;
    for (let k = 1; k <= 100; k++) {
      const o = openFor(k / 100, layout);
      assert(o >= prev, `opening shrinks at ${k}`);
      prev = o;
    }
    assert(openFor(2, layout) === full && openFor(-1, layout) === 0, "not clamped");
  });
}

// ---------------------------------------------------------------------------
// Layouts and the camera path

const fake = (slug: string, kind: WorkKind, side: WorkSide, aspect: number): Work => ({
  slug,
  kind,
  side,
  title: slug,
  line: "",
  story: [],
  links: [],
  media: { image: "", aspect, avgColor: "#808080" },
});

const WORKS_16: Work[] = [
  ...[1.34, 1.3, 1.24, 1.24, 1.24, 0.74, 1.25].map((a, i) => fake(`painting-${i}`, "painting", "art", a)),
  fake("both-0", "project", "both", 1.21),
  ...[1.92, 1.9, 0.87, 2.22, 1.29, 1.26, 1.37, 0.79].map((a, i) => fake(`project-${i}`, "project", "code", a)),
];

const VIEWPORTS: Viewport[] = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];

const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** Distance from a point to a work's rectangle (a vertical plane turned by rotationY). */
function distanceToWork(point: THREE.Vector3, placement: Placement): number {
  const d = point.clone().sub(v3(placement.position));
  const right = new THREE.Vector3(Math.cos(placement.rotationY), 0, -Math.sin(placement.rotationY));
  const normal = new THREE.Vector3(Math.sin(placement.rotationY), 0, Math.cos(placement.rotationY));
  const x = d.dot(right);
  const z = d.dot(normal);
  const dx = Math.max(0, Math.abs(x) - placement.width / 2);
  const dy = Math.max(0, Math.abs(d.y) - placement.height / 2);
  return Math.hypot(dx, dy, z);
}

/** How much of the viewport (width, height) a work fills seen from `eye` looking at `target`. */
function fill(placement: Placement, eye: THREE.Vector3, target: THREE.Vector3, viewport: Viewport): [number, number] {
  const camera = new THREE.PerspectiveCamera(FOV_Y, viewport.width / viewport.height, 0.05, 1000);
  camera.position.copy(eye);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const right = new THREE.Vector3(Math.cos(placement.rotationY), 0, -Math.sin(placement.rotationY));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const corner = v3(placement.position)
        .addScaledVector(right, (sx * placement.width) / 2)
        .add(new THREE.Vector3(0, (sy * placement.height) / 2, 0))
        .project(camera);
      minX = Math.min(minX, corner.x);
      maxX = Math.max(maxX, corner.x);
      minY = Math.min(minY, corner.y);
      maxY = Math.max(maxY, corner.y);
    }
  }
  return [(maxX - minX) / 2, (maxY - minY) / 2];
}

function floorSide(layout: SceneLayout, x: number, z: number): "art" | "code" {
  if (layout.floor.spine) return x < 0 ? "art" : "code";
  let k = 0;
  for (const [px, pz, nx, nz] of layout.floor.planes) if ((x - px) * nx + (z - pz) * nz > 0) k++;
  return layout.floor.sides[k];
}

for (const name of Object.keys(LAYOUTS) as LayoutName[]) {
  for (const viewport of VIEWPORTS) {
    const label = `${name} ${viewport.width}×${viewport.height}`;
    const layout = LAYOUTS[name](WORKS_16, viewport);
    const path = createCameraPath(layout.cameraPath);
    const byslug = new Map(layout.placements.map((p) => [p.slug, p]));
    const eye = new THREE.Vector3();
    const target = new THREE.Vector3();

    check(`${label}: every work has one placement and one stop`, () => {
      assert(layout.placements.length === WORKS_16.length, `${layout.placements.length} placements`);
      assert(layout.stops.length === WORKS_16.length, `${layout.stops.length} stops`);
      for (const work of WORKS_16) {
        assert(layout.placements.filter((p) => p.slug === work.slug).length === 1, `placements of ${work.slug}`);
        assert(layout.stops.filter((s) => s.slug === work.slug).length === 1, `stops of ${work.slug}`);
      }
    });

    check(`${label}: stops are in order, titles and passages inside the path`, () => {
      layout.stops.forEach((s, i) => assert(i === 0 || s.t > layout.stops[i - 1].t, `stop ${i} out of order`));
      for (const s of layout.stops) assert(s.t > 0 && s.t < 1, `stop ${s.slug} at ${s.t}`);
      for (const x of [...layout.titles, ...layout.passages]) assert(x.t > 0 && x.t < 1, `${x.key} at ${x.t}`);
    });

    check(`${label}: the camera is at each stop's point, looking at the work`, () => {
      for (const s of layout.stops) {
        const index = Math.round(s.t * (layout.cameraPath.length - 1));
        assert(near(index / (layout.cameraPath.length - 1), s.t), `${s.slug}: t ${s.t} is not a control point`);
        path.at(s.t, eye, target);
        assert(eye.distanceTo(v3(layout.cameraPath[index].position)) < 1e-6, `${s.slug}: camera off its point`);
        assert(target.distanceTo(v3(byslug.get(s.slug)!.position)) < 1e-6, `${s.slug}: not looking at the work`);
      }
    });

    check(`${label}: the camera never brushes a work`, () => {
      for (let k = 0; k <= 2000; k++) {
        path.at(k / 2000, eye, target);
        assert(Number.isFinite(eye.x + eye.y + eye.z + target.x + target.y + target.z), `NaN at ${k}`);
        for (const p of layout.placements) {
          const d = distanceToWork(eye, p);
          assert(d >= 0.6, `${p.slug} ${d.toFixed(2)} m from the camera at t ${(k / 2000).toFixed(4)}`);
        }
      }
      for (const s of layout.stops) {
        path.at(s.t, eye, target);
        const d = distanceToWork(eye, byslug.get(s.slug)!);
        assert(d >= 1, `${s.slug} presented from ${d.toFixed(2)} m`);
      }
    });

    check(`${label}: works stand apart, on the floor`, () => {
      const [minX, maxX, minZ, maxZ] = layout.floor.bounds;
      layout.placements.forEach((a, i) => {
        assert(a.position[0] > minX && a.position[0] < maxX && a.position[2] > minZ && a.position[2] < maxZ, `${a.slug} off the floor`);
        layout.placements.slice(i + 1).forEach((b) => {
          const d = v3(a.position).distanceTo(v3(b.position));
          assert(d >= 1.2, `${a.slug} and ${b.slug} ${d.toFixed(2)} m apart`);
        });
      });
    });

    check(`${label}: a presented work fills a good part of the view, not all of it`, () => {
      for (const s of layout.stops) {
        path.at(s.t, eye, target);
        const [w, h] = fill(byslug.get(s.slug)!, eye, target, viewport);
        assert(w <= 0.7 && h <= 0.7, `${s.slug} fills ${w.toFixed(2)} × ${h.toFixed(2)}`);
        assert(Math.max(w, h) >= 0.35, `${s.slug} only fills ${w.toFixed(2)} × ${h.toFixed(2)}`);
      }
    });

    check(`${label}: each work stands on its side of the floor`, () => {
      for (const work of WORKS_16) {
        if (work.side === "both") continue;
        const p = byslug.get(work.slug)!;
        const side = name === "split" ? work.side : work.kind === "painting" ? "art" : "code";
        assert(floorSide(layout, p.position[0], p.position[2]) === side, `${work.slug} on the wrong side`);
      }
    });

    check(`${label}: beats cover every stop and title, in order`, () => {
      const beats = beatsFor(layout, { work: 1, title: 0.8 });
      assert(beats.length === layout.stops.length + layout.titles.length, `${beats.length} beats`);
      beats.forEach((b, i) => assert(i === 0 || b.t > beats[i - 1].t, `beat ${b.key} out of order`));
    });

    if (name === "split") {
      check(`${label}: works that are both sit on the spine`, () => {
        const p = byslug.get("both-0")!;
        assert(p.position[0] === 0, `both-0 at x ${p.position[0]}`);
      });
    } else {
      check(`${label}: one title per chapter, a passage between chapters`, () => {
        assert(layout.titles.length === 2, `${layout.titles.length} titles`);
        assert(layout.passages.length === 1, `${layout.passages.length} passages`);
        assert(layout.floor.sides.join() === "art,code", `sides ${layout.floor.sides.join()}`);
        assert(layout.groups.map((g) => g.title).join() === "Paintings,Projects", `groups ${layout.groups.map((g) => g.title).join()}`);
      });
    }
  }
}

// ---------------------------------------------------------------------------

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`showcase:check: ${failures.length} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`showcase:check: ${passed} passed`);
}
