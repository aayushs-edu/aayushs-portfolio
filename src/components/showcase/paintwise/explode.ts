// Paintwise's exploded still life on a CSS 3D stage (pure; checked by
// showcase:check). The jug still life is a stack of its pipeline's layers.
// At rest it reads as the canvas. "layers" fans the six layers out in depth,
// seen from the right, with a tag on each. "masks" pushes every object of the
// masks layer out to its own depth, seen from the left. The spacing and the
// angles are the old 3D room's (its canvas was 1.9 m wide).
//
// Items are placed in canvas widths (the jug is 1 wide), y down, z toward the
// viewer. Each state also gets a rig: the turn it's seen at, and the scale and
// offset that fit it in the stage (in stage widths, from the stage's centre).
// The stage's CSS uses 1 canvas width = 100cqw before the rig's scale.

import media from "../stations/paintwise/paintwise.generated.json";

export type ExplodeState = "rest" | "layers" | "masks";
export const EXPLODE_STATES: readonly ExplodeState[] = ["rest", "layers", "masks"];

export type Vec3 = [number, number, number];

export const STAGE = {
  /** Height / width. */
  aspect: 0.66,
  /** CSS perspective, in stage widths. */
  perspective: 1.8,
  /** How much of the stage each state may fill (its wider share of width or height); the rest is room for the tags. */
  fill: { rest: 0.86, layers: 0.92, masks: 0.9 } as Record<ExplodeState, number>,
  /** The turn each state is seen at (degrees): rotateX, rotateY. */
  turn: { rest: [0, 0], layers: [-7, -49], masks: [-6, 43] } as Record<ExplodeState, [number, number]>,
} as const;

/** Each layer's tag: the model, and what it sees. */
export const LAYER_COPY: Record<string, { title: string; line: string }> = {
  original: { title: "Reference", line: "the still life to learn from" },
  masks: { title: "SAM 2.1", line: "segments every object" },
  depth: { title: "Depth Anything V2", line: "how far away each part is" },
  blockin: { title: "Value block-in", line: "one flat value per region" },
  edges: { title: "PiDiNet", line: "where the edges are" },
  sketch: { title: "Pencil sketch", line: "the drawing underneath, from the edges" },
};

export const MASKS_COPY = { title: "SAM 2.1 × Depth Anything V2", line: "every mask, pushed out to its depth" };

export interface Pose {
  x: number;
  y: number;
  z: number;
  opacity: number;
}

export interface ExplodeItem {
  id: string;
  kind: "layer" | "object";
  src: string;
  /** Canvas widths */
  width: number;
  height: number;
  poses: Record<ExplodeState, Pose>;
}

export interface Rig {
  /** Turned about this point (canvas widths) */
  centre: Vec3;
  /** rotateX, rotateY (degrees) */
  turn: readonly [number, number];
  scale: number;
  /** Stage widths from the stage's centre */
  offset: [number, number];
}

export interface Tag {
  id: string;
  state: ExplodeState;
  title: string;
  line: string;
  /** Where it pins, in stage widths from the stage's top left */
  x: number;
  y: number;
  /** Above or below the point */
  align: "above" | "below";
}

/** The room's metres, in canvas widths. */
const M = 1 / 1.9;
/** The canvas's height, in canvas widths. */
export const CANVAS_H = media.canvas.height / media.canvas.width;
/** Fanned out, each layer sits this much further right, up and back than the one before it. */
const SPREAD = { x: 0.32 * M, y: -0.06 * M, z: -0.75 * M };
/** At rest, the layers stack this close behind the canvas. */
const STACK = 0.012 * M;
/** The objects sit just in front of the masks layer until they're pushed out. */
const LIFT = 0.004 * M;

const pose = (x: number, y: number, z: number, opacity: number): Pose => ({ x, y, z, opacity });

const MASKS_K = media.layers.findIndex((l) => l.id === "masks");

const LAYERS: ExplodeItem[] = media.layers.map((layer, k) => ({
  id: `layer:${layer.id}`,
  kind: "layer",
  src: layer.src,
  width: 1,
  height: CANVAS_H,
  poses: {
    rest: pose(0, 0, -STACK * k, k === 0 ? 1 : 0),
    layers: pose(SPREAD.x * k, SPREAD.y * k, SPREAD.z * k, 1),
    // Pushed back and dimmed, so the masks in front read; the masks layer itself gives way to its objects.
    masks: pose(SPREAD.x * k - 0.6 * M, SPREAD.y * k, SPREAD.z * k - 1.2 * M, layer.id === "masks" ? 0 : 0.25),
  },
}));

