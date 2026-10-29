// Positioning a DOM label over the canvas at a point in the scene, the way
// the captions are: projected every frame, faded, and only clickable when
// it's mostly in.

import type * as THREE from "three";
import type { LabelSpec } from "../room/types";

/** Gap between a label and its anchor (px). */
const GAP = 14;

/** Where the label's box sits relative to its anchor point: beside it, with its edge or middle on the anchor. */
function shiftFor(align: LabelSpec["align"], ax: number): string {
  const across = ax < -0.01 ? "0" : ax > 0.01 ? "-100%" : "-50%";
  switch (align) {
    case "above":
      return `translate(${across}, calc(-100% - ${GAP}px))`;
    case "below":
      return `translate(${across}, ${GAP}px)`;
    case "left":
      return `translate(calc(-100% - ${GAP}px), -50%)`;
    case "right":
      return `translate(${GAP}px, -50%)`;
  }
}

/** Puts `el` at the projection of `world` (written into `scratch`), at `opacity`. */
export function placeLabel(
  el: HTMLElement,
  world: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number,
  opacity: number,
  align: LabelSpec["align"],
  ax: number,
  scratch: THREE.Vector3,
) {
  const p = scratch.copy(world).project(camera);
  if (p.z > 1 || p.z < -1) opacity = 0;
  if (opacity <= 0.001) {
    if (el.style.visibility !== "hidden") {
      el.style.opacity = "0";
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
    }
    return;
  }
  const x = ((p.x + 1) / 2) * width;
  const y = ((1 - p.y) / 2) * height;
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) ${shiftFor(align, ax)}`;
  el.style.opacity = opacity.toFixed(3);
  el.style.visibility = "visible";
  el.style.pointerEvents = opacity > 0.6 ? "auto" : "none";
}
