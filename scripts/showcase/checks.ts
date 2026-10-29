// Checks for the showcase's pure modules. Run with `npm run showcase:check`.

import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { openFor } from "../../src/components/hero/seamField";
import { BITS, CURVE, SEAM } from "../../src/components/hero/splitConfig";
import { createCameraPath } from "../../src/components/showcase/cameraPath";
import { detailPose } from "../../src/components/showcase/cameraPose";
import { freeArea, SHOWCASE } from "../../src/components/showcase/showcaseConfig";
import { FOV_Y, type Placement, type Vec3, type Viewport } from "../../src/components/showcase/layouts/types";
import { createScrollMap, progressForBeat, sampleScroll, type Beat } from "../../src/components/showcase/scrollMap";
import type { Work, WorkKind, WorkSide } from "../../src/components/showcase/works";
import { arcLerp, buildRoom, locate, ROOM, stationPlacement, toWorld } from "../../src/components/showcase/room/ring";
import type { GroupId, PanelPose } from "../../src/components/showcase/room/types";
import { easeBetween, poseAt, presenceAt } from "../../src/components/showcase/panels/pose";
import { paintwiseStation } from "../../src/components/showcase/stations/paintwise/layout";

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

/** What scripts/showcase/build-assets.py writes (checked at run time, so a missing file is a failed check). */
interface PaintwiseMediaShape {
  canvas: { width: number; height: number };
  layers: { id: string; src: string }[];
  objects: { id: string; src: string; box: [number, number, number, number]; depth: number; color: string }[];
  stillLifes: { src: string; aspect: number }[];
  figure: { src: string; aspect: number };
}

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
// The room: the ring, its stations and the camera path

const fake = (slug: string, kind: WorkKind, side: WorkSide, group: GroupId, aspect: number): Work => ({
  slug,
  kind,
  side,
  group,
  title: slug,
  line: "",
  story: [],
  links: [],
  media: { image: "", aspect, avgColor: "#808080" },
});

/** The real works' slugs, groups and aspects (stage 1). */
const WORKS_16: Work[] = [
  ...(
    [
      ["snorkeling-hawaii", 1.34],
      ["snowboarding", 1.3],
      ["taj-mahal", 1.24],
      ["safari-kid", 1.24],
      ["soccer-penalty", 1.24],
      ["red-dead-redemption", 0.74],
      ["childhood-toys", 1.25],
    ] as const
  ).map(([slug, a]) => fake(slug, "painting", "art", "paintings", a)),
  fake("paintwise", "project", "both", "paintwise", 1.21),
  ...(
    [
      ["exovision", 1.92],
      ["lumina", 1.9],
      ["medai", 0.87],
      ["stockapp", 2.22],
    ] as const
  ).map(([slug, a]) => fake(slug, "project", "code", "hackathons", a)),
  ...(
    [
      ["bounce-back", 1.29],
      ["reign-or-ruin", 1.26],
      ["biscuit-bandit", 1.37],
      ["murphys-rocket", 0.79],
    ] as const
  ).map(([slug, a]) => fake(slug, "project", "code", "games", a)),
];

const VIEWPORTS: Viewport[] = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
];
const landscape = (v: Viewport) => v.width >= v.height;

const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);
const flat = (p: THREE.Vector3 | Vec3) => (Array.isArray(p) ? Math.hypot(p[0] - ROOM.centre[0], p[2] - ROOM.centre[2]) : Math.hypot(p.x - ROOM.centre[0], p.z - ROOM.centre[2]));

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

const paintwiseFor = (viewport: Viewport) => paintwiseStation(viewport);

check("ring: stations stand on their halves, facing the centre", () => {
  for (const id of ["paintings", "animation", "hackathons", "games"] as const) {
    const at = stationPlacement(id);
    const side = id === "paintings" || id === "animation" ? -1 : 1;
    assert(Math.sign(at.position[0]) === side, `${id} at x ${at.position[0].toFixed(2)}`);
    assert(near(flat(at.position), ROOM.radius, 1e-6), `${id} off the ring`);
    const facing = v3(toWorld([0, 0, 1], at)).sub(v3(at.position));
    const inward = v3(ROOM.centre).sub(v3(at.position)).setY(0).normalize();
    assert(facing.dot(inward) > 0.999, `${id} faces ${facing.toArray().map((v) => v.toFixed(2))}`);
  }
  const centre = stationPlacement("paintwise");
  assert(centre.position.every((v, i) => near(v, ROOM.centre[i])) && centre.yaw === 0, "paintwise not at the centre facing the entrance");
});

