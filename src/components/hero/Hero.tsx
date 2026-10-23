"use client";

import dynamic from "next/dynamic";
import { motion, useMotionValue, useMotionValueEvent, useTransform, type MotionStyle, type MotionValue } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import GalleryStack from "./GalleryStack";
import HeroTitle from "./HeroTitle";
import styles from "./Hero.module.css";
import { GALLERY, INITIAL_INDEX, INITIAL_MODE, PHASES, SCROLL, SYNTAX_PALETTE, type Mode } from "./heroConfig";
import { clamp01, easeInOut, measureLayout, range, zoomAmount, type HeroLayout } from "./heroLayout";
import { useHeroTier } from "./useHeroTier";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

function useScrollVar(source: MotionValue<number>, fn: (v: number) => number) {
  return useTransform(source, fn);
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export interface HeroProps {
  /**
   * What the visitor finds on the other side of the cloud. It is pinned under the
   * end of the hero (revealed in place as the dots clear), then scrolls on normally.
   */
  next?: ReactNode;
}

export default function Hero({ next }: HeroProps) {
  const [tier, demote] = useHeroTier();
  const [mode, setMode] = useState<Mode>(INITIAL_MODE);
  const [displayMode, setDisplayMode] = useState<Mode>(INITIAL_MODE);
  const [selected, setSelected] = useState<Record<Mode, number>>(INITIAL_INDEX);
  const [settled, setSettled] = useState(true);
  const [atRest, setAtRest] = useState(true);
  const [canvasWanted, setCanvasWanted] = useState(false);
  const [canvasLive, setCanvasLive] = useState(false);
  const [cleared, setCleared] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const compRef = useRef<HTMLDivElement | null>(null);
  const poolRef = useRef<HTMLDivElement | null>(null);
  const frontImageRef = useRef<HTMLElement | null>(null);
  const placardTextRef = useRef<HTMLDivElement | null>(null);
  const detailSuffixRef = useRef<HTMLSpanElement | null>(null);
  const layoutRef = useRef<HeroLayout | null>(null);
  const tapRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const placardRestRef = useRef<DOMRect | null>(null);

  const pinned = tier !== "static";
  const item = GALLERY[displayMode][selected[displayMode]];
  const pointTier = tier === "full" ? "full" : "lite";

  // ---- nav height (Navigation is sticky above the hero) ---------------------
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      const top = root.getBoundingClientRect().top + window.scrollY;
      root.style.setProperty("--nav-h", `${Math.max(0, Math.round(top))}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ---- scroll progress: native scroll, exponentially smoothed, never in React state.
  // Same as useScroll({ target, offset: ["start start", "end end"] }); measured directly
  // because framer warns in dev whenever <html> is position: static.
  const scrollYProgress = useMotionValue(0);
  const progress = useMotionValue(0);
  useEffect(() => {
    const section = sectionRef.current;
    if (!pinned || !section) return;
    const read = () => {
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      scrollYProgress.set(span > 0 ? clamp01(-rect.top / span) : 0);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [pinned, scrollYProgress, tier]);

  useEffect(() => {
    if (!pinned) {
      progress.set(0);
      return;
    }
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      const target = scrollYProgress.get();
      const current = progress.get();
      const next = current + (target - current) * (1 - Math.exp(-SCROLL.smoothing * dt));
      if (Math.abs(target - next) < 1e-4) {
        progress.set(target);
        raf = 0;
        return;
      }
      progress.set(next);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const unsubscribe = scrollYProgress.on("change", start);
    start();
    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, [pinned, progress, scrollYProgress]);

  // ---- layout ----------------------------------------------------------------
  const layoutVersion = useMotionValue(0);
  const measure = useCallback(() => {
    const sticky = stickyRef.current;
    const comp = compRef.current;
    if (!sticky || !comp) return;
    const stickyRect = sticky.getBoundingClientRect();
    if (progress.get() < PHASES.rest && placardTextRef.current) placardRestRef.current = placardTextRef.current.getBoundingClientRect();
    layoutRef.current = measureLayout(sticky, comp, item, placardRestRef.current, stickyRect);
    layoutVersion.set(layoutVersion.get() + 1);
  }, [item, progress, layoutVersion]);

  useLayoutEffect(() => {
    measure();
    const sticky = stickyRef.current;
    if (!sticky) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(sticky);
    return () => observer.disconnect();
  }, [measure]);

  // ---- rest / interaction gate and placard detail line -------------------------
  const atRestRef = useRef(true);
  const suffixRef = useRef("");
  const canvasLiveRef = useRef(false);
  canvasLiveRef.current = canvasLive;
  const clearedRef = useRef(false);
  const countText = item.tiers[pointTier].count.toLocaleString("en-US");
  useMotionValueEvent(progress, "change", (p) => {
    const rest = p < PHASES.rest;
    if (rest !== atRestRef.current) {
      atRestRef.current = rest;
      setAtRest(rest);
      if (rest) measure();
    }
    const suffix = !canvasLiveRef.current || p < PHASES.handoffEnd ? "" : ` · ${countText} points`;
    // Once the wall has gone, let clicks through to the section underneath.
    const isCleared = p > PHASES.revealEnd;
    if (isCleared !== clearedRef.current) {
      clearedRef.current = isCleared;
      setCleared(isCleared);
    }
    if (suffix !== suffixRef.current && detailSuffixRef.current) {
      suffixRef.current = suffix;
      detailSuffixRef.current.textContent = suffix;
    }
  });

  // ---- scroll-driven CSS variables ---------------------------------------------
  const sideT = useScrollVar(progress, (p) => range(p, PHASES.rest, PHASES.sideGone));
  const titleT = useScrollVar(progress, (p) => range(p, PHASES.rest, PHASES.titleGone));
  // Side cards slide out by ±35% of the hero width (CSS multiplies by 100cqw).
  const spread = useTransform(sideT, (t) => t * t * SCROLL.sideSpread);
  const rise = useTransform(titleT, (t) => easeInOut(t));
  const zoomT = useTransform(progress, zoomAmount);
  const canvasLiveMV = useMotionValue(0);
  useEffect(() => canvasLiveMV.set(canvasLive ? 1 : 0), [canvasLive, canvasLiveMV]);

  const zx = useTransform([zoomT, layoutVersion], ([t]: number[]) => {
    const l = layoutRef.current;
    return l ? (l.zoom.cx - l.card.cx) * t : 0;
  });
  const zy = useTransform([zoomT, layoutVersion], ([t]: number[]) => {
    const l = layoutRef.current;
    return l ? (l.zoom.cy - l.card.cy) * t : 0;
  });
  const zs = useTransform([zoomT, layoutVersion], ([t]: number[]) => {
    const l = layoutRef.current;
    return l ? 1 + (l.zoom.w / l.card.w - 1) * t : 1;
  });
  const frameO = useTransform(progress, (p) => 1 - range(p, PHASES.rest, PHASES.sideGone));
  // The wall fades to reveal the next section. Never ahead of the real scroll position:
  // the section only holds still (CSS sticky) once the raw progress passes PHASES.reveal.
  const clear = useTransform([progress, scrollYProgress], ([p, raw]: number[]) => smoothstep(range(Math.min(p, raw), PHASES.clearStart, PHASES.revealEnd)));
  const posterO = useTransform([progress, canvasLiveMV, clear], ([p, live, c]: number[]) =>
    (live ? 1 - range(p, PHASES.neutralEnd + 0.01, PHASES.handoffEnd) : 1) * (1 - c),
  );
  const plx = useTransform([progress, layoutVersion], ([p]: number[]) => (layoutRef.current?.placard.dx ?? 0) * easeInOut(range(p, PHASES.rest, PHASES.zoomEnd)));
  const ply = useTransform([progress, layoutVersion], ([p]: number[]) => (layoutRef.current?.placard.dy ?? 0) * easeInOut(range(p, PHASES.rest, PHASES.zoomEnd)));

  const stageStyle = { "--spread": spread, "--side-fade": sideT, "--rise": rise, "--title-fade": titleT } as MotionStyle;
  const frontStyle = { "--zx": zx, "--zy": zy, "--zs": zs, "--zoom-t": zoomT, "--frame-o": frameO, "--poster-o": posterO } as MotionStyle;
  const placardStyle = { "--pl-x": plx, "--pl-y": ply } as MotionStyle;

  // ---- WebGL: load the canvas chunk once the front poster is in and the browser is idle
  useEffect(() => {
    if (tier === "static") {
      setCanvasWanted(false);
      setCanvasLive(false);
      return;
    }
    let cancelled = false;
    let idleId = 0;
    const idle = () => {
      if (cancelled) return;
      const ready = () => !cancelled && setCanvasWanted(true);
      if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(ready, { timeout: 1200 });
      else idleId = setTimeout(ready, 1200) as unknown as number;
    };
    const img = frontImageRef.current?.querySelector("img");
    if (!img || img.complete) idle();
    else img.addEventListener("load", idle, { once: true });
    return () => {
      cancelled = true;
      img?.removeEventListener("load", idle);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      clearTimeout(idleId);
    };
  }, [tier]);

  // ---- state handlers -----------------------------------------------------------
  const onSelect = useCallback((m: Mode, index: number) => setSelected((prev) => (prev[m] === index ? prev : { ...prev, [m]: index })), []);
  const onSwitch = useCallback(
    (m: Mode) => {
      if (m === mode || mode !== displayMode) return;
      setMode(m);
    },
    [mode, displayMode],
  );
  const onFrontTap = useCallback((x: number, y: number) => {
    tapRef.current = { x, y, t: performance.now() };
  }, []);

  const interactive = !pinned || atRest;
  const heightSvh = tier === "full" ? SCROLL.heightFull : tier === "lite" ? SCROLL.heightLite : 100;
  // How far the next section overlaps the hero: the viewport under the nav, plus the
  // stretch of scrolling (from PHASES.reveal to the end) during which it is held in place.
  const revealSvh = (heightSvh - 100) * (1 - PHASES.reveal);
  const sectionStyle = {
    height: pinned ? `${heightSvh}svh` : undefined,
    "--syn-kw": SYNTAX_PALETTE.kw,
    "--syn-str": SYNTAX_PALETTE.str,
    "--syn-num": SYNTAX_PALETTE.num,
    "--syn-fn": SYNTAX_PALETTE.fn,
    "--syn-punct": SYNTAX_PALETTE.punct,
    "--syn-com": SYNTAX_PALETTE.com,
  } as CSSProperties;

  const neighbors = [-1, 1].map((d) => {
    const list = GALLERY[displayMode];
    return list[(((selected[displayMode] + d) % list.length) + list.length) % list.length];
  });
  const otherMode: Mode = displayMode === "art" ? "code" : "art";

  return (
    <div ref={rootRef} className={styles.root}>
      <section ref={sectionRef} className={`${styles.hero} ${pinned ? "" : styles.static}`} style={sectionStyle} aria-label="Aayush Sharma: art and code" data-tier={tier}>
        <motion.div ref={stickyRef} className={styles.sticky} style={{ "--clear": clear } as MotionStyle} data-cleared={cleared}>
          <motion.div className={styles.stage} style={stageStyle}>
            <div ref={poolRef} className={styles.pool} />
            <div ref={compRef} className={styles.comp}>
              <HeroTitle
                mode={mode}
                displayMode={displayMode}
                selected={selected}
                tier={tier}
                interactive={interactive}
                panelId="hero-gallery"
                onSwitch={onSwitch}
              />
              <GalleryStack
                mode={mode}
                selected={selected}
                onSelect={onSelect}
                tier={tier}
                interactive={interactive}
                panelId="hero-gallery"
                wheelTarget={stickyRef}
                frontImageRef={frontImageRef}
                onSettledChange={setSettled}
                onDisplayModeChange={setDisplayMode}
                frontStyle={frontStyle}
                placardStyle={placardStyle}
                placardTextRef={placardTextRef}
                detailSuffixRef={detailSuffixRef}
                onFrontTap={onFrontTap}
              />
            </div>
            {canvasWanted && pinned && (
              <HeroCanvas
                tier={tier}
                item={item}
                prefetch={[...neighbors, GALLERY[otherMode][selected[otherMode]]]}
                show={settled && mode === displayMode}
                progress={progress}
                layoutRef={layoutRef}
                layoutVersion={layoutVersion}
                frontImageRef={frontImageRef}
                stickyRef={stickyRef}
                poolRef={poolRef}
                tapRef={tapRef}
                onLiveChange={setCanvasLive}
                onContextLost={demote}
              />
            )}
          </motion.div>
        </motion.div>
      </section>
      {next && (
        <div
          className={pinned ? styles.underlay : undefined}
          style={pinned ? { marginTop: `calc(-1 * (100svh - var(--nav-h)) - ${revealSvh}svh)` } : undefined}
        >
          <div className={pinned ? styles.underlayPin : undefined}>{next}</div>
          {pinned && <div style={{ height: `${revealSvh}svh` }} aria-hidden="true" />}
        </div>
      )}
    </div>
  );
}
