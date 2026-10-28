"use client";

// What both kinds of work share in the scene: streaming their textures in, and
// hover (a small lift toward the camera) and click (open the detail view).

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SHOWCASE } from "./showcaseConfig";

export interface WorkInteraction {
  /** The work under the pointer */
  hover: { current: string | null };
  /** False while a work is open */
  enabled: { current: boolean };
  open: (slug: string) => void;
}

export const InteractionContext = createContext<WorkInteraction | null>(null);

const loader = new THREE.TextureLoader();

/** Loads `url` once `wanted` (the work is near), and keeps it. Null until it's in. */
export function useWorkTexture(url: string | undefined, wanted: boolean, color: boolean): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (!wanted || !url || texture) return;
    let cancelled = false;
    loader
      .loadAsync(url)
      .then((t) => {
        if (cancelled) {
          t.dispose();
          return;
        }
        t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        t.anisotropy = color ? Math.min(8, gl.capabilities.getMaxAnisotropy()) : 1;
        setTexture(t);
      })
      .catch(() => {
        // Keeps its placeholder colour.
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, url, texture, color, gl]);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

/** Pointer handlers for a work, and a group (put it inside the work's placement) that lifts on hover. */
export function useWorkPointer(slug: string) {
  const ctx = useContext(InteractionContext);
  const lift = useRef<THREE.Group | null>(null);

  useFrame((_, delta) => {
    const group = lift.current;
    if (!group || !ctx) return;
    const goal = ctx.enabled.current && ctx.hover.current === slug ? SHOWCASE.hover.lift : 0;
    group.position.z += (goal - group.position.z) * (1 - Math.exp(-SHOWCASE.hover.follow * Math.min(delta, 0.05)));
  });

  const handlers = {
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (!ctx?.enabled.current) return;
      ctx.hover.current = slug;
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      if (ctx?.hover.current !== slug) return;
      ctx.hover.current = null;
      document.body.style.cursor = "";
    },
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (ctx?.enabled.current) ctx.open(slug);
    },
  };
  return { lift, handlers };
}
