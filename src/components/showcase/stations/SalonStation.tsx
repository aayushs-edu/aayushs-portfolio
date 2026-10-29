"use client";

// The paintings' salon, drawn from its pure layout: every frame each painting
// takes its pose for where the scroll is within the station (compact when the
// camera is elsewhere; the early work arriving a moment after the portfolio),
// drifts a little, and the ones with a "held" photo turn over to show it on
// hover, and now and then while they're presented.

import { useFrame } from "@react-three/fiber";
import { useContext, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { poseAt, presenceAt } from "../panels/pose";
import PaintingMesh from "../PaintingMesh";
import type { PanelPose, RoomStation } from "../room/types";
import type { ScrollSample } from "../scrollMap";
import { SHOWCASE, type SceneTier } from "../showcaseConfig";
import { InteractionContext } from "../workMesh";
import type { Work } from "../works";
import type { SalonLayout } from "./salon";

interface SalonStationProps {
  layout: SalonLayout;
  station: RoomStation;
  tier: SceneTier;
  works: ReadonlyMap<string, Work>;
  scroll: RefObject<ScrollSample>;
  openSlug: string | null;
  wanted: (slug: string) => boolean;
}

/** The early work's arrival lags the portfolio's by this much (beats). */
const LAG = 0.25;
/** While a held painting is presented: front this long (s), then its back until the cycle (s) comes round. */
const TURN = { front: 2.5, cycle: 6 };
const ORIGIN = { position: [0, 0, 0] as [number, number, number], rotationY: 0 };

export default function SalonStation({ layout, station, tier, works, scroll, openSlug, wanted }: SalonStationProps) {
  const ctx = useContext(InteractionContext);
  const groups = useRef(new Map<string, THREE.Group>());
  const turns = useRef(new Map<string, THREE.Group>());
  const state = useRef(new Map<string, { open: number; flip: number; timer: number }>());
  const scratch = useMemo(() => ({ position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, opacity: 1 }) as PanelPose, []);
  /** The beat (within the station) that presents each painting. */
  const presentedAt = useMemo(() => {
    const map = new Map<string, number>();
    layout.beats.forEach((beat, i) => beat.slugs?.forEach((slug) => map.has(slug) || map.set(slug, i)));
    return map;
  }, [layout]);
  const count = layout.beats.length;
  const lift = tier === "full" ? SHOWCASE.drift.lift * 0.5 : 0;

  useFrame((frameState, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = scroll.current;
    if (!s) return;
    const u = s.beat - station.first;
    const t = frameState.clock.elapsedTime;
    layout.panels.forEach((panel, i) => {
      const group = groups.current.get(panel.id);
      if (!group) return;
      let st = state.current.get(panel.id);
      if (!st) state.current.set(panel.id, (st = { open: 0, flip: 0, timer: 0 }));
      const home = presentedAt.get(panel.slug) ?? 0;
      // While it's open, it glides to where it's presented: the camera flies in there.
      st.open += ((openSlug === panel.slug ? 1 : 0) - st.open) * (1 - Math.exp(-6 * dt));
      const here = u + (home - u) * st.open;
      const presence = Math.max(presenceAt(here - (panel.early ? LAG : 0), count), st.open);
      const pose = poseAt(panel.poses, panel.idle, here, presence, scratch);
      group.position.set(pose.position[0], pose.position[1] + lift * Math.sin(0.5 * t + i * 1.3), pose.position[2]);
      group.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
      group.scale.setScalar(pose.scale);

      // Turning over to its held photo.
      if (!panel.held) return;
      const presented = presence > 0.5 && Math.abs(here - home) < 0.35 && !st.open;
      st.timer = presented ? st.timer + dt : 0;
      const showBack = ctx?.hover.current === panel.slug || (presented && st.timer % TURN.cycle > TURN.front);
      st.flip += ((showBack ? Math.PI : 0) - st.flip) * (1 - Math.exp(-5 * dt));
      const turn = turns.current.get(panel.id);
      if (turn) turn.rotation.y = st.flip;
    });
  });

  return (
    <group position={station.at.position} rotation-y={station.at.yaw}>
      {layout.panels.map((panel) => {
        const work = works.get(panel.slug);
        if (!work) return null;
        return (
          <group
            key={panel.id}
            ref={(g) => {
              if (g) groups.current.set(panel.id, g);
              else groups.current.delete(panel.id);
            }}
          >
            <group
              ref={(g) => {
                if (g) turns.current.set(panel.id, g);
                else turns.current.delete(panel.id);
              }}
            >
              <PaintingMesh
                work={work}
                placement={{ slug: work.slug, ...ORIGIN, width: panel.width, height: panel.height }}
                wanted={wanted(work.slug)}
                relief={tier === "full" && !!work.media.depth}
                back={panel.held}
              />
            </group>
          </group>
        );
      })}
    </group>
  );
}
