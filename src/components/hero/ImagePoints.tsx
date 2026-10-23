"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { POINTS, type GalleryItem, type PointTier } from "./heroConfig";
import type { FrameState, ItemTextures } from "./HeroCanvas";
import { pointsFragment, pointsVertex } from "./shaders";

interface ImagePointsProps {
  item: GalleryItem;
  textures: ItemTextures;
  pointTier: PointTier;
  push: boolean;
  frame: RefObject<FrameState>;
}

function hash(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** One point per grid cell of the image: its uv and a per-point random. */
function buildGeometry(gw: number, gh: number): THREE.BufferGeometry {
  const n = gw * gh;
  const uv = new Float32Array(n * 2);
  const rand = new Float32Array(n);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const k = j * gw + i;
      uv[k * 2] = (i + 0.5) / gw;
      uv[k * 2 + 1] = 1 - (j + 0.5) / gh;
      rand[k] = hash(k);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("aUv", new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  geometry.setDrawRange(0, n);
  return geometry;
}

/** The image as a cloud of dots: lifts into depth layers, then the camera flies through it. */
export default function ImagePoints({ item, textures, pointTier, push, frame }: ImagePointsProps) {
  const { gw, gh } = item.tiers[pointTier];
  const points = useRef<THREE.Points>(null);
  const dpr = useThree((state) => state.viewport.dpr);

  const geometry = useMemo(() => buildGeometry(gw, gh), [gw, gh]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: textures.color },
          uDepth: { value: textures.depth },
          uRect: { value: new THREE.Vector4() },
          uLod: { value: 0 },
          uDepthT: { value: 0 },
          uFlyT: { value: 0 },
          uLift: { value: 0 },
          uScatter: { value: 0 },
          uDelay: { value: POINTS.depthDelay },
          uPointSize: { value: 1 },
          uCamDist: { value: 1 },
          uShrink: { value: POINTS.shrink },
          uMaxSize: { value: POINTS.maxSize },
          uNearFade: { value: new THREE.Vector2() },
          uMouse: { value: new THREE.Vector3() },
          uMouseVel: { value: new THREE.Vector2() },
          uPushSigma: { value: POINTS.pushRadiusPx / 2 },
          uPushGain: { value: 0 },
          uRound: { value: 0 },
          uOpacity: { value: 0 },
        },
        vertexShader: pointsVertex,
        fragmentShader: pointsFragment,
        transparent: true,
        depthWrite: false,
      }),
    [textures],
  );
  useEffect(() => () => material.dispose(), [material]);

  const object = useMemo(() => {
    const p = new THREE.Points(geometry, material);
    p.frustumCulled = false;
    return p;
  }, [geometry, material]);

  const texWidth = item.width;
  useFrame(() => {
    const s = frame.current;
    const p = points.current;
    if (!s || !p) return;
    const u = material.uniforms;
    const { rect } = s;
    p.visible = s.pointsAlpha * s.cloud > 0.001;
    if (!p.visible) return;
    u.uRect.value.set(rect.x, rect.y, rect.w, rect.h);
    // One mip level per halving: each point takes the average colour of its cell.
    u.uLod.value = Math.max(0, Math.log2(texWidth / gw) - 0.5);
    u.uDepthT.value = s.depthT;
    u.uFlyT.value = s.flyT;
    u.uLift.value = item.tuning.depthScale * rect.h;
    u.uScatter.value = POINTS.scatter * rect.h;
    // Squares at handoff tile the image exactly; +1px closes rounding gaps.
    u.uPointSize.value = (rect.w / gw) * dpr + 1;
    u.uMaxSize.value = POINTS.maxSize * dpr;
    u.uCamDist.value = s.dist;
    u.uNearFade.value.set(POINTS.nearFade[0] * s.dist, POINTS.nearFade[1] * s.dist);
    u.uRound.value = s.round;
    u.uOpacity.value = s.pointsAlpha * s.cloud;
    u.uMouse.value.copy(s.pointerWorld);
    u.uMouseVel.value.copy(s.pointerVel);
    u.uPushGain.value = push ? 0.07 : 0;
  });

  return <primitive object={object} ref={points} />;
}
