"use client";

// Paintwise at the centre of the room, drawn from its pure layout: every
// frame each panel takes its pose for where the scroll is within the station
// (idle when the camera is elsewhere), the flipbook steps, and the labels
// are pinned to their panels in the DOM overlay.

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useContext, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import ImagePanel, { type ImagePanelHandle } from "../../panels/ImagePanel";
import { placeLabel } from "../../panels/labels";
import { poseAt, presenceAt } from "../../panels/pose";
import type { PanelPose, RoomStation } from "../../room/types";
import type { ScrollSample } from "../../scrollMap";
import { SHOWCASE, type SceneTier } from "../../showcaseConfig";
import { InteractionContext } from "../../workMesh";
import type { PaintwiseLayout } from "./layout";

interface PaintwiseStationProps {
  layout: PaintwiseLayout;
  station: RoomStation;
  tier: SceneTier;
  scroll: RefObject<ScrollSample>;
  openSlug: string | null;
  /** Near enough (or late enough) to load its images */
  wanted: boolean;
  overlay: RefObject<HTMLDivElement | null>;
  /** Written every frame: where the figure is on screen (null while it's hidden), for the hand-off. */
  figureRect: RefObject<DOMRect | null>;
  onFigure: () => void;
}

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const TAU = Math.PI * 2;
/** A panel answers the pointer only when it's mostly in. */
const PICKABLE = 0.3;

