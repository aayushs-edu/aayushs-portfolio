"use client";

// The animation station, drawn from its pure layout: the films as floating
// screens playing their short muted loops (only while the camera is here),
// the Wild West storyboard round the first, and the 3D models, turning on
// their plinths. An open model can be turned by dragging (or the arrow keys);
// an open film's place on screen is written out for the full film's player.

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import ImagePanel, { type ImagePanelHandle } from "../panels/ImagePanel";
import { poseAt, presenceAt } from "../panels/pose";
import type { PanelPose, RoomStation } from "../room/types";
import type { ScrollSample } from "../scrollMap";
import { SHOWCASE, type SceneTier } from "../showcaseConfig";
import { useWorkPointer, useWorkTexture } from "../workMesh";
import type { AnimationLayout, AnimationPanel } from "./animation";

interface AnimationStationProps {
  layout: AnimationLayout;
  station: RoomStation;
  tier: SceneTier;
  scroll: RefObject<ScrollSample>;
  openSlug: string | null;
  /** The scene is drawing (videos pause when it isn't) */
  active: boolean;
  wanted: (slug: string) => boolean;
  /** Written every frame while a film is open: where it is on screen. */
  filmRect: RefObject<DOMRect | null>;
}

const TURNTABLE = 0.35;
const ORBIT = { drag: 0.008, key: 0.25, pitch: 0.6 };

// ---- a film: its loop as a video texture, its poster until the loop plays ---------------

interface FilmHandle {
  setOpacity(o: number): void;
  setPlaying(playing: boolean): void;
}

function FilmPanel({ panel, wanted, handle }: { panel: AnimationPanel; wanted: boolean; handle: (h: FilmHandle | null) => void }) {
  const poster = useWorkTexture(panel.src ?? undefined, wanted, true);
  const { lift, handlers } = useWorkPointer(panel.slug!);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);

  // The loop: a muted, inline video, made once the film is wanted.
  useEffect(() => {
    if (!wanted || !panel.loop) return;
    const el = document.createElement("video");
    el.src = panel.loop;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = "auto";
    const onPlaying = () => {
      setTexture((current) => {
        if (current) return current;
        const t = new THREE.VideoTexture(el);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      });
    };
    el.addEventListener("playing", onPlaying);
    setVideo(el);
    return () => {
      el.removeEventListener("playing", onPlaying);
      el.pause();
      el.removeAttribute("src");
      el.load();
      setVideo(null);
    };
  }, [wanted, panel.loop]);
  useEffect(() => () => texture?.dispose(), [texture]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0 }), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.8, transparent: true, opacity: 0 }), []);
  useEffect(
    () => () => {
      material.dispose();
      frame.dispose();
    },
    [material, frame],
  );
  useEffect(() => {
    const map = texture ?? poster;
    material.map = map;
    material.color.set(map ? "#ececec" : panel.color);
    material.needsUpdate = true;
  }, [material, texture, poster, panel.color]);

  const playing = useRef(false);
  useEffect(() => {
    handle({
      setOpacity(o) {
        material.opacity = o;
        material.depthWrite = o > 0.98;
        frame.opacity = o;
      },
      setPlaying(play) {
        if (!video || play === playing.current) return;
        playing.current = play;
        if (play) void video.play().catch(() => (playing.current = false));
        else video.pause();
      },
    });
    return () => handle(null);
  }, [handle, material, frame, video]);

  const bezel = 0.04;
  return (
    <group ref={lift} {...handlers}>
      <mesh position-z={-0.012} material={frame}>
        <boxGeometry args={[panel.width + bezel * 2, panel.height + bezel * 2, 0.02]} />
      </mesh>
      <mesh material={material}>
        <planeGeometry args={[panel.width, panel.height]} />
      </mesh>
    </group>
  );
}

// ---- a model: a compressed GLB, fitted to its box, turning on a plinth ------------------

let loader: GLTFLoader | null = null;
function gltfLoader(): GLTFLoader {
  if (loader) return loader;
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  return loader;
}

