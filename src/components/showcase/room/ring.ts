// The room: one round space. Paintwise floats at its centre on the spine;
// the other stations stand on a ring round it, art on the left half (x < 0)
// and code on the right (x > 0), each facing the centre. The camera's path
// takes in the whole room, then visits the stations in tour order, swinging
// back toward the middle between them. Pure: no DOM, no three.

import { EYE, type PathPoint, type Placement, type Vec3, type Viewport } from "../layouts/types";
import type { Beat } from "../scrollMap";
import { SHOWCASE } from "../showcaseConfig";
import { arcStation, salonStation } from "../stations/gallery";
import type { Work } from "../works";
import { GROUP_TITLES, type GroupId, type RoomLayout, type RoomStation, type StationLayout, type StationPlacement } from "./types";

export const ROOM = {
  /** Paintwise stands here. The camera enters at the origin, looking down −z. */
  centre: [0, 0, -13] as Vec3,
  /** The stations stand this far from the centre (m) */
  radius: 12,
  /** The floor fades into the dark by this distance (m) */
  floorRadius: 16,
  /** Between stations the path swings this close to the centre (m) */
  transit: 5.5,
  /** Directions from the centre: degrees clockwise from north (−z), seen from above */
  angles: { paintings: -90, animation: -45, hackathons: 45, games: 90 } as Record<Exclude<GroupId, "paintwise">, number>,
  tour: ["paintwise", "paintings", "animation", "hackathons", "games"] as GroupId[],
  /** The held view of the whole room after the hero opens */
  overview: { position: [0, 6.8, 7], target: [0, 0.6, -11] } as PathPoint,
  /** Before the overview, the camera starts this far back along its view (m) */
  entryBack: 3,
  /** After the last station: pull back and up, looking across the room */
  tail: { angle: 135, distance: 8.5, height: 3.5 },
};

const DEG = Math.PI / 180;

/** Unit direction from the centre at `angle` degrees clockwise from north. */
const directionOf = (angle: number): Vec3 => [Math.sin(angle * DEG), 0, -Math.cos(angle * DEG)];

/** The angle (degrees clockwise from north) of a point round the centre. */
const angleOf = (p: Vec3) => Math.atan2(p[0] - ROOM.centre[0], -(p[2] - ROOM.centre[2])) / DEG;

export function stationPlacement(id: GroupId): StationPlacement {
  if (id === "paintwise") return { position: [...ROOM.centre], yaw: 0 };
  const dir = directionOf(ROOM.angles[id]);
  return {
    position: [ROOM.centre[0] + dir[0] * ROOM.radius, ROOM.centre[1], ROOM.centre[2] + dir[2] * ROOM.radius],
    yaw: Math.atan2(-dir[0], -dir[2]),
  };
}

/** A point in a station's frame, in the world. */
export function toWorld(p: Vec3, at: StationPlacement): Vec3 {
  const c = Math.cos(at.yaw);
  const s = Math.sin(at.yaw);
  return [at.position[0] + p[0] * c + p[2] * s, at.position[1] + p[1], at.position[2] - p[0] * s + p[2] * c];
}

const worldPlacement = (p: Placement, at: StationPlacement): Placement => ({ ...p, position: toWorld(p.position, at), rotationY: p.rotationY + at.yaw });
const worldPoint = (p: PathPoint, at: StationPlacement): PathPoint => ({ position: toWorld(p.position, at), target: toWorld(p.target, at) });

/** Between two cameras: a point toward the middle of the room, halfway round (clockwise), looking at the next station. */
function transit(from: PathPoint, to: PathPoint, next: StationPlacement): PathPoint {
  const a0 = angleOf(from.position);
  let sweep = angleOf(to.position) - a0;
  while (sweep <= 0) sweep += 360;
  while (sweep > 360) sweep -= 360;
  const dir = directionOf(a0 + sweep / 2);
  return {
    position: [ROOM.centre[0] + dir[0] * ROOM.transit, EYE, ROOM.centre[2] + dir[2] * ROOM.transit],
    target: [next.position[0], EYE - 0.1, next.position[2]],
  };
}

