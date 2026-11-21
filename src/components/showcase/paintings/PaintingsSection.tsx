"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { workButtonId } from "../WorkList";
import { WORKS } from "../works";
import {
  clampPan,
  fadeAt,
  fitScale,
  focusLayout,
  layoutWall,
  panBounds,
} from "./wall";
import PaintSwirls from "../PaintSwirls";
import PaintTitle from "./PaintTitle";
import css from "./PaintingsSection.module.css";

const PAINTINGS = WORKS.filter((w) => w.group === "paintings");
const BY_SLUG = new Map(PAINTINGS.map((w) => [w.slug, w]));
const PLACED = layoutWall(
  PAINTINGS.map((w) => ({
    slug: w.slug,
    aspect: w.media.aspect,
    wall: w.wall,
  })),
);
const BOUNDS = panBounds(PLACED);
/** Rounded, so the server's and the browser's styles match. */
const px = (v: number) => `${v.toFixed(1)}px`;
const ITEMS = PLACED.map((p) => ({ p, w: BY_SLUG.get(p.slug)! }));

/** A press that moves farther than this (px) is a drag, not a click. */
const DRAG_PX = 6;
/** Inertia: velocity kept per 16 ms frame, and the speed (world px / ms) it stops under. */
const FRICTION = 0.92;
const STOP = 0.01;
const GLIDE_MS = 650;
/** The wall's background: faint paint swirls, or the grid (kept while the swirls are tried out). */
const WALL_BACKGROUND: "swirls" | "grid" = "swirls";
/** The swirls' size behind the wall: CSS px to a swirl (they stay put as the wall moves). */
const SWIRL_UNIT = 260;
/** Stronger than the gap's swirls: the vignette darkens the wall's edges. */
const SWIRL_STRENGTH = 0.3;
/** The grid's cell, in world px (a heavier line every 4 cells) */
const GRID_CELL = 60;

/**
 * Paintings: the high school portfolio hung in the middle as the /paintings
 * page hung it, the early work round it. The wall is a plane you drag about;
 * paintings fade and shrink with their distance from the middle of the view.
 * Clicking a painting glides it over and enlarges it, and its title and
 * year reveal out of its side. The plane moves by direct style writes,
 * outside React, and only while something moves.
 */
