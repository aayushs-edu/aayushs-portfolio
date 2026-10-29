"use client";

import { useEffect, useRef, type RefObject } from "react";
import css from "./Showcase.module.css";

interface FilmPlayerProps {
  /** The full film (the GitHub release), or null when no film is open */
  src: string | null;
  poster?: string;
  title: string;
  /** Where the film's screen is, written every frame by the scene */
  rect: RefObject<DOMRect | null>;
}

/**
 * The full film, with sound and controls, laid exactly over its floating
 * screen in the scene while the film is open. If the browser won't start it
 * with sound, it waits with its controls showing.
 */
export default function FilmPlayer({ src, poster, title, rect }: FilmPlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!src || !video) return;
    let raf = 0;
    let last = "";
    const follow = () => {
      const r = rect.current;
      const box = r && r.width > 40 && r.height > 24 ? `${r.left.toFixed(1)},${r.top.toFixed(1)},${r.width.toFixed(1)},${r.height.toFixed(1)}` : "";
      if (box !== last) {
        last = box;
        if (r && box) {
          video.style.transform = `translate(${r.left}px, ${r.top}px)`;
          video.style.width = `${r.width}px`;
          video.style.height = `${r.height}px`;
          video.style.visibility = "visible";
        } else {
          video.style.visibility = "hidden";
        }
      }
      raf = requestAnimationFrame(follow);
    };
    raf = requestAnimationFrame(follow);
    void video.play().catch(() => {
      // Autoplay with sound was blocked: the controls are there.
    });
    return () => cancelAnimationFrame(raf);
  }, [src, rect]);

  if (!src) return null;
  return <video ref={ref} key={src} className={css.filmPlayer} src={src} poster={poster} controls playsInline preload="auto" aria-label={title} />;
}