function ModelPanel({ panel, wanted, spin }: { panel: AnimationPanel; wanted: boolean; spin: RefObject<THREE.Group | null> }) {
  const { lift, handlers } = useWorkPointer(panel.slug!);
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!wanted || !panel.model || model) return;
    let cancelled = false;
    gltfLoader()
      .loadAsync(panel.model)
      .then((gltf) => {
        if (cancelled) return;
        const root = gltf.scene;
        // Fit it to the panel's box, standing on the plinth.
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const scale = panel.width / Math.max(size.x, size.y, size.z, 1e-6);
        const centre = box.getCenter(new THREE.Vector3());
        root.position.set(-centre.x * scale, -box.min.y * scale - panel.height / 2, -centre.z * scale);
        root.scale.setScalar(scale);
        const holder = new THREE.Group();
        holder.add(root);
        setModel(holder);
      })
      .catch(() => {
        // The plinth stays; the caption and the story still work.
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, panel.model, panel.width, panel.height, model]);

  return (
    <group ref={lift} {...handlers}>
      <group ref={spin}>{model && <primitive object={model} />}</group>
      <mesh position-y={-panel.height / 2 - 0.02}>
        <cylinderGeometry args={[panel.width * 0.42, panel.width * 0.45, 0.04, 40]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.6} />
      </mesh>
      {/* What the pointer finds before the model has loaded. */}
      <mesh visible={false}>
        <boxGeometry args={[panel.width, panel.height, panel.width]} />
      </mesh>
    </group>
  );
}

// ---- the station ----------------------------------------------------------------------

