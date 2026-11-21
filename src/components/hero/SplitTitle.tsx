"use client";

import { memo } from "react";
import css from "./SplitHero.module.css";
import { DESCRIPTION, DESIGN, NAME } from "./heroConfig";

// The DOM title: the name's outline, "Art x Code" and the real heading. The
// seam canvas fills the letters; without WebGL2 they're filled plain instead.

const { titleBox: box, cx } = DESIGN;
const VIEWBOX = `${box.x} ${box.y} ${box.w} ${box.h}`;
const GAP_MASK = "split-name-gap";

/**
 * "Aayush Sharma", the tagline's gap cut out of it: outlined (over the seam),
 * or filled with plain paint (the fallback without WebGL2).
 */
export const PlainName = memo(function PlainName({ fill = false }: { fill?: boolean }) {
  return (
    <div className={css.titleIn}>
      <svg className={css.titleSvg} viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        <defs>
          <mask id={`${GAP_MASK}-${fill ? "fill" : "outline"}`} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#fff" />
            <text className={css.tagText} x={cx} y={DESIGN.tagBaseline} fill="#000" stroke="#000" strokeWidth={NAME.taglineGap} strokeLinejoin="round">
              Art x Code
            </text>
          </mask>
        </defs>
        <g
          mask={`url(#${GAP_MASK}-${fill ? "fill" : "outline"})`}
          className={fill ? undefined : css.outline}
          style={fill ? { fill: NAME.paint } : { stroke: NAME.paint, strokeWidth: DESIGN.outline }}
        >
          <text className={css.nameText} x={cx} y={DESIGN.baseline1}>
            Aayush
          </text>
          <text className={css.nameText} x={cx} y={DESIGN.baseline2}>
            Sharma
          </text>
        </g>
      </svg>
    </div>
  );
});

/** Who this is, in grey under the name. */
export const Description = memo(function Description() {
  return <p className={css.description}>{DESCRIPTION}</p>;
});

/** "Art x Code" over the name, plus the real heading. */
export const Tagline = memo(function Tagline() {
  return (
    <div className={css.titleIn}>
      <h1 className="sr-only">Aayush Sharma</h1>
      <svg className={css.titleSvg} viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        <text className={`${css.tagText} ${css.tagline}`} x={cx} y={DESIGN.tagBaseline}>
          Art x Code
        </text>
      </svg>
    </div>
  );
});
