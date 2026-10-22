"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { PHASES, POINTS, type GalleryItem, type PointTier } from "./heroConfig";
import type { FrameState, ItemTextures } from "./HeroCanvas";
import { computePaletteTargets } from "./paletteTargets";
import { pointsFragment, pointsVertex } from "./shaders";

interface ImagePointsProps {
  item: GalleryItem;
  textures: ItemTextures;
  pointTier: PointTier;
  push: boolean;
  /** The selection has settled: safe to spend ~30ms building on idle. */
  settled: boolean;
  frame: RefObject<FrameState>;
}

function hash(i: number): number {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** One point per grid cell; palette targets computed once per item. */
function buildGeometry(image: CanvasImageSource, gw: number, gh: number, neutralChroma: number): THREE.BufferGeometry {
  const canvas = document.createElement("canvas");
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("ImagePoints: 2D canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, gw, gh);
  const rgba = ctx.getImageData(0, 0, gw, gh).data;
  const targets = computePaletteTargets(rgba, gw, gh, { columns: POINTS.hueColumns, neutralChroma });

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
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
  geometry.setDrawRange(0, n);
  return geometry;
}

export default function ImagePoints({ item, textures, pointTier, push, settled, frame }: ImagePointsProps) {
  const { gw, gh } = item.tiers[pointTier];
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const points = useRef<THREE.Points>(null);
  const dpr = useThree((state) => state.viewport.dpr);

  // Build on idle once the selection has settled (sooner if the visitor is already scrolling).
  const [wanted, setWanted] = useState(false);
  useEffect(() => {
    if (wanted) return;
    if (settled) {
      setWanted(true);
      return;
    }
    // Already scrolling into the acts: build now rather than wait for a settle.
    const s = frame.current;
    let raf = 0;
    const check = () => {
      if ((s?.p ?? 0) > PHASES.rest) setWanted(true);
      else raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [settled, wanted, frame]);

  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    let built: THREE.BufferGeometry | null = null;
    const build = () => {
      if (cancelled) return;
      built = buildGeometry(textures.color.image as CanvasImageSource, gw, gh, item.tuning.neutralChroma);
      setGeometry(built);
    };
    const urgent = (frame.current?.p ?? 0) > PHASES.rest;
    let id = 0;
    if (urgent) build();
    else if (typeof window.requestIdleCallback === "function") id = window.requestIdleCallback(build, { timeout: 1500 });
    else id = window.setTimeout(build, 200);
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      window.clearTimeout(id);
      built?.dispose();
    };
  }, [wanted, textures, gw, gh, item.tuning.neutralChroma, frame]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: textures.color },
          uDepth: { value: textures.depth },
          uRect: { value: new THREE.Vector4() },
          uField: { value: new THREE.Vector4() },
          uLod: { value: 0 },
          uDepthT: { value: 0 },
          uPaletteT: { value: 0 },
          uLift: { value: 0 },
          uDelay: { value: POINTS.depthDelay },
          uPointSize: { value: 1 },
          uCamDist: { value: 1 },
          uShrink: { value: POINTS.shrink },
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
    if (!geometry) return null;
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
    p.visible = s.pointsAlpha > 0.001;
    if (!p.visible) return;
    u.uRect.value.set(rect.x, rect.y, rect.w, rect.h);
    u.uField.value.set(rect.x, rect.y, rect.w, rect.h);
    // One mip level per halving: each point takes the average colour of its cell.
    u.uLod.value = Math.max(0, Math.log2(texWidth / gw) - 0.5);
    u.uDepthT.value = s.depthT;
    u.uPaletteT.value = s.paletteT;
    u.uLift.value = item.tuning.depthScale * rect.h;
    // Squares at handoff tile the image exactly; +1px closes rounding gaps.
    u.uPointSize.value = (rect.w / gw) * dpr + 1;
    u.uCamDist.value = s.dist;
    u.uRound.value = s.round;
    u.uOpacity.value = s.pointsAlpha * s.dim;
    u.uMouse.value.copy(s.pointerWorld);
    u.uMouseVel.value.copy(s.pointerVel);
    u.uPushGain.value = push ? 0.07 : 0;
  });

  if (!object) return null;
  return <primitive object={object} ref={points} />;
}
