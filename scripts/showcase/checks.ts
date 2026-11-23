// Checks for the home page's pure modules (Paintwise's exploded still life, the paintings wall, the works) and its generated media. Run with `npm run showcase:check`.

import fs from "node:fs";
import path from "node:path";
import { corners, EXPLODE_STATES, fillOf, fitItems, JUG, PIECE_DEPTH, PIECES, RIGS, STAGE, TAGS, toStage, project, VIEW_ITEMS, VIEWS } from "../../src/components/showcase/paintwise/explode";
import { fadeAt, layoutWall, panBounds, PORTFOLIO_COLUMNS } from "../../src/components/showcase/paintings/wall";
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

interface StillLifeShape {
  canvas: { width: number; height: number };
  layers: { id: string; src: string }[];
  objects: { id: string; src: string; box: [number, number, number, number]; depth: number; color: string }[];
}

interface PaintwiseMediaShape extends StillLifeShape {
  pieces: { canvas: { width: number; height: number }; original: string; objects: { id: string; src: string; box: number[]; depth: number }[] };
  stillLifes: { src: string; aspect: number }[];
  figure: { src: string; aspect: number };
}

// ---------------------------------------------------------------------------
// Paintwise's exploded still life

const ALL_ITEMS = [...JUG.layers, PIECES.original, ...PIECES.objects];

check("explode: the jug's six layers fan out; the SAM pieces show what the models see", () => {
  const ids = (items: { id: string }[]) => items.map((i) => i.id).join();
  assert(ids(VIEW_ITEMS.layers) === "jug:original,jug:masks,jug:depth,jug:blockin,jug:edges,jug:sketch", `layers view ${ids(VIEW_ITEMS.layers)}`);
  assert(VIEW_ITEMS.masks[0] === PIECES.original && VIEW_ITEMS.masks.length === 1 + PIECES.objects.length, "masks view");
  assert(PIECES.objects.length >= 10 && PIECES.objects.some((o) => o.id === "pieces:back"), `${PIECES.objects.length} pieces`);
  for (const item of ALL_ITEMS) {
    for (const state of EXPLODE_STATES) {
      const p = item.poses[state];
      assert([p.x, p.y, p.z, p.opacity].every(Number.isFinite) && p.opacity >= 0 && p.opacity <= 1, `${item.id} ${state}`);
    }
  }
  assert(JUG.canvasH > 0.5 && JUG.canvasH < 1.2 && PIECES.canvasH > 0.5 && PIECES.canvasH < 1.2, `canvas heights ${JUG.canvasH}, ${PIECES.canvasH}`);
});

check("explode: at rest each stage is its picture, square on and whole, about the same height in both (the stages are)", () => {
  for (const view of VIEWS) assert(RIGS[view].rest.turn[0] === 0 && RIGS[view].rest.turn[1] === 0, `${view}: turned at rest`);
  const jug = JUG.layers.filter((l) => l.poses.rest.opacity > 0.01).map((l) => l.id);
  assert(jug.join() === "jug:original", `the jug shows ${jug} at rest`);
  // The painting lies over its pieces, which sit flat in place under it.
  assert(PIECES.original.poses.rest.opacity === 1 && PIECES.objects.every((o) => o.poses.rest.z < PIECES.original.poses.rest.z), "the painting isn't on top at rest");
  const height = (view: (typeof VIEWS)[number]) => {
    const ys = corners(VIEW_ITEMS[view][0], "rest").map((p) => project(p, RIGS[view].rest)[1]);
    return (Math.max(...ys) - Math.min(...ys)) / STAGE.view[view].aspect;
  };
  assert(Math.abs(height("layers") - height("masks")) < 0.06, `${height("layers").toFixed(3)} vs ${height("masks").toFixed(3)} of the stage's height`);
});

check("explode: fanned out, every jug layer shows; for the masks, only the pieces show, spread through PIECE_DEPTH with the back farthest", () => {
  for (const l of JUG.layers) assert(l.poses.layers.opacity === 1, `${l.id} hidden in layers`);
  assert(PIECES.original.poses.masks.opacity === 0, "the painting still shows over its pieces");
  assert(PIECES.objects.every((o) => o.poses.masks.opacity === 1), "a piece is hidden");
  const zs = PIECES.objects.map((o) => o.poses.masks.z);
  const back = PIECES.objects.find((o) => o.id === "pieces:back")!;
  assert(back.poses.masks.z === Math.min(...zs) && near(Math.max(...zs) - Math.min(...zs), PIECE_DEPTH, 1e-6), `pieces span ${(Math.max(...zs) - Math.min(...zs)).toFixed(3)}`);
});

