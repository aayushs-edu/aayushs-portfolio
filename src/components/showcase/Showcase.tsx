"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import SplitHero from "../hero/SplitHero";
import { useHeroTier } from "../hero/useHeroTier";
import Captions from "./Captions";
import DetailPanel from "./DetailPanel";
import { beatsFor, splitLayout } from "./layouts";
import type { Viewport } from "./layouts/types";
import { createScrollMap, progressForBeat, sampleScroll, type ScrollSample } from "./scrollMap";
import css from "./Showcase.module.css";
import { SHOWCASE } from "./showcaseConfig";
import WorkList, { workButtonId, type WorkListGroup } from "./WorkList";
import { KIND_TITLES, WORKS, type Work, type WorkKind } from "./works";

// three, R3F and the scene code: loaded once the hero is up (or at the first scroll).
const Scene = dynamic(() => import("./Scene"), { ssr: false });

const BY_SLUG = new Map(WORKS.map((work) => [work.slug, work]));
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** `#work/<slug>` → slug, if it names a work. */
function slugFromHash(): string | null {
  const match = /^#work\/([\w-]+)$/.exec(window.location.hash);
  return match && BY_SLUG.has(match[1]) ? match[1] : null;
}

const groupWorks = (groups: { title: string; slugs: string[] }[]): WorkListGroup[] =>
  groups.map((group) => ({ title: group.title, works: group.slugs.map((slug) => BY_SLUG.get(slug)!) }));

/** The fallback page groups works by kind, under a heading each. */
const KIND_GROUPS = groupWorks(
  (Object.keys(KIND_TITLES) as WorkKind[])
    .map((kind) => ({ title: KIND_TITLES[kind], slugs: WORKS.filter((w) => w.kind === kind).map((w) => w.slug) }))
    .filter((g) => g.slugs.length),
);

function currentViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * The split hero and, under it, the whole portfolio as a 3D scene. One tall
 * section with one pinned viewport: scrolling first tears the hero open along
 * its line, then carries the camera from work to work. Each work has a caption
 * as you pass and its full story one click away (`#work/<slug>`). Without
 * WebGL2, or with reduced motion, the hero stays whole and the works are a
 * calm grid with the same detail panel.
 */
