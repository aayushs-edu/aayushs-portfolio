// The paintings: one big salon wall (pure). The old /paintings wall's three
// columns hang large in the middle, Childhood Toys at the heart; the early
// work hangs smaller round the edges, the left edge starting with "Where it
// all started". Six beats pan left to right: the whole wall, the left edge,
// each column of the core, the right edge. At a beat its paintings step
// forward and the rest ease back. Idle (the camera elsewhere) the wall is
// compact, still readable from across the room. The station faces +z.

import type { PathPoint, Placement, Vec3, Viewport } from "../layouts/types";
import { GROUP_TITLES, type PanelPose, type PosedPanel, type PosedStationLayout, type StationBeat } from "../room/types";
import type { Work } from "../works";

export interface SalonPanel extends PosedPanel {
  slug: string;
  /** A photo of it being held, shown on its back */
  held?: { src: string; aspect: number };
  /** Early work arrives a moment after the portfolio */
  early: boolean;
}

export interface SalonLayout extends PosedStationLayout {
  panels: SalonPanel[];
}

const DEG = Math.PI / 180;

const CORE = {
  columns: [
    ["snorkeling-hawaii", "snowboarding"],
    ["soccer-penalty", "childhood-toys", "taj-mahal"],
    ["safari-kid", "red-dead-redemption"],
  ],
  height: 0.85,
  heart: { slug: "childhood-toys", height: 1.05 },
  gap: 0.32,
  rowGap: 0.25,
  midY: 2.0,
  sideZ: 0.3,
  sideTurn: 10 * DEG,
};

const EDGE = {
  origin: "where-it-all-started",
  height: 0.58,
  rows: 3,
  /** Between its two columns, and from the core (m) */
  gap: 0.22,
  rowGap: 0.2,
  fromCore: 0.4,
  z: 0.55,
  turn: 22 * DEG,
};

/** Presented paintings come this far forward (m); the others go back a little. */
const STEP = 0.4;
const BACK = 0.08;
/** At most, how much of the view a beat's paintings fill (height, width), and how far the camera stands back (m). */
const FILL = { height: 0.82, width: 0.78, max: 8 };
const EYE_Y: [number, number] = [1.2, 2.4];

interface Hung {
  work: Work;
  position: Vec3;
  rotationY: number;
  width: number;
  height: number;
  /** 0: the left edge … 4: the right edge */
  group: number;
}

const normalOf = (ry: number): Vec3 => [Math.sin(ry), 0, Math.cos(ry)];
const along = (p: Vec3, n: Vec3, d: number): Vec3 => [p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d];

/** Stack a column's paintings top to bottom, centred at `midY`. */
function stack<T extends { height: number }>(items: T[], midY: number, gap: number): number[] {
  const total = items.reduce((sum, i) => sum + i.height, 0) + gap * Math.max(0, items.length - 1);
  let top = midY + total / 2;
  return items.map((i) => {
    const y = top - i.height / 2;
    top -= i.height + gap;
    return y;
  });
}

function distanceFor(width: number, height: number, viewport: Viewport): number {
  const tanV = Math.tan(20 * DEG);
  const tanH = tanV * (viewport.width / Math.max(1, viewport.height));
  return Math.min(FILL.max, Math.max(1.6, height / (FILL.height * 2 * tanV), width / (FILL.width * 2 * tanH)));
}

