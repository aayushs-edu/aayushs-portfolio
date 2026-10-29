// Paintwise, at the centre of the room: the exploded painting (pure).
//
// Five beats. (0) The jug still life hangs as a canvas, the pipeline figure
// beside it. (1) It separates into its pipeline's layers, spaced out in
// depth. (2) The masks layer breaks into one shape per object, each pushed
// out to its own depth. (3) The grapefruit's real steps play as a flipbook.
// (4) The figure comes forward, the other still lifes round it. Idle (the
// camera elsewhere): the layers half-exploded, read as a sculpture.
//
// The station's frame faces +z, toward the entrance.

import { presentDistance, type PathPoint, type Placement, type Vec3, type Viewport } from "../../layouts/types";
import { GROUP_TITLES, type LabelSpec, type PanelPose, type StationBeat, type StationLayout } from "../../room/types";
import media from "./paintwise.generated.json";

export type PaintwiseMedia = typeof media;

export interface PaintwisePanel {
  id: string;
  kind: "canvas" | "layer" | "object" | "flipbook" | "figure" | "still";
  /** Its image (null: a flat colour) */
  src: string | null;
  /** Size at scale 1 (m) */
  width: number;
  height: number;
  /** Shown until the image is in, and behind transparent parts */
  color: string;
  /** One per beat */
  poses: PanelPose[];
  idle: PanelPose;
}

export interface PaintwiseLayout extends StationLayout {
  panels: PaintwisePanel[];
  labels: LabelSpec[];
  /** Where the canvas hangs at the first beat: what the camera flies in to */
  detailPlacement: Placement;
  steps: PaintwiseMedia["steps"];
  figure: PaintwiseMedia["figure"];
}

/** The canvas (m) and the height everything is centred at. */
const CANVAS_W = 1.9;
const Y0 = 1.75;
const CANVAS_H = (CANVAS_W * media.canvas.height) / media.canvas.width;
/** At the most, the camera stands this far from what it presents (narrow viewports would push it out of the room). */
const MAX_DISTANCE = 8;

export const LAYER_COPY: Record<string, { title: string; line: string }> = {
  original: { title: "Reference", line: "the still life to learn from" },
  masks: { title: "SAM 2.1", line: "segments every object" },
  depth: { title: "Depth Anything V2", line: "how far away each part is" },
  blockin: { title: "Value block-in", line: "one flat value per region" },
  edges: { title: "PiDiNet", line: "where the edges are" },
  sketch: { title: "Pencil sketch", line: "the drawing underneath, from the edges" },
};

const PITCH = "Teaches you to paint a picture the way an artist would, one step at a time.";
const ORDER = ["background", "table", "focal objects", "supporting", "small details", "refinements"];

const pose = (x: number, y: number, z: number, o = 1, { ry = 0, s = 1, rx = 0 } = {}): PanelPose => ({
  position: [x, y, z],
  rotation: [rx, ry, 0],
  scale: s,
  opacity: o,
});

/** A point on a panel that has been turned by `ry` and scaled by `s` about its centre. */
const onPanel = (centre: Vec3, ry: number, s: number, local: Vec3): Vec3 => [
  centre[0] + (local[0] * Math.cos(ry) + local[2] * Math.sin(ry)) * s,
  centre[1] + local[1] * s,
  centre[2] + (-local[0] * Math.sin(ry) + local[2] * Math.cos(ry)) * s,
];

function camera(centre: Vec3, size: [number, number], dir: Vec3, viewport: Viewport): PathPoint {
  const length = Math.hypot(...dir);
  const distance = Math.min(MAX_DISTANCE, presentDistance(size[0], size[1], viewport));
  return { position: [0, 1, 2].map((i) => centre[i] + (dir[i] / length) * distance) as Vec3, target: centre };
}

