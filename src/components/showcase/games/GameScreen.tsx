"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { EMBED_BAR, type Game } from "./games";
import css from "./GameScreen.module.css";

const SHOT_MS = 3200;

/**
 * A game's screen, shared by the three layouts. Until it's played, its
 * screenshots take turns (while in view). Played, its itch.io build loads in
 * an iframe: a build that fills any window gets the screen's own size; one
 * with a fixed canvas gets that canvas's size, scaled to fit (the pointer
 * still lands right through the scale). A game with no browser build plays
 * its video. The
 * layout around it stops it (the handheld's B and START).
 *
 * `prompt` replaces the built-in play button (a layout may have its own,
 * like the cabinet's start button); pass `null` to hide it.
 */
export default function GameScreen({
  game,
  playing,
  onPlay,
  prompt,
  className,
  style,
}: {
  game: Game;
  playing: boolean;
  onPlay: () => void;
  prompt?: React.ReactNode | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [shot, setShot] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // Layout size, not the transformed rect: the layouts fold and tilt this box.
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    const io = new IntersectionObserver((es) => setInView(es[es.length - 1].isIntersecting));
    ro.observe(el);
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  useEffect(() => setShot(0), [game.slug]);

  useEffect(() => {
    if (playing || !inView || game.shots.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setShot((s) => (s + 1) % game.shots.length), SHOT_MS);
    return () => window.clearInterval(id);
  }, [playing, inView, game.shots.length]);

  const build = game.build;
  // A fixed canvas gets its own size plus itch's bar under it; a fill build gets the screen's size.
  const fixed = build && !build.fill ? { width: build.width, height: build.height + EMBED_BAR } : null;
  const frame = build?.fill
    ? { width: Math.round(box.w) || build.width, height: Math.round(box.h) || build.height, scale: 1 }
    : fixed
      ? { ...fixed, scale: box.w ? Math.min(box.w / fixed.width, box.h / fixed.height) : 1 }
      : null;

  return (
    <div ref={boxRef} className={`${css.screen} ${className ?? ""}`} style={style} data-playing={playing}>
      {!playing &&
        game.shots.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} className={css.shot} src={src} alt={i === 0 ? `${game.work.title}: a screenshot` : ""} data-on={i === shot} loading="lazy" decoding="async" />
        ))}

      {playing && build && frame && (
        <iframe
          key={game.slug}
          className={css.build}
          src={build.src}
          title={`${game.work.title}, playable`}
          width={frame.width}
          height={frame.height}
          style={{ transform: `translate(-50%, -50%) scale(${frame.scale})` }}
          allow="autoplay; fullscreen; gamepad"
          allowFullScreen
          onLoad={(e) => e.currentTarget.focus({ preventScroll: true })}
        />
      )}
      {playing && !build && game.video && (
        <iframe
          key={game.slug}
          className={css.video}
          src={`https://www.youtube-nocookie.com/embed/${game.video}?autoplay=1&rel=0&modestbranding=1`}
          title={`${game.work.title}, gameplay video`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}

      {!playing && prompt === undefined && (
        <button type="button" className={css.play} onClick={onPlay}>
          <span className={css.playDisc} aria-hidden="true">
            <Play size={18} strokeWidth={0} fill="currentColor" />
          </span>
          {build ? "Play in browser" : "Watch it played"}
        </button>
      )}
      {!playing && prompt}

    </div>
  );
}
