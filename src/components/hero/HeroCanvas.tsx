"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import FrontCard from "./FrontCard";
import ImagePoints from "./ImagePoints";
import styles from "./Hero.module.css";
import { zoomAmount, type HeroLayout, type Rect } from "./heroLayout";
import { DESIGN, DPR, LIGHT, PHASES, POINTS, type GalleryItem, type Tier } from "./heroConfig";

export interface HeroCanvasProps {
  tier: Tier;
  item: GalleryItem;
  prefetch: GalleryItem[];
  /** At rest and settled (no card motion, no flip). */
  show: boolean;
  progress: MotionValue<number>;
  layoutRef: RefObject<HeroLayout | null>;
  layoutVersion: MotionValue<number>;
  frontImageRef: RefObject<HTMLElement | null>;
  stickyRef: RefObject<HTMLDivElement | null>;
  poolRef: RefObject<HTMLDivElement | null>;
  tapRef: RefObject<{ x: number; y: number; t: number } | null>;
  onLiveChange: (live: boolean) => void;
  onContextLost: () => void;
}

export interface ItemTextures {
  color: THREE.Texture;
  depth: THREE.Texture;
  normal?: THREE.Texture;
  height?: THREE.Texture;
}

/** Everything the per-frame components read, written once per frame by the Director. */
export interface FrameState {
  W: number;
  H: number;
  dist: number;
  p: number;
  zoomT: number;
  /** Image plane in world px (centre and size) plus its corner radius. */
  rect: { x: number; y: number; w: number; h: number; radius: number };
  flat: number;
  planeAlpha: number;
  pointsAlpha: number;
  depthT: number;
  /** 0..1 through the fly-through */
  flyT: number;
  round: number;
  /** Remaining opacity of the cloud (clears at the end of the fly-through). */
  cloud: number;
  light: THREE.Vector3;
  lightRamp: number;
  pointerWorld: THREE.Vector3;
  pointerVel: THREE.Vector2;
  tilt: THREE.Vector2;
  sheenUv: THREE.Vector2;
}

function createFrameState(): FrameState {
  return {
    W: 1,
    H: 1,
    dist: 1,
    p: 0,
    zoomT: 0,
    rect: { x: 0, y: 0, w: 1, h: 1, radius: 0 },
    flat: 0,
    planeAlpha: 1,
    pointsAlpha: 0,
    depthT: 0,
    flyT: 0,
    round: 0,
    cloud: 1,
    light: new THREE.Vector3(),
    lightRamp: 0,
    pointerWorld: new THREE.Vector3(1e6, 1e6, 0),
    pointerVel: new THREE.Vector2(),
    tilt: new THREE.Vector2(),
    sheenUv: new THREE.Vector2(0.3, 0.75),
  };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const keyOf = (item: GalleryItem) => `${item.mode}/${item.slug}`;
const idle = (fn: () => void) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 2000 }) : window.setTimeout(fn, 200));
const FOV = 30;

// ---------------------------------------------------------------------------
// Textures: at most 4 items resident (selected, its neighbours, other mode's selected).

class TextureCache {
  private entries = new Map<string, { promise: Promise<ItemTextures>; textures?: ItemTextures }>();
  private loader = new THREE.TextureLoader();
  gl: THREE.WebGLRenderer | null = null;
  maxAnisotropy = 4;

  private loadOne(url: string, color: boolean): Promise<THREE.Texture> {
    return this.loader.loadAsync(url).then((texture) => {
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = color ? this.maxAnisotropy : 1;
      texture.needsUpdate = true;
      return texture;
    });
  }

  load(item: GalleryItem): Promise<ItemTextures> {
    const key = keyOf(item);
    const existing = this.entries.get(key);
    if (existing) return existing.promise;
    const { assets } = item;
    const wantRelief = item.tuning.relief && !!assets.normal;
    const promise = Promise.all([
      this.loadOne(assets.color, true),
      this.loadOne(assets.depth, false),
      wantRelief && assets.normal ? this.loadOne(assets.normal, false) : Promise.resolve(undefined),
      wantRelief && assets.height ? this.loadOne(assets.height, false) : Promise.resolve(undefined),
    ]).then(([color, depth, normal, height]) => {
      const textures: ItemTextures = { color, depth, normal, height };
      const entry = this.entries.get(key);
      if (entry) entry.textures = textures;
      else Object.values(textures).forEach((t) => t?.dispose());
      return textures;
    });
    this.entries.set(key, { promise });
    return promise;
  }