for (const view of VIEWS) {
  for (const state of ["rest", view] as const) {
    const rig = state === "rest" ? RIGS[view].rest : RIGS[view].view;
    const fill = fillOf(view, state);
    check(`explode ${view} stage, ${state}: inside, centred, filling about ${fill}, in front of the viewer`, () => {
      const { aspect } = STAGE.view[view];
      const points = fitItems(view, state).flatMap((i) => corners(i, state));
      const xy = points.map((p) => project(p, rig));
      const [x0, x1] = [Math.min(...xy.map((p) => p[0])), Math.max(...xy.map((p) => p[0]))];
      const [y0, y1] = [Math.min(...xy.map((p) => p[1])), Math.max(...xy.map((p) => p[1]))];
      assert(x0 >= 0 && x1 <= 1 && y0 >= 0 && y1 <= aspect, `box ${[x0, x1, y0, y1].map((v) => v.toFixed(3))}`);
      assert(near((x0 + x1) / 2, 0.5, 0.005) && near((y0 + y1) / 2, aspect / 2, 0.005), "off centre");
      const share = Math.max(x1 - x0, (y1 - y0) / aspect);
      assert(near(share, fill, 0.01), `fills ${share.toFixed(3)}`);
      for (const p of points) assert(toStage(p, rig)[2] < STAGE.perspective * 0.6, "too close to the viewer");
    });
  }
}

check("explode: the back is a whole rectangle; a slab runs back toward it without reaching it", () => {
  const back = PIECES.objects.find((o) => o.id === "pieces:back")!;
  assert(near(back.width, 1, 1e-3) && near(back.height, PIECES.canvasH, 1e-3), `back ${back.width} × ${back.height}`);
  const slabs = PIECES.objects.filter((o) => o.slab);
  for (const s of slabs) {
    assert(s.slab!.thickness > 0 && s.poses.masks.z - s.slab!.thickness > back.poses.masks.z, `${s.id} runs through the back`);
    assert(!!s.slab!.side && !!s.slab!.top, `${s.id} has no edge strips`);
  }
});

check("explode: the jug's layers fan out toward the back", () => {
  for (let k = 1; k < JUG.layers.length; k++) assert(JUG.layers[k].poses.layers.z < JUG.layers[k - 1].poses.layers.z, `${JUG.layers[k].id} not behind`);
});

check("explode: a tag per layer when fanned out, one for the masks, each pinned on its stage", () => {
  assert(TAGS.layers.length === 6 && TAGS.masks.length === 1, "tag count");
  for (const view of VIEWS) {
    for (const t of TAGS[view]) {
      assert(!!t.title && !!t.line, `${t.id} text`);
      assert(t.x > 0.02 && t.x < 0.98 && t.y > 0 && t.y < STAGE.view[view].aspect, `${view} ${t.id} at ${t.x.toFixed(3)}, ${t.y.toFixed(3)}`);
    }
  }
});

// ---------------------------------------------------------------------------
// The works

check("paintings wall: every painting hangs once, the portfolio in its columns, nothing overlapping", () => {
  const paintings = WORKS.filter((w) => w.group === "paintings");
  const placed = layoutWall(paintings.map((w) => ({ slug: w.slug, aspect: w.media.aspect, wall: w.wall })));
  assert(placed.length === paintings.length && new Set(placed.map((p) => p.slug)).size === placed.length, "each painting placed once");
  for (const slug of PORTFOLIO_COLUMNS.flat()) assert(placed.some((p) => p.slug === slug && p.wall === "portfolio"), `${slug} is on the portfolio wall`);
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      const apart = Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2;
      assert(apart, `${a.slug} overlaps ${b.slug}`);
    }
  const bounds = panBounds(placed);
  for (const p of placed) assert(Math.abs(p.x) <= bounds.x && Math.abs(p.y) <= bounds.y, `${p.slug} can be centred`);
  assert(fadeAt(0, 0, 500, 400).opacity === 1 && fadeAt(2000, 0, 500, 400).opacity === 0, "whole in the middle, gone far off");
});

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

  check("paintwise media: the picture's SAM 2.1 pieces and the back, on disk, far to near, inside the painting", () => {
    assert(media !== null, "no media");
    const toys = media.pieces;
    assert(!!toys, "no pieces (run npm run showcase:assets paintwise)");
    assert(exists(toys.original) && toys.canvas.width > 0 && toys.canvas.height > 0, "the painting");
    assert(toys.objects.length >= 10 && toys.objects.length <= 33, `${toys.objects.length} pieces`);
    assert(toys.objects[0].id === "back", "the back isn't farthest");
    toys.objects.forEach((o, i) => {
      assert(exists(o.src), `missing ${o.src}`);
      const [x, y, w, h] = o.box;
      assert(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1.0001 && y + h <= 1.0001, `${o.id} box ${o.box}`);
      assert(i === 0 || o.depth >= toys.objects[i - 1].depth, `${o.id} out of depth order`);
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

check("image sizes: every image listed has its smaller copies on disk, and every image still exists", () => {
  const file = path.join(process.cwd(), "src/lib/image-sizes.generated.json");
  assert(fs.existsSync(file), "src/lib/image-sizes.generated.json is missing (run node scripts/showcase/image-sizes.mjs)");
  const sizes = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, { w: number; sizes: number[] }>;
  for (const [src, { sizes: widths }] of Object.entries(sizes)) {
    const disk = path.join(process.cwd(), "public", src);
    assert(fs.existsSync(disk), `${src} is listed but gone (rerun image-sizes.mjs)`);
    for (const w of widths) assert(fs.existsSync(disk.replace(/\.webp$/, `.w${w}.webp`)), `${src}: no ${w}px copy (rerun image-sizes.mjs)`);
  }
});

// ---------------------------------------------------------------------------

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`showcase:check: ${failures.length} failed, ${passed} passed`);
  process.exitCode = 1;
} else {
  console.log(`showcase:check: ${passed} passed`);
}
