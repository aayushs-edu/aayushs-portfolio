"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { FRONT, type GalleryItem } from "./heroConfig";
import type { FrameState, ItemTextures } from "./HeroCanvas";
import { flatFragment, flatVertex } from "./shaders";

interface FrontCardProps {
  item: GalleryItem;
  textures: ItemTextures;
  frame: RefObject<FrameState>;
  onRendered: () => void;
}

/**
 * The front image plane at rest and through the zoom act, clipped to the
 * card's corner radius. Project screenshots tilt slightly toward the cursor.
 */
export default function FrontCard({ item, textures, frame, onRendered }: FrontCardProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const rendered = useRef(false);
  const renderedCb = useRef(onRendered);
  renderedCb.current = onRendered;
  const tilts = item.mode === "code";

  const { geometry, material, uniforms } = useMemo(() => {
    const uniforms = {
      uMap: { value: textures.color },
      uSize: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 0 },
      uAlpha: { value: 1 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: flatVertex,
      fragmentShader: flatFragment,
      transparent: true,
      depthWrite: false,
    });
    return { geometry: new THREE.PlaneGeometry(1, 1, 1, 1), material, uniforms };
  }, [textures]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const m = mesh.current;
    const s = frame.current;
    if (!m || !s) return;
    const { rect } = s;
    m.position.set(rect.x, rect.y, 0);
    m.scale.set(rect.w, rect.h, 1);
    uniforms.uSize.value.set(rect.w, rect.h);
    uniforms.uRadius.value = rect.radius;
    uniforms.uAlpha.value = s.planeAlpha;
    m.visible = s.planeAlpha > 0.001;
    const k = tilts ? ((FRONT.tiltDeg * Math.PI) / 180) * (1 - s.zoomT) : 0;
    m.rotation.set(-s.tilt.y * k, s.tilt.x * k, 0);

    if (!rendered.current) {
      rendered.current = true;
      // The frame being drawn now uses these textures; report on the next tick.
      requestAnimationFrame(() => renderedCb.current());
    }
  });

  const object = useMemo(() => {
    const m = new THREE.Mesh(geometry, material);
    m.frustumCulled = false;
    return m;
  }, [geometry, material]);

  return <primitive object={object} ref={mesh} />;
}