  /** Uploads to the GPU ahead of time, one texture per idle slice, so a later switch doesn't hitch. */
  warm(textures: ItemTextures, isCancelled: () => boolean) {
    const queue = Object.values(textures).filter((t): t is THREE.Texture => !!t);
    const next = () => {
      const texture = queue.shift();
      if (!texture || !this.gl || isCancelled()) return;
      this.gl.initTexture(texture);
      if (queue.length) idle(next);
    };
    idle(next);
  }

  retain(keys: string[]) {
    for (const [key, entry] of this.entries) {
      if (keys.includes(key)) continue;
      if (entry.textures) Object.values(entry.textures).forEach((t) => t?.dispose());
      this.entries.delete(key);
    }
  }

  dispose() {
    this.retain([]);
  }
}

// ---------------------------------------------------------------------------

interface DirectorProps {
  tier: Tier;
  item: GalleryItem;
  frame: RefObject<FrameState>;
  progress: MotionValue<number>;
  layoutRef: RefObject<HeroLayout | null>;
  restRect: RefObject<Rect | null>;
  pointer: RefObject<{ x: number; y: number; inside: boolean; t: number }>;
  tapRef: RefObject<{ x: number; y: number; t: number } | null>;
  poolRef: RefObject<HTMLDivElement | null>;
  live: boolean;
}

