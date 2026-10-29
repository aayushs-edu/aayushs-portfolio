// Animation (pure): the films float as large screens, the one in front
// playing, the others turned to either side; the Wild West storyboard hangs
// round the first; the 3D models stand at the back until their beat, when
// they come forward in a row. One beat per film, then the models. Idle: the
// films in a staggered row, readable from across the room. The station faces +z.

import { presentDistance, type PathPoint, type Placement, type Vec3, type Viewport } from "../layouts/types";
import { GROUP_TITLES, type PanelPose, type PosedPanel, type PosedStationLayout, type StationBeat } from "../room/types";
import type { Work } from "../works";
import media from "./animation/animation.generated.json";

export interface AnimationPanel extends PosedPanel {
  kind: "film" | "still" | "model";
  /** Films: the muted loop; models: the GLB */
  loop?: string;
  model?: string;
}

export interface AnimationLayout extends PosedStationLayout {
  panels: AnimationPanel[];
}

const FILM_W = 2.2;
const FILM_Y = 1.9;
const STILL_W = 1.0;
const MODEL_BOX = 1.5;
const MODEL_Y = 1.35;
const MODEL_X = 2.4;

const pose = (x: number, y: number, z: number, { ry = 0, s = 1, o = 1 } = {}): PanelPose => ({ position: [x, y, z], rotation: [0, ry, 0], scale: s, opacity: o });

function camera(centre: Vec3, size: [number, number], dir: Vec3, viewport: Viewport): PathPoint {
  const length = Math.hypot(...dir);
  const d = Math.min(8, presentDistance(size[0], size[1], viewport));
  return { position: [0, 1, 2].map((i) => centre[i] + (dir[i] / length) * d) as Vec3, target: centre };
}

export function animationStation(works: readonly Work[], viewport: Viewport): AnimationLayout {
  const films = works.filter((w) => w.kind === "animation");
  const models = works.filter((w) => w.kind === "model");
  const filmBeats = films.length;
  const count = filmBeats + (models.length ? 1 : 0);

  const panels: AnimationPanel[] = [];

  // Films: the presented one in front; its neighbours turned to either side, further ones further back.
  films.forEach((film, i) => {
    const poses: PanelPose[] = [];
    for (let b = 0; b < count; b++) {
      if (b >= filmBeats) {
        poses.push(pose(-2.7 + 2.7 * i, 3.4, -2.0, { s: 0.62, o: 0.9 }));
        continue;
      }
      const j = i - b;
      const side = Math.sign(j);
      if (j === 0) poses.push(pose(0, FILM_Y, 0.5));
      else if (Math.abs(j) === 1) poses.push(pose(side * 2.75, FILM_Y + 0.1, -1.0, { ry: -side * 0.45, s: 0.72 }));
      else poses.push(pose(side * 4.0, FILM_Y + 0.2, -2.2, { ry: -side * 0.6, s: 0.6 }));
    }
    panels.push({
      id: film.slug,
      kind: "film",
      slug: film.slug,
      src: film.media.image,
      loop: film.media.loop,
      width: FILM_W,
      height: FILM_W / film.media.aspect,
      color: film.media.avgColor,
      poses,
      idle: pose(-2.6 + 2.6 * i, FILM_Y, i === 1 ? 0 : -0.4, { ry: i === 0 ? 0.2 : i === 2 ? -0.2 : 0, s: 0.85 }),
    });
  });

  // The Wild West storyboard at its beat: a row above the first film and a column to its left
  // (its right is where the next films wait; below it, its caption).
  const firstFilm = 0;
  media.stills.forEach((still, k) => {
    const height = STILL_W / still.aspect;
    const shown =
      k < 4
        ? pose(-1.8 + 1.2 * k, FILM_Y + 1.12, -0.9, { o: 0.95 })
        : pose(-2.75, FILM_Y + 1.5 * (height + 0.1) - (k - 4) * (height + 0.1) - (height + 0.1) / 2, -0.6, { ry: 0.3, o: 0.95 });
    const gathered = pose(0, FILM_Y, -2.0, { s: 0.4, o: 0 });
    panels.push({
      id: `still:${k}`,
      kind: "still",
      src: still.src,
      width: STILL_W,
      height: STILL_W / still.aspect,
      color: "#2a2a2a",
      poses: Array.from({ length: count }, (_, b) => (b === firstFilm && films.length ? shown : gathered)),
      idle: gathered,
    });
  });

  // Models: at the back, then forward in a row at their beat.
  models.forEach((model, m) => {
    const x = -MODEL_X + MODEL_X * m;
    panels.push({
      id: model.slug,
      kind: "model",
      slug: model.slug,
      src: model.media.image,
      model: model.media.model,
      width: MODEL_BOX,
      height: MODEL_BOX,
      color: model.media.avgColor,
      poses: Array.from({ length: count }, (_, b) => (b === filmBeats ? pose(x, MODEL_Y, 0.4) : pose(x, 0.9, -2.8, { s: 0.65 }))),
      idle: pose(x, 0.9, -2.6, { s: 0.7 }),
    });
  });

  const beats: StationBeat[] = [
    ...films.map((film) => ({ key: `work:${film.slug}`, camera: camera([0, FILM_Y, 0.5], [2.6, 1.6], [0, 0, 1], viewport) })),
    ...(models.length
      ? [{ key: "animation:models", slugs: models.map((m) => m.slug), camera: camera([0, MODEL_Y + 0.05, 0.4], [2 * MODEL_X + MODEL_BOX + 0.4, 1.6], [0, 0.12, 1], viewport) }]
      : []),
  ];

  // Where each work is when presented: the camera flies in to it there.
  const placements: Placement[] = panels.flatMap((p) => {
    if (!p.slug) return [];
    const beat = p.kind === "model" ? filmBeats : films.findIndex((f) => f.slug === p.slug);
    const at = p.poses[beat];
    return [{ slug: p.slug, position: [...at.position], rotationY: at.rotation[1], width: p.width * at.scale, height: p.height * at.scale }];
  });
  const radius = Math.max(...panels.flatMap((p) => [...p.poses, p.idle].map((q) => Math.hypot(q.position[0], q.position[2]) + (p.width * q.scale) / 2))) + 0.2;

  return { id: "animation", title: GROUP_TITLES.animation, beats, works: placements, radius, panels, labels: [] };
}
