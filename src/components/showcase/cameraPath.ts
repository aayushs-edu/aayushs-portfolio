// The camera's path: one Catmull-Rom spline for where it is, another for where
// it looks. Control point k sits at t = k / (count − 1), so a layout's stops
// and titles are exact control points.

import * as THREE from "three";
import type { PathPoint } from "./layouts/types";

export interface CameraPath {
  /** Where the camera is and what it looks at, at path parameter t (0..1). */
  at(t: number, position: THREE.Vector3, target: THREE.Vector3): void;
  count: number;
}

export function createCameraPath(points: PathPoint[]): CameraPath {
  const curve = (pick: (p: PathPoint) => [number, number, number]) => {
    const vectors = points.map((p) => new THREE.Vector3(...pick(p)));
    // One point is not a curve; repeat it.
    if (vectors.length === 1) vectors.push(vectors[0].clone());
    return new THREE.CatmullRomCurve3(vectors, false, "centripetal");
  };
  const position = curve((p) => p.position);
  const target = curve((p) => p.target);
  return {
    count: points.length,
    at(t, outPosition, outTarget) {
      const u = Math.min(1, Math.max(0, t));
      position.getPoint(u, outPosition);
      target.getPoint(u, outTarget);
    },
  };
}
