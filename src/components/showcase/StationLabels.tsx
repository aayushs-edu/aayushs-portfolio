"use client";

import type { LabelSpec } from "./room/types";
import css from "./Showcase.module.css";

interface StationLabelsProps {
  labels: LabelSpec[];
  /** The figure's caption opens it full size */
  onFigure: () => void;
}

/**
 * A station's floating labels in the DOM over the canvas: the scene pins and
 * fades them every frame (by data-label); here they're only laid out. The
 * semantic list carries the same content for screen readers, so this layer is
 * hidden from them and has no tab stops.
 */
export default function StationLabels({ labels, onFigure }: StationLabelsProps) {
  return (
    <>
      {labels.map((label) => {
        switch (label.kind) {
          case "title":
            return (
              <div key={label.id} data-label={label.id} className={`${css.label} ${css.stationTitle}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a small static logo in the overlay */}
                <img src="/images/paintwise-logo.png" alt="" width={48} height={38} />
                <span>
                  <span className={css.stationName}>{label.title}</span>
                  <span className={css.stationPitch}>{label.meta}</span>
                </span>
              </div>
            );
          case "tag":
            return (
              <div key={label.id} data-label={label.id} className={`${css.label} ${css.tag}`}>
                <span className={css.tagTitle}>{label.title}</span>
                {label.meta && <span className={css.tagMeta}>{label.meta}</span>}
              </div>
            );
          case "step":
            return (
              <div key={label.id} data-label={label.id} className={`${css.label} ${css.tag} ${css.step}`}>
                <span className={css.tagTitle}>{label.title}</span>
                <span className={css.stepText} data-text="" />
              </div>
            );
          case "chips":
            return (
              <div key={label.id} data-label={label.id} className={`${css.label} ${css.tag}`}>
                <span className={css.tagTitle}>{label.title}</span>
                <ol className={css.chips}>
                  {(label.meta ?? "").split("|").map((chip, i) => (
                    <li key={chip}>
                      <span>{i + 1}</span>
                      {chip}
                    </li>
                  ))}
                </ol>
              </div>
            );
          case "figure":
            return (
              <button key={label.id} type="button" tabIndex={-1} data-label={label.id} className={`${css.label} ${css.tag} ${css.figureCaption}`} onClick={onFigure}>
                <span className={css.figureTitle}>{label.title}</span>
                <span className={css.tagMeta}>{label.meta}</span>
              </button>
            );
          case "link":
            return (
              <a key={label.id} href={label.href} tabIndex={-1} data-label={label.id} className={`${css.label} ${css.tagLink}`}>
                {label.title}
              </a>
            );
        }
      })}
    </>
  );
}
