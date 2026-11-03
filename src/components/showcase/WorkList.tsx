"use client";

import css from "./WorkList.module.css";
import { isExternal, type Work } from "./works";

export interface WorkListGroup {
  title: string;
  works: Work[];
}

interface WorkListProps {
  groups: WorkListGroup[];
  onOpen: (slug: string) => void;
}

export const workButtonId = (slug: string) => `work-open-${slug}`;

/**
 * Every work of a group as a grid: a heading per group, and per work its
 * image, title and line, with its story and real links for screen readers and
 * search engines, and one button that opens its detail view (the only tab
 * stop per work).
 */
export default function WorkList({ groups, onOpen }: WorkListProps) {
  return (
    <section className={css.page} aria-label="Work">
      {groups.map((group, g) => (
        <section key={group.title} className={css.group} aria-labelledby={`group-${g}`}>
          <h2 id={`group-${g}`} className={css.groupTitle}>
            {group.title}
          </h2>
          <ol className={css.grid}>
            {group.works.map((work) => (
              <li key={work.slug} className={css.item}>
                <article aria-labelledby={`title-${work.slug}`}>
                  <div className={css.thumb} data-kind={work.kind}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- hashed, pre-sized assets from public/hero and public/showcase */}
                    <img src={work.media.image} alt="" loading="lazy" decoding="async" />
                  </div>
                  <h3 id={`title-${work.slug}`} className={css.title}>
                    {work.title}
                  </h3>
                  <p className={css.meta}>{[work.year, work.line].filter(Boolean).join(" · ")}</p>
                  <div className={css.srOnly}>
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
                  <button id={workButtonId(work.slug)} type="button" className={css.open} onClick={() => onOpen(work.slug)}>
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
