"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import css from "./HandOff.module.css";

export interface HandOffItem {
  src: string;
  alt: string;
  /** width / height */
  aspect: number;
  /** Where the panel was on screen: the image grows from there */
  from: DOMRect | null;
}

interface HandOffProps {
  item: HandOffItem | null;
  onClose: () => void;
}

/**
 * Something in the scene shown full size over it (the Paintwise figure): it
 * grows out of its panel's place on screen. A modal dialog: Esc, the close
 * button or a click outside it closes it.
 */
export default function HandOff({ item, onClose }: HandOffProps) {
  // Keep showing the last item while it fades out.
  const [shown, setShown] = useState<HandOffItem | null>(item);
  if (item && item !== shown) setShown(item);
  const open = !!item;
  const frameRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Grow from the panel: measure where it ends up, start it where it was, let it transition home.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!item || !frame) return;
    frame.style.transition = "none";
    frame.style.transform = "none";
    const to = frame.getBoundingClientRect();
    const from = item.from;
    if (from && to.width > 0 && to.height > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
      void frame.offsetWidth;
    }
    frame.style.transition = "";
    frame.style.transform = "none";
  }, [item]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      // The close button is the only stop: keep focus on it.
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={css.root} data-open={open} inert={!open} role="dialog" aria-modal="true" aria-label={shown?.alt ?? "Image"}>
      <div className={css.backdrop} onClick={onClose} aria-hidden="true" />
      {shown && (
        <div ref={frameRef} className={css.frame} style={{ aspectRatio: shown.aspect, width: `min(94vw, ${(86 * shown.aspect).toFixed(2)}vh)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a hashed, pre-sized figure from public/showcase */}
          <img src={shown.src} alt={shown.alt} className={css.image} />
        </div>
      )}
      <button ref={closeRef} type="button" className={css.close} onClick={onClose}>
        <span aria-hidden="true">×</span>
        <span className={css.srOnly}>Close</span>
      </button>
    </div>
  );
}