check("ring: arcLerp ends where it should and keeps its distance from the centre", () => {
  const a: Vec3 = [-6, 1.6, -13];
  const b: Vec3 = [6, 2, -13];
  const start = arcLerp(a, b, ROOM.centre, 0);
  const end = arcLerp(a, b, ROOM.centre, 1);
  assert(start.every((v, i) => near(v, a[i], 1e-9)) && end.every((v, i) => near(v, b[i], 1e-9)), "endpoints");
  for (let k = 0; k <= 50; k++) assert(flat(arcLerp(a, b, ROOM.centre, k / 50)) >= 6 - 1e-9, `cuts in at ${k}`);
});

for (const viewport of VIEWPORTS) {
  const label = `room ${viewport.width}×${viewport.height}`;
  const room = buildRoom(WORKS_16, viewport, paintwiseFor(viewport));
  const path = createCameraPath(room.cameraPath);
  const byslug = new Map(room.placements.map((p) => [p.slug, p]));
  const keyIndex = new Map(room.beats.map((b, i) => [b.key, i]));
  const eye = new THREE.Vector3();
  const target = new THREE.Vector3();

  check(`${label}: every work has one placement and one beat`, () => {
    assert(room.placements.length === WORKS_16.length, `${room.placements.length} placements`);
    for (const work of WORKS_16) {
      assert(room.placements.filter((p) => p.slug === work.slug).length === 1, `placements of ${work.slug}`);
      assert(room.beats.filter((b) => b.key === `work:${work.slug}`).length === 1, `beats of ${work.slug}`);
    }
  });

  check(`${label}: the overview first, then the stations in tour order`, () => {
    assert(room.beats[0].key === "room:overview", `first beat ${room.beats[0].key}`);
    const order = room.stations.map((s) => s.id).join(",");
    assert(order === "paintwise,paintings,hackathons,games", `stations ${order}`);
    room.stations.forEach((s, i) => {
      const next = room.stations[i + 1];
      assert(s.first === (i === 0 ? 1 : room.stations[i - 1].first + room.stations[i - 1].count), `${s.id} starts at ${s.first}`);
      assert(!next || next.first === s.first + s.count, `${s.id} and ${next?.id} overlap`);
    });
    assert(room.beats.length === 1 + room.stations.reduce((n, s) => n + s.count, 0), "beat count");
  });

  check(`${label}: beats are in order, on control points, inside the path`, () => {
    room.beats.forEach((b, i) => {
      assert(i === 0 || b.t > room.beats[i - 1].t, `${b.key} out of order`);
      assert(b.t > 0 && b.t < 1, `${b.key} at ${b.t}`);
      const index = Math.round(b.t * (room.cameraPath.length - 1));
      assert(near(index / (room.cameraPath.length - 1), b.t), `${b.key} is not on a control point`);
      path.at(b.t, eye, target);
      assert(eye.distanceTo(v3(room.cameraPath[index].position)) < 1e-6, `${b.key}: camera off its point`);
    });
  });

  check(`${label}: at a gallery work's beat the camera looks at it`, () => {
    for (const work of WORKS_16) {
      if (work.group === "paintwise") continue;
      path.at(room.beats[keyIndex.get(`work:${work.slug}`)!].t, eye, target);
      assert(target.distanceTo(v3(byslug.get(work.slug)!.position)) < 1e-6, `${work.slug}: not looking at it`);
    }
  });

  check(`${label}: stations keep apart (with room for animation)`, () => {
    const ring = [...room.stations.map((s) => ({ id: s.id, p: s.at.position, r: s.layout.radius })), { id: "animation", p: stationPlacement("animation").position, r: 4 }];
    ring.forEach((a, i) =>
      ring.slice(i + 1).forEach((b) => {
        const d = Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2]);
        assert(d >= a.r + b.r + 0.5, `${a.id} and ${b.id}: ${d.toFixed(2)} m apart, reach ${a.r.toFixed(2)} + ${b.r.toFixed(2)}`);
      }),
    );
  });

  check(`${label}: the camera never brushes a work, nor cuts through the middle`, () => {
    for (let k = 0; k <= 2000; k++) {
      path.at(k / 2000, eye, target);
      assert(Number.isFinite(eye.x + eye.y + eye.z + target.x + target.y + target.z), `NaN at ${k}`);
      assert(flat(eye) >= 2.2, `${flat(eye).toFixed(2)} m from the centre at t ${(k / 2000).toFixed(4)}`);
      for (const p of room.placements) {
        const d = distanceToWork(eye, p);
        assert(d >= 0.6, `${p.slug} ${d.toFixed(2)} m from the camera at t ${(k / 2000).toFixed(4)}`);
      }
    }
  });

  check(`${label}: works in a station stand apart`, () => {
    for (const s of room.stations) {
      s.layout.works.forEach((a, i) =>
        s.layout.works.slice(i + 1).forEach((b) => {
          const d = v3(a.position).distanceTo(v3(b.position));
          assert(d >= 1.0, `${a.slug} and ${b.slug} ${d.toFixed(2)} m apart`);
        }),
      );
    }
  });

  if (landscape(viewport)) {
    check(`${label}: a presented gallery work fills a good part of the view, not all of it`, () => {
      for (const work of WORKS_16) {
        if (work.group === "paintwise") continue;
        path.at(room.beats[keyIndex.get(`work:${work.slug}`)!].t, eye, target);
        const [w, h] = fill(byslug.get(work.slug)!, eye, target, viewport);
        assert(w <= 0.7 && h <= 0.7, `${work.slug} fills ${w.toFixed(2)} × ${h.toFixed(2)}`);
        assert(Math.max(w, h) >= 0.35, `${work.slug} only fills ${w.toFixed(2)} × ${h.toFixed(2)}`);
      }
    });
  }

  check(`${label}: locate names the station and the beat within it`, () => {
    assert(locate(room, 0).station === null, "overview has a station");
    for (const s of room.stations) {
      for (let i = 0; i < s.count; i++) {
        const at = locate(room, s.first + i);
        assert(at.station?.id === s.id && near(at.local, i), `beat ${s.first + i}: ${at.station?.id} ${at.local}`);
      }
      const between = locate(room, s.first + 0.3);
      assert(between.station?.id === s.id && near(between.local, 0.3), "continuous local");
    }
  });

  check(`${label}: a jump between any two stations arcs round the middle`, () => {
    const firsts = room.stations.map((s) => room.cameraPath[Math.round(room.beats[s.first].t * (room.cameraPath.length - 1))].position);
    firsts.forEach((a) =>
      firsts.forEach((b) => {
        for (let k = 0; k <= 50; k++) assert(flat(arcLerp(a, b, ROOM.centre, k / 50)) >= 2.2, "jump cuts through the middle");
      }),
    );
  });
}
// ---------------------------------------------------------------------------
// Floating panels: poses between beats, and the Paintwise station