export default function PaintwiseStation({ layout, station, tier, scroll, openSlug, wanted, overlay, figureRect, onFigure }: PaintwiseStationProps) {
  const ctx = useContext(InteractionContext);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const spin = useRef<THREE.Group>(null!);
  const handles = useRef(new Map<string, ImagePanelHandle>());
  const labelEls = useRef<Map<string, HTMLElement> | null>(null);
  const state = useRef({ spin: 0, open: 0, clock: 0, frame: -1, stepText: "" });
  const scratch = useMemo(
    () => ({ pose: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, opacity: 0 } as PanelPose, p: new THREE.Vector3(), q: new THREE.Vector3() }),
    [],
  );
  const panelById = useMemo(() => new Map(layout.panels.map((p) => [p.id, p])), [layout]);
  const drift = tier === "full" ? SHOWCASE.drift : { lift: 0, sway: 0 };
  const count = layout.beats.length;
  const steps = layout.steps;

  useFrame((frameState, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = scroll.current;
    if (!s) return;
    const S = state.current;

    // While Paintwise's story is open, its panels glide back to the first beat, where the camera flies in.
    S.open += ((openSlug === station.layout.works[0]?.slug ? 1 : 0) - S.open) * (1 - Math.exp(-6 * dt));
    const raw = s.beat - station.first;
    const u = raw + (0 - raw) * S.open;
    const presence = presenceAt(u, count);

    // Idle, the sculpture turns; arriving, it comes back square to the room.
    S.spin += dt * SHOWCASE.spin * (1 - presence);
    if (presence > 0) {
      const home = Math.round(S.spin / TAU) * TAU;
      S.spin += (home - S.spin) * (1 - Math.exp(-3 * dt * presence));
    }
    spin.current.rotation.y = S.spin;

    const t = frameState.clock.elapsedTime;
    layout.panels.forEach((panel, i) => {
      const handle = handles.current.get(panel.id);
      if (!handle) return;
      const pose = poseAt(panel.poses, panel.idle, u, presence, scratch.pose);
      const g = handle.group;
      g.position.set(pose.position[0], pose.position[1] + drift.lift * Math.sin(0.6 * t + i * 1.7), pose.position[2]);
      g.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2] + drift.sway * Math.sin(0.4 * t + i));
      g.scale.setScalar(pose.scale);
      handle.setOpacity(pose.opacity);
    });
    spin.current.updateMatrixWorld(true);

    // The flipbook plays from the steps beat on; elsewhere it rests on its last step.
    const playing = presence > 0.5 && u > 2.5;
    if (playing) S.clock += dt;
    else S.clock = 0;
    const cycle = steps.count * SHOWCASE.flipbook.frame + SHOWCASE.flipbook.hold;
    const frame = playing ? Math.min(steps.count - 1, Math.floor((S.clock % cycle) / SHOWCASE.flipbook.frame)) : steps.count - 1;
    if (frame !== S.frame) {
      S.frame = frame;
      handles.current.get("flipbook")?.setFrame(frame);
    }

    // Where the figure is on screen, for the hand-off.
    const figure = handles.current.get("figure");
    const figurePanel = panelById.get("figure");
    if (figure && figurePanel && figure.opacity > PICKABLE) {
      const rect = gl.domElement.getBoundingClientRect();
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        scratch.p.set((sx * figurePanel.width) / 2, (sy * figurePanel.height) / 2, 0);
        figure.group.localToWorld(scratch.p).project(camera);
        const x = rect.left + ((scratch.p.x + 1) / 2) * rect.width;
        const y = rect.top + ((1 - scratch.p.y) / 2) * rect.height;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      figureRect.current = new DOMRect(minX, minY, maxX - minX, maxY - minY);
    } else {
      figureRect.current = null;
    }

    // Labels, pinned to their panels.
    const root = overlay.current;
    if (root && !labelEls.current) {
      labelEls.current = new Map([...root.querySelectorAll<HTMLElement>("[data-label]")].map((el) => [el.dataset.label!, el]));
    }
    for (const label of layout.labels) {
      const el = labelEls.current?.get(label.id);
      if (!el) continue;
      const handle = label.panel ? handles.current.get(label.panel) : undefined;
      const panel = label.panel ? panelById.get(label.panel) : undefined;
      const away = Math.max(label.beats[0] - u, u - label.beats[1], 0);
      let opacity = (1 - smoothstep(0.3, 0.5, away)) * presence * (1 - S.open);
      if (handle && panel) {
        opacity *= Math.min(1, handle.opacity * 1.5);
        scratch.q.set(label.anchor[0] * panel.width, label.anchor[1] * panel.height, 0);
        handle.group.localToWorld(scratch.q);
      } else if (label.point) {
        scratch.q.set(...label.point);
        spin.current.localToWorld(scratch.q);
      } else {
        continue;
      }
      if (label.kind === "step" && opacity > 0) {
        const text = `${steps.labels[frame]} · ${steps.phase[frame] === 2 ? "detail matching" : "block-in"}`;
        if (text !== S.stepText) {
          S.stepText = text;
          const target = el.querySelector<HTMLElement>("[data-text]");
          if (target) target.textContent = text;
        }
      }
      placeLabel(el, scratch.q, camera, size.width, size.height, opacity, label.align, label.anchor[0], scratch.p);
    }
  });

  const pickable = (id: string) => {
    const handle = handles.current.get(id);
    return !!handle && handle.opacity > PICKABLE && !!ctx?.enabled.current;
  };
  const handlers = (id: string, kind: string) => ({
    onClick: (event: ThreeEvent<MouseEvent>) => {
      if (!pickable(id)) return;
      event.stopPropagation();
      if (kind === "figure") onFigure();
      else ctx?.open(station.layout.works[0]?.slug ?? "paintwise");
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      if (!pickable(id)) return;
      event.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  });

  return (
    <group position={station.at.position} rotation-y={station.at.yaw}>
      <group ref={spin}>
        {layout.panels.map((panel) => (
          <ImagePanel
            key={panel.id}
            ref={(handle) => {
              if (handle) handles.current.set(panel.id, handle);
              else handles.current.delete(panel.id);
            }}
            src={panel.src}
            width={panel.width}
            height={panel.height}
            color={panel.color}
            wanted={wanted}
            lit={panel.kind === "canvas" || panel.kind === "layer" || panel.kind === "object"}
            cutout={panel.kind === "object"}
            canvas={panel.kind === "canvas"}
            atlas={panel.kind === "flipbook" ? { cols: steps.cols, rows: steps.rows } : undefined}
            {...handlers(panel.id, panel.kind)}
          />
        ))}
      </group>
    </group>
  );
}