/** Writes FrameState once per frame: phases, plane rect, camera, light, pointer. */
function Director({ tier, item, frame, progress, layoutRef, restRect, pointer, tapRef, poolRef, live }: DirectorProps) {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const lastPointer = useMemo(() => new THREE.Vector3(1e6, 1e6, 0), []);
  const lightTarget = useMemo(() => new THREE.Vector3(), []);
  const started = useRef(0);
  const wasLive = useRef(false);
  const shownOnce = useRef(false);
  const rampFrom = useRef(-1);
  const rampLength = useRef(LIGHT.rampMs / 1000);
  const lastSize = useRef({ w: 0, h: 0, fov: 0 });

  useFrame((state, delta) => {
    const s = frame.current;
    const layout = layoutRef.current;
    if (!s || !layout) return;
    const dt = Math.min(delta, 0.1);
    const W = state.size.width;
    const H = state.size.height;
    s.W = W;
    s.H = H;
    s.dist = H / 2 / Math.tan((FOV * Math.PI) / 360);

    const p = progress.get();
    s.p = p;
    s.zoomT = zoomAmount(p);

    // Plane rect: DOM card rect at rest → zoom rect (same interpolation as the DOM poster).
    const card = restRect.current ?? layout.card;
    const t = s.zoomT;
    const cx = card.cx + (layout.zoom.cx - card.cx) * t;
    const cy = card.cy + (layout.zoom.cy - card.cy) * t;
    const w = card.w + (layout.zoom.w - card.w) * t;
    const h = card.h + (layout.zoom.h - card.h) * t;
    s.rect.x = cx - W / 2;
    s.rect.y = H / 2 - cy;
    s.rect.w = w;
    s.rect.h = h;
    s.rect.radius = DESIGN.radius * layout.u * (1 - t) * (w / card.w);

    // Acts. The plane starts neutral (identical to the DOM poster) and eases into
    // gallery lighting as the light ramps up, so the fade-in never dims with a pop.
    s.flat = Math.max(smooth(range(p, PHASES.zoomEnd, PHASES.neutralEnd)), 1 - smooth(s.lightRamp));
    s.pointsAlpha = smooth(range(p, PHASES.neutralEnd, PHASES.neutralEnd + 0.02));
    s.planeAlpha = 1 - range(p, PHASES.neutralEnd + 0.02, PHASES.handoffEnd);
    s.depthT = range(p, PHASES.handoffEnd, PHASES.depthEnd);
    s.flyT = range(p, PHASES.depthEnd, PHASES.flyEnd);
    s.round = smooth(range(p, PHASES.handoffEnd, PHASES.handoffEnd + 0.05));
    s.cloud = 1 - smooth(range(p, PHASES.flyEnd - 0.08, PHASES.flyEnd));

    // Camera: head-on throughout (1 world unit = 1 CSS px on z = 0 at rest). In the
    // fly-through it accelerates straight in, through the cloud and past the image plane.
    const push = s.flyT ** 1.6;
    camera.position.set(0, 0, s.dist * (1 + (POINTS.flyTo - 1) * push));
    camera.rotation.set(0, 0, 0);
    if (lastSize.current.w !== W || lastSize.current.h !== H || camera.fov !== FOV) {
      camera.fov = FOV;
      camera.near = s.dist * 0.02;
      camera.far = s.dist * 6;
      camera.updateProjectionMatrix();
      lastSize.current = { w: W, h: H, fov: FOV };
    }
    camera.updateMatrixWorld();

    // Pointer → world on z = 0 (ray through the possibly yawed camera).
    const ptr = pointer.current;
    let target: THREE.Vector3 | null = null;
    if (ptr.inside) {
      ndc.set((ptr.x / W) * 2 - 1, -(ptr.y / H) * 2 + 1, 0.5).unproject(camera);
      dir.copy(ndc).sub(camera.position).normalize();
      const k = -camera.position.z / dir.z;
      const world = hit.copy(camera.position).addScaledVector(dir, k);
      const decay = Math.exp(-POINTS.pushDamping * dt);
      if (lastPointer.x < 1e5 && dt > 0) {
        const vx = (world.x - lastPointer.x) / dt;
        const vy = (world.y - lastPointer.y) / dt;
        s.pointerVel.set(s.pointerVel.x * decay + vx * (1 - decay), s.pointerVel.y * decay + vy * (1 - decay));
      }
      lastPointer.copy(world);
      s.pointerWorld.copy(world);
      target = world;
    } else {
      s.pointerVel.multiplyScalar(Math.exp(-POINTS.pushDamping * dt));
      lastPointer.set(1e6, 1e6, 0);
    }

    // Light: follows the cursor across the painting (full tier), else rests and drifts.
    const time = state.clock.elapsedTime;
    const rest = item.tuning.lightRest;
    const driftX = Math.sin((2 * Math.PI * time) / LIGHT.driftPeriodS) * LIGHT.driftAmp;
    const driftY = Math.sin((2 * Math.PI * time) / (LIGHT.driftPeriodS * 1.31) + 1.2) * LIGHT.driftAmp;
    let restX = rest[0];
    let restY = rest[1];
    const tap = tapRef.current;
    if (tier === "lite" && tap) {
      restX = clamp01((tap.x - (cx - w / 2)) / w);
      restY = clamp01((tap.y - (cy - h / 2)) / h);
    }
    const restWorld = { x: s.rect.x + (restX + driftX - 0.5) * w, y: s.rect.y + (0.5 - restY - driftY) * h };
    if (tier === "full" && target && p < PHASES.zoomEnd) {
      const mx = w * 0.15;
      const my = h * 0.15;
      lightTarget.set(
        Math.min(s.rect.x + w / 2 + mx, Math.max(s.rect.x - w / 2 - mx, target.x)),
        Math.min(s.rect.y + h / 2 + my, Math.max(s.rect.y - h / 2 - my, target.y)),
        0,
      );
    } else {
      lightTarget.set(restWorld.x, restWorld.y, 0);
    }
    const follow = 1 - Math.exp(-LIGHT.follow * dt);
    if (!started.current) s.light.copy(lightTarget);
    s.light.lerp(lightTarget, follow);

    // The light ramps up on first show (1.2s) and again, quicker, each time the canvas returns.
    if (live && !wasLive.current) {
      rampFrom.current = time;
      rampLength.current = shownOnce.current ? 0.5 : LIGHT.rampMs / 1000;
      shownOnce.current = true;
    }
    wasLive.current = live;
    s.lightRamp = live && rampFrom.current >= 0 ? clamp01((time - rampFrom.current) / rampLength.current) : 0;
    if (!started.current && live) started.current = time;

    // Flat cards tilt toward the cursor; the sheen sits where the light is.
    const tiltTarget = tier === "full" && target && p < PHASES.rest ? [clamp01((target.x - s.rect.x) / w + 0.5) * 2 - 1, clamp01((target.y - s.rect.y) / h + 0.5) * 2 - 1] : [0, 0];
    s.tilt.set(s.tilt.x + (tiltTarget[0] - s.tilt.x) * follow, s.tilt.y + (tiltTarget[1] - s.tilt.y) * follow);
    s.sheenUv.set((s.light.x - s.rect.x) / w + 0.5, (s.light.y - s.rect.y) / h + 0.5);

    // The wall pool (DOM, behind the cards) follows the light.
    const pool = poolRef.current;
    if (pool) {
      pool.style.setProperty("--pool-x", `${(s.light.x + W / 2).toFixed(1)}px`);
      pool.style.setProperty("--pool-y", `${(H / 2 - s.light.y).toFixed(1)}px`);
      pool.style.setProperty("--pool-o", (s.lightRamp * (1 - s.zoomT)).toFixed(3));
    }
  }, -1);

  return null;
}

