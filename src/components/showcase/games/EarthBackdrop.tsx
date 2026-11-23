"use client";

import { useEffect, useRef } from "react";
import { EarthBlaze } from "@/components/ui/earth-blaze";
import { usePerfLite } from "@/lib/perf";
import css from "./EarthBackdrop.module.css";

/** NASA's Blue Marble (cloud-free topography), resized to 3072×1536 and served from the site. */
const EARTH = "/showcase/games/earth-blue-marble.webp";
/**
 * Pixel art, like the rest of the section: a canvas pixel every PIXEL CSS px, dithered down to LEVELS colour levels.
 * It draws up to 60 times a second, still or moving (FRAME_MS: every frame on a 60 Hz screen, every other on 120 Hz).
 * That stays smooth, and on a weak machine it took Games from 70 to about 95 fps.
 */
const PIXEL = 4;
const LEVELS = 7;
const FRAME_MS = 12;
/** Kept in the background: a faint nebula, fewer stars, a softer sun and a dimmer Earth (dimmed here, not with CSS opacity, which costs a full-screen blend every frame). */
const SKY = { galaxyBrightness: 0.28, starCount: 900, illumination: 0.64, surfaceBrightness: 0.8 };
const FULL = { ...SKY, pixelSize: PIXEL, colorLevels: LEVELS, idleFrameMs: 0, minFrameMs: FRAME_MS };
/** In lite mode, fewer frames: 20 a second while still, 30 while the light moves. */
const LITE = { ...FULL, idleFrameMs: 50, minFrameMs: 24 };

/**
 * The Games background: Earth Blaze (21st.dev; WebGL), a sunlit horizon of
 * Earth under stars and a nebula, drawn as pixel art (chunky pixels, a few
 * dithered colour levels, stars as single pixels and plus-shaped sparkles). As on 21st.dev, the light follows the mouse
 * along the horizon: the section passes its pointer moves on to the canvas,
 * which sits behind the content, so the light follows wherever the mouse is
 * over the section. Only moves and leaves are passed on, never presses, so
 * clicks stay with the content and the aurora (a held press) is never set
 * off. The canvas takes no keyboard focus.
 *
 * It's held to the view (sticky) so its canvas stays screen-sized, and faded
 * in and out over the section's ends so it blends into the sections around
 * it. Earth Blaze pauses itself off screen and stills itself with reduced
 * motion. In lite mode it idles at fewer frames a second.
 */
export default function EarthBackdrop() {
  const ref = useRef<HTMLDivElement | null>(null);
  const lite = usePerfLite();

  useEffect(() => {
    const section = ref.current?.parentElement;
    const canvas = ref.current?.querySelector("canvas");
    if (!section || !canvas) return;
    // A backdrop, not a control (Earth Blaze makes an interactive canvas focusable).
    canvas.tabIndex = -1;
    const pass = (type: "pointermove" | "pointerleave") => (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      canvas.dispatchEvent(new PointerEvent(type, { clientX: e.clientX, clientY: e.clientY, isPrimary: true, pointerType: e.pointerType, pointerId: e.pointerId }));
    };
    const move = pass("pointermove");
    const leave = pass("pointerleave");
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} className={css.backdrop} aria-hidden="true">
      <div className={css.view}>
        <EarthBlaze auroraEnabled={false} textureUrl={EARTH} {...(lite ? LITE : FULL)} style={{ position: "absolute", inset: 0, height: "100%", aspectRatio: "auto" }} />
      </div>
    </div>
  );
}
