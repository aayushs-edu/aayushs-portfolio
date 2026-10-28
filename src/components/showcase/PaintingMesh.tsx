"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Placement } from "./layouts/types";
import { SHOWCASE } from "./showcaseConfig";
import { useWorkPointer, useWorkTexture } from "./workMesh";
import type { Work } from "./works";

/** How deep the stretched canvas is (m): its sides show as the camera passes. */
const CANVAS_DEPTH = 0.04;

interface PaintingMeshProps {
  work: Work;
  placement: Placement;
  /** Near enough to load its textures */
  wanted: boolean;
  /** Full tier: the face is a fine mesh raised by the depth map, so the paint catches the light. */
  relief: boolean;
}

/** A painting hung as a real canvas: stretched canvas sides behind a painted face. */
export default function PaintingMesh({ work, placement, wanted, relief }: PaintingMeshProps) {
  const color = useWorkTexture(work.media.image, wanted, true);
  const depth = useWorkTexture(work.media.depth, wanted && relief, false);
  const { lift, handlers } = useWorkPointer(work.slug);
  const { width: w, height: h } = placement;

  const geometry = useMemo(() => {
    const n = relief ? SHOWCASE.relief.segments : 1;
    const sx = Math.max(1, Math.round(n * Math.min(1, w / h)));
    const sy = Math.max(1, Math.round(n * Math.min(1, h / w)));
    return new THREE.PlaneGeometry(w, h, relief ? sx : 1, relief ? sy : 1);
  }, [w, h, relief]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0 }), []);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    material.map = color;
    material.color.set(color ? "#ffffff" : work.media.avgColor);
    // The brushwork's light and dark edges read as relief; the depth map raises the forms.
    material.bumpMap = relief ? color : null;
    material.bumpScale = SHOWCASE.relief.bump;
    material.displacementMap = relief ? depth : null;
    material.displacementScale = SHOWCASE.relief.scale;
    material.displacementBias = 0;
    material.needsUpdate = true;
  }, [material, color, depth, relief, work.media.avgColor]);

  return (
    <group position={placement.position} rotation-y={placement.rotationY}>
      <group ref={lift} {...handlers}>
        <mesh position-z={-CANVAS_DEPTH / 2}>
          <boxGeometry args={[w, h, CANVAS_DEPTH]} />
          <meshStandardMaterial color="#2b2722" roughness={0.95} />
        </mesh>
        <mesh geometry={geometry} material={material} position-z={0.0015} />
      </group>
    </group>
  );
}
