"use client";

import { useCallback, useEffect, useState } from "react";
import type { Tier } from "./heroConfig";

let webgl2: boolean | undefined;

function hasWebGL2(): boolean {
  if (webgl2 !== undefined) return webgl2;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    webgl2 = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl2 = false;
  }
  return webgl2;
}

function saveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

function detectTier(): Tier {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData() || !hasWebGL2()) return "static";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (coarse || window.innerWidth < 1024 || cores <= 4) return "lite";
  return "full";
}

/**
 * 'static' | 'lite' | 'full'. SSR and the first client render are 'static';
 * the real tier is picked after mount. Reduced motion is followed live, and
 * `demote()` drops to static for the rest of the session (WebGL context loss).
 */
export function useHeroTier(): [Tier, () => void] {
  const [tier, setTier] = useState<Tier>("static");
  const [demoted, setDemoted] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setTier(demoted ? "static" : detectTier());
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [demoted]);

  const demote = useCallback(() => setDemoted(true), []);
  return [tier, demote];
}
