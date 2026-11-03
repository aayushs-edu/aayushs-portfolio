// Checks for the home page's pure modules and its generated media. Run with `npm run showcase:check`.

import fs from "node:fs";
import path from "node:path";
import { CURVE, ZIP, type SplitLayout } from "../../src/components/hero/splitConfig";
import { CLOSED, goneAt, lineAt, openAt, swing, zipClipPaths, zipFor } from "../../src/components/hero/zipper";
import { CANVAS_H, corners, EXPLODE_STATES, ITEMS, RIGS, STAGE, TAGS, toStage, project } from "../../src/components/showcase/paintwise/explode";
import { GROUP_ORDER, WORKS } from "../../src/components/showcase/works";

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
interface PaintingsMediaShape {
  early: { slug: string; title: string; year: string; story: string; image: string; depth: string; aspect: number; avgColor: string }[];
  held: Record<string, { src: string; aspect: number }>;
  origin: { image: string; aspect: number; avgColor: string };
}

interface AnimationMediaShape {
  films: { slug: string; loop: string; poster: string; film: string; aspect: number }[];
  stills: { src: string; aspect: number }[];
  models: { slug: string; glb: string; thumb: string; uid: string }[];
}

interface PaintwiseMediaShape {
  canvas: { width: number; height: number };
  layers: { id: string; src: string }[];
  objects: { id: string; src: string; box: [number, number, number, number]; depth: number; color: string }[];
  stillLifes: { src: string; aspect: number }[];
  figure: { src: string; aspect: number };
}

// ---------------------------------------------------------------------------
// The hero unzipping from below

/** A line that swings as far as it can either way, down its length. */
function swingingCurve(layout: SplitLayout): Float32Array {
  const curve = new Float32Array(CURVE.samples);
  for (let i = 0; i < curve.length; i++) curve[i] = CURVE.amp * layout.u * Math.sin(i * 0.11);
  return curve;
}

for (const [w, h, seamX, u] of [
  [1440, 900, 720, 0.62],
  [390, 844, 195, 0.32],
  [1024, 768, 400, 0.6],
]) {
  const layout: SplitLayout = { w, h, u, seamX, gridY: 100, cellW: 8 * u, cellH: 16 * u };
  const label = `zip ${w}×${h}`;
  const reach = Math.max(seamX, w - seamX) + swing(layout);
  const gone = goneAt(layout);

  check(`${label}: closed at the top of the page`, () => {
    const zip = zipFor(0, layout);
    for (let y = 0; y <= h; y += 4) assert(openAt(zip, y) === 0, `open ${openAt(zip, y)} at ${y}`);
    assert(zipFor(-50, layout).scroll === 0, "negative scroll (overscroll) isn't clamped");
  });

  check(`${label}: it opens from below, wider further down and the further the page scrolls`, () => {
    for (let s = 0; s <= gone; s += gone / 20) {
      const zip = zipFor(s, layout);
      let prev = 0;
      for (let y = s; y <= s + h; y += 8) {
        const o = openAt(zip, y);
        assert(o >= prev, `narrows going down at scroll ${s.toFixed(0)}, row ${y.toFixed(0)}`);
        prev = o;
        assert(openAt(zipFor(s + 10, layout), y) >= o, `closes as the page scrolls at row ${y.toFixed(0)}`);
      }
    }
    // The point where the halves meet climbs the screen.
    const onScreen = (s: number) => zipFor(s, layout).apex - s;
    assert(onScreen(0) > h && onScreen(gone / 2) < h && onScreen(gone / 2) < onScreen(gone / 4), "the apex doesn't climb");
  });

  check(`${label}: gone at goneAt (every row's halves off screen), not long before`, () => {
    const at = (s: number) => {
      const zip = zipFor(s, layout);
      let least = Infinity;
      for (let y = 0; y <= h; y += 4) least = Math.min(least, openAt(zip, y + s));
      return least;
    };
    assert(at(gone) >= reach - 0.01, `at goneAt the least opening is ${at(gone).toFixed(1)}, need ${reach.toFixed(1)}`);
    assert(at(gone * 0.92) < reach, "goneAt is later than it needs to be");
    assert(gone > 0.6 * h && gone < 2 * h, `gone after ${(gone / h).toFixed(2)} screens`);
  });

  check(`${label}: below the hero the line runs on smoothly and stays near the centre`, () => {
    const curve = swingingCurve(layout);
    assert(near(lineAt(curve, h, layout), curve[curve.length - 1], 1e-3) && near(lineAt(curve, h + 0.5, layout), lineAt(curve, h, layout), 0.5), "a jump at the hero's bottom edge");
    const bound = CURVE.amp * u + ZIP.maxSlope * ZIP.runOn * u + 1e-6;
    for (let y = h; y < h + 3 * gone; y += 10) assert(Math.abs(lineAt(curve, y, layout)) <= bound, `line at ${lineAt(curve, y, layout).toFixed(1)} at ${y}`);
  });

  check(`${label}: the wall's clip-paths trace the line closed, and the opened edges apart`, () => {
    const curve = swingingCurve(layout);
    const xs = (polygon: string) => [...polygon.matchAll(/(-?[\d.]+)px (-?[\d.]+)px/g)].map((m) => [Number(m[1]), Number(m[2])]);
    const closed = zipClipPaths(curve, layout, CLOSED);
    const [l0, r0] = [xs(closed.left), xs(closed.right)];
    assert(l0.length === CURVE.clipPoints + 4 && r0.length === l0.length, `${l0.length} points`);
    for (let k = 1; k < l0.length - 1; k++) assert(l0[k][0] === r0[k][0] && l0[k][1] === r0[k][1], `the halves part at ${l0[k][1]} while closed`);
    const open = zipClipPaths(curve, layout, zipFor(gone / 2, layout));
    const [l1, r1] = [xs(open.left), xs(open.right)];
    let parted = false;
    for (let k = 1; k < l1.length - 1; k++) {
      assert(l1[k][0] <= r1[k][0], `the halves cross at ${l1[k][1]}`);
      assert(l1[k][0] >= -2 && r1[k][0] <= w + 2, `off the stage at ${l1[k][1]}`);
      parted ||= r1[k][0] - l1[k][0] > 100;
    }
    assert(parted, "half way to gone, nothing has parted");
  });
}