/**
 * The room for these works: the stations that hold any (Paintwise's layout
 * is given; the others are laid out here), the camera path through them and
 * a beat at every stop.
 */
export function buildRoom(works: readonly Work[], viewport: Viewport, paintwise: StationLayout): RoomLayout {
  const groups = new Map<GroupId, Work[]>();
  for (const work of works) groups.set(work.group, [...(groups.get(work.group) ?? []), work]);

  const layouts: StationLayout[] = [];
  for (const id of ROOM.tour) {
    const held = groups.get(id) ?? [];
    if (!held.length) continue;
    if (id === "paintwise") layouts.push(paintwise);
    else if (id === "paintings") layouts.push(salonStation(held, viewport));
    else layouts.push(arcStation(id, GROUP_TITLES[id], held, viewport));
  }

  const { overview } = ROOM;
  const view = [0, 1, 2].map((i) => overview.target[i] - overview.position[i]);
  const length = Math.hypot(...view);
  const back = (p: Vec3): Vec3 => [0, 1, 2].map((i) => p[i] - (view[i] / length) * ROOM.entryBack) as Vec3;

  const cameraPath: PathPoint[] = [{ position: back(overview.position), target: back(overview.target) }];
  const keys: string[] = ["room:overview"];
  const at: number[] = [cameraPath.length];
  cameraPath.push(overview);

  const stations: RoomStation[] = [];
  const placements: Placement[] = [];
  let last: PathPoint | null = null;
  for (const layout of layouts) {
    const placement = stationPlacement(layout.id);
    const cameras = layout.beats.map((beat) => worldPoint(beat.camera, placement));
    if (last) cameraPath.push(transit(last, cameras[0], placement));
    stations.push({ id: layout.id, title: layout.title, at: placement, layout, first: keys.length, count: layout.beats.length });
    layout.beats.forEach((beat, i) => {
      keys.push(beat.key);
      at.push(cameraPath.length);
      cameraPath.push(cameras[i]);
    });
    placements.push(...layout.works.map((p) => worldPlacement(p, placement)));
    last = cameras[cameras.length - 1] ?? last;
  }

  const tail = directionOf(ROOM.tail.angle);
  cameraPath.push({
    position: [ROOM.centre[0] + tail[0] * ROOM.tail.distance, ROOM.tail.height, ROOM.centre[2] + tail[2] * ROOM.tail.distance],
    target: [ROOM.centre[0], 1.2, ROOM.centre[2]],
  });

  const count = cameraPath.length;
  const beats: Beat[] = keys.map((key, i) => ({ key, t: at[i] / (count - 1), units: SHOWCASE.units.work }));
  return { stations, cameraPath, beats, placements, floor: { centre: ROOM.centre, radius: ROOM.floorRadius } };
}

/** Which station a continuous beat index is in, and where within it (0 at its first beat). Null on the overview. */
export function locate(room: RoomLayout, beat: number): { station: RoomStation | null; local: number } {
  const i = Math.round(beat);
  for (const station of room.stations) {
    if (i >= station.first && i < station.first + station.count) return { station, local: beat - station.first };
  }
  return { station: null, local: beat };
}

/**
 * From `from` to `to` (k: 0..1) round `centre` rather than straight across it:
 * the angle and the distance from the centre are blended, so the point never
 * comes closer to the centre than the nearer end.
 */
export function arcLerp(from: Vec3, to: Vec3, centre: Vec3, k: number, out: Vec3 = [0, 0, 0]): Vec3 {
  const ax = from[0] - centre[0];
  const az = from[2] - centre[2];
  const bx = to[0] - centre[0];
  const bz = to[2] - centre[2];
  const ra = Math.hypot(ax, az);
  const rb = Math.hypot(bx, bz);
  const a0 = Math.atan2(az, ax);
  let d = Math.atan2(bz, bx) - a0;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  if (k <= 0) return Object.assign(out, from);
  if (k >= 1) return Object.assign(out, to);
  const a = a0 + d * k;
  const r = ra + (rb - ra) * k;
  out[0] = centre[0] + Math.cos(a) * r;
  out[1] = from[1] + (to[1] - from[1]) * k;
  out[2] = centre[2] + Math.sin(a) * r;
  return out;
}