export default function AnimationStation({ layout, station, tier, scroll, openSlug, active, wanted, filmRect }: AnimationStationProps) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const groups = useRef(new Map<string, THREE.Group>());
  const images = useRef(new Map<string, ImagePanelHandle>());
  const films = useRef(new Map<string, FilmHandle>());
  const spins = useMemo(() => new Map(layout.panels.filter((p) => p.kind === "model").map((p) => [p.id, { current: null } as RefObject<THREE.Group | null>])), [layout]);
  const presentedAt = useMemo(() => {
    const map = new Map<string, number>();
    layout.beats.forEach((beat, i) => {
      const slugs = beat.slugs ?? (beat.key.startsWith("work:") ? [beat.key.slice(5)] : []);
      slugs.forEach((slug) => map.has(slug) || map.set(slug, i));
    });
    return map;
  }, [layout]);
  const state = useRef({ open: 0 });
  const orbit = useRef({ yaw: 0, pitch: 0 });
  const scratch = useMemo(() => ({ pose: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, opacity: 1 } as PanelPose, p: new THREE.Vector3() }), []);
  const count = layout.beats.length;
  const lift = tier === "full" ? SHOWCASE.drift.lift : 0;
  const openPanel = layout.panels.find((p) => p.slug && p.slug === openSlug);

  // An open model turns with the pointer and the arrow keys.
  useEffect(() => {
    if (!openPanel || openPanel.kind !== "model") return;
    orbit.current = { yaw: spins.get(openPanel.id)?.current?.rotation.y ?? 0, pitch: 0 };
    const el = gl.domElement;
    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      orbit.current.yaw += (e.clientX - last.x) * ORBIT.drag;
      orbit.current.pitch = Math.max(-ORBIT.pitch, Math.min(ORBIT.pitch, orbit.current.pitch + (e.clientY - last.y) * ORBIT.drag));
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      last = null;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") orbit.current.yaw -= ORBIT.key;
      else if (e.key === "ArrowRight") orbit.current.yaw += ORBIT.key;
      else if (e.key === "ArrowUp") orbit.current.pitch = Math.max(-ORBIT.pitch, orbit.current.pitch - ORBIT.key);
      else if (e.key === "ArrowDown") orbit.current.pitch = Math.min(ORBIT.pitch, orbit.current.pitch + ORBIT.key);
      else return;
      e.preventDefault();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    el.style.cursor = "grab";
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
      el.style.cursor = "";
    };
  }, [openPanel, gl, spins]);

  useFrame((frameState, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = scroll.current;
    if (!s) return;
    const S = state.current;
    const home = openPanel?.slug ? (presentedAt.get(openPanel.slug) ?? 0) : 0;
    S.open += ((openPanel ? 1 : 0) - S.open) * (1 - Math.exp(-6 * dt));
    const raw = s.beat - station.first;
    const u = raw + (home - raw) * S.open;
    const presence = Math.max(presenceAt(u, count), S.open);
    const t = frameState.clock.elapsedTime;

    layout.panels.forEach((panel, i) => {
      const group = groups.current.get(panel.id);
      if (!group) return;
      const pose = poseAt(panel.poses, panel.idle, u, presence, scratch.pose);
      group.position.set(pose.position[0], pose.position[1] + lift * Math.sin(0.55 * t + i * 1.9), pose.position[2]);
      group.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
      group.scale.setScalar(pose.scale);

      if (panel.kind === "still") images.current.get(panel.id)?.setOpacity(pose.opacity);
      if (panel.kind === "film") {
        const film = films.current.get(panel.id);
        film?.setOpacity(pose.opacity);
        const front = Math.abs(u - (presentedAt.get(panel.slug!) ?? -9)) < 0.5;
        // Loops play while the camera is here (lite: only the film in front); never under the open film's player.
        film?.setPlaying(active && presence > 0.3 && (tier === "full" || front) && openSlug !== panel.slug);
      }
      if (panel.kind === "model") {
        const spin = spins.get(panel.id)?.current;
        if (spin) {
          if (openSlug === panel.slug) {
            spin.rotation.y += (orbit.current.yaw - spin.rotation.y) * (1 - Math.exp(-10 * dt));
            spin.rotation.x += (orbit.current.pitch - spin.rotation.x) * (1 - Math.exp(-10 * dt));
          } else {
            spin.rotation.y += dt * TURNTABLE;
            spin.rotation.x *= 1 - Math.min(1, 4 * dt);
          }
        }
      }
    });

    // Where the open film is on screen, for the full film's player.
    if (openPanel?.kind === "film") {
      const group = groups.current.get(openPanel.id);
      if (group) {
        group.updateMatrixWorld(true);
        const rect = gl.domElement.getBoundingClientRect();
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          scratch.p.set((sx * openPanel.width) / 2, (sy * openPanel.height) / 2, 0);
          group.localToWorld(scratch.p).project(camera);
          const x = rect.left + ((scratch.p.x + 1) / 2) * rect.width;
          const y = rect.top + ((1 - scratch.p.y) / 2) * rect.height;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
        filmRect.current = new DOMRect(minX, minY, maxX - minX, maxY - minY);
      }
    } else {
      filmRect.current = null;
    }
  });

  return (
    <group position={station.at.position} rotation-y={station.at.yaw}>
      {layout.panels.map((panel) => (
        <group
          key={panel.id}
          ref={(g) => {
            if (g) groups.current.set(panel.id, g);
            else groups.current.delete(panel.id);
          }}
        >
          {panel.kind === "film" && (
            <FilmPanel
              panel={panel}
              wanted={wanted(panel.slug!)}
              handle={(h) => {
                if (h) films.current.set(panel.id, h);
                else films.current.delete(panel.id);
              }}
            />
          )}
          {panel.kind === "still" && (
            <ImagePanel
              ref={(h) => {
                if (h) images.current.set(panel.id, h);
                else images.current.delete(panel.id);
              }}
              src={panel.src ?? null}
              width={panel.width}
              height={panel.height}
              color={panel.color}
              wanted={wanted(layout.panels.find((p) => p.kind === "film")?.slug ?? "")}
              lit={false}
            />
          )}
          {panel.kind === "model" && <ModelPanel panel={panel} wanted={wanted(panel.slug!)} spin={spins.get(panel.id)!} />}
        </group>
      ))}
    </group>
  );
}