// ---------------------------------------------------------------------------
// Paintwise's exploded still life

check("explode: six layers then every object, with a finite pose in each state", () => {
  const layers = ITEMS.filter((i) => i.kind === "layer");
  assert(layers.length === 6 && layers[0].id === "layer:original", `layers ${layers.map((l) => l.id)}`);
  assert(ITEMS.length > 14, `${ITEMS.length} items`);
  for (const item of ITEMS) {
    for (const state of EXPLODE_STATES) {
      const p = item.poses[state];
      assert([p.x, p.y, p.z, p.opacity].every(Number.isFinite) && p.opacity >= 0 && p.opacity <= 1, `${item.id} ${state}`);
    }
  }
});

check("explode: at rest it's the canvas, square on, alone", () => {
  assert(RIGS.rest.turn[0] === 0 && RIGS.rest.turn[1] === 0, "turned at rest");
  const shown = ITEMS.filter((i) => i.poses.rest.opacity > 0.01).map((i) => i.id);
  assert(shown.join() === "layer:original", `shown at rest: ${shown}`);
});

check("explode: fanned out, every layer shows and no object does; for the masks, the objects show and the masks layer doesn't", () => {
  for (const item of ITEMS) {
    const { layers, masks } = item.poses;
    if (item.kind === "layer") {
      assert(layers.opacity === 1, `${item.id} hidden in layers`);
      assert((masks.opacity === 0) === (item.id === "layer:masks"), `${item.id} masks opacity ${masks.opacity}`);
    } else {
      assert(layers.opacity === 0 && masks.opacity === 1, `${item.id}`);
    }
  }
});

for (const state of EXPLODE_STATES) {
  check(`explode ${state}: inside the stage, centred, filling about ${STAGE.fill[state]} of it, in front of the viewer`, () => {
    const points = ITEMS.filter((i) => i.poses[state].opacity > 0.01).flatMap((i) => corners(i, state));
    const xy = points.map((p) => project(p, RIGS[state]));
    const [x0, x1] = [Math.min(...xy.map((p) => p[0])), Math.max(...xy.map((p) => p[0]))];
    const [y0, y1] = [Math.min(...xy.map((p) => p[1])), Math.max(...xy.map((p) => p[1]))];
    assert(x0 >= 0 && x1 <= 1 && y0 >= 0 && y1 <= STAGE.aspect, `box ${[x0, x1, y0, y1].map((v) => v.toFixed(3))}`);
    assert(near((x0 + x1) / 2, 0.5, 0.005) && near((y0 + y1) / 2, STAGE.aspect / 2, 0.005), "off centre");
    const share = Math.max(x1 - x0, (y1 - y0) / STAGE.aspect);
    assert(near(share, STAGE.fill[state], 0.01), `fills ${share.toFixed(3)}`);
    for (const p of points) assert(toStage(p, RIGS[state])[2] < STAGE.perspective * 0.6, "too close to the viewer");
  });
}

check("explode: the layers fan out toward the back, and the masks sit in front of their layers", () => {
  const layers = ITEMS.filter((i) => i.kind === "layer");
  for (let k = 1; k < layers.length; k++) assert(layers[k].poses.layers.z < layers[k - 1].poses.layers.z, `${layers[k].id} not behind`);
  const front = Math.max(...layers.map((l) => l.poses.masks.z));
  assert(ITEMS.filter((i) => i.kind === "object").every((o) => o.poses.masks.z > front), "an object is behind the layers");
  assert(CANVAS_H > 0.5 && CANVAS_H < 1.2, `canvas height ${CANVAS_H}`);
});

