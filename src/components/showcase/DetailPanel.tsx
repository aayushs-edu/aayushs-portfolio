"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import css from "./DetailPanel.module.css";
import { isExternal, type Work } from "./works";

interface DetailPanelProps {
  /** The open work, or null when closed. */
  work: Work | null;
  onClose: () => void;
  /** Dim what's behind (the fallback page); in 3D the scene itself frames the work. */
  scrim?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A work's full story: a panel on the free side of the flown-in work (a bottom
 * sheet on phones). It's a modal dialog: focus moves in and stays in until it
 * closes (Esc, the close button; the showcase also closes it on a scroll
 * gesture or browser Back).
 */
export default function DetailPanel({ work, onClose, scrim = false }: DetailPanelProps) {
  // Keep showing the last work while the panel slides out.
  const [shown, setShown] = useState<Work | null>(work);
  if (work && work !== shown) setShown(work);
  const open = !!work;
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollTo({ top: 0 });
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, work, onClose]);

  // Tab and Shift+Tab cycle inside the panel.
  const trap = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={css.root} data-open={open} data-scrim={scrim} inert={!open}>
      {scrim && <div className={css.scrim} onClick={onClose} aria-hidden="true" />}
      <aside
        ref={panelRef}
        className={css.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        data-detail-panel=""
        onKeyDown={trap}
      >
        <button ref={closeRef} type="button" className={css.close} onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className={css.srOnly}>Close</span>
        </button>
        {shown && (
          <>
            <h2 id="detail-title" className={css.title}>
              {shown.title}
            </h2>
            <p className={css.meta}>{[shown.year, shown.line].filter(Boolean).join(" · ")}</p>
            <div className={css.story}>
              {shown.story.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            {shown.media.video && (
              <video className={css.video} src={shown.media.video} controls muted playsInline preload="none" />
            )}
            {shown.links.length > 0 && (
              <ul className={css.links}>
                {shown.links.map((link) => {
                  const external = isExternal(link.href);
                  return (
                    <li key={link.href}>
                      <a href={link.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {link.label}
                        {external && <span aria-hidden="true"> ↗</span>}
                        {external && <span className={css.srOnly}> (opens in a new tab)</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