const finitePose = (p: PanelPose) => [...p.position, ...p.rotation, p.scale, p.opacity].every(Number.isFinite);
const samePose = (a: PanelPose, b: PanelPose, eps = 1e-9) =>
  a.position.every((v, i) => near(v, b.position[i], eps)) && a.rotation.every((v, i) => near(v, b.rotation[i], eps)) && near(a.scale, b.scale, eps) && near(a.opacity, b.opacity, eps);
const blankPose = (): PanelPose => ({ position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, opacity: 1 });

check("pose: presence is 0 away from a station, 1 through its beats", () => {
  const count = 5;
  for (const u of [-3, -1.5, -1, count, count + 2]) assert(presenceAt(u, count) === 0, `presence ${presenceAt(u, count)} at ${u}`);
  for (const u of [-0.35, 0, 1.5, count - 0.65]) assert(near(presenceAt(u, count), 1), `presence ${presenceAt(u, count)} at ${u}`);
  let prev = 0;
  for (let k = 0; k <= 100; k++) {
    const p = presenceAt(-1 + (k / 100) * 0.65, count);
    assert(p >= prev - 1e-12, "presence falls while arriving");
    prev = p;
  }
});

check("pose: panels rest at each beat and move between them", () => {
  assert(easeBetween(0) === 0 && easeBetween(0.2) === 0 && easeBetween(0.8) === 1 && easeBetween(1) === 1, "not resting near beats");
  assert(near(easeBetween(0.5), 0.5), `halfway ${easeBetween(0.5)}`);
});

check("pose: poseAt lands on each beat's pose, and on idle when absent", () => {
  const poses: PanelPose[] = [
    { position: [0, 1, 0], rotation: [0, 0, 0], scale: 1, opacity: 1 },
    { position: [2, 1, -1], rotation: [0, 0.5, 0], scale: 0.5, opacity: 0 },
    { position: [-1, 2, 1], rotation: [0.1, -0.5, 0], scale: 2, opacity: 0.5 },
  ];
  const idle: PanelPose = { position: [9, 9, 9], rotation: [0, 1, 0], scale: 0.3, opacity: 0.2 };
  const out = blankPose();
  poses.forEach((p, i) => assert(samePose(poseAt(poses, idle, i, 1, out), p), `beat ${i}`));
  assert(samePose(poseAt(poses, idle, -2, 1, out), poses[0]) && samePose(poseAt(poses, idle, 7, 1, out), poses[2]), "not clamped");
  assert(samePose(poseAt(poses, idle, 1.3, 0, out), idle), "not idle at presence 0");
  const mid = poseAt(poses, idle, 0.5, 1, out);
  assert(near(mid.position[0], 1) && near(mid.opacity, 0.5), `halfway ${JSON.stringify(mid)}`);
});

