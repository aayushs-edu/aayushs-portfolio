"use client";

import css from "./Showcase.module.css";
import type { Work } from "./works";

interface CaptionsProps {
  /** In path order */
  works: Work[];
  /** The work whose button has keyboard focus: its caption shows the focus ring. */
  focusSlug: string | null;
  onOpen: (slug: string) => void;
}

/**
 * The DOM over the canvas: a caption per work. The scene positions and fades
 * them every frame (by data-caption); here they're only laid out. The
 * semantic list carries them for screen readers, so this layer is hidden from
 * them and has no tab stops.
 */
export default function Captions({ works, focusSlug, onOpen }: CaptionsProps) {
  return (
    <>
      {works.map((work) => (
        <button
          key={work.slug}
          type="button"
          tabIndex={-1}
          className={css.caption}
          data-caption={work.slug}
          data-focused={focusSlug === work.slug}
          onClick={() => onOpen(work.slug)}
        >
          <span className={css.captionTitle}>{work.title}</span>
          <span className={css.captionMeta}>{[work.year, work.line].filter(Boolean).join(" · ")}</span>
        </button>
      ))}
    </>
  );
}