export default function PaintingsSection() {
  const viewRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;

  // The pan is the world point at the middle of the view.
  const pan = useRef({ x: 0, y: 0 });
  const size = useRef({ w: 0, h: 0, s: 1 });
  const raf = useRef(0);
  const reduced = useRef(false);

  const render = useCallback(() => {
    const view = viewRef.current;
    const plane = planeRef.current;
    const grid = gridRef.current;
    if (!view || !plane) return;
    const { w, h, s } = size.current;
    const ox = w / 2 - pan.current.x * s;
    const oy = h / 2 - pan.current.y * s;
    plane.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
    // The grid is pinned to the wall: it moves and scales with it.
    if (grid) {
      grid.style.setProperty("--grid-x", `${ox.toFixed(1)}px`);
      grid.style.setProperty("--grid-y", `${oy.toFixed(1)}px`);
      grid.style.setProperty("--cell", `${(GRID_CELL * s).toFixed(2)}px`);
    }
    PLACED.forEach((p, i) => {
      const el = itemRefs.current[i];
      if (!el) return;
      const f = fadeAt(
        (p.x - pan.current.x) * s,
        (p.y - pan.current.y) * s,
        w / 2,
        h / 2,
      );
      el.style.opacity = f.opacity.toFixed(3);
      el.style.setProperty("--fade-scale", f.scale.toFixed(4));
      el.style.visibility = f.opacity < 0.01 ? "hidden" : "visible";
      if (p.slug !== selectedRef.current) return;
      const focus = focusLayout(p.w, p.h, s, w, h);
      el.style.setProperty("--zoom", focus.zoom.toFixed(4));
      const info = infoRef.current;
      if (info) {
        info.style.left = px(focus.info.left);
        info.style.top = px(focus.info.top);
        info.style.width = px(focus.info.width);
        info.dataset.mode = focus.info.mode;
      }
    });
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  /** Move the pan; a drag can't take it past the bounds (or farther past, after a glide out to a painting). */
  const setPan = useCallback(
    (x: number, y: number, free = false) => {
      const bounds = {
        x: Math.max(BOUNDS.x, Math.abs(pan.current.x)),
        y: Math.max(BOUNDS.y, Math.abs(pan.current.y)),
      };
      const [cx, cy] = free ? [x, y] : clampPan(x, y, bounds);
      pan.current.x = cx;
      pan.current.y = cy;
      render();
    },
    [render],
  );

  /** Glide the middle of the view to a world point. */
  const glideTo = useCallback(
    (tx: number, ty: number) => {
      stop();
      if (reduced.current) return setPan(tx, ty, true);
      const from = { ...pan.current };
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / GLIDE_MS);
        const e = 1 - Math.pow(1 - t, 3);
        setPan(from.x + (tx - from.x) * e, from.y + (ty - from.y) * e, true);
        raf.current = t < 1 ? requestAnimationFrame(step) : 0;
      };
      raf.current = requestAnimationFrame(step);
    },
    [setPan, stop],
  );

  // Size: fit the portfolio, and a glimpse of the ring, into the view.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = motion.matches;
    const onMotion = () => (reduced.current = motion.matches);
    motion.addEventListener("change", onMotion);
    const resize = () => {
      const { width, height } = view.getBoundingClientRect();
      size.current = { w: width, h: height, s: fitScale(width, height) };
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(view);
    resize();
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      stop();
    };
  }, [render, stop]);

  // ---- dragging, with inertia -------------------------------------------------
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
    vx: number;
    vy: number;
    t: number;
  } | null>(null);
  const justDragged = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    // The title is for reading (and selecting), not for dragging the wall.
    if (e.button !== 0 || (e.target as Element).closest(`.${css.infoInner}`))
      return;
    stop();
    justDragged.current = false;
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      vx: 0,
      vy: 0,
      t: performance.now(),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    // The grid brightens round a mouse.
    if (e.pointerType === "mouse" && gridRef.current && viewRef.current) {
      const r = viewRef.current.getBoundingClientRect();
      gridRef.current.style.setProperty(
        "--mx",
        `${(e.clientX - r.left).toFixed(0)}px`,
      );
      gridRef.current.style.setProperty(
        "--my",
        `${(e.clientY - r.top).toFixed(0)}px`,
      );
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_PX) return;
      d.moved = true;
      setSelected(null);
      viewRef.current?.setPointerCapture(e.pointerId);
      viewRef.current?.setAttribute("data-dragging", "true");
    }
    const now = performance.now();
    const dt = Math.max(1, now - d.t);
    const s = size.current.s;
    // Velocity in world px / ms, smoothed.
    d.vx = d.vx * 0.6 + (-dx / s / dt) * 0.4;
    d.vy = d.vy * 0.6 + (-dy / s / dt) * 0.4;
    d.x = e.clientX;
    d.y = e.clientY;
    d.t = now;
    setPan(pan.current.x - dx / s, pan.current.y - dy / s);
  };

  const endDrag = (e: React.PointerEvent, coast: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    viewRef.current?.removeAttribute("data-dragging");
    if (!d.moved) return;
    justDragged.current = true;
    // A pause before letting go means no throw.
    if (!coast || reduced.current || performance.now() - d.t > 80) return;
    let { vx, vy } = d;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const k = Math.pow(FRICTION, dt / 16);
      vx *= k;
      vy *= k;
      setPan(pan.current.x + vx * dt, pan.current.y + vy * dt);
      raf.current = Math.hypot(vx, vy) > STOP ? requestAnimationFrame(step) : 0;
    };
    raf.current = requestAnimationFrame(step);
  };

  // A drag that ends on a painting isn't a click on it.
  const onClickCapture = (e: React.MouseEvent) => {
    if (!justDragged.current) return;
    justDragged.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  // A click on the bare wall puts the selected painting back.
  const onClick = (e: React.MouseEvent) => {
    if (!(e.target as Element).closest(`button, .${css.infoInner}`))
      setSelected(null);
  };

  // ---- selecting -------------------------------------------------------------------
  const select = useCallback(
    (slug: string) => {
      const p = PLACED.find((q) => q.slug === slug);
      if (!p) return;
      setSelected(slug);
      selectedRef.current = slug;
      // Pan so the painting lands where its focus layout puts it.
      const { w, h, s } = size.current;
      const focus = focusLayout(p.w, p.h, s, w, h);
      glideTo(p.x - (focus.cx - w / 2) / s, p.y - (focus.cy - h / 2) / s);
    },
    [glideTo],
  );

  const onPainting = (slug: string) => {
    if (selected === slug) setSelected(null);
    else select(slug);
  };

  // Place the title once it mounts (render places it from then on).
  useEffect(() => {
    if (selected) render();
  }, [selected, render]);

  const work = selected ? BY_SLUG.get(selected) : null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && selected) setSelected(null);
  };

  return (
    <section className={css.section} aria-labelledby="paintings-title">
      <div className={css.intro}>
        <PaintSwirls className={css.swirls} />
        <header className={css.head}>
          <PaintTitle id="paintings-title">Paintings</PaintTitle>
          <p className={css.pitch}>My high school portfolio</p>
        </header>
      </div>

      <div
        ref={viewRef}
        className={css.view}
        data-selected={!!selected}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        onClickCapture={onClickCapture}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {WALL_BACKGROUND === "swirls" ? (
          <PaintSwirls
            className={css.wallSwirls}
            masked={false}
            unit={SWIRL_UNIT}
            strength={SWIRL_STRENGTH}
          />
        ) : (
          <div ref={gridRef} className={css.grid} aria-hidden="true" />
        )}
        <div ref={planeRef} className={css.plane}>
          {ITEMS.map(({ p, w }, i) => (
            <button
              key={p.slug}
              id={workButtonId(w.slug)}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              className={css.painting}
              data-wall={p.wall}
              data-selected={selected === p.slug}
              style={
                {
                  left: px(p.x - p.w / 2),
                  top: px(p.y - p.h / 2),
                  width: px(p.w),
                  height: px(p.h),
                  background: w.media.avgColor,
                } as CSSProperties
              }
              aria-label={`${w.title}${w.year ? `, ${w.year}` : ""}`}
              aria-pressed={selected === p.slug}
              onClick={() => onPainting(p.slug)}
              onFocus={(e) => {
                if (
                  e.currentTarget.matches(":focus-visible") &&
                  selected !== p.slug
                )
                  select(p.slug);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- hashed, pre-sized assets from public/hero and public/showcase */}
              <img
                src={w.media.image}
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
              />
              {w.media.held && (
                // eslint-disable-next-line @next/next/no-img-element -- as above
                <img
                  className={css.held}
                  src={w.media.held.src}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </button>
          ))}
        </div>

        <div className={css.vignette} aria-hidden="true" />

        <div ref={infoRef} className={css.info} aria-live="polite">
          {work && (
            <div key={work.slug} className={css.infoInner}>
              <h3 className={css.infoTitle}>{work.title}</h3>
              <p className={css.infoMeta}>
                {[
                  work.year,
                  work.wall === "portfolio"
                    ? "High school portfolio"
                    : work.line,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
