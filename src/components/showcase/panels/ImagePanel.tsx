"use client";

// A floating panel: a thin plane showing an image (a flat colour until it
// loads), that the station poses and fades every frame through its handle.
// Optionally a stretched canvas's sides behind it, or one frame of an atlas.

import type { ThreeEvent } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { useWorkTexture } from "../workMesh";

export interface ImagePanelHandle {
  /** Pose this group: position, rotation, scale */
  group: THREE.Group;
  /** The opacity it was last given */
  opacity: number;
  setOpacity(opacity: number): void;
  /** Show frame `k` of the atlas */
  setFrame(k: number): void;
}

interface ImagePanelProps {
  src: string | null;
  width: number;
  height: number;
  /** Shown until the image is in */
  color: string;
  /** Near enough to load its image */
  wanted: boolean;
  /** Lit by the room (paint, masks) or self-lit like a screen (figure, flipbook, prints) */
  lit: boolean;
  /** The image has transparent parts (a cut-out mask) */
  cutout?: boolean;
  atlas?: { cols: number; rows: number };
  /** A stretched canvas's sides behind it */
  canvas?: boolean;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}

/** How deep a stretched canvas is (m). */
const CANVAS_DEPTH = 0.035;

const ImagePanel = forwardRef<ImagePanelHandle, ImagePanelProps>(function ImagePanel(
  { src, width, height, color, wanted, lit, cutout = false, atlas, canvas = false, onClick, onPointerOver, onPointerOut },
  ref,
) {
  const group = useRef<THREE.Group>(null!);
  const texture = useWorkTexture(src ?? undefined, wanted, true);

  const face = useMemo(() => {
    const options = { transparent: true, side: THREE.DoubleSide, alphaTest: cutout ? 0.04 : 0, opacity: 0 };
    return lit ? new THREE.MeshStandardMaterial({ ...options, roughness: 0.86, metalness: 0 }) : new THREE.MeshBasicMaterial({ ...options, toneMapped: false });
  }, [lit, cutout]);
  const sides = useMemo(() => (canvas ? new THREE.MeshStandardMaterial({ color: "#2b2722", roughness: 0.95, transparent: true, opacity: 0 }) : null), [canvas]);
  useEffect(
    () => () => {
      face.dispose();
      sides?.dispose();
    },
    [face, sides],
  );

  useEffect(() => {
    if (texture && atlas) {
      texture.repeat.set(1 / atlas.cols, 1 / atlas.rows);
      texture.offset.set(0, 1 - 1 / atlas.rows);
    }
    face.map = texture;
    face.color.set(texture ? (lit ? "#ffffff" : "#ececec") : color);
    face.needsUpdate = true;
  }, [face, texture, atlas, color, lit]);

  const state = useRef({ opacity: -1 });
  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return group.current;
      },
      get opacity() {
        return Math.max(0, state.current.opacity);
      },
      setOpacity(opacity: number) {
        if (Math.abs(opacity - state.current.opacity) < 1e-4) return;
        state.current.opacity = opacity;
        face.opacity = opacity;
        // Fully opaque panels write depth like any solid; fading ones don't hide what's behind them.
        face.depthWrite = opacity > 0.98;
        if (sides) sides.opacity = opacity;
        group.current.visible = opacity > 0.002;
      },
      setFrame(k: number) {
        if (!texture || !atlas) return;
        const col = k % atlas.cols;
        const row = Math.floor(k / atlas.cols);
        texture.offset.set(col / atlas.cols, 1 - (row + 1) / atlas.rows);
      },
    }),
    [face, sides, texture, atlas],
  );

  return (
    <group ref={group} visible={false}>
      {canvas && sides && (
        <mesh position-z={-CANVAS_DEPTH / 2} material={sides}>
          <boxGeometry args={[width, height, CANVAS_DEPTH]} />
        </mesh>
      )}
      <mesh material={face} position-z={canvas ? 0.0015 : 0} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  );
});

export default ImagePanel;
