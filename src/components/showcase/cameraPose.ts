// Where the camera flies to when a work is opened (pure, no DOM): straight in
// front of it, close enough that it fills `fill` of the part of the viewport
// the detail panel leaves free, and shifted so it sits in the middle of that part.

import { FOV_Y, type PathPoint, type Placement, type Viewport } from "./layouts/types";
import { freeArea } from "./showcaseConfig";

export function detailPose(placement: Placement, viewport: Viewport, fill: number): PathPoint {
  const { width: W, height: H } = viewport;
  const [fx, fy, fw, fh] = freeArea(W, H);
  const tanV = Math.tan(((FOV_Y / 2) * Math.PI) / 180);
  const tanH = tanV * (W / Math.max(1, H));
  const distance = Math.max(placement.height / (fill * (fh / H) * 2 * tanV), placement.width / (fill * (fw / W) * 2 * tanH));

  // The work's facing direction, its right, and how far the free area's centre is from the screen's (in world units at that distance).
  const ry = placement.rotationY;
  const normal = [Math.sin(ry), 0, Math.cos(ry)];
  const right = [Math.cos(ry), 0, -Math.sin(ry)];
  const shiftX = ((fx + fw / 2 - W / 2) / (W / 2)) * distance * tanH;
  const shiftY = ((fy + fh / 2 - H / 2) / (H / 2)) * distance * tanV;

  const [cx, cy, cz] = placement.position;
  const eye: [number, number, number] = [
    cx + normal[0] * distance - right[0] * shiftX,
    cy + shiftY,
    cz + normal[2] * distance - right[2] * shiftX,
  ];
  return { position: eye, target: [eye[0] - normal[0] * distance, eye[1], eye[2] - normal[2] * distance] };
}