const OBJECTS: ExplodeItem[] = media.objects.map((object) => {
  const [bx, by, bw, bh] = object.box;
  const x = bx + bw / 2 - 0.5;
  const y = (by + bh / 2 - 0.5) * CANVAS_H;
  return {
    id: `object:${object.id}`,
    kind: "object",
    src: object.src,
    width: bw,
    height: bh * CANVAS_H,
    poses: {
      rest: pose(x, y, -STACK * MASKS_K + LIFT, 0),
      layers: pose(x + SPREAD.x * MASKS_K, y + SPREAD.y * MASKS_K, SPREAD.z * MASKS_K + LIFT, 0),
      masks: pose(x * 1.15, y, ((object.depth - 0.5) * 2.4 + 0.3) * M, 1),
    },
  };
});

/** Back to front within each state doesn't matter (the stage depth-sorts); layers first, then the objects. */
export const ITEMS: ExplodeItem[] = [...LAYERS, ...OBJECTS];

// ---- Projection: the same maths as the browser's CSS 3D -------------------------

const rad = (deg: number) => (deg * Math.PI) / 180;

/** rotateX(ax) rotateY(ay) applied to p (CSS order: rotateY first). */
function turnPoint(p: Vec3, [ax, ay]: readonly [number, number]): Vec3 {
  const [x, y, z] = p;
  const cy = Math.cos(rad(ay));
  const sy = Math.sin(rad(ay));
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(rad(ax));
  const sx = Math.sin(rad(ax));
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

/** A point of the rig (canvas widths) on the stage, before perspective (stage widths from its centre). */
export function toStage(p: Vec3, rig: Rig): Vec3 {
  const q = turnPoint([p[0] - rig.centre[0], p[1] - rig.centre[1], p[2] - rig.centre[2]], rig.turn);
  return [rig.scale * q[0] + rig.offset[0], rig.scale * q[1] + rig.offset[1], rig.scale * q[2]];
}

/** Where a point of the rig lands on screen, in stage widths from the stage's top left. */
export function project(p: Vec3, rig: Rig): [number, number] {
  const [x, y, z] = toStage(p, rig);
  const k = STAGE.perspective / (STAGE.perspective - z);
  return [0.5 + x * k, STAGE.aspect / 2 + y * k];
}

/** An item's four corners in its pose. */
export function corners(item: ExplodeItem, state: ExplodeState): Vec3[] {
  const { x, y, z } = item.poses[state];
  const w = item.width / 2;
  const h = item.height / 2;
  return [
    [x - w, y - h, z],
    [x + w, y - h, z],
    [x + w, y + h, z],
    [x - w, y + h, z],
  ];
}

const visible = (item: ExplodeItem, state: ExplodeState) => item.poses[state].opacity > 0.01;

/** Turns the state's composition and fits it in the stage, centred, filling STAGE.fill of it. */
function fitRig(state: ExplodeState): Rig {
  const points = ITEMS.filter((item) => visible(item, state)).flatMap((item) => corners(item, state));
  const lo: Vec3 = [Infinity, Infinity, Infinity];
  const hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], p[i]);
      hi[i] = Math.max(hi[i], p[i]);
    }
  }
  const rig: Rig = { centre: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], turn: STAGE.turn[state], scale: 0.5, offset: [0, 0] };
  const box = () => {
    const xy = points.map((p) => project(p, rig));
    const xs = xy.map((p) => p[0]);
    const ys = xy.map((p) => p[1]);
    return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  };
  // Perspective makes size and position depend on each other a little: settle both.
  for (let i = 0; i < 12; i++) {
    const [x0, x1, y0, y1] = box();
    rig.scale *= STAGE.fill[state] * Math.min(1 / (x1 - x0), STAGE.aspect / (y1 - y0));
    const [a0, a1, b0, b1] = box();
    rig.offset = [rig.offset[0] - ((a0 + a1) / 2 - 0.5), rig.offset[1] - ((b0 + b1) / 2 - STAGE.aspect / 2)];
  }
  return rig;
}

export const RIGS: Record<ExplodeState, Rig> = { rest: fitRig("rest"), layers: fitRig("layers"), masks: fitRig("masks") };

/** The tags: one per layer when they fan out (alternately above and below, on the dark between them), one for the masks. */
export const TAGS: Tag[] = [
  ...LAYERS.map((layer, k): Tag => {
    const { x, y, z } = layer.poses.layers;
    const above = k % 2 === 0;
    const [px, py] = project([x, y + (above ? -1 : 1) * (layer.height / 2), z], RIGS.layers);
    const id = layer.id.slice("layer:".length);
    return { id: `tag:${id}`, state: "layers", ...LAYER_COPY[id], x: px, y: py, align: above ? "above" : "below" };
  }),
  (() => {
    const [px, py] = project([0, -(CANVAS_H / 2 + 0.45 * M), 0.6 * M], RIGS.masks);
    return { id: "tag:objects", state: "masks" as const, ...MASKS_COPY, x: px, y: py, align: "above" as const };
  })(),
];
