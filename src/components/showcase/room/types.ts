// The room and its stations: what the pure layouts produce. World units are
// metres, y is up; the camera enters at the origin looking down −z. A station
// is laid out in its own frame, facing +z (toward the room's centre, or for
// Paintwise at the centre, toward the entrance), and placed on the ring.

import type { PathPoint, Placement, Vec3 } from "../layouts/types";
import type { Beat } from "../scrollMap";

export type GroupId = "paintwise" | "paintings" | "animation" | "hackathons" | "games";

/** Each group's name, as the group bar and the semantic list show it. */
export const GROUP_TITLES: Record<GroupId, string> = {
  paintwise: "Paintwise",
  paintings: "Paintings",
  animation: "Animation",
  hackathons: "Hackathons",
  games: "Games",
};

/** A floating panel's pose in its station's frame. */
export interface PanelPose {
  position: Vec3;
  /** Euler angles (radians), XYZ */
  rotation: Vec3;
  scale: number;
  opacity: number;
}

export interface StationBeat {
  /** "work:<slug>" when the beat presents a work, else "<station>:<name>" */
  key: string;
  /** The camera at this beat, in the station's frame */
  camera: PathPoint;
}

export interface StationLayout {
  id: GroupId;
  title: string;
  beats: StationBeat[];
  /** The works it holds, placed in the station's frame (fly-in, captions, picking) */
  works: Placement[];
  /** How far its panels reach from its origin (m) */
  radius: number;
}

/** Where a station stands: its origin, and its turn about y (its frame's +z, in the world). */
export interface StationPlacement {
  position: Vec3;
  yaw: number;
}

export interface RoomStation {
  id: GroupId;
  title: string;
  at: StationPlacement;
  layout: StationLayout;
  /** Index of its first beat in the room's beats, and how many it has */
  first: number;
  count: number;
}

export interface RoomLayout {
  /** In tour order; only stations that hold works */
  stations: RoomStation[];
  /** World space; every beat is a control point */
  cameraPath: PathPoint[];
  /** The overview, then every station's beats, in path order */
  beats: Beat[];
  /** Every work, world space */
  placements: Placement[];
  floor: { centre: Vec3; radius: number };
}

/** A DOM label pinned to a panel (or a point) in a station, shown around some of its beats. */
export interface LabelSpec {
  id: string;
  /** The panel it's pinned to, and where on it: −0.5..0.5 of its width and height */
  panel?: string;
  anchor: [number, number];
  /** Or a fixed point in the station's frame */
  point?: Vec3;
  /** Which side of the anchor the label sits on */
  align: "below" | "above" | "left" | "right";
  /** Shown from the first beat to the last (station-local) */
  beats: [number, number];
  kind: "title" | "tag" | "figure" | "link";
  title?: string;
  meta?: string;
  href?: string;
}
