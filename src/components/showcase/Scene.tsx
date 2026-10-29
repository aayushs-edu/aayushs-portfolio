"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { createCameraPath } from "./cameraPath";
import { detailPose } from "./cameraPose";
import { Floor } from "./Floor";
import { EYE, FOV_Y, type Vec3 } from "./layouts/types";
import PaintingMesh from "./PaintingMesh";
import { arcLerp, stationOf, toWorld } from "./room/ring";
import type { RoomLayout } from "./room/types";
import ScreenMesh from "./ScreenMesh";
import type { ScrollSample } from "./scrollMap";
import type { AnimationLayout } from "./stations/animation";
import AnimationStation from "./stations/AnimationStation";
import type { PaintwiseLayout } from "./stations/paintwise/layout";
import PaintwiseStation from "./stations/paintwise/PaintwiseStation";
import type { SalonLayout } from "./stations/salon";
import SalonStation from "./stations/SalonStation";
import { SHOWCASE, type SceneTier } from "./showcaseConfig";
import { InteractionContext, type WorkInteraction } from "./workMesh";
import type { Work } from "./works";

export interface SceneProps {
  tier: SceneTier;
  room: RoomLayout;
  works: ReadonlyMap<string, Work>;
  /** Beat index by key (every "work:<slug>" names the beat that presents it) */
  beatOf: ReadonlyMap<string, number>;
  /** Where the scroll is (written by the showcase every frame) */
  scroll: RefObject<ScrollSample>;
  openSlug: string | null;
  /** Run the frame loop (the scene is on screen and showing) */
  active: boolean;
  /** Holds the captions (data-caption) and station labels (data-label) the scene positions */
  overlay: RefObject<HTMLDivElement | null>;
  /** Bumped by the showcase on every jump to another station: the camera arcs there from where it was. */
  jump: RefObject<number>;
  /** Load every station's images now, not only the near ones */
  loadAll: boolean;
  /** Something is shown full size over the scene: no picking */
  paused: boolean;
  /** Where Paintwise's figure is on screen (written by its station) */
  figureRect: RefObject<DOMRect | null>;
  /** Where the open film is on screen (written by the animation station) */
  filmRect: RefObject<DOMRect | null>;
  onOpen: (slug: string) => void;
  onFigure: () => void;
  onContextLost: () => void;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smoothstep = (e0: number, e1: number, x: number) => smooth(Math.min(1, Math.max(0, (x - e0) / (e1 - e0))));

/**
 * The camera: along the room's path with scroll (dollying through the gap
 * during the entrance), arcing round the centre on a jump to another station,
 * into a work when it's open, and a little toward the cursor. Also positions
 * the captions.
 */
function Rig({ tier, room, beatOf, scroll, openSlug, overlay, jump, onBeat }: Pick<SceneProps, "tier" | "room" | "beatOf" | "scroll" | "openSlug" | "overlay" | "jump"> & { onBeat: (beat: number) => void }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const path = useMemo(() => createCameraPath(room.cameraPath), [room]);
  const placements = useMemo(() => new Map(room.placements.map((p) => [p.slug, p])), [room]);
  const v = useMemo(
    () => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), p0: new THREE.Vector3(), t0: new THREE.Vector3(), dir: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }),
    [],
  );
  const flight = useRef({ blend: 0, slug: null as string | null });
  const arc = useRef({ seen: jump.current ?? 0, blend: 0, from: new THREE.Vector3(), fromTarget: new THREE.Vector3(), out: [0, 0, 0] as Vec3 });
  const last = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3(), set: false });
  const look = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const key = useRef<THREE.DirectionalLight | null>(null);
  const nearBeat = useRef(Number.NaN);
  const elements = useRef<[string, HTMLElement][] | null>(null);
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

  // The overlay's captions, found again whenever the room changes.
  useEffect(() => {
    elements.current = null;
  }, [room]);

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

    // A jump to another station: from where the camera was, round the centre to the path.
    const A = arc.current;
    if ((jump.current ?? 0) !== A.seen) {
      A.seen = jump.current ?? 0;
      if (last.current.set) {
        A.from.copy(last.current.position);
        A.fromTarget.copy(last.current.target);
        A.blend = 1;
      }
    }
    if (A.blend > 0) {
      A.blend = Math.max(0, A.blend - dt / SHOWCASE.jump.seconds);
      const e = easeInOutCubic(1 - A.blend);
      const p = arcLerp([A.from.x, A.from.y, A.from.z], [v.pos.x, v.pos.y, v.pos.z], room.floor.centre, e, A.out);
      v.pos.set(p[0], p[1], p[2]);
      v.tgt.lerpVectors(A.fromTarget, v.tgt, e);
    }
    last.current.position.copy(v.pos);
    last.current.target.copy(v.tgt);
    last.current.set = true;

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

    // Captions.
    const root = overlay.current;
    if (root && !elements.current) elements.current = [...root.querySelectorAll<HTMLElement>("[data-caption]")].map((el) => [el.dataset.caption!, el]);
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
    for (const [slug, el] of elements.current ?? []) {
      const p = placements.get(slug);
      const beat = beatOf.get(`work:${slug}`);
      if (!p || beat === undefined) continue;
      let opacity = (1 - smoothstep(SHOWCASE.caption.fade[0], SHOWCASE.caption.fade[1], Math.abs(s.beat - beat))) * (1 - fly);
      v.a.set(p.position[0], p.position[1] - p.height / 2 - 0.1, p.position[2]).project(camera);
      if (v.a.z > 1) opacity = 0;
      set(el, opacity, `translate3d(${(((v.a.x + 1) / 2) * W).toFixed(1)}px, ${Math.min(H - 76, ((1 - v.a.y) / 2) * H).toFixed(1)}px, 0) translate(-50%, 0)`);
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

function SceneContents({ tier, room, works, beatOf, scroll, openSlug, active, overlay, jump, loadAll, paused, figureRect, filmRect, onOpen, onFigure }: SceneProps) {
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
    interaction.enabled.current = !openSlug && !paused;
    if (openSlug || paused) {
      interaction.hover.current = null;
      document.body.style.cursor = "";
    }
  }, [openSlug, paused, interaction]);
  useEffect(() => () => void (document.body.style.cursor = ""), []);

  // Compile and draw one frame up front, so the scene is ready the moment the hero opens.
  useEffect(() => {
    gl.compile(scene, camera);
    advance(performance.now());
  }, [gl, scene, camera, advance]);

  const centre = stationOf(room, "paintwise");
  const salon = stationOf(room, "paintings");
  const animation = stationOf(room, "animation");
  const wanted = (slug: string) => loadAll || Math.abs((beatOf.get(`work:${slug}`) ?? 0) - near) <= SHOWCASE.streamBeats;

  return (
    <InteractionContext.Provider value={interaction}>
      <ambientLight color="#fff4e6" intensity={1.05} />
      {tier === "full" &&
        room.stations.map((station) => (
          <pointLight
            key={station.id}
            position={toWorld([0, SHOWCASE.stationLight.height, SHOWCASE.stationLight.ahead], station.at)}
            color="#fff0dc"
            intensity={SHOWCASE.stationLight.intensity}
            decay={2}
          />
        ))}
      <Floor centre={room.floor.centre} radius={room.floor.radius} effects={tier === "full"} />
      {/* The stations that show their works as they are: the arcs of screens. */}
      {room.placements.map((placement) => {
        const work = works.get(placement.slug);
        if (!work || (work.group !== "hackathons" && work.group !== "games")) return null;
        return work.kind === "painting" ? (
          <PaintingMesh key={work.slug} work={work} placement={placement} wanted={wanted(work.slug)} relief={tier === "full"} />
        ) : (
          <ScreenMesh key={work.slug} work={work} placement={placement} wanted={wanted(work.slug)} />
        );
      })}
      {salon && <SalonStation layout={salon.layout as SalonLayout} station={salon} tier={tier} works={works} scroll={scroll} openSlug={openSlug} wanted={wanted} />}
      {animation && (
        <AnimationStation
          layout={animation.layout as AnimationLayout}
          station={animation}
          tier={tier}
          scroll={scroll}
          openSlug={openSlug}
          active={active}
          wanted={wanted}
          filmRect={filmRect}
        />
      )}
      {centre && (
        <PaintwiseStation
          layout={centre.layout as PaintwiseLayout}
          station={centre}
          tier={tier}
          scroll={scroll}
          openSlug={openSlug}
          wanted={loadAll || near <= centre.first + centre.count + SHOWCASE.streamBeats}
          overlay={overlay}
          figureRect={figureRect}
          onFigure={onFigure}
        />
      )}
      <Rig tier={tier} room={room} beatOf={beatOf} scroll={scroll} openSlug={openSlug} overlay={overlay} jump={jump} onBeat={setNear} />
    </InteractionContext.Provider>
  );
}

/**
 * The 3D scene of the work: one round room, dark with light fog, a floor of
 * linen and dots, Paintwise at its centre and the other stations round it.
 * Loaded lazily by the showcase.
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
