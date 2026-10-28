// Layout "split": the hero's line carries on as a spine down the middle of the
// floor and the camera travels along it. Paintings hang on the art side (left),
// projects stand on the code side (right), alternating, each turned toward the
// spot the camera presents it from. Works that are both art and code sit on the
// spine itself, and the path steps round them.

import type { Work } from "../works";
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
  type PathPoint,
  type Placement,
  type Stop,
  type Vec3,
} from "./types";

/** Works stand this far either side of the spine (m). */
const X_OFF = 1.95;
/** At a stop the camera leans this far to the other side of the spine. */
const CAM_X = 0.15;
/** Least distance along the path between works (m). */
const MIN_SPACING = 4.6;
/** From the end of the entrance to the first stop, and from the last stop to the end (m). */
const LEAD = 4;
const TAIL = 5;
/** Clearance when the path steps round a work on the spine (m from its edge). */
const PASS_CLEAR = 0.95;
/** The closest a side work's stop comes to it along the path (m). */
const MIN_DEPTH = 1.2;

/** Spine works first (the line opens onto them), then art and code alternating. */
export function splitOrder(works: readonly Work[]): Work[] {
  const spine = works.filter((w) => w.side === "both");
  const art = works.filter((w) => w.side === "art");
  const code = works.filter((w) => w.side === "code");
  const out = [...spine];
  for (let i = 0; i < Math.max(art.length, code.length); i++) {
    if (art[i]) out.push(art[i]);
    if (code[i]) out.push(code[i]);
  }
  return out;
}

const sideOf = (work: Work) => (work.side === "both" ? 0 : work.side === "art" ? -1 : 1);

export const splitLayout: LayoutFn = (works, viewport) => {
  const order = splitOrder(works);
  const items = order.map((work) => {
    const size = sizeOf(work);
    const side = sideOf(work);
    const distance = presentDistance(size.width, size.height, viewport);
    const lateral = X_OFF + CAM_X;
    // How far back along the path the camera stands from the work.
    const depth = side === 0 ? distance : Math.sqrt(Math.max(distance * distance - lateral * lateral, MIN_DEPTH * MIN_DEPTH));
    return { work, size, side, depth };
  });
  const spacing = Math.max(MIN_SPACING, ...items.map((item) => item.depth + MIN_DEPTH));

  const placements: Placement[] = [];
  const cameraStops: PathPoint[] = [];
  let z = 0;
  items.forEach((item, i) => {
    z = i === 0 ? -LEAD - item.depth : z - spacing;
    const position: Vec3 = [item.side * X_OFF, centreY(item.work), z];
    const eye: Vec3 = [-item.side * CAM_X, EYE, z + item.depth];
    placements.push({
      slug: item.work.slug,
      position,
      rotationY: item.side === 0 ? 0 : yawFacing(position, eye),
      width: item.size.width,
      height: item.size.height,
    });
    cameraStops.push({ position: eye, target: position });
  });

  const ahead = (position: Vec3): PathPoint => ({ position, target: [position[0], EYE - 0.1, position[2] - AHEAD] });
  const cameraPath: PathPoint[] = [ahead([0, EYE, 0])];
  const stopIndex: number[] = [];
  items.forEach((item, i) => {
    stopIndex.push(cameraPath.length);
    cameraPath.push(cameraStops[i]);
    const next = items[i + 1];
    if (!next) return;
    if (item.side === 0) {
      // Step round a work on the spine, on the side away from the next work.
      const pass = next.side === 0 ? 1 : -next.side;
      cameraPath.push(ahead([pass * (item.size.width / 2 + PASS_CLEAR), EYE, placements[i].position[2] - 0.5]));
    } else {
      cameraPath.push(ahead([0, EYE, (cameraStops[i].position[2] + cameraStops[i + 1].position[2]) / 2]));
    }
  });
  const last = cameraStops[cameraStops.length - 1]?.position[2] ?? 0;
  cameraPath.push(ahead([0, EYE, last - TAIL]));

  const count = cameraPath.length;
  const stops: Stop[] = items.map((item, i) => ({ slug: item.work.slug, t: pathT(stopIndex[i], count) }));

  return {
    placements,
    cameraPath,
    stops,
    titles: [],
    passages: [],
    floor: {
      spine: true,
      planes: [],
      sides: ["art", "code"],
      bounds: boundsOf([...placements.map((p) => p.position), ...cameraPath.map((p) => p.position)], 10),
    },
    groups: [{ title: "Paintings and projects", slugs: order.map((w) => w.slug) }],
  };
};