// ---------------------------------------------------------------------------

function Lights({ frame, relief }: { frame: RefObject<FrameState>; relief: boolean }) {
  const spot = useMemo(() => {
    const light = new THREE.SpotLight(LIGHT.color, 0, 0, (LIGHT.angleDeg * Math.PI) / 180, LIGHT.penumbra, 0);
    return light;
  }, []);
  const hemi = useMemo(() => new THREE.HemisphereLight("#fff4e6", "#2a2622", 1.1), []);
  useEffect(() => () => {
    spot.dispose();
    hemi.dispose();
  }, [spot, hemi]);

  useFrame(() => {
    const s = frame.current;
    if (!s) return;
    const h = s.rect.h;
    // Grazing: up-left of the lit point, low over the canvas.
    spot.position.set(s.light.x - h * 0.3, s.light.y + h * 0.32, h * LIGHT.heightOfPlane);
    spot.target.position.copy(s.light);
    spot.target.updateMatrixWorld();
    spot.intensity = relief ? 4.2 * s.lightRamp : 0;
    hemi.intensity = 1.1;
  });

  return (
    <>
      <primitive object={spot} />
      <primitive object={spot.target} />
      <primitive object={hemi} />
    </>
  );
}

function Renderer({ cache, onLost }: { cache: TextureCache; onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  const lostRef = useRef(onLost);
  lostRef.current = onLost;
  useEffect(() => {
    cache.gl = gl;
    cache.maxAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      // The context is already gone; R3F's unmount would ask three to lose it again (and warn).
      gl.forceContextLoss = () => {};
      lostRef.current();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      cache.gl = null;
    };
  }, [gl, cache]);
  return null;
}

// ---------------------------------------------------------------------------