export default function Showcase() {
  const [tier, demote, detected] = useHeroTier();
  const threeD = tier !== "static";

  // ---- layout and scroll map ---------------------------------------------------
  const [viewport, setViewport] = useState<Viewport>({ width: 1440, height: 900 });
  useEffect(() => {
    const update = () =>
      setViewport((prev) => {
        const next = currentViewport();
        // Ignore the address bar showing and hiding on phones.
        const same = prev.width === next.width && Math.abs(prev.height - next.height) < prev.height * 0.15;
        return same ? prev : next;
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const layout = useMemo(() => splitLayout(WORKS, viewport), [viewport]);
  const map = useMemo(() => createScrollMap(beatsFor(layout, SHOWCASE.units.work), SHOWCASE.units.entrance, SHOWCASE.dwell), [layout]);
  const groups = useMemo(() => (threeD ? groupWorks(layout.groups) : KIND_GROUPS), [threeD, layout]);
  const beats = useMemo(() => new Map(map.beats.map((b, i) => [b.key, i])), [map]);
  const pathWorks = useMemo(() => layout.stops.map((stop) => BY_SLUG.get(stop.slug)!), [layout]);

  // ---- scroll: native, exponentially smoothed, never in React state --------------
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<ScrollSample>({ entrance: 0, t: 0, beat: -1 });
  const entranceRef = useRef(0);
  const progress = useRef({ target: 0, current: 0 });
  const [heroGone, setHeroGone] = useState(false);
  const [opening, setOpening] = useState(false);
  /** Jumps the page to scroll progress p (instantly, or let the smoothing carry the camera there). */
  const jumpRef = useRef<(p: number, instant: boolean) => void>(() => {});

  useEffect(() => {
    const section = sectionRef.current;
    if (!threeD || !section) {
      scrollRef.current = { entrance: 0, t: 0, beat: -1 };
      entranceRef.current = 0;
      setHeroGone(false);
      setOpening(false);
      return;
    }
    const state = progress.current;
    let raf = 0;
    let last = 0;
    const apply = () => {
      sampleScroll(map, state.current, scrollRef.current);
      const e = scrollRef.current.entrance;
      entranceRef.current = e;
      setHeroGone(e >= 0.999);
      setOpening(e > 0.0005);
    };
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      state.current += (state.target - state.current) * (1 - Math.exp(-SHOWCASE.smoothing * dt));
      const done = Math.abs(state.target - state.current) < 1e-5;
      if (done) state.current = state.target;
      apply();
      raf = done ? 0 : requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const read = () => {
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      state.target = span > 0 ? clamp01(-rect.top / span) : 0;
      start();
    };
    jumpRef.current = (p, instant) => {
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      window.scrollTo({ top: rect.top + window.scrollY + span * p, behavior: "instant" });
      state.target = p;
      if (instant) {
        state.current = p;
        apply();
      }
      start();
    };
    // Start where the page is (a reload restores the scroll position), without flying there.
    read();
    state.current = state.target;
    apply();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      cancelAnimationFrame(raf);
      jumpRef.current = () => {};
    };
  }, [threeD, map]);

  const beatOf = useCallback((key: string) => beats.get(key) ?? -1, [beats]);

  // ---- the scene: loaded on idle after the hero is up, or at the first scroll; drawing only while it shows.
  const [wantScene, setWantScene] = useState(false);
  useEffect(() => {
    if (!threeD || wantScene) return;
    const want = () => setWantScene(true);
    const idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(want, { timeout: 2500 }) : window.setTimeout(want, 1200);
    window.addEventListener("scroll", want, { once: true, passive: true });
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.removeEventListener("scroll", want);
    };
  }, [threeD, wantScene]);

  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const section = sectionRef.current;
    if (!threeD || !section) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(section);
    return () => observer.disconnect();
  }, [threeD]);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // ---- the detail view ---------------------------------------------------------
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const pushed = useRef(false);
  const returnTo = useRef<string | null>(null);

  const openWork = useCallback((slug: string) => {
    if (!BY_SLUG.has(slug)) return;
    returnTo.current = slug;
    setOpenSlug(slug);
    window.history.pushState(null, "", `#work/${slug}`);
    pushed.current = true;
  }, []);

  const closeWork = useCallback(() => {
    if (pushed.current && slugFromHash()) {
      // Back out of the entry we pushed; popstate closes the panel.
      pushed.current = false;
      window.history.back();
      return;
    }
    pushed.current = false;
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setOpenSlug(null);
  }, []);

  useEffect(() => {
    const onPop = () => {
      pushed.current = false;
      setOpenSlug(slugFromHash());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A #work/<slug> link opens that work once the tier is known (in 3D, at its stop).
  const linked = useRef(false);
  useEffect(() => {
    if (!detected || linked.current) return;
    linked.current = true;
    const slug = slugFromHash();
    if (!slug) return;
    if (threeD) jumpRef.current(progressForBeat(map, beatOf(`work:${slug}`)), true);
    returnTo.current = slug;
    setOpenSlug(slug);
  }, [detected, threeD, map, beatOf]);

  // While it's open the page doesn't scroll; a scroll gesture outside the panel closes it.
  useEffect(() => {
    if (!openSlug) return;
    const html = document.documentElement;
    const before = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter };
    html.style.overflow = "hidden";
    html.style.scrollbarGutter = "stable";
    const inPanel = (target: EventTarget | null) => target instanceof Element && !!target.closest("[data-detail-panel]");
    const onWheel = (event: WheelEvent) => {
      if (!inPanel(event.target) && Math.abs(event.deltaY) + Math.abs(event.deltaX) > 4) closeWork();
    };
    let touchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchY = inPanel(event.target) ? null : event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (touchY !== null && Math.abs(event.touches[0].clientY - touchY) > 24) {
        touchY = null;
        closeWork();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      html.style.overflow = before.overflow;
      html.style.scrollbarGutter = before.gutter;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [openSlug, closeWork]);

  // Closing returns focus to the work.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (openSlug) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const slug = returnTo.current;
    if (slug) document.getElementById(workButtonId(slug))?.focus({ preventScroll: true });
  }, [openSlug]);

  // ---- keyboard: focusing a work brings the camera to it --------------------------
  const [focusSlug, setFocusSlug] = useState<string | null>(null);
  const onFocusWork = useCallback(
    (slug: string, visible: boolean) => {
      setFocusSlug(visible ? slug : null);
      if (!threeD || openSlug) return;
      const index = beatOf(`work:${slug}`);
      if (index < 0) return;
      // Only move if it isn't already the work in front of the camera.
      if (Math.abs(scrollRef.current.beat - index) > 0.25) jumpRef.current(progressForBeat(map, index), false);
    },
    [threeD, openSlug, beatOf, map],
  );
  const onBlurWork = useCallback(() => setFocusSlug(null), []);

  const openWorkObj: Work | null = openSlug ? BY_SLUG.get(openSlug) ?? null : null;

  return (
    <>
      <section
        ref={sectionRef}
        className={css.section}
        data-mode={threeD ? "scene" : "static"}
        style={{ "--units": map.units } as CSSProperties}
      >
        <div className={css.sticky}>
          {threeD && (
            <div className={css.scene}>
              {wantScene && (
                <Scene
                  tier={tier === "full" ? "full" : "lite"}
                  layout={layout}
                  works={BY_SLUG}
                  beatOf={beats}
                  scroll={scrollRef}
                  openSlug={openSlug}
                  active={onScreen && (opening || !!openSlug)}
                  overlay={overlayRef}
                  onOpen={openWork}
                  onContextLost={demote}
                />
              )}
            </div>
          )}
          {threeD && (
            <div ref={overlayRef} className={css.overlay} aria-hidden="true">
              {wantScene && <Captions works={pathWorks} focusSlug={focusSlug} onOpen={openWork} />}
            </div>
          )}
          <div className={css.hero} data-gone={heroGone} data-opening={opening}>
            <SplitHero entrance={threeD ? entranceRef : undefined} paused={threeD && heroGone} />
          </div>
          {threeD && <WorkList groups={groups} mode="hidden" onOpen={openWork} onFocusWork={onFocusWork} onBlurWork={onBlurWork} />}
        </div>
        {!threeD && <WorkList groups={groups} mode="grid" onOpen={openWork} onFocusWork={onFocusWork} onBlurWork={onBlurWork} />}
      </section>
      <DetailPanel work={openWorkObj} onClose={closeWork} scrim={!threeD} />
    </>
  );
}
