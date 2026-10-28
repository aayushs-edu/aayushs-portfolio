"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { createCameraPath } from "./cameraPath";
import { detailPose } from "./cameraPose";
import { Floor, Gate } from "./Floor";
import { EYE, FOV_Y, type SceneLayout } from "./layouts/types";
import PaintingMesh from "./PaintingMesh";
import ScreenMesh from "./ScreenMesh";
import type { ScrollSample } from "./scrollMap";
import { SHOWCASE, type SceneTier } from "./showcaseConfig";
import { InteractionContext, type WorkInteraction } from "./workMesh";
import type { Work } from "./works";

export interface SceneProps {
  tier: SceneTier;
  layout: SceneLayout;
  works: ReadonlyMap<string, Work>;
  /** Beat index by key ("work:<slug>", "title:<key>") */
  beatOf: ReadonlyMap<string, number>;
  /** Where the scroll is (written by the showcase every frame) */
  scroll: RefObject<ScrollSample>;
  openSlug: string | null;
  /** Run the frame loop (the scene is on screen and showing) */
  active: boolean;
  /** Holds the captions and titles (data-caption / data-title) the scene positions */
  overlay: RefObject<HTMLDivElement | null>;
  onOpen: (slug: string) => void;
  onContextLost: () => void;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smoothstep = (e0: number, e1: number, x: number) => smooth(Math.min(1, Math.max(0, (x - e0) / (e1 - e0))));

/** The camera: along the path with scroll (dollying through the gap during the entrance), into a work when it's open, and a little toward the cursor. Also positions the DOM overlay. */
function Rig({ tier, layout, beatOf, scroll, openSlug, overlay, onBeat }: Pick<SceneProps, "tier" | "layout" | "beatOf" | "scroll" | "openSlug" | "overlay"> & { onBeat: (beat: number) => void }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const path = useMemo(() => createCameraPath(layout.cameraPath), [layout]);
  const placements = useMemo(() => new Map(layout.placements.map((p) => [p.slug, p])), [layout]);
  const v = useMemo(
    () => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), p0: new THREE.Vector3(), t0: new THREE.Vector3(), dir: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }),
    [],
  );
  const flight = useRef({ blend: 0, slug: null as string | null });
  const look = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const key = useRef<THREE.DirectionalLight | null>(null);
  const nearBeat = useRef(Number.NaN);
  const elements = useRef<{ captions: [string, HTMLElement][]; titles: [string, HTMLElement][] } | null>(null);
  const shown = useRef(new Map<HTMLElement, number>());

  // Look-around toward the cursor (fine pointers on the full tier only).
  useEffect(() => {
    if (tier !== "full" || !window.matchMedia("(pointer: fine)").matches) return;
    const max = (SHOWCASE.look.degrees * Math.PI) / 180;
    const onMove = (event: PointerEvent) => {
      look.current.tx = -((event.clientX / window.innerWidth) * 2 - 1) * max;
      look.current.ty = (1 - (event.clientY / window.innerHeight) * 2) * max;
    };
    const onLeave = () => {
      look.current.tx = 0;
      look.current.ty = 0;
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [tier]);

  // The overlay's elements, found again whenever the layout changes.
  useEffect(() => {
    elements.current = null;
  }, [layout]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = scroll.current;
    if (!s) return;

    // The path; during the entrance, back along the first view so the camera moves forward through the gap.
    path.at(s.t, v.pos, v.tgt);
    if (s.entrance < 1) {
      path.at(0, v.p0, v.t0);
      v.dir.subVectors(v.t0, v.p0).setY(0).normalize();
      const back = (1 - smooth(s.entrance)) * SHOWCASE.dolly;
      v.pos.addScaledVector(v.dir, -back);
      v.tgt.addScaledVector(v.dir, -back);
    }

    // Flying in to an open work, and back out.
    const f = flight.current;
    if (openSlug) f.slug = openSlug;
    const step = dt / SHOWCASE.flight.seconds;
    f.blend = openSlug ? Math.min(1, f.blend + step) : Math.max(0, f.blend - step);
    if (!openSlug && f.blend === 0) f.slug = null;
    const fly = easeInOutCubic(f.blend);
    const placement = f.slug ? placements.get(f.slug) : undefined;
    if (placement && fly > 0) {
      const pose = detailPose(placement, size, SHOWCASE.flight.fill);
      v.pos.lerp(v.a.set(...pose.position), fly);
      v.tgt.lerp(v.b.set(...pose.target), fly);
    }
    camera.position.copy(v.pos);
    camera.lookAt(v.tgt);

    // A little toward the cursor, never while a work is open.
    const L = look.current;
    const k = 1 - Math.exp(-SHOWCASE.look.follow * dt);
    L.x += (L.tx * (1 - fly) - L.x) * k;
    L.y += (L.ty * (1 - fly) - L.y) * k;
    camera.rotateY(L.x);
    camera.rotateX(L.y);
    camera.updateMatrixWorld();

    // The key light rides with the camera, warm, from the upper left.
    const light = key.current;
    if (light) {
      light.position.copy(camera.localToWorld(v.a.set(-2.4, 3, 2.6)));
      light.target.position.copy(camera.localToWorld(v.b.set(0, 0, -6)));
      light.target.updateMatrixWorld();
    }

    // Captions and titles.
    const root = overlay.current;
    if (root && !elements.current) {
      elements.current = {
        captions: [...root.querySelectorAll<HTMLElement>("[data-caption]")].map((el) => [el.dataset.caption!, el]),
        titles: [...root.querySelectorAll<HTMLElement>("[data-title]")].map((el) => [el.dataset.title!, el]),
      };
    }
    const set = (el: HTMLElement, opacity: number, transform: string) => {
      const was = shown.current.get(el) ?? -1;
      if (opacity <= 0.001) {
        if (was !== 0) {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
          shown.current.set(el, 0);
        }
        return;
      }
      el.style.opacity = opacity.toFixed(3);
      el.style.visibility = "visible";
      el.style.pointerEvents = opacity > 0.6 ? "auto" : "none";
      el.style.transform = transform;
      shown.current.set(el, opacity);
    };
    const W = size.width;
    const H = size.height;
    for (const [slug, el] of elements.current?.captions ?? []) {
      const p = placements.get(slug);
      const beat = beatOf.get(`work:${slug}`);
      if (!p || beat === undefined) continue;
      let opacity = (1 - smoothstep(SHOWCASE.caption.fade[0], SHOWCASE.caption.fade[1], Math.abs(s.beat - beat))) * (1 - fly);
      v.a.set(p.position[0], p.position[1] - p.height / 2 - 0.1, p.position[2]).project(camera);
      if (v.a.z > 1) opacity = 0;
      set(el, opacity, `translate3d(${(((v.a.x + 1) / 2) * W).toFixed(1)}px, ${Math.min(H - 76, ((1 - v.a.y) / 2) * H).toFixed(1)}px, 0) translate(-50%, 0)`);
    }
    for (const [keyName, el] of elements.current?.titles ?? []) {
      const title = layout.titles.find((t) => t.key === keyName);
      const beat = beatOf.get(`title:${keyName}`);
      if (!title || beat === undefined) continue;
      v.a.set(...title.position);
      const distance = v.a.distanceTo(camera.position);
      v.a.project(camera);
      let opacity = (1 - smoothstep(SHOWCASE.title.fade[0], SHOWCASE.title.fade[1], Math.abs(s.beat - beat))) * (1 - fly);
      if (v.a.z > 1) opacity = 0;
      const scale = Math.min(2.2, Math.max(0.25, 6 / Math.max(0.1, distance)));
      set(el, opacity, `translate3d(${(((v.a.x + 1) / 2) * W).toFixed(1)}px, ${(((1 - v.a.y) / 2) * H).toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`);
    }

    // Which works should have their textures (React state, changes once per beat).
    const near = Math.round(Math.max(0, s.beat));
    if (near !== nearBeat.current) {
      nearBeat.current = near;
      onBeat(near);
    }
  });

  return <directionalLight ref={key} color="#fff0dc" intensity={2.5} />;
}

