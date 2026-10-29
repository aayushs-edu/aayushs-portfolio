// Where a floating panel is between its station's beats (pure). A station
// gives each panel a pose at every beat and an idle pose; `u` is the
// continuous beat within the station (0 at its first), and `presence` blends
// from idle (the camera is elsewhere) to the beat poses (it's here).

import type { PanelPose } from "../room/types";

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * From one beat to the next (f: 0..1 of the scroll between them): panels
 * hold still near each beat, while the camera dwells, and move in the middle,
 * while it travels.
 */
export const easeBetween = (f: number) => smoothstep(0.25, 0.75, f);

/** 0 when the camera is a beat or more away from the station, 1 through its beats. */
export function presenceAt(u: number, count: number): number {
  return smoothstep(-1, -0.35, u) * (1 - smoothstep(count - 0.65, count, u));
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/** A panel's pose at continuous beat `u` (clamped to its beats), blended toward `idle` as presence falls. */
export function poseAt(poses: PanelPose[], idle: PanelPose, u: number, presence: number, out: PanelPose): PanelPose {
  const last = poses.length - 1;
  const v = Math.min(last, Math.max(0, u));
  const i = Math.min(Math.max(0, last - 1), Math.floor(v));
  const f = last > 0 ? easeBetween(v - i) : 0;
  const a = poses[i];
  const b = poses[Math.min(last, i + 1)];
  for (let k = 0; k < 3; k++) {
    out.position[k] = mix(idle.position[k], mix(a.position[k], b.position[k], f), presence);
    out.rotation[k] = mix(idle.rotation[k], mix(a.rotation[k], b.rotation[k], f), presence);
  }
  out.scale = mix(idle.scale, mix(a.scale, b.scale, f), presence);
  out.opacity = mix(idle.opacity, mix(a.opacity, b.opacity, f), presence);
  return out;
}
