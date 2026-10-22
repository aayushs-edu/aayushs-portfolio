"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { LIGHT, type GalleryItem } from "./heroConfig";
import type { FrameState, ItemTextures } from "./HeroCanvas";
import { flatFragment, flatVertex, reliefFragmentOutput, reliefFragmentPars, reliefVertexMain, reliefVertexPars } from "./shaders";

const SEGMENTS = 256;
const DISPLACEMENT = 0.004;

interface FrontCardProps {
  item: GalleryItem;
  textures: ItemTextures;
  frame: RefObject<FrameState>;
  onRendered: () => void;
}

/**
 * The front image plane at rest and through the zoom act: a lit, varnished
 * relief for paintings, or a flat screen with a soft sheen and a small
 * cursor tilt for project screenshots. Clipped to the card's corner radius.
 */
export default function FrontCard({ item, textures, frame, onRendered }: FrontCardProps) {
  const relief = item.tuning.relief && !!textures.normal;
  const mesh = useRef<THREE.Mesh>(null);
  const rendered = useRef(false);
  const renderedCb = useRef(onRendered);
  renderedCb.current = onRendered;

  const { geometry, material, uniforms } = useMemo(() => {
    const segX = item.aspect >= 1 ? SEGMENTS : Math.max(1, Math.round(SEGMENTS * item.aspect));
    const segY = item.aspect >= 1 ? Math.max(1, Math.round(SEGMENTS / item.aspect)) : SEGMENTS;
    const uniforms = {
      uSize: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: 0 },
      uFlat: { value: 0 },
      uAlpha: { value: 1 },
      uMap: { value: textures.color },
      uSheen: { value: new THREE.Vector2(0.3, 0.75) },
      uSheenAmount: { value: 0 },
      uSheenColor: { value: new THREE.Color(LIGHT.color) },
    };
    if (relief) {
      const geometry = new THREE.PlaneGeometry(1, 1, segX, segY);
      // Vertex tangents: derivative-based normal mapping would read the displaced triangles.
      // A flat plane's tangent is +X everywhere; filled directly (computeTangents is slow here).
      const count = geometry.attributes.position.count;
      const tangents = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        tangents[i * 4] = 1;
        tangents[i * 4 + 3] = 1;
      }
      geometry.setAttribute("tangent", new THREE.BufferAttribute(tangents, 4));
      const material = new THREE.MeshPhysicalMaterial({
        map: textures.color,
        normalMap: textures.normal ?? null,
        normalScale: new THREE.Vector2(item.tuning.normalStrength, item.tuning.normalStrength),
        displacementMap: textures.height ?? null,
        displacementScale: 1,
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.25,
        clearcoatRoughness: 0.4,
        transparent: true,
        depthWrite: false,
      });
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uSize = uniforms.uSize;
        shader.uniforms.uRadius = uniforms.uRadius;
        shader.uniforms.uFlat = uniforms.uFlat;
        shader.uniforms.uAlpha = uniforms.uAlpha;
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", `#include <common>\n${reliefVertexPars}`)
          .replace("#include <uv_vertex>", `#include <uv_vertex>\n${reliefVertexMain}`);
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", `#include <common>\n${reliefFragmentPars}`)
          .replace("#include <opaque_fragment>", reliefFragmentOutput);
      };
      material.customProgramCacheKey = () => "hero-relief";
      return { geometry, material, uniforms };
    }
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: flatVertex,
      fragmentShader: flatFragment,
      transparent: true,
      depthWrite: false,
    });
    return { geometry, material, uniforms };
  }, [item, textures, relief]);

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
    uniforms.uFlat.value = s.flat;
    uniforms.uAlpha.value = s.planeAlpha;
    m.visible = s.planeAlpha > 0.001;

    if (relief) {
      const mat = material as THREE.MeshPhysicalMaterial;
      mat.displacementScale = DISPLACEMENT * rect.w * (1 - s.flat);
      mat.displacementBias = -0.5 * mat.displacementScale;
      m.rotation.set(0, 0, 0);
    } else {
      // Flat screens tilt toward the cursor (up to ±3°) at rest only.
      const k = (LIGHT.tiltDeg * Math.PI) / 180 * (1 - s.zoomT);
      m.rotation.set(-s.tilt.y * k, s.tilt.x * k, 0);
      uniforms.uSheen.value.copy(s.sheenUv);
      uniforms.uSheenAmount.value = LIGHT.sheen * s.lightRamp * (1 - s.flat) * 3;
    }

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
