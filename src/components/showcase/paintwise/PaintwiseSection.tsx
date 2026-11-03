"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import media from "../stations/paintwise/paintwise.generated.json";
import { ITEMS, LAYER_COPY, RIGS, STAGE, TAGS, type ExplodeState, type Rig } from "./explode";
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

/** Hover (or keyboard focus) takes it apart; a click (or a tap, after the first) shows what the models see. */
const NEXT_TAP: Record<ExplodeState, ExplodeState> = { rest: "layers", layers: "masks", masks: "rest" };

const STATE_LABEL: Record<ExplodeState, string> = {
  rest: "the still life, whole",
  layers: "taken apart into the six layers its pipeline makes",
  masks: "every object's mask pushed out to its depth",
};

const HINT: Record<ExplodeState, { pointer: string; touch: string }> = {
  rest: { pointer: "Hover to take it apart", touch: "Tap to take it apart" },
  layers: { pointer: "Click to see what the models see", touch: "Tap to see what the models see" },
  masks: { pointer: "Click to go back to the layers", touch: "Tap to put it back together" },
};

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
 * Paintwise, first under the hero: the pitch, the exploded still life (hover
 * fans out its pipeline's layers, a click pushes the masks out to their
 * depths), and beside it the pipeline figure and the other still lifes run
 * through it.
 */
export default function PaintwiseSection({ storyId, figureId, onStory, onFigure }: PaintwiseSectionProps) {
  const [state, setState] = useState<ExplodeState>("rest");
  const pointer = useRef("mouse");
  const figureRef = useRef<HTMLImageElement | null>(null);

  const onEnter = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setState((s) => (s === "rest" ? "layers" : s));
  };
  const onLeave = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setState("rest");
  };
  const onClick = (event: MouseEvent) => {
    // A mouse is already hovering (layers), so its click toggles the masks; touch and keys step through.
    const mouse = event.detail > 0 && pointer.current === "mouse";
    setState((s) => (mouse ? (s === "masks" ? "layers" : "masks") : NEXT_TAP[s]));
  };

  return (
    <section className={css.section} aria-labelledby="paintwise-title">
      <div className={css.lead}>
        <h2 id="paintwise-title" className={css.title}>
          Paintwise
        </h2>
        <p className={css.pitch}>Teaches you to paint a picture the way an artist would, one step at a time.</p>
        <p className={css.links}>
          <button id={storyId} type="button" className={css.link} onClick={onStory}>
            The story
          </button>
          <a className={css.link} href="/paintwise">
            Read the build log <span aria-hidden="true">→</span>
          </a>
        </p>
      </div>

      <div className={css.jug}>
        <button
          type="button"
          className={css.stage}
          data-state={state}
          style={{ aspectRatio: `1 / ${STAGE.aspect}`, perspective: cqw(STAGE.perspective) } as CSSProperties}
          aria-label={`Paintwise's pipeline on a still life: ${STATE_LABEL[state]}`}
          aria-describedby="paintwise-layers"
          onPointerDown={(event) => (pointer.current = event.pointerType)}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
          onFocus={(event) => {
            if (event.currentTarget.matches(":focus-visible")) setState((s) => (s === "rest" ? "layers" : s));
          }}
          onBlur={() => setState("rest")}
          onClick={onClick}
        >
          <span className={css.rig} style={{ transform: rigTransform(RIGS[state]) }}>
            {ITEMS.map((item, i) => {
              const p = item.poses[state];
              return (
                <span
                  key={item.id}
                  className={css.item}
                  data-kind={item.kind}
                  style={
                    {
                      left: cqw(-item.width / 2),
                      top: cqw(-item.height / 2),
                      width: cqw(item.width),
                      height: cqw(item.height),
                      transform: `translate3d(${cqw(p.x)}, ${cqw(p.y)}, ${cqw(p.z)})`,
                      opacity: p.opacity,
                      "--i": item.kind === "layer" ? i : i * 0.3,
                    } as CSSProperties
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- hashed, pre-sized layers from public/showcase */}
                  <img src={item.src} alt="" loading="lazy" decoding="async" draggable={false} />
                </span>
              );
            })}
          </span>
          {TAGS.map((tag) => (
            <span
              key={tag.id}
              className={css.tag}
              data-align={tag.align}
              data-on={tag.state === state}
              style={{ left: cqw(tag.x), top: cqw(tag.y) }}
              aria-hidden="true"
            >
              <span className={css.tagTitle}>{tag.title}</span>
              <span className={css.tagLine}>{tag.line}</span>
            </span>
          ))}
        </button>
        <p className={css.hint} aria-hidden="true">
          <span className={css.hintPointer}>{HINT[state].pointer}</span>
          <span className={css.hintTouch}>{HINT[state].touch}</span>
        </p>
        <p id="paintwise-layers" className={css.srOnly}>
          {`Its layers: ${media.layers.map((l) => `${LAYER_COPY[l.id]?.title}, ${LAYER_COPY[l.id]?.line}`).join("; ")}.`}
        </p>
      </div>

      <div className={css.side}>
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
          <figcaption className={css.caption}>Figure 1 · the Paintwise pipeline · click to enlarge</figcaption>
        </figure>
        <ul className={css.stills} aria-label="Other still lifes run through the pipeline">
          {media.stillLifes.map((still) => (
            <li key={still.src}>
              {/* eslint-disable-next-line @next/next/no-img-element -- hashed, pre-sized still lifes from public/showcase */}
              <img src={still.src} alt="" loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
        <p className={css.caption} aria-hidden="true">
          Other still lifes, run through the same pipeline
        </p>
      </div>
    </section>
  );
}
