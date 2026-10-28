"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Placement } from "./layouts/types";
import { useWorkPointer, useWorkTexture } from "./workMesh";
import type { Work } from "./works";

/** Bezel width, depth and corner radius (m). */
const BEZEL = 0.035;
const DEPTH = 0.03;
const RADIUS = 0.035;
const STAND = "#1b1b1b";

/** A rounded rectangle, extruded; its front face at z = 0. */
function slab(width: number, height: number, radius: number, depth: number): THREE.ExtrudeGeometry {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
  geometry.translate(0, 0, -depth);
  return geometry;
}

interface ScreenMeshProps {
  work: Work;
  placement: Placement;
  /** Near enough to load its screenshot */
  wanted: boolean;
}

/** A project: its screenshot lit like a screen, in a slim bezel on a stand. */
export default function ScreenMesh({ work, placement, wanted }: ScreenMeshProps) {
  const texture = useWorkTexture(work.media.image, wanted, true);
  const { lift, handlers } = useWorkPointer(work.slug);
  const aspect = work.media.aspect;
  const innerW = Math.min(placement.width - 2 * BEZEL, (placement.height - 2 * BEZEL) * aspect);
  const innerH = innerW / aspect;
  const outerW = innerW + 2 * BEZEL;
  const outerH = innerH + 2 * BEZEL;
  const standH = Math.max(0.01, placement.position[1] - outerH / 2);

  const bezel = useMemo(() => slab(outerW, outerH, RADIUS, DEPTH), [outerW, outerH]);
  useEffect(() => () => bezel.dispose(), [bezel]);

  return (
    <group position={placement.position} rotation-y={placement.rotationY}>
      <group ref={lift} {...handlers}>
        <mesh geometry={bezel}>
          <meshStandardMaterial color="#141414" roughness={0.8} metalness={0} />
        </mesh>
        <mesh position-z={0.0015}>
          <planeGeometry args={[innerW, innerH]} />
          {/* Remount when the screenshot arrives so the material compiles with its map. */}
          <meshBasicMaterial key={texture ? "image" : "flat"} map={texture} color={texture ? "#ebebeb" : work.media.avgColor} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, -outerH / 2 - standH / 2, -DEPTH / 2]}>
        <boxGeometry args={[0.035, standH, 0.035]} />
        <meshStandardMaterial color={STAND} roughness={0.6} />
      </mesh>
      <mesh position={[0, -placement.position[1] + 0.006, -DEPTH / 2]}>
        <boxGeometry args={[0.34, 0.012, 0.2]} />
        <meshStandardMaterial color={STAND} roughness={0.6} />
      </mesh>
    </group>
  );
}
