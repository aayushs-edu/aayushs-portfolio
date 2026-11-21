"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import css from "./FilmGrain.module.css";

/**
 * Animation's background: old film running through a projector. Very faint
 * grain that dances, a flicker now and then, and once in a while a thin
 * scratch down the frame. It is held to the view (sticky) so its layer stays
 * the size of the screen, and it rests while the section is out of view.
 * With reduced motion the grain stands still and nothing flickers.
 */
const TILE = 180;

type Scratch = { id: number; x: number; top: number; h: number; ms: number };

export default function FilmGrain() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tile, setTile] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [scratches, setScratches] = useState<Scratch[]>([]);

  // One tile of grain, drawn once: specks of grey at random strengths.
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = TILE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(TILE, TILE);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 145;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() ** 3 * 255;
    }
    ctx.putImageData(img, 0, 0);
    setTile(canvas.toDataURL());
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(motion.matches);
    const section = ref.current?.parentElement;
    if (!section) return;
    const seen = new IntersectionObserver((es) => setLive(es[es.length - 1].isIntersecting));
    seen.observe(section);
    return () => seen.disconnect();
  }, []);

  // A scratch every few seconds, for a fraction of one.
  useEffect(() => {
    if (!live || reduced) return;
    let id = 0;
    let next: number;
    const spawn = () => {
      const s: Scratch = { id: id++, x: 4 + Math.random() * 92, top: Math.random() * 60, h: 18 + Math.random() * 40, ms: 260 + Math.random() * 520 };
      setScratches((all) => [...all, s]);
      window.setTimeout(() => setScratches((all) => all.filter((o) => o.id !== s.id)), s.ms);
      next = window.setTimeout(spawn, 2200 + Math.random() * 4800);
    };
    next = window.setTimeout(spawn, 1200);
    return () => window.clearTimeout(next);
  }, [live, reduced]);

  return (
    <div ref={ref} className={css.film} data-live={live && !reduced} aria-hidden="true">
      <div className={css.view}>
        {tile && <div className={css.grain} style={{ "--grain": `url(${tile})` } as CSSProperties} />}
        <div className={css.flicker} />
        {scratches.map((s) => (
          <span key={s.id} className={css.scratch} style={{ left: `${s.x}%`, top: `${s.top}%`, height: `${s.h}%`, animationDuration: `${s.ms}ms` }} />
        ))}
      </div>
    </div>
  );
}