export function paintwiseStation(viewport: Viewport): PaintwiseLayout {
  const panels: PaintwisePanel[] = [];

  // The canvas and the five layers behind it (k = 0 is the canvas).
  const stackAt3 = { at: [-2.9, Y0 - 0.1, -1.0] as Vec3, ry: 0.55, s: 0.55 };
  const stackAt4 = { at: [3.9, Y0, -1.6] as Vec3, ry: -0.5, s: 0.55 };
  media.layers.forEach((layer, k) => {
    const behind = (stack: typeof stackAt3, o: number) => {
      const [x, y, z] = onPanel(stack.at, stack.ry, stack.s, [0, 0, -0.012 * k]);
      return pose(x, y, z, o, { ry: stack.ry, s: stack.s });
    };
    panels.push({
      id: k === 0 ? "canvas" : `layer:${layer.id}`,
      kind: k === 0 ? "canvas" : "layer",
      src: layer.src,
      width: CANVAS_W,
      height: CANVAS_H,
      color: k === 0 ? "#2c2420" : "#1d1d1d",
      poses: [
        pose(0, Y0, -0.012 * k, k === 0 ? 1 : 0),
        pose(0.32 * k, Y0 + 0.06 * k, -0.75 * k),
        pose(0.32 * k - 0.6, Y0 + 0.06 * k, -0.75 * k - 1.2, layer.id === "masks" ? 0 : 0.25),
        behind(stackAt3, k === 0 ? 1 : 0),
        behind(stackAt4, k === 0 ? 1 : 0),
      ],
      idle: pose(0.18 * k - 0.45, Y0, 1.0 - 0.4 * k),
    });
  });

  // The masks, one shape per object: on the masks layer, then out at their depths, then home to the canvas.
  const masksK = media.layers.findIndex((l) => l.id === "masks");
  for (const object of media.objects) {
    const [bx, by, bw, bh] = object.box;
    const x = (bx + bw / 2 - 0.5) * CANVAS_W;
    const y = Y0 + (0.5 - (by + bh / 2)) * CANVAS_H;
    const home = (stack: typeof stackAt3) => {
      const p = onPanel(stack.at, stack.ry, stack.s, [x, y - Y0, 0.004]);
      return pose(p[0], p[1], p[2], 0, { ry: stack.ry, s: stack.s });
    };
    panels.push({
      id: `obj:${object.id}`,
      kind: "object",
      src: object.src,
      width: bw * CANVAS_W,
      height: bh * CANVAS_H,
      color: object.color,
      poses: [
        pose(x, y, -0.012 * masksK + 0.004, 0),
        pose(x + 0.32 * masksK, y + 0.06 * masksK, -0.75 * masksK + 0.004, 0),
        pose(x * 1.15, y, (object.depth - 0.5) * 2.4 + 0.3),
        home(stackAt3),
        home(stackAt4),
      ],
      idle: pose(x + 0.18 * masksK - 0.45, y, 1.0 - 0.4 * masksK + 0.004, 0),
    });
  }

  // The steps, as a flipbook.
  const steps = media.steps;
  const parked = pose(-2.5, Y0, -1.2, 0, { ry: 0.5, s: 0.6 });
  panels.push({
    id: "flipbook",
    kind: "flipbook",
    src: steps.atlas,
    width: 2.3,
    height: 2.3 / steps.aspect,
    color: "#b48a5a",
    poses: [parked, parked, parked, pose(0, Y0, 0.4), pose(-3.9, Y0, -1.6, 1, { ry: 0.5, s: 0.55 })],
    idle: parked,
  });

  // The figure: a preview beside the canvas, then front and centre.
  const FIGURE_W = 1.5;
  const away = pose(2.6, Y0, -1.5, 0, { ry: -0.45, s: 0.8 });
  panels.push({
    id: "figure",
    kind: "figure",
    src: media.figure.src,
    width: FIGURE_W,
    height: FIGURE_W / media.figure.aspect,
    color: "#ffffff",
    poses: [pose(2.25, Y0 - 0.1, -0.5, 1, { ry: -0.45 }), away, away, away, pose(0, Y0, 0.7, 1, { s: 3.1 / FIGURE_W })],
    idle: pose(2.25, Y0, -0.5, 0),
  });

  // The other still lifes, on an ellipse round the figure at the last beat.
  const STILL = 0.8;
  const angles = [30, 70, 110, 150, 210, 250, 290, 330];
  media.stillLifes.forEach((still, i) => {
    const a = (angles[i % angles.length] * Math.PI) / 180;
    const gathered = pose(0, Y0, -1.4, 0, { s: 0.5 });
    panels.push({
      id: `still:${i}`,
      kind: "still",
      src: still.src,
      width: still.aspect >= 1 ? STILL : STILL * still.aspect,
      height: still.aspect >= 1 ? STILL / still.aspect : STILL,
      color: "#3a3a3a",
      poses: [gathered, gathered, gathered, gathered, pose(2.9 * Math.cos(a), Y0 + 1.35 * Math.sin(a), -1.2, 1, { ry: -0.25 * Math.cos(a) })],
      idle: gathered,
    });
  });

  const beats: StationBeat[] = [
    { key: "work:paintwise", camera: camera([0.55, Y0, -0.1], [3.8, CANVAS_H + 0.2], [0.1, 0, 1], viewport) },
    { key: "paintwise:explode", camera: camera([0.8, Y0 + 0.15, -1.9], [3.4, 2.2], [0.75, 0.12, 0.65], viewport) },
    { key: "paintwise:masks", camera: camera([0, Y0, 0], [2.6, 2.1], [-0.68, 0.1, 0.73], viewport) },
    { key: "paintwise:steps", camera: camera([-0.35, Y0, 0.4], [3.2, 1.7], [0, 0, 1], viewport) },
    { key: "paintwise:pipeline", camera: camera([0, Y0, 0.7], [3.4, 1.8], [0, 0, 1], viewport) },
  ];

  const labels: LabelSpec[] = [
    { id: "pw:title", kind: "title", panel: "canvas", anchor: [-0.5, 0.5], align: "above", beats: [0, 0], title: GROUP_TITLES.paintwise, meta: PITCH },
    // Layer tags alternate above and below the fanned-out layers, where they sit on the dark, not on the next image.
    ...media.layers.map(
      (layer, k): LabelSpec => ({
        id: `pw:tag:${layer.id}`,
        kind: "tag",
        panel: k === 0 ? "canvas" : `layer:${layer.id}`,
        anchor: [0, k % 2 === 0 ? 0.5 : -0.5],
        align: k % 2 === 0 ? "above" : "below",
        beats: [1, 1],
        title: LAYER_COPY[layer.id]?.title ?? layer.id,
        meta: LAYER_COPY[layer.id]?.line,
      }),
    ),
    {
      id: "pw:tag:objects",
      kind: "tag",
      point: [0, Y0 + CANVAS_H / 2 + 0.45, 0.6],
      anchor: [0, 0],
      align: "above",
      beats: [2, 2],
      title: "SAM 2.1 × Depth Anything V2",
      meta: "every mask, pushed out to its depth",
    },
    { id: "pw:step", kind: "step", panel: "flipbook", anchor: [0, -0.5], align: "below", beats: [3, 3], title: "Two-phase painter" },
    { id: "pw:chips", kind: "chips", panel: "flipbook", anchor: [-0.5, 0], align: "left", beats: [3, 3], title: "Painting order", meta: ORDER.join("|") },
    { id: "pw:figure", kind: "figure", panel: "figure", anchor: [0, -0.5], align: "below", beats: [4, 4], title: "Figure 1 · the Paintwise pipeline", meta: "Click to enlarge" },
    { id: "pw:buildlog", kind: "link", panel: "figure", anchor: [0.5, -0.5], align: "below", beats: [4, 4], title: "Read the build log →", href: "/paintwise" },
  ];

  const canvas = panels[0];
  const detailPlacement: Placement = {
    slug: "paintwise",
    position: [...canvas.poses[0].position],
    rotationY: canvas.poses[0].rotation[1],
    width: canvas.width * canvas.poses[0].scale,
    height: canvas.height * canvas.poses[0].scale,
  };
  const radius = Math.max(...panels.flatMap((p) => [...p.poses, p.idle].map((q) => Math.hypot(q.position[0], q.position[2]) + (p.width * q.scale) / 2)));

  return {
    id: "paintwise",
    title: GROUP_TITLES.paintwise,
    beats,
    works: [detailPlacement],
    radius,
    panels,
    labels,
    detailPlacement,
    steps,
    figure: media.figure,
  };
}
