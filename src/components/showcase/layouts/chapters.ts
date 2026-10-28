// Layout "chapters": one space per medium, one after another. Each opens with
// its title, then hangs its works along a gentle curve; the camera sweeps along
// the inside of the curve, looking out at each work in turn. Between chapters a
// short straight passage runs through a wall split on a fluid line, which opens
// as the camera nears (the hero's line opening again).

import type { Work, WorkKind } from "../works";
import {
  AHEAD,
  boundsOf,
  centreY,
  EYE,
  pathT,
  presentDistance,
  sizeOf,
  yawFacing,
  type LayoutFn,
  type Passage,
  type PathPoint,
  type Placement,
  type Title,
  type Vec3,
  type WorkGroup,
} from "./types";

/** The chapters, in order, and which floor each stands on. */
export const CHAPTERS: { kind: WorkKind; title: string; side: "art" | "code" }[] = [
  { kind: "painting", title: "Paintings", side: "art" },
  { kind: "project", title: "Projects", side: "code" },
  { kind: "game", title: "Games", side: "code" },
  { kind: "animation", title: "Animation", side: "art" },
  { kind: "hackathon", title: "Hackathons", side: "code" },
];

/** The title floats this far ahead of the chapter's start; the camera presents it from this far in (m). */
const TITLE_AHEAD = 6;
const TITLE_CAM = 1.2;
const TITLE_LIFT = 0.3;
/** Where the curve starts, after the chapter's start (m). */
const ARC_START = 4.5;
/** Before the first work and after the last, the curve runs on this far (rad). */
const LEAD_ANGLE = 0.25;
/** The curve turns at most this far in a chapter, and at most this far per work (rad). */
const MAX_SWEEP = (100 * Math.PI) / 180;
const MAX_STEP = 0.3;
/** Space between neighbouring works, edge to edge (m). */
const GAP = 1.3;
/** The passage between chapters, and the run-out after the last one (m). */
const PASSAGE = 7;
const TAIL = 5;

type V2 = [number, number];
const add = (a: V2, b: V2, k = 1): V2 => [a[0] + b[0] * k, a[1] + b[1] * k];
const scale = (a: V2, k: number): V2 => [a[0] * k, a[1] * k];
const norm = (a: V2): V2 => scale(a, 1 / Math.hypot(a[0], a[1]));
/** Left and right of a heading (x right, z toward the viewer: facing −z, left is −x). */
const leftOf = (h: V2): V2 => [h[1], -h[0]];
const rightOf = (h: V2): V2 => [-h[1], h[0]];
const at3 = (p: V2, y: number): Vec3 => [p[0], y, p[1]];
const ahead = (p: V2, h: V2): PathPoint => ({ position: at3(p, EYE), target: at3(add(p, h, AHEAD), EYE - 0.1) });

export const chaptersLayout: LayoutFn = (works, viewport) => {
  const chapters = CHAPTERS.map((chapter) => ({ ...chapter, works: works.filter((w) => w.kind === chapter.kind) })).filter((c) => c.works.length);

  let start: V2 = [0, 0];
  let heading: V2 = [0, -1];
  const cameraPath: PathPoint[] = [ahead(start, heading)];
  const placements: Placement[] = [];
  const stopIndex = new Map<string, number>();
  const titleIndex: number[] = [];
  const passageIndex: number[] = [];
  const titles: Omit<Title, "t">[] = [];
  const passages: Omit<Passage, "t">[] = [];
  const planes: [number, number, number, number][] = [];
  const groups: WorkGroup[] = [];

  chapters.forEach((chapter, k) => {
    const h = heading;
    // The title, presented from just inside the chapter.
    const titleAt = add(start, h, TITLE_AHEAD);
    titleIndex.push(cameraPath.length);
    cameraPath.push({ position: at3(add(start, h, TITLE_CAM), EYE), target: at3(titleAt, EYE + TITLE_LIFT) });
    titles.push({ key: chapter.kind, text: chapter.title, position: at3(titleAt, EYE + TITLE_LIFT) });

    // The curve. Even chapters (paintings first) hang their works on the left, as in the hero.
    const out0 = k % 2 === 0 ? leftOf(h) : rightOf(h);
    const items = chapter.works.map((work) => {
      const size = sizeOf(work);
      return { work, size, distance: presentDistance(size.width, size.height, viewport) };
    });
    const n = items.length;
    const meanDistance = items.reduce((s, i) => s + i.distance, 0) / n;
    const widest = Math.max(...items.map((i) => i.size.width));
    const step = n > 1 ? Math.min(MAX_STEP, (MAX_SWEEP - 2 * LEAD_ANGLE) / (n - 1)) : 0;
    const radius = Math.max(2.5, (n > 1 ? (widest + GAP) / step : 6) - meanDistance);
    const centre = add(add(start, h, ARC_START), out0, -radius);
    const outward = (phi: number): V2 => add(scale(out0, Math.cos(phi)), h, Math.sin(phi));
    const onCurve = (phi: number, r: number) => add(centre, outward(phi), r);

    items.forEach((item, i) => {
      const phi = LEAD_ANGLE + i * step;
      const eye = at3(onCurve(phi, radius), EYE);
      const position = at3(onCurve(phi, radius + item.distance), centreY(item.work));
      placements.push({ slug: item.work.slug, position, rotationY: yawFacing(position, eye), width: item.size.width, height: item.size.height });
      stopIndex.set(item.work.slug, cameraPath.length);
      cameraPath.push({ position: eye, target: position });
      if (i < n - 1) {
        const mid = phi + step / 2;
        cameraPath.push({ position: at3(onCurve(mid, radius), EYE), target: at3(onCurve(mid, radius + meanDistance), EYE) });
      }
    });

    const phiEnd = 2 * LEAD_ANGLE + (n - 1) * step;
    const exit = onCurve(phiEnd, radius);
    const exitHeading = norm(add(scale(out0, -Math.sin(phiEnd)), h, Math.cos(phiEnd)));
    cameraPath.push(ahead(exit, exitHeading));
    groups.push({ title: chapter.title, slugs: chapter.works.map((w) => w.slug) });

    if (k < chapters.length - 1) {
      const gate = add(exit, exitHeading, PASSAGE / 2);
      passageIndex.push(cameraPath.length);
      cameraPath.push(ahead(gate, exitHeading));
      passages.push({ key: `${chapter.kind}-${chapters[k + 1].kind}`, position: at3(gate, 0), rotationY: Math.atan2(-exitHeading[0], -exitHeading[1]) });
      planes.push([gate[0], gate[1], exitHeading[0], exitHeading[1]]);
      start = add(exit, exitHeading, PASSAGE);
      heading = exitHeading;
    } else {
      cameraPath.push(ahead(add(exit, exitHeading, TAIL), exitHeading));
    }
  });

  const count = cameraPath.length;
  const order = chapters.flatMap((c) => c.works);
  return {
    placements,
    cameraPath,
    stops: order.map((work) => ({ slug: work.slug, t: pathT(stopIndex.get(work.slug)!, count) })),
    titles: titles.map((title, i) => ({ ...title, t: pathT(titleIndex[i], count) })),
    passages: passages.map((passage, i) => ({ ...passage, t: pathT(passageIndex[i], count) })),
    floor: {
      spine: false,
      planes,
      sides: chapters.map((c) => c.side),
      bounds: boundsOf([...placements.map((p) => p.position), ...cameraPath.map((p) => p.position)], 12),
    },
    groups,
  };
};
