"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import css from "./SplitHero.module.css";
import SeamCanvas from "./SeamCanvas";
import { Description, PlainName, Tagline } from "./SplitTitle";
import { DESIGN, type Tier } from "./heroConfig";
import { GRID, SEAM_X, type SplitLayout } from "./splitConfig";

function sameLayout(a: SplitLayout, b: SplitLayout) {
  return a.w === b.w && a.h === b.h && a.u === b.u && a.seamX === b.seamX && a.gridY === b.gridY;
}

/**
 * The hero: "Aayush Sharma", outlined, on a plain wall, split by a straight
 * line tilted like "/". Through the letters left of the line, paint floats out
 * of it; through those right of it, bits pop out of it, both square to the
 * line. Outside the letters nothing moves. "Art x Code" sits over the name,
 * and a short description in grey under it. It's the page's first section and
 * scrolls away with it. The page picks the tier (static: one still frame).
 */
export default function SplitHero({ tier, onFail }: { tier: Tier; onFail?: () => void }) {
  const [layout, setLayout] = useState<SplitLayout | null>(null);
  const [failed, setFailed] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);

  // The title box sets the scale; the seam lines up with its grid.
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

  const fail = useCallback(() => {
    setFailed(true);
    onFail?.();
  }, [onFail]);

  return (
    <section className={css.hero} aria-label="Aayush Sharma: art and code" data-tier={tier}>
      <div ref={stageRef} className={css.stage}>
        <SeamCanvas tier={tier} layout={layout} onFail={fail} />
        <div ref={titleRef} className={css.title}>
          <PlainName fill={failed} />
          <Tagline />
        </div>
        <Description />
      </div>
    </section>
  );
}
