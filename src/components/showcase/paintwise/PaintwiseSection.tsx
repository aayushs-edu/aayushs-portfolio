"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import media from "../stations/paintwise/paintwise.generated.json";
import PaintToBinary from "./PaintToBinary";
import { FLOOR, LAYER_COPY, RIGS, STAGE, TAGS, VIEW_ITEMS, type Rig, type View } from "./explode";
import css from "./PaintwiseSection.module.css";

const cqw = (v: number) => `${(v * 100).toFixed(3)}cqw`;

function rigTransform(rig: Rig): string {
  const [cx, cy, cz] = rig.centre;
  return [
    `translate3d(${cqw(rig.offset[0])}, ${cqw(rig.offset[1])}, 0)`,
    `scale3d(${rig.scale.toFixed(4)}, ${rig.scale.toFixed(4)}, ${rig.scale.toFixed(4)})`,
    `rotateX(${rig.turn[0]}deg)`,
    `rotateY(${rig.turn[1]}deg)`,
    `translate3d(${cqw(-cx)}, ${cqw(-cy)}, ${cqw(-cz)})`,
  ].join(" ");
}

const VIEW_TEXT: Record<View, { title: string; label: string }> = {
  layers: {
    title: "The layers",
    label: `The still life taken apart into the six layers its pipeline makes: ${media.layers.map((l) => `${LAYER_COPY[l.id]?.title}, ${LAYER_COPY[l.id]?.line}`).join("; ")}.`,
  },
  masks: {
    title: "What the models see",
    label: `${media.pieces.from === "toys" ? "Childhood Toys, a still-life painting" : "The still life"}: every piece SAM 2.1 cuts it into, pushed out to the depth Depth Anything V2 gives it.`,
  },
};

/** One exploded view: its still life, which comes apart into the view once it scrolls into sight. */
function ExplodedView({ view }: { view: View }) {
  const [apart, setApart] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setApart(true);
        observer.disconnect();
      },
      { threshold: 0.45 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const state = apart ? view : "rest";
  const { aspect } = STAGE.view[view];
  return (
    <figure className={css.view}>
      <div
        ref={stageRef}
        className={css.stage}
        data-view={view}
        data-apart={apart}
        style={{ aspectRatio: `1 / ${aspect}`, perspective: cqw(STAGE.perspective) } as CSSProperties}
        role="img"
        aria-label={VIEW_TEXT[view].label}
      >
        <span className={css.rig} style={{ transform: rigTransform(apart ? RIGS[view].view : RIGS[view].rest) }}>
          {view === "masks" && (
            <span
              className={css.floor}
              aria-hidden="true"
              style={
                {
                  left: cqw(-FLOOR.width / 2),
                  top: cqw(-FLOOR.depth / 2),
                  width: cqw(FLOOR.width),
                  height: cqw(FLOOR.depth),
                  transform: `translate3d(${cqw(FLOOR.x)}, ${cqw(FLOOR.y)}, ${cqw(FLOOR.z)}) rotateX(90deg)`,
                  "--cell": cqw(FLOOR.cell),
                } as CSSProperties
              }
            />
          )}
          {VIEW_ITEMS[view].map((item, i) => {
            const p = item.poses[state];
            return (
              <span
                key={item.id}
                className={css.item}
                data-kind={item.kind}
                data-slab={item.slab ? "" : undefined}
                style={
                  {
                    left: cqw(-item.width / 2),
                    top: cqw(-item.height / 2),
                    width: cqw(item.width),
                    height: cqw(item.height),
                    transform: `translate3d(${cqw(p.x)}, ${cqw(p.y)}, ${cqw(p.z)})`,
                    opacity: p.opacity,
                    "--i": item.kind === "layer" ? i : 4 + (i - 6) * 0.35,
                    ...(item.slab ? { "--t": cqw(item.slab.thickness), "--side": `url(${item.slab.side})`, "--top": `url(${item.slab.top})` } : {}),
                  } as CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- hashed, pre-sized layers from public/showcase */}
                <img src={item.src} alt="" loading="lazy" decoding="async" draggable={false} />
                {item.slab && ["top", "bottom", "left", "right"].map((face) => <span key={face} className={css.face} data-face={face} />)}
              </span>
            );
          })}
        </span>
        {TAGS[view].map((tag) => (
          <span key={tag.id} className={css.tag} data-align={tag.align} style={{ left: cqw(tag.x), top: cqw(tag.y) }} aria-hidden="true">
            <span className={css.tagTitle}>{tag.title}</span>
            <span className={css.tagLine}>{tag.line}</span>
          </span>
        ))}
      </div>
      <figcaption className={css.viewTitle}>{VIEW_TEXT[view].title}</figcaption>
    </figure>
  );
}

interface PaintwiseSectionProps {
  /** Ids for the story button and the figure, so focus can come back to them. */
  storyId: string;
  figureId: string;
  /** Opens Paintwise's full story (the detail panel). */
  onStory: () => void;
  /** Opens the pipeline figure full size, growing from where it is. */
  onFigure: (from: DOMRect | null) => void;
}

/**
 * Paintwise, first under the hero: the pitch beside the pipeline figure, then
 * the old room's two exploded views side by side, each coming apart as it
 * scrolls into sight: the layers its pipeline makes of the jug, and what the
 * models see, cut into SAM 2.1's pieces.
 */
export default function PaintwiseSection({ storyId, figureId, onStory, onFigure }: PaintwiseSectionProps) {
  const figureRef = useRef<HTMLImageElement | null>(null);
  // Both stages are the same height: each takes width in proportion to its shape.
  const columns = `${(1 / STAGE.view.layers.aspect).toFixed(4)}fr ${(1 / STAGE.view.masks.aspect).toFixed(4)}fr`;

  return (
    <section id="paintwise" className={css.section} aria-labelledby="paintwise-title">
      <PaintToBinary />
      <div className={css.top}>
        <div className={css.lead}>
          <div className={css.brand}>
            <Image src="/images/paintwise-logo.png" alt="" width={110} height={88} className={css.logo} />
            <h2 id="paintwise-title" className={css.title}>
              Paintwise
            </h2>
          </div>
          <p className={css.pitch}>AI-powered Art Education</p>
          <p className={css.links}>
            <button id={storyId} type="button" className={css.link} onClick={onStory}>
              The story
            </button>
            <a className={css.link} href="https://github.com/aayushs-edu/paintwise" target="_blank" rel="noopener noreferrer">
              View code on GitHub <span aria-hidden="true">↗</span>
            </a>
          </p>
        </div>
        <figure className={css.figure}>
          <button id={figureId} type="button" className={css.figureButton} onClick={() => onFigure(figureRef.current?.getBoundingClientRect() ?? null)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a hashed, pre-sized figure from public/showcase */}
            <img
              ref={figureRef}
              src={media.figure.src}
              alt="Figure 1: the Paintwise pipeline, from scene understanding to critique"
              loading="lazy"
              decoding="async"
              style={{ aspectRatio: media.figure.aspect }}
            />
          </button>
        </figure>
      </div>

      <div className={css.views} style={{ "--columns": columns } as CSSProperties}>
        <ExplodedView view="layers" />
        <ExplodedView view="masks" />
      </div>
    </section>
  );
}
