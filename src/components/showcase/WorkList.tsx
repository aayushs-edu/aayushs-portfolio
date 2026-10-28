"use client";

import type { FocusEvent } from "react";
import css from "./WorkList.module.css";
import { isExternal, type Work } from "./works";

export interface WorkListGroup {
  title: string;
  works: Work[];
}

interface WorkListProps {
  groups: WorkListGroup[];
  /** "hidden": for screen readers and the keyboard, under the 3D scene. "grid": the calm fallback page. */
  mode: "hidden" | "grid";
  onOpen: (slug: string) => void;
  /** A work's button took focus (`visible`: it shows a focus ring). */
  onFocusWork?: (slug: string, visible: boolean) => void;
  onBlurWork?: (slug: string) => void;
}

export const workButtonId = (slug: string) => `work-open-${slug}`;

/**
 * Every work as semantic DOM: a heading per chapter, a heading, text and real
 * links per work, and one button per work that opens its detail view (the
 * only tab stop per work, in path order). Screen readers and search engines
 * read this, not the canvas. Without 3D it is the page itself: a grid.
 */
export default function WorkList({ groups, mode, onOpen, onFocusWork, onBlurWork }: WorkListProps) {
  const grid = mode === "grid";
  const focus = (slug: string) => (event: FocusEvent<HTMLButtonElement>) => onFocusWork?.(slug, event.currentTarget.matches(":focus-visible"));

  return (
    <section className={grid ? css.page : css.hidden} aria-label="Work">
      {groups.map((group, g) => (
        <section key={group.title} className={css.group} aria-labelledby={`${mode}-group-${g}`}>
          <h2 id={`${mode}-group-${g}`} className={css.groupTitle}>
            {group.title}
          </h2>
          <ol className={css.grid}>
            {group.works.map((work) => (
              <li key={work.slug} className={css.item}>
                <article aria-labelledby={`${mode}-title-${work.slug}`}>
                  {grid && (
                    <div className={css.thumb} data-kind={work.kind}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- hashed, pre-sized assets from public/hero */}
                      <img src={work.media.image} alt="" loading="lazy" decoding="async" />
                    </div>
                  )}
                  <h3 id={`${mode}-title-${work.slug}`} className={css.title}>
                    {work.title}
                  </h3>
                  <p className={css.meta}>{[work.year, work.line].filter(Boolean).join(" · ")}</p>
                  <div className={grid ? css.srOnly : undefined}>
                    {work.story.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                    <ul>
                      {work.links.map((link) => (
                        <li key={link.href}>
                          {/* Reachable by screen readers; the keyboard opens the detail view instead. */}
                          <a href={link.href} tabIndex={-1} {...(isExternal(link.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    id={workButtonId(work.slug)}
                    type="button"
                    className={css.open}
                    onClick={() => onOpen(work.slug)}
                    onFocus={focus(work.slug)}
                    onBlur={() => onBlurWork?.(work.slug)}
                  >
                    <span className={css.srOnly}>Open {work.title}</span>
                  </button>
                </article>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