export function salonStation(works: readonly Work[], viewport: Viewport): SalonLayout {
  const bySlug = new Map(works.map((w) => [w.slug, w]));
  const core = CORE.columns.map((slugs) => slugs.flatMap((slug) => bySlug.get(slug) ?? []));
  const placed = new Set(core.flat().map((w) => w.slug));
  for (const work of works) {
    if (placed.has(work.slug) || work.wall === "early" || work.slug === EDGE.origin) continue;
    (core[0].length <= core[2].length ? core[0] : core[2]).push(work);
    placed.add(work.slug);
  }
  const early = works.filter((w) => !placed.has(w.slug) && w.slug !== EDGE.origin).sort((a, b) => (a.year ?? "").localeCompare(b.year ?? ""));
  const origin = bySlug.get(EDGE.origin);
  const leftEdge = [...(origin ? [origin] : []), ...early.slice(0, 2 * EDGE.rows - (origin ? 1 : 0))];
  const rightEdge = early.slice(leftEdge.length - (origin ? 1 : 0));

  const hung: Hung[] = [];

  // The core: three columns.
  const coreSize = (w: Work) => {
    const height = w.slug === CORE.heart.slug ? CORE.heart.height : CORE.height;
    return { width: height * w.media.aspect, height };
  };
  const widths = core.map((column) => Math.max(0, ...column.map((w) => coreSize(w).width)));
  const xs = [-(widths[1] / 2 + CORE.gap + widths[0] / 2), 0, widths[1] / 2 + CORE.gap + widths[2] / 2];
  core.forEach((column, c) => {
    const sizes = column.map(coreSize);
    const ys = stack(sizes, CORE.midY, CORE.rowGap);
    const side = c - 1;
    column.forEach((work, i) =>
      hung.push({ work, position: [xs[c], ys[i], side === 0 ? 0 : CORE.sideZ], rotationY: -side * CORE.sideTurn, ...sizes[i], group: c + 1 }),
    );
  });

  // The edges: two small columns each, turned in toward the middle.
  const edge = (items: Work[], side: -1 | 1, group: number) => {
    const size = (w: Work) => ({ width: EDGE.height * w.media.aspect, height: EDGE.height });
    // Fill from the outside in on the left, the inside out on the right: the early work reads left to right.
    const columns = [items.slice(0, EDGE.rows), items.slice(EDGE.rows)];
    const [outer, inner] = side < 0 ? columns : [columns[1], columns[0]];
    const innerW = Math.max(0, ...inner.map((w) => size(w).width));
    const outerW = Math.max(0, ...outer.map((w) => size(w).width));
    const coreEdge = side < 0 ? xs[0] - widths[0] / 2 : xs[2] + widths[2] / 2;
    const origin: Vec3 = [coreEdge + side * EDGE.fromCore, 0, EDGE.z];
    const yaw = -side * EDGE.turn;
    const place = (column: Work[], lx: number) => {
      const sizes = column.map(size);
      const ys = stack(sizes, CORE.midY, EDGE.rowGap);
      column.forEach((work, i) =>
        hung.push({
          work,
          position: [origin[0] + lx * Math.cos(yaw), ys[i], origin[2] - lx * Math.sin(yaw)],
          rotationY: yaw,
          ...sizes[i],
          group,
        }),
      );
    };
    place(inner, side * (innerW / 2));
    place(outer, side * (innerW + EDGE.gap + outerW / 2));
  };
  edge(leftEdge, -1, 0);
  edge(rightEdge, 1, 4);

  // Beats: the whole wall, then left to right.
  const order = [0, 1, 2, 3, 4];
  const names = ["beginnings", "left", "centre", "right", "early"];
  const restOf = (h: Hung): PanelPose => ({ position: h.position, rotation: [0, h.rotationY, 0], scale: 1, opacity: 1 });
  const presentedOf = (h: Hung): Vec3 => along(h.position, normalOf(h.rotationY), STEP);

  const camera = (members: Hung[], presented: boolean): PathPoint => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const centre: Vec3 = [0, 0, 0];
    const normal: Vec3 = [0, 0, 0];
    for (const h of members) {
      const p = presented ? presentedOf(h) : h.position;
      minX = Math.min(minX, p[0] - h.width / 2);
      maxX = Math.max(maxX, p[0] + h.width / 2);
      minY = Math.min(minY, p[1] - h.height / 2);
      maxY = Math.max(maxY, p[1] + h.height / 2);
      centre[2] += p[2] / members.length;
      const n = normalOf(h.rotationY);
      normal[0] += n[0];
      normal[2] += n[2];
    }
    centre[0] = (minX + maxX) / 2;
    centre[1] = (minY + maxY) / 2;
    const length = Math.hypot(normal[0], normal[2]) || 1;
    const d = distanceFor(maxX - minX, maxY - minY, viewport);
    const y = Math.min(EYE_Y[1], Math.max(EYE_Y[0], centre[1]));
    return { position: [centre[0] + (normal[0] / length) * d, y, centre[2] + (normal[2] / length) * d], target: centre };
  };

  const beats: StationBeat[] = [
    { key: "paintings:wall", camera: camera(hung, false) },
    ...order.map((g) => {
      const members = hung.filter((h) => h.group === g);
      return { key: `paintings:${names[g]}`, slugs: members.map((h) => h.work.slug), camera: camera(members, true) };
    }),
  ].filter((beat) => !("slugs" in beat) || (beat.slugs?.length ?? 0) > 0);

  const panels: SalonPanel[] = hung.map((h) => {
    const rest = restOf(h);
    const n = normalOf(h.rotationY);
    return {
      id: h.work.slug,
      kind: "painting",
      slug: h.work.slug,
      src: h.work.media.image,
      width: h.width,
      height: h.height,
      color: h.work.media.avgColor,
      held: h.work.media.held,
      early: h.work.wall === "early",
      poses: beats.map((beat) => {
        if (!beat.slugs) return rest;
        const shown = beat.slugs.includes(h.work.slug);
        return { ...rest, position: along(h.position, n, shown ? STEP : -BACK) };
      }),
      idle: { position: [h.position[0] * 0.82, h.position[1] * 0.9 + 0.2, h.position[2] - 0.3], rotation: [0, h.rotationY, 0], scale: 0.85, opacity: 1 },
    };
  });

  const placements: Placement[] = hung.map((h) => ({ slug: h.work.slug, position: presentedOf(h), rotationY: h.rotationY, width: h.width, height: h.height }));
  const radius = Math.max(...panels.flatMap((p) => [...p.poses, p.idle].map((q) => Math.hypot(q.position[0], q.position[2]) + (p.width * q.scale) / 2))) + 0.2;

  return { id: "paintings", title: GROUP_TITLES.paintings, beats, works: placements, radius, panels, labels: [] };
}