export default function HeroCanvas({
  tier,
  item,
  prefetch,
  show,
  progress,
  layoutRef,
  layoutVersion,
  frontImageRef,
  stickyRef,
  poolRef,
  tapRef,
  onLiveChange,
  onContextLost,
}: HeroCanvasProps) {
  const frame = useRef<FrameState>(createFrameState());
  const cache = useMemo(() => new TextureCache(), []);
  const [loaded, setLoaded] = useState<{ key: string; textures: ItemTextures } | null>(null);
  const [renderedKey, setRenderedKey] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const restRect = useRef<Rect | null>(null);
  const pointer = useRef({ x: 0, y: 0, inside: false, t: 0 });
  const key = keyOf(item);

  useEffect(() => () => cache.dispose(), [cache]);

  // Current item's textures.
  useEffect(() => {
    let cancelled = false;
    cache.load(item).then((textures) => {
      if (!cancelled) setLoaded({ key: keyOf(item), textures });
    });
    return () => {
      cancelled = true;
    };
  }, [item, cache]);

  // Prefetch neighbours + the other mode's selection on idle; drop everything else.
  const prefetchKey = prefetch.map(keyOf).join("|");
  useEffect(() => {
    cache.retain([key, ...prefetch.map(keyOf)]);
    if (!show || !loaded || loaded.key !== key) return;
    let cancelled = false;
    const id = idle(() => prefetch.forEach((next) => cache.load(next).then((t) => cache.warm(t, () => cancelled))));
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      window.clearTimeout(id);
    };
    // prefetchKey stands in for the prefetch array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, prefetchKey, loaded, cache, show]);

  // DOM is the source of truth for the card rect: re-read on settle, resize and scroll at rest.
  const readRest = useCallback(() => {
    const el = frontImageRef.current;
    const sticky = stickyRef.current;
    if (!el || !sticky) return;
    // Mid-scroll the DOM card is transformed; fall back to the measured layout.
    if (progress.get() >= PHASES.rest) {
      restRect.current = null;
      return;
    }
    const a = el.getBoundingClientRect();
    const b = sticky.getBoundingClientRect();
    restRect.current = { cx: a.left - b.left + a.width / 2, cy: a.top - b.top + a.height / 2, w: a.width, h: a.height };
  }, [frontImageRef, stickyRef, progress]);

  useEffect(() => {
    if (show) readRest();
    else restRect.current = null;
  }, [show, key, readRest]);
  useEffect(() => layoutVersion.on("change", () => (show ? readRest() : undefined)), [layoutVersion, readRest, show]);

  // Pointer, tracked on window (the canvas itself never takes pointer events).
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const sticky = stickyRef.current;
      if (!sticky) return;
      const r = sticky.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      pointer.current = { x, y, inside: x >= 0 && y >= 0 && x <= r.width && y <= r.height && event.pointerType !== "touch", t: performance.now() };
    };
    const leave = () => (pointer.current = { ...pointer.current, inside: false });
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [stickyRef]);

  // Pause when the hero is fully off-screen or the tab is hidden.
  useEffect(() => {
    const sticky = stickyRef.current;
    let onScreen = true;
    const update = () => setRunning(onScreen && !document.hidden);
    const observer = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      update();
    });
    if (sticky) observer.observe(sticky);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [stickyRef]);

  // Wall tint follows the selected item (CSS transitions it over 600ms).
  useEffect(() => {
    const pool = poolRef.current;
    if (!pool) return;
    const tint = new THREE.Color(LIGHT.color).lerp(new THREE.Color(item.avgColor), 0.55);
    pool.style.setProperty("--pool-tint", `rgb(${Math.round(tint.r * 255)} ${Math.round(tint.g * 255)} ${Math.round(tint.b * 255)} / 0.075)`);
  }, [item, poolRef]);

  const textures = loaded && loaded.key === key ? loaded.textures : null;
  // WebGL objects for an item are built once the selection settles and kept while it stays selected.
  const [mountedKey, setMountedKey] = useState<string | null>(null);
  useEffect(() => {
    if (show && textures) setMountedKey(key);
  }, [show, textures, key]);
  const mounted = textures && mountedKey === key;
  const visible = show && !!textures && renderedKey === key;
  useEffect(() => onLiveChange(visible), [visible, onLiveChange]);
  useEffect(() => () => onLiveChange(false), [onLiveChange]);

  const onRendered = useCallback(() => setRenderedKey(key), [key]);
  // A remounted plane must draw again before the canvas is shown.
  useEffect(() => setRenderedKey(null), [key]);
  const pointTier = tier === "full" ? "full" : "lite";

  return (
    <div className={styles.canvas} data-visible={visible} aria-hidden="true">
      <Canvas
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        dpr={tier === "full" ? DPR.full : DPR.lite}
        flat
        frameloop={running ? "always" : "never"}
        camera={{ fov: FOV, near: 1, far: 100000, position: [0, 0, 1000] }}
        style={{ pointerEvents: "none" }}
      >
        <Renderer cache={cache} onLost={onContextLost} />
        <Director
          tier={tier}
          item={item}
          frame={frame}
          progress={progress}
          layoutRef={layoutRef}
          restRect={restRect}
          pointer={pointer}
          tapRef={tapRef}
          poolRef={poolRef}
          live={visible}
        />
        <Lights frame={frame} relief={item.tuning.relief} />
        {mounted && <FrontCard key={key} item={item} textures={textures} frame={frame} onRendered={onRendered} />}
        {mounted && (
          <ImagePoints key={`${key}-${pointTier}`} item={item} textures={textures} pointTier={pointTier} push={tier === "full"} frame={frame} />
        )}
      </Canvas>
    </div>
  );
}