function SceneContents({ tier, layout, works, beatOf, scroll, openSlug, overlay, onOpen }: SceneProps) {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const advance = useThree((s) => s.advance);
  const [near, setNear] = useState(0);

  useEffect(() => {
    scene.background = new THREE.Color(SHOWCASE.background);
    scene.fog = new THREE.FogExp2(SHOWCASE.background, SHOWCASE.fog);
  }, [scene]);

  // Hover and click, shared with the works.
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const interaction = useMemo<WorkInteraction>(() => ({ hover: { current: null }, enabled: { current: true }, open: (slug) => onOpenRef.current(slug) }), []);
  useEffect(() => {
    interaction.enabled.current = !openSlug;
    if (openSlug) {
      interaction.hover.current = null;
      document.body.style.cursor = "";
    }
  }, [openSlug, interaction]);
  useEffect(() => () => void (document.body.style.cursor = ""), []);

  // Compile and draw one frame up front, so the scene is ready the moment the hero opens.
  useEffect(() => {
    gl.compile(scene, camera);
    advance(performance.now());
  }, [gl, scene, camera, advance]);

  return (
    <InteractionContext.Provider value={interaction}>
      <ambientLight color="#fff4e6" intensity={1.05} />
      <Floor plan={layout.floor} effects={tier === "full"} />
      {layout.passages.map((passage) => (
        <Gate key={passage.key} passage={passage} />
      ))}
      {layout.placements.map((placement) => {
        const work = works.get(placement.slug);
        if (!work) return null;
        const beat = beatOf.get(`work:${placement.slug}`) ?? 0;
        const wanted = Math.abs(beat - near) <= SHOWCASE.streamBeats;
        return work.kind === "painting" ? (
          <PaintingMesh key={work.slug} work={work} placement={placement} wanted={wanted} relief={tier === "full"} />
        ) : (
          <ScreenMesh key={work.slug} work={work} placement={placement} wanted={wanted} />
        );
      })}
      <Rig tier={tier} layout={layout} beatOf={beatOf} scroll={scroll} openSlug={openSlug} overlay={overlay} onBeat={setNear} />
    </InteractionContext.Provider>
  );
}

/**
 * The 3D scene of the work: a dark space with soft fog, a floor of linen and
 * dots, and the works along the camera's path. Loaded lazily by the showcase.
 */
export default function Scene(props: SceneProps) {
  const { tier, active } = props;
  const lost = useRef(props.onContextLost);
  lost.current = props.onContextLost;

  return (
    <Canvas
      flat
      dpr={SHOWCASE.dpr[tier]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: tier === "full", powerPreference: "high-performance" }}
      camera={{ fov: FOV_Y, near: 0.05, far: 80, position: [0, EYE, SHOWCASE.dolly] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            lost.current();
          },
          { once: true },
        );
      }}
    >
      <SceneContents {...props} />
    </Canvas>
  );
}