for (const viewport of VIEWPORTS) {
  const label = `paintwise ${viewport.width}×${viewport.height}`;
  const station = paintwiseStation(viewport);
  const ids = new Set(station.panels.map((p) => p.id));

  check(`${label}: four beats (no flipbook), the first presents the work`, () => {
    const keys = station.beats.map((b) => b.key).join(",");
    assert(keys === "work:paintwise,paintwise:explode,paintwise:masks,paintwise:pipeline", keys);
    assert(!ids.has("flipbook") && !station.labels.some((l) => l.id === "pw:step" || l.id === "pw:chips"), "the flipbook and its labels are still there");
  });

  check(`${label}: every panel has a finite pose at every beat and in idle`, () => {
    assert(station.panels.length >= 6 + 8 + 1 + 8, `${station.panels.length} panels`);
    for (const panel of station.panels) {
      assert(panel.poses.length === station.beats.length, `${panel.id}: ${panel.poses.length} poses`);
      for (const pose of [...panel.poses, panel.idle]) {
        assert(finitePose(pose), `${panel.id}: not finite`);
        assert(pose.opacity >= 0 && pose.opacity <= 1 && pose.scale > 0, `${panel.id}: opacity ${pose.opacity}, scale ${pose.scale}`);
      }
      assert(panel.width > 0 && panel.height > 0, `${panel.id} size`);
    }
  });

  check(`${label}: the fly-in lands on the canvas as it hangs at the first beat`, () => {
    const canvas = station.panels.find((p) => p.id === "canvas")!;
    const pose = canvas.poses[0];
    const d = station.detailPlacement;
    assert(d.slug === "paintwise" && pose.opacity === 1, "canvas hidden at beat 0");
    assert(d.position.every((v, i) => near(v, pose.position[i])) && near(d.rotationY, pose.rotation[1]), "detail placement off the canvas");
    assert(near(d.width, canvas.width * pose.scale) && near(d.height, canvas.height * pose.scale), "detail placement size");
    assert(station.works.length === 1 && station.works[0] === d, "the station's one work is the canvas");
  });

  check(`${label}: labels pin to panels that exist, within the beats`, () => {
    for (const l of station.labels) {
      assert(!!l.point || (!!l.panel && ids.has(l.panel)), `${l.id} pinned to ${l.panel}`);
      assert(l.beats[0] >= 0 && l.beats[1] < station.beats.length && l.beats[0] <= l.beats[1], `${l.id} beats ${l.beats}`);
    }
  });

  if (landscape(viewport)) {
    check(`${label}: at each beat the camera keeps clear of every panel it shows`, () => {
      station.beats.forEach((beat, i) => {
        const eye = v3(beat.camera.position);
        for (const panel of station.panels) {
          const pose = panel.poses[i];
          if (pose.opacity < 0.05) continue;
          const d = eye.distanceTo(v3(pose.position));
          assert(d >= 2.5, `beat ${i}: ${panel.id} ${d.toFixed(2)} m from the camera`);
        }
      });
    });
  }
}

check("room with the real Paintwise: the camera keeps clear of its panels at every beat and between", () => {
  for (const viewport of VIEWPORTS) {
    const station = paintwiseStation(viewport);
    const room = buildRoom(WORKS_16, viewport, station);
    const pw = room.stations.find((s) => s.id === "paintwise")!;
    const path = createCameraPath(room.cameraPath);
    const eye = new THREE.Vector3();
    const target = new THREE.Vector3();
    const reach = Math.max(...station.panels.flatMap((p) => p.poses.map((q) => Math.hypot(q.position[0], q.position[2]))));
    assert(station.radius >= reach, `radius ${station.radius.toFixed(2)} < reach ${reach.toFixed(2)}`);
    for (let k = 0; k <= 2000; k++) {
      path.at(k / 2000, eye, target);
      assert(Number.isFinite(eye.x + eye.y + eye.z), `NaN at ${k}`);
      assert(flat(eye) >= 2.2, `${viewport.width}: ${flat(eye).toFixed(2)} m from the centre at ${k}`);
    }
    assert(pw.first === 1 && pw.count === 4, `paintwise beats ${pw.first}+${pw.count}`);
  }
});

