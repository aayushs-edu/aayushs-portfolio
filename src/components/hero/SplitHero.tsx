"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./Hero.module.css";
import split from "./SplitHero.module.css";
import SeamCanvas from "./SeamCanvas";
import { NameTouch } from "./nameTouch";
import { BinaryName, PaintedName, Tagline } from "./SplitTitle";
import SplitWall from "./SplitWall";
import { DESIGN, SYNTAX_PALETTE } from "./heroConfig";
import { GRID, SEAM_X, type SplitLayout } from "./splitConfig";
import { useHeroTier } from "./useHeroTier";

const SECTION_STYLE = {
  "--syn-kw": SYNTAX_PALETTE.kw,
  "--syn-str": SYNTAX_PALETTE.str,
  "--syn-num": SYNTAX_PALETTE.num,
  "--syn-fn": SYNTAX_PALETTE.fn,
  "--syn-punct": SYNTAX_PALETTE.punct,
  "--syn-com": SYNTAX_PALETTE.com,
} as CSSProperties;

function sameLayout(a: SplitLayout, b: SplitLayout) {
  return a.w === b.w && a.h === b.h && a.u === b.u && a.seamX === b.seamX && a.gridY === b.gridY;
}

/**
 * The split hero: Art on the left, Code on the right, at once. A fluid line
 * runs down the middle; the wall and the name split on it, paint floats out of
 * its left side and bits out of its right. The name is fluid to the touch:
 * moving through it pushes the letters around and bits come loose from the
 * binary ones; grab it to pull the line through it.
 *
 * Under the showcase, `entrance` (0..1) tears it open along the line: the
 * halves part, the tagline lifts away, and the name stops responding to touch.
 * `paused` stops its frame loop once it is gone.
 */
export default function SplitHero({ entrance, paused = false }: { entrance?: { readonly current: number }; paused?: boolean }) {
  const [tier] = useHeroTier();
  const [layout, setLayout] = useState<SplitLayout | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const [touch] = useState(() => new NameTouch());
  // Once the canvas draws the name itself, the DOM name (the fallback) hides.
  const [glName, setGlName] = useState(false);

  // The title box sets the scale; the wall and the seam line up with its grid.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const title = titleRef.current;
    if (!stage || !title) return;
    const measure = () => {
      const s = stage.getBoundingClientRect();
      const t = title.getBoundingClientRect();
      const u = t.width / DESIGN.titleBox.w;
      const next: SplitLayout = {
        w: s.width,
        h: s.height,
        u,
        seamX: t.left - s.left + (SEAM_X - DESIGN.titleBox.x) * u,
        gridY: t.top - s.top,
        cellW: GRID.cellW * u,
        cellH: GRID.cellH * u,
      };
      setLayout((prev) => (prev && sameLayout(prev, next) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Pointer input for touching the name (until the hero starts to open).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const opening = () => {
      if ((entrance?.current ?? 0) <= 0) return false;
      touch.leave();
      stage.style.cursor = "";
      return true;
    };
    const local = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top] as const;
    };
    const cursor = (x: number, y: number) => {
      stage.style.cursor = touch.holding ? "grabbing" : touch.overName(x, y) ? "grab" : "";
    };
    const onMove = (event: PointerEvent) => {
      if (opening()) return;
      const [x, y] = local(event);
      touch.move(x, y, event.pointerType === "touch");
      cursor(x, y);
    };
    const onDown = (event: PointerEvent) => {
      if (opening()) return;
      const [x, y] = local(event);
      touch.down(x, y, event.pointerType === "touch");
      cursor(x, y);
    };
    const onUp = (event: PointerEvent) => {
      touch.up();
      const [x, y] = local(event);
      cursor(x, y);
    };
    const onLeave = () => {
      touch.leave();
      stage.style.cursor = "";
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointercancel", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointercancel", onLeave);
    };
  }, [touch, entrance]);

  return (
    <section className={styles.hero} style={SECTION_STYLE} aria-label="Aayush Sharma: art and code" data-tier={tier}>
      <div ref={stageRef} className={split.stage} data-gl-name={glName}>
        <div className={split.layer}>
          <SplitWall layout={layout} />
          <SeamCanvas
            tier={tier}
            layout={layout}
            clipRef={stageRef}
            touch={touch}
            onNameReady={() => setGlName(true)}
            entrance={entrance}
            paused={paused}
          />
          {/* The name twice, each clipped to its side of the line; the tagline over both. */}
          <div className={`${split.artSide} ${split.domName}`}>
            <div ref={titleRef} className={split.title}>
              <PaintedName />
            </div>
          </div>
          <div className={`${split.codeSide} ${split.domName}`}>
            <div className={split.title}>
              <BinaryName />
            </div>
          </div>
          <div className={`${split.title} ${split.taglineLift}`}>
            <Tagline />
          </div>
        </div>
      </div>
    </section>
  );
}