check("explode: a tag per layer when fanned out, one for the masks, all on the stage", () => {
  assert(TAGS.filter((t) => t.state === "layers").length === 6 && TAGS.filter((t) => t.state === "masks").length === 1, "tag count");
  for (const t of TAGS) {
    assert(!!t.title && !!t.line, `${t.id} text`);
    assert(t.x > 0.02 && t.x < 0.98 && t.y > 0 && t.y < STAGE.aspect, `${t.id} at ${t.x.toFixed(3)}, ${t.y.toFixed(3)}`);
  }
});

// ---------------------------------------------------------------------------
// The works

check("works: every work is in a group on the page, and slugs are unique", () => {
  assert(new Set(WORKS.map((w) => w.slug)).size === WORKS.length, "duplicate slugs");
  for (const w of WORKS) assert(GROUP_ORDER.includes(w.group), `${w.slug} is in ${w.group}`);
  assert(WORKS.filter((w) => w.group === "paintwise").length === 1, "Paintwise");
});

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
// The paintings' and the animation station's media (also `npm run showcase:assets`)

{
  const root = process.cwd();
  const onDisk = (src: string) => fs.existsSync(path.join(root, "public", src.replace(/^\//, "")));
  const sizeOf = (src: string) => fs.statSync(path.join(root, "public", src.replace(/^\//, ""))).size;
  const read = <T,>(rel: string): T | null => {
    const file = path.join(root, rel);
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : null;
  };
  const paintings = read<PaintingsMediaShape>("src/components/showcase/stations/paintings/paintings.generated.json");
  const animation = read<AnimationMediaShape>("src/components/showcase/stations/animation/animation.generated.json");

  check("paintings media: ten early works with images and depth maps", () => {
    assert(paintings !== null, "paintings.generated.json is missing (run npm run showcase:assets)");
    assert(paintings.early.length === 10, `${paintings.early.length} early works`);
    const slugs = new Set(paintings.early.map((p) => p.slug));
    assert(slugs.size === 10, "duplicate slugs");
    for (const p of paintings.early) {
      assert(onDisk(p.image) && onDisk(p.depth), `${p.slug}: missing media`);
      assert(p.aspect > 0.4 && p.aspect < 2.5 && /^#[0-9a-f]{6}$/.test(p.avgColor), `${p.slug}: aspect ${p.aspect}, colour ${p.avgColor}`);
      assert(!!p.title && !!p.year && !!p.story, `${p.slug}: text`);
    }
  });

  check("paintings media: the three held photos and the origin photo", () => {
    assert(paintings !== null, "no paintings media");
    const held = Object.keys(paintings.held).sort().join(",");
    assert(held === "asthma,covid,red-dead-redemption", `held ${held}`);
    for (const h of Object.values(paintings.held)) assert(onDisk(h.src) && h.aspect > 0, `held ${h.src}`);
    assert(onDisk(paintings.origin.image) && paintings.origin.aspect > 0, "origin");
  });

  check("animation media: three films with small loops and posters", () => {
    assert(animation !== null, "animation.generated.json is missing (run npm run showcase:assets)");
    assert(animation.films.map((f) => f.slug).join(",") === "wild-west,soccer-star,sanctuary", "films");
    for (const f of animation.films) {
      assert(onDisk(f.loop) && onDisk(f.poster), `${f.slug}: missing loop or poster`);
      assert(sizeOf(f.loop) < 3 * 1024 * 1024, `${f.slug}: loop is ${(sizeOf(f.loop) / 1048576).toFixed(1)} MB`);
      assert(/^https:\/\/github\.com\/aayushs-edu\/aayushs-portfolio\/releases\/download\/videos-v1\.0\//.test(f.film), `${f.slug}: film ${f.film}`);
      assert(f.aspect > 1.5 && f.aspect < 2, `${f.slug}: aspect ${f.aspect}`);
    }
  });

  check("animation media: eight storyboard stills and three compressed models", () => {
    assert(animation !== null, "no animation media");
    assert(animation.stills.length === 8, `${animation.stills.length} stills`);
    for (const s of animation.stills) assert(onDisk(s.src) && s.aspect > 1, `still ${s.src}`);
    assert(animation.models.map((m) => m.slug).join(",") === "main-character,banana-gun,saloon", "models");
    for (const m of animation.models) {
      assert(onDisk(m.glb) && onDisk(m.thumb), `${m.slug}: missing glb or thumbnail`);
      assert(sizeOf(m.glb) < 4 * 1024 * 1024, `${m.slug}: ${(sizeOf(m.glb) / 1048576).toFixed(1)} MB`);
      assert(/^[0-9a-f]{32}$/.test(m.uid), `${m.slug}: sketchfab uid`);
    }
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