// ---------------------------------------------------------------------------
// Flying in to a work

for (const viewport of VIEWPORTS) {
  const placements: Placement[] = [
    { slug: "wide", position: [-1.95, 1.6, -8], rotationY: 0.6, width: 1.6, height: 1.19 },
    { slug: "tall", position: [1.95, 1.4, -12], rotationY: -0.6, width: 0.87, height: 1.1 },
    { slug: "flat", position: [4, 1.4, -20], rotationY: 2.4, width: 1.7, height: 0.77 },
  ];
  for (const p of placements) {
    check(`detail ${viewport.width}×${viewport.height} ${p.slug}: centred in the free area, filling about ${SHOWCASE.flight.fill}`, () => {
      const pose = detailPose(p, viewport, SHOWCASE.flight.fill);
      const eye = v3(pose.position);
      const target = v3(pose.target);
      const camera = new THREE.PerspectiveCamera(FOV_Y, viewport.width / viewport.height, 0.05, 1000);
      camera.position.copy(eye);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      const centre = v3(p.position).project(camera);
      const [fx, fy, fw, fh] = freeArea(viewport.width, viewport.height);
      const want = [((fx + fw / 2) / viewport.width) * 2 - 1, 1 - ((fy + fh / 2) / viewport.height) * 2];
      assert(Math.abs(centre.x - want[0]) < 0.02 && Math.abs(centre.y - want[1]) < 0.02, `centre at ${centre.x.toFixed(3)}, ${centre.y.toFixed(3)}; want ${want.map((v) => v.toFixed(3))}`);
      const [w, h] = fill(p, eye, target, viewport);
      const share = Math.max((w * viewport.width) / fw, (h * viewport.height) / fh);
      assert(share > SHOWCASE.flight.fill - 0.03 && share < SHOWCASE.flight.fill + 0.03, `fills ${share.toFixed(3)} of the free area`);
      assert(eye.distanceTo(v3(p.position)) > 0.5, "too close");
    });
  }
}

// ---------------------------------------------------------------------------
// Paintwise's media (made by `npm run showcase:assets`)

{
  const generated = path.join(process.cwd(), "src/components/showcase/stations/paintwise/paintwise.generated.json");
  const exists = (src: string) => fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
  let media: PaintwiseMediaShape | null = null;

  check("paintwise media: the generated JSON is there", () => {
    assert(fs.existsSync(generated), `${path.relative(process.cwd(), generated)} is missing (run npm run showcase:assets)`);
    media = JSON.parse(fs.readFileSync(generated, "utf8")) as PaintwiseMediaShape;
  });

  check("paintwise media: six layers, in pipeline order, all on disk", () => {
    assert(media !== null, "no media");
    const ids = media.layers.map((l) => l.id).join(",");
    assert(ids === "original,masks,depth,blockin,edges,sketch", `layers ${ids}`);
    for (const l of media.layers) assert(exists(l.src), `missing ${l.src}`);
    assert(media.canvas.width > 0 && media.canvas.height > 0, "canvas size");
  });

  check("paintwise media: objects cut from the masks, far to near, inside the canvas", () => {
    assert(media !== null, "no media");
    assert(media.objects.length >= 8 && media.objects.length <= 28, `${media.objects.length} objects`);
    media.objects.forEach((o, i) => {
      assert(exists(o.src), `missing ${o.src}`);
      const [x, y, w, h] = o.box;
      assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1.0001 && y + h <= 1.0001, `${o.id} box ${o.box}`);
      assert(o.depth >= 0 && o.depth <= 1, `${o.id} depth ${o.depth}`);
      assert(i === 0 || o.depth >= media!.objects[i - 1].depth, `${o.id} out of depth order`);
    });
  });

  check("paintwise media: no step flipbook any more", () => {
    assert(media !== null, "no media");
    assert(!("steps" in media), "steps are still in the generated media");
  });

  check("paintwise media: eight still lifes and the figure", () => {
    assert(media !== null, "no media");
    assert(media.stillLifes.length === 8, `${media.stillLifes.length} still lifes`);
    for (const s of media.stillLifes) assert(exists(s.src) && s.aspect > 0, `still life ${s.src}`);
    assert(exists(media.figure.src) && media.figure.aspect > 1.5, `figure ${media.figure.src}`);
  });
}

// ---------------------------------------------------------------------------

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`showcase:check: ${failures.length} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`showcase:check: ${passed} passed`);
}
